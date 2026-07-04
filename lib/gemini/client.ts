import type { Anchor, Axis, RawRecommendation } from "@/lib/types";
import { buildRecommendPrompt } from "./prompts";
import { parseRecommendations } from "./parse";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_FALLBACK_MODELS = ["gemini-2.0-flash-lite"] as const;
const MAX_OVERLOAD_RETRIES = 1;

export class AllModelsQuotaError extends Error {
  retryAfterSeconds: number;
  isDailyLimit: boolean;

  constructor(message: string, retryAfterSeconds = 60, isDailyLimit = false) {
    super(message);
    this.name = "AllModelsQuotaError";
    this.retryAfterSeconds = retryAfterSeconds;
    this.isDailyLimit = isDailyLimit;
  }
}

class ModelQuotaError extends Error {
  model: string;
  retryAfterSeconds: number;
  isDailyLimit: boolean;

  constructor(model: string, rawMessage: string, isDailyLimit = false) {
    super(rawMessage);
    this.name = "ModelQuotaError";
    this.model = model;
    this.isDailyLimit = isDailyLimit;
    this.retryAfterSeconds = isDailyLimit ? 0 : parseRetryAfterSeconds(rawMessage);
  }
}

class ModelUnavailableError extends Error {
  model: string;

  constructor(model: string, rawMessage: string) {
    super(rawMessage);
    this.name = "ModelUnavailableError";
    this.model = model;
  }
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown[];
  };
};

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Recommendations unavailable — check configuration.");
  }

  return apiKey;
}

export function assertGeminiConfigured(): void {
  getApiKey();
}

function getModelChain(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const configuredFallbacks = process.env.GEMINI_FALLBACK_MODELS?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  const fallbacks = configuredFallbacks ?? [...DEFAULT_FALLBACK_MODELS];

  return [...new Set([primary, ...fallbacks.filter((model) => model !== primary)])];
}

export function parseRetryAfterSeconds(message: string): number {
  const match = message.match(/retry in ([\d.]+)s/i);

  if (!match) {
    return 60;
  }

  return Math.ceil(Number.parseFloat(match[1]));
}

function normalizeSongKey(title: string, artist: string): string {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .replace(/\[[^\]]*\]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const primaryArtist = artist.split(",")[0]?.trim() ?? artist;

  return `${clean(title)}|${clean(primaryArtist)}`;
}

export function filterAnchorAndDuplicates(
  anchor: Anchor,
  recommendations: RawRecommendation[],
): RawRecommendation[] {
  const anchorKey = normalizeSongKey(anchor.title, anchor.artist);
  const seen = new Set<string>();

  return recommendations.filter((item) => {
    const key = normalizeSongKey(item.title, item.artist);

    if (key === anchorKey || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDailyQuotaError(message: string, details?: unknown[]): boolean {
  const blob = JSON.stringify({ message, details }).toLowerCase();

  return (
    blob.includes("perday") ||
    blob.includes("per day") ||
    blob.includes("generaterequestsperday")
  );
}

function isQuotaError(
  status: number,
  message: string,
  details?: unknown[],
): boolean {
  const normalized = message.toLowerCase();

  return (
    status === 429 ||
    normalized.includes("quota exceeded") ||
    normalized.includes("exceeded your current quota") ||
    normalized.includes("resource has been exhausted") ||
    normalized.includes("resource_exhausted") ||
    isDailyQuotaError(message, details)
  );
}

function isTransientOverload(status: number, message: string): boolean {
  if (isQuotaError(status, message)) {
    return false;
  }

  if (isModelUnavailable(status, message)) {
    return false;
  }

  if (status === 503) {
    return true;
  }

  const normalized = message.toLowerCase();

  return (
    normalized.includes("high demand") ||
    normalized.includes("overloaded") ||
    normalized.includes("try again later")
  );
}

function isModelUnavailable(status: number, message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    status === 404 ||
    normalized.includes("is not found") ||
    normalized.includes("not supported for generatecontent")
  );
}

async function callGeminiModel(
  apiKey: string,
  prompt: string,
  model: string,
): Promise<GeminiGenerateResponse> {
  let lastError = "Recommendations unavailable — try again.";

  for (let attempt = 0; attempt <= MAX_OVERLOAD_RETRIES; attempt++) {
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8,
          },
        }),
      },
    );

    const data = (await response.json()) as GeminiGenerateResponse;

    if (response.ok) {
      return data;
    }

    const rawMessage =
      data.error?.message ?? "Recommendations unavailable — try again.";
    const status = data.error?.code ?? response.status;
    const details = data.error?.details;

    if (isQuotaError(status, rawMessage, details)) {
      throw new ModelQuotaError(
        model,
        rawMessage,
        isDailyQuotaError(rawMessage, details),
      );
    }

    if (isModelUnavailable(status, rawMessage)) {
      throw new ModelUnavailableError(model, rawMessage);
    }

    lastError = rawMessage;

    const canRetry =
      isTransientOverload(status, rawMessage) && attempt < MAX_OVERLOAD_RETRIES;

    if (!canRetry) {
      throw new Error(lastError);
    }

    await sleep(2000);
  }

  throw new Error(lastError);
}

async function callGeminiWithFallbacks(
  apiKey: string,
  prompt: string,
): Promise<GeminiGenerateResponse> {
  const models = getModelChain();
  let lastQuotaError: ModelQuotaError | null = null;

  for (const model of models) {
    try {
      return await callGeminiModel(apiKey, prompt, model);
    } catch (error) {
      if (error instanceof ModelQuotaError) {
        lastQuotaError = error;
        continue;
      }

      if (error instanceof ModelUnavailableError) {
        continue;
      }

      throw error;
    }
  }

  if (lastQuotaError) {
    if (lastQuotaError.isDailyLimit) {
      throw new AllModelsQuotaError(
        "Today's free AI limit is used up. It resets overnight — or enable billing at aistudio.google.com.",
        0,
        true,
      );
    }

    throw new AllModelsQuotaError(
      `AI rate limit reached — wait about ${lastQuotaError.retryAfterSeconds} seconds and try again.`,
      lastQuotaError.retryAfterSeconds,
    );
  }

  throw new Error(
    "Recommendations unavailable — configured AI models are not supported.",
  );
}

export async function getRecommendations(
  anchor: Anchor,
  axis: Axis,
): Promise<RawRecommendation[]> {
  const apiKey = getApiKey();
  const prompt = buildRecommendPrompt(anchor, axis);

  const data = await callGeminiWithFallbacks(apiKey, prompt);

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Couldn't read recommendations — try again.");
  }

  const parsed = parseRecommendations(rawText);
  const filtered = filterAnchorAndDuplicates(anchor, parsed);

  if (filtered.length === 0) {
    throw new Error("Couldn't read recommendations — try again.");
  }

  return filtered;
}

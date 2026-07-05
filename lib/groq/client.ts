import type { Anchor, Axis, RawRecommendation } from "@/lib/types";
import { AllModelsQuotaError } from "@/lib/gemini/client";
import { filterAnchorAndDuplicates } from "@/lib/gemini/client";
import { buildRecommendPrompt, getAxisTemperature } from "@/lib/gemini/prompts";
import { parseRecommendations } from "@/lib/gemini/parse";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

function getApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Recommendations unavailable — check configuration.");
  }

  return apiKey;
}

export function assertGroqConfigured(): void {
  getApiKey();
}

function getModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

function extractJsonArray(rawText: string): string {
  const cleaned = rawText.trim();

  try {
    const parsed = JSON.parse(cleaned) as unknown;

    if (Array.isArray(parsed)) {
      return cleaned;
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { recommendations?: unknown }).recommendations)
    ) {
      return JSON.stringify(
        (parsed as { recommendations: unknown[] }).recommendations,
      );
    }
  } catch {
    // Fall through to array extraction from markdown fences.
  }

  return cleaned;
}

function parseRetryAfterSeconds(headers: Headers): number {
  const retryAfter = headers.get("retry-after");

  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);

    if (!Number.isNaN(seconds) && seconds > 0) {
      return seconds;
    }
  }

  return 60;
}

export async function getGroqRecommendations(
  anchor: Anchor,
  axis: Axis,
  options?: { strictScene?: boolean },
): Promise<RawRecommendation[]> {
  const apiKey = getApiKey();
  const prompt = `${buildRecommendPrompt(anchor, axis, options)}

Return your answer as a JSON object with a single key "recommendations" whose value is the array of song objects.`;

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        {
          role: "system",
          content:
            "You are a precise music recommendation engine. Each request uses exactly one similarity axis (beat, mood, or lyrics). Lists for different axes must differ meaningfully. For Indian/Tamil/Hindi/Telugu anchors, recommend only songs from that same language and industry — never substitute Western English hits. Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: getAxisTemperature(axis),
    }),
  });

  if (response.status === 429) {
    throw new AllModelsQuotaError(
      "AI rate limit reached — wait a minute, then click Retry.",
      parseRetryAfterSeconds(response.headers),
    );
  }

  const data = (await response.json()) as GroqChatResponse;

  if (!response.ok) {
    const message =
      data.error?.message ?? "Recommendations unavailable — try again.";

    if (/rate limit|too many requests/i.test(message)) {
      throw new AllModelsQuotaError(
        "AI rate limit reached — wait a minute, then click Retry.",
        60,
      );
    }

    throw new Error(message);
  }

  const rawText = data.choices?.[0]?.message?.content;

  if (!rawText) {
    throw new Error("Couldn't read recommendations — try again.");
  }

  const parsed = parseRecommendations(extractJsonArray(rawText));
  const filtered = filterAnchorAndDuplicates(anchor, parsed);

  if (filtered.length === 0) {
    throw new Error("Couldn't read recommendations — try again.");
  }

  return filtered;
}

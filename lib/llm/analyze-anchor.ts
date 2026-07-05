import type { Axis, Anchor } from "@/lib/types";
import { AllModelsQuotaError } from "@/lib/gemini/client";
import { detectAnchorScene } from "@/lib/music/anchor-scene";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function getApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Recommendations unavailable — check configuration.");
  }

  return apiKey;
}

function getModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

function buildAnalyzePrompt(anchor: Anchor, axis: Axis): string {
  const albumLine = anchor.albumName ? `Album/film: ${anchor.albumName}` : "";
  const yearLine = anchor.releaseYear ? `Year: ${anchor.releaseYear}` : "";

  const axisQuestion =
    axis === "beat"
      ? "Describe the actual tempo, percussion, and energy of THIS recording — not generic guesses."
      : axis === "mood"
        ? "Describe the specific emotional atmosphere this recording creates — not just 'happy' or 'sad'."
        : "Describe what this song is lyrically about (translate the title if needed) and its narrative theme.";

  return `You are an expert on Indian film and pop music (Tamil, Hindi, Telugu, Malayalam).

The user selected this exact Spotify recording:
- Title: "${anchor.title}"
- Artist: ${anchor.artist}
${albumLine}
${yearLine}

${axisQuestion}

Rules:
- Analyze THIS specific song recording, not a different song with a similar name.
- Be concrete (e.g. "mass kuthu dance track ~130 BPM" vs "slow romantic ballad ~75 BPM").
- Do not confuse upbeat dance intro songs with mellow romantic tracks.

Return JSON: { "anchorAssessment": "2-3 sentences" }`;
}

export async function analyzeAnchorForAxis(
  anchor: Anchor,
  axis: Axis,
): Promise<string | null> {
  if (!detectAnchorScene(anchor)) {
    return null;
  }

  const apiKey = getApiKey();
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
            "You analyze Indian film/pop songs accurately. Return valid JSON only.",
        },
        {
          role: "user",
          content: buildAnalyzePrompt(anchor, axis),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    const seconds = retryAfter ? Number.parseInt(retryAfter, 10) : 60;

    throw new AllModelsQuotaError(
      "AI rate limit reached — wait a minute, then click Retry.",
      Number.isNaN(seconds) ? 60 : seconds,
    );
  }

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GroqChatResponse;
  const rawText = data.choices?.[0]?.message?.content;

  if (!rawText) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawText) as { anchorAssessment?: unknown };

    if (
      typeof parsed.anchorAssessment === "string" &&
      parsed.anchorAssessment.trim().length > 0
    ) {
      return parsed.anchorAssessment.trim();
    }
  } catch {
    return null;
  }

  return null;
}

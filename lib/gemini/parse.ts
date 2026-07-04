import type { RawRecommendation } from "@/lib/types";
import { RECOMMENDATION_COUNT } from "@/lib/constants";

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }

  return cleaned.trim();
}

function isRawRecommendation(value: unknown): value is RawRecommendation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.title === "string" &&
    typeof record.artist === "string" &&
    typeof record.reason === "string" &&
    record.title.trim().length > 0 &&
    record.artist.trim().length > 0 &&
    record.reason.trim().length > 0
  );
}

export function parseRecommendations(rawText: string): RawRecommendation[] {
  const cleaned = stripMarkdownFences(rawText);

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Couldn't read recommendations — try again.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Couldn't read recommendations — try again.");
  }

  const recommendations = parsed
    .filter(isRawRecommendation)
    .map((item) => ({
      title: item.title.trim(),
      artist: item.artist.trim(),
      reason: item.reason.trim(),
    }))
    .slice(0, RECOMMENDATION_COUNT);

  if (recommendations.length === 0) {
    throw new Error("Couldn't read recommendations — try again.");
  }

  return recommendations;
}

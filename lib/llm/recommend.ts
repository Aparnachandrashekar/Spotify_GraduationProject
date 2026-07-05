import {
  AllModelsQuotaError,
  assertGeminiConfigured,
  getRecommendations as getGeminiRecommendations,
} from "@/lib/gemini/client";
import {
  assertGroqConfigured,
  getGroqRecommendations,
} from "@/lib/groq/client";
import { getRecommendationsWithSceneGuard } from "@/lib/llm/scene-filter";
import type { Anchor, Axis, RawRecommendation } from "@/lib/types";

export { AllModelsQuotaError };

function useGroq(): boolean {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();

  if (provider === "groq") {
    return true;
  }

  if (provider === "gemini") {
    return false;
  }

  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export function assertLlmConfigured(): void {
  if (useGroq()) {
    assertGroqConfigured();
    return;
  }

  assertGeminiConfigured();
}

export async function getRecommendations(
  anchor: Anchor,
  axis: Axis,
): Promise<RawRecommendation[]> {
  if (useGroq()) {
    return getRecommendationsWithSceneGuard(anchor, axis, getGroqRecommendations);
  }

  return getRecommendationsWithSceneGuard(anchor, axis, getGeminiRecommendations);
}

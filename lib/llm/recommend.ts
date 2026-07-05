import {
  AllModelsQuotaError,
  assertGeminiConfigured,
  getRecommendations as getGeminiRecommendations,
} from "@/lib/gemini/client";
import {
  assertGroqConfigured,
  getGroqRecommendations,
} from "@/lib/groq/client";
import { analyzeAnchorForAxis } from "@/lib/llm/analyze-anchor";
import { getRecommendationsWithSceneGuard } from "@/lib/llm/scene-filter";
import { inferAnchorProfile, type InferredAnchorProfile } from "@/lib/music/anchor-inference";
import { detectAnchorScene } from "@/lib/music/anchor-scene";
import type { TrackAudioProfile } from "@/lib/spotify/audio-features";
import type { Anchor, Axis, RawRecommendation } from "@/lib/types";

export { AllModelsQuotaError };

export type RecommendOptions = {
  strictScene?: boolean;
  audioProfile?: TrackAudioProfile | null;
  anchorAssessment?: string | null;
  inferredProfile?: InferredAnchorProfile | null;
};

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
  options?: RecommendOptions,
): Promise<RawRecommendation[]> {
  const scene = detectAnchorScene(anchor);
  const inferredProfile = scene ? inferAnchorProfile(anchor) : null;
  let anchorAssessment = options?.anchorAssessment ?? null;

  if (scene && !anchorAssessment) {
    anchorAssessment = await analyzeAnchorForAxis(anchor, axis);
  }

  const enrichedOptions: RecommendOptions = {
    ...options,
    inferredProfile,
    anchorAssessment,
  };

  if (useGroq()) {
    return getRecommendationsWithSceneGuard(
      anchor,
      axis,
      getGroqRecommendations,
      enrichedOptions,
    );
  }

  return getRecommendationsWithSceneGuard(
    anchor,
    axis,
    getGeminiRecommendations,
    enrichedOptions,
  );
}

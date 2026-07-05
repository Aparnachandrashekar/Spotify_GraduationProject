import type { Axis, Recommendation } from "@/lib/types";
import {
  energyMatchScore,
  inferAnchorProfile,
  inferTitleBeatEnergy,
  type InferredAnchorProfile,
} from "@/lib/music/anchor-inference";
import type { Anchor } from "@/lib/types";

function moodKeywordScore(
  anchorTitle: string,
  candidateTitle: string,
  profile: InferredAnchorProfile,
): number {
  const anchor = anchorTitle.toLowerCase();
  const candidate = candidateTitle.toLowerCase();
  let score = 0;

  if (profile.beatEnergy === "low") {
    if (
      /kannamma|munbe|anbe|pogadhe|melody|yaayum|visai|ennodu|vaseegara/i.test(
        candidate,
      )
    ) {
      score += 2;
    }

    if (/mass|doluma|vaathi|raid|rowdy|local|donu/i.test(candidate)) {
      score -= 2;
    }
  }

  if (profile.beatEnergy === "high") {
    if (/mass|doluma|vaathi|raid|rowdy|local|donu|chillena|arabic/i.test(
      candidate,
    )) {
      score += 2;
    }

    if (/munbe|vaseegara|pogadhe|yaayum|melody/i.test(candidate)) {
      score -= 2;
    }
  }

  if (anchor.includes("kannamma") && candidate.includes("kannamma")) {
    score += 1;
  }

  return score;
}

export function rerankRecommendationsByInference(
  recommendations: Recommendation[],
  anchor: Anchor,
  axis: Axis,
): Recommendation[] {
  if (axis === "lyrics" || recommendations.length <= 1) {
    return recommendations;
  }

  const profile = inferAnchorProfile(anchor);

  const scored = recommendations
    .map((recommendation) => {
      const candidateEnergy = inferTitleBeatEnergy(recommendation.title);
      const beatScore = energyMatchScore(profile.beatEnergy, candidateEnergy);
      const moodScore = moodKeywordScore(
        anchor.title,
        recommendation.title,
        profile,
      );

      const totalScore =
        axis === "beat" ? beatScore * 3 + moodScore : moodScore * 3 + beatScore;

      return {
        recommendation,
        totalScore,
      };
    })
    .sort((left, right) => right.totalScore - left.totalScore);

  return scored.map((item, index) => ({
    ...item.recommendation,
    rank: index + 1,
  }));
}

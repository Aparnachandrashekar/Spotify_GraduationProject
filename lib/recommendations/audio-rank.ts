import type { Axis, Recommendation } from "@/lib/types";
import type { TrackAudioProfile } from "@/lib/spotify/audio-features";
import { getSeveralTrackAudioProfiles } from "@/lib/spotify/audio-features";

function beatDistance(
  anchor: TrackAudioProfile,
  candidate: TrackAudioProfile,
): number {
  const tempoDiff = Math.abs(anchor.tempo - candidate.tempo) / 50;
  const energyDiff = Math.abs(anchor.energy - candidate.energy);
  const danceDiff = Math.abs(anchor.danceability - candidate.danceability);
  const acousticDiff = Math.abs(anchor.acousticness - candidate.acousticness);

  return (
    tempoDiff * 0.45 +
    energyDiff * 0.35 +
    danceDiff * 0.12 +
    acousticDiff * 0.08
  );
}

function moodDistance(
  anchor: TrackAudioProfile,
  candidate: TrackAudioProfile,
): number {
  const valenceDiff = Math.abs(anchor.valence - candidate.valence);
  const energyDiff = Math.abs(anchor.energy - candidate.energy);
  const acousticDiff = Math.abs(anchor.acousticness - candidate.acousticness);
  const tempoDiff = Math.abs(anchor.tempo - candidate.tempo) / 80;

  return (
    valenceDiff * 0.5 +
    energyDiff * 0.28 +
    acousticDiff * 0.12 +
    tempoDiff * 0.1
  );
}

function distanceForAxis(
  axis: Axis,
  anchor: TrackAudioProfile,
  candidate: TrackAudioProfile,
): number {
  if (axis === "beat") {
    return beatDistance(anchor, candidate);
  }

  if (axis === "mood") {
    return moodDistance(anchor, candidate);
  }

  return 0;
}

export async function rerankRecommendationsByAudio(
  recommendations: Recommendation[],
  anchorProfile: TrackAudioProfile,
  axis: Axis,
): Promise<Recommendation[]> {
  if (axis === "lyrics" || recommendations.length <= 1) {
    return recommendations;
  }

  const profiles = await getSeveralTrackAudioProfiles(
    recommendations.map((item) => item.spotifyId),
  );

  const scored = recommendations
    .map((recommendation) => {
      const profile = profiles.get(recommendation.spotifyId);

      if (!profile) {
        return {
          recommendation,
          distance: Number.POSITIVE_INFINITY,
        };
      }

      return {
        recommendation,
        distance: distanceForAxis(axis, anchorProfile, profile),
      };
    })
    .sort((left, right) => left.distance - right.distance);

  return scored.map((item, index) => ({
    ...item.recommendation,
    rank: index + 1,
  }));
}

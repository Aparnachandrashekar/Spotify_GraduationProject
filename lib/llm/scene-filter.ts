import { RECOMMENDATION_REQUEST_COUNT } from "@/lib/constants";
import {
  filterRecommendationsForScene,
  detectAnchorScene,
} from "@/lib/music/anchor-scene";
import type { Anchor, Axis, RawRecommendation } from "@/lib/types";

const MIN_SCENE_COUNT = Math.ceil(RECOMMENDATION_REQUEST_COUNT * 0.6);

type FetchRecommendations = (
  anchor: Anchor,
  axis: Axis,
  options?: { strictScene?: boolean },
) => Promise<RawRecommendation[]>;

export async function getRecommendationsWithSceneGuard(
  anchor: Anchor,
  axis: Axis,
  fetchRecommendations: FetchRecommendations,
): Promise<RawRecommendation[]> {
  const scene = detectAnchorScene(anchor);
  const initial = await fetchRecommendations(anchor, axis);

  if (!scene) {
    return initial;
  }

  const filtered = filterRecommendationsForScene(initial, scene);

  if (filtered.length >= MIN_SCENE_COUNT) {
    return filtered;
  }

  const retry = await fetchRecommendations(anchor, axis, { strictScene: true });
  const retryFiltered = filterRecommendationsForScene(retry, scene);

  if (retryFiltered.length >= MIN_SCENE_COUNT) {
    return retryFiltered;
  }

  if (retryFiltered.length >= filtered.length) {
    return retryFiltered;
  }

  return filtered;
}

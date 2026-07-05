import type { Axis, RawRecommendation } from "@/lib/types";

type CacheEntry = {
  rawRecommendations: RawRecommendation[];
  expiresAt: number;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_VERSION = "scene-v6";
const cache = new Map<string, CacheEntry>();

function cacheKey(
  title: string,
  artist: string,
  axis: Axis,
): string {
  return `${CACHE_VERSION}|${title.toLowerCase()}|${artist.toLowerCase()}|${axis}`;
}

export function getCachedRecommendations(
  title: string,
  artist: string,
  axis: Axis,
): RawRecommendation[] | null {
  const key = cacheKey(title, artist, axis);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.rawRecommendations;
}

export function setCachedRecommendations(
  title: string,
  artist: string,
  axis: Axis,
  rawRecommendations: RawRecommendation[],
): void {
  const key = cacheKey(title, artist, axis);

  cache.set(key, {
    rawRecommendations,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

import type { Anchor, RawRecommendation, Recommendation } from "@/lib/types";
import { RECOMMENDATION_DISPLAY_COUNT } from "@/lib/constants";
import { normalizeSongKey } from "@/lib/recommendations/keys";
import { lookupTrack } from "./search";

const ENRICH_CONCURRENCY = 2;
const ENRICH_LOOKUP_DELAY_MS = 120;

export type EnrichmentStats = {
  llmReturned: number;
  survivedLookup: number;
  dropped: number;
};

function dedupeRawInOrder(
  rawRecommendations: RawRecommendation[],
  anchorKey: string,
): RawRecommendation[] {
  const seen = new Set<string>([anchorKey]);
  const deduped: RawRecommendation[] = [];

  for (const item of rawRecommendations) {
    const key = normalizeSongKey(item.title, item.artist);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);

      if (currentIndex < items.length - 1) {
        await new Promise((resolve) => {
          setTimeout(resolve, ENRICH_LOOKUP_DELAY_MS);
        });
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );

  await Promise.all(workers);

  return results;
}

async function enrichRecommendation(
  raw: RawRecommendation,
): Promise<Recommendation | null> {
  try {
    const track = await lookupTrack(raw.title, raw.artist);

    if (!track) {
      return null;
    }

    return {
      rank: 0,
      title: track.title,
      artist: track.artist,
      reason: raw.reason,
      spotifyId: track.id,
      albumArtUrl: track.albumArtUrl,
      spotifyUrl: track.spotifyUrl,
      previewUrl: track.previewUrl,
    };
  } catch {
    return null;
  }
}

export async function enrichRecommendations(
  rawRecommendations: RawRecommendation[],
  anchor: Anchor,
): Promise<{ recommendations: Recommendation[]; stats: EnrichmentStats }> {
  const anchorKey = normalizeSongKey(anchor.title, anchor.artist);
  const dedupedRaw = dedupeRawInOrder(rawRecommendations, anchorKey);

  const indexedResults = await mapWithConcurrency(
    dedupedRaw,
    ENRICH_CONCURRENCY,
    async (raw, index) => ({
      index,
      recommendation: await enrichRecommendation(raw),
    }),
  );

  indexedResults.sort((a, b) => a.index - b.index);

  const seenSpotifyIds = new Set<string>();
  const recommendations: Recommendation[] = [];

  for (const { recommendation } of indexedResults) {
    if (recommendations.length >= RECOMMENDATION_DISPLAY_COUNT) {
      break;
    }

    if (!recommendation) {
      continue;
    }

    if (seenSpotifyIds.has(recommendation.spotifyId)) {
      continue;
    }

    const resolvedKey = normalizeSongKey(
      recommendation.title,
      recommendation.artist,
    );

    if (resolvedKey === anchorKey) {
      continue;
    }

    seenSpotifyIds.add(recommendation.spotifyId);
    recommendations.push({
      ...recommendation,
      rank: recommendations.length + 1,
    });
  }

  const stats: EnrichmentStats = {
    llmReturned: rawRecommendations.length,
    survivedLookup: recommendations.length,
    dropped: rawRecommendations.length - recommendations.length,
  };

  return { recommendations, stats };
}

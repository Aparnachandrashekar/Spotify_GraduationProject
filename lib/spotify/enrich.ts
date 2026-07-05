import type { Anchor, RawRecommendation, Recommendation } from "@/lib/types";
import {
  RECOMMENDATION_DISPLAY_COUNT,
  RECOMMENDATION_REQUEST_COUNT,
} from "@/lib/constants";
import { normalizeSongKey } from "@/lib/recommendations/keys";
import { lookupTrack } from "./search";

const ENRICH_LOOKUP_DELAY_MS = 100;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
  const dedupedRaw = dedupeRawInOrder(rawRecommendations, anchorKey).slice(
    0,
    RECOMMENDATION_REQUEST_COUNT,
  );

  const seenSpotifyIds = new Set<string>();
  const recommendations: Recommendation[] = [];
  let lookups = 0;

  for (const raw of dedupedRaw) {
    if (recommendations.length >= RECOMMENDATION_DISPLAY_COUNT) {
      break;
    }

    const recommendation = await enrichRecommendation(raw);
    lookups += 1;

    if (!recommendation) {
      if (lookups < dedupedRaw.length) {
        await sleep(ENRICH_LOOKUP_DELAY_MS);
      }
      continue;
    }

    if (seenSpotifyIds.has(recommendation.spotifyId)) {
      if (lookups < dedupedRaw.length) {
        await sleep(ENRICH_LOOKUP_DELAY_MS);
      }
      continue;
    }

    const resolvedKey = normalizeSongKey(
      recommendation.title,
      recommendation.artist,
    );

    if (resolvedKey === anchorKey) {
      if (lookups < dedupedRaw.length) {
        await sleep(ENRICH_LOOKUP_DELAY_MS);
      }
      continue;
    }

    seenSpotifyIds.add(recommendation.spotifyId);
    recommendations.push({
      ...recommendation,
      rank: recommendations.length + 1,
    });

    if (
      recommendations.length < RECOMMENDATION_DISPLAY_COUNT &&
      lookups < dedupedRaw.length
    ) {
      await sleep(ENRICH_LOOKUP_DELAY_MS);
    }
  }

  console.info(
    `[spotify] enrich done: ${lookups} lookups, ${recommendations.length} results`,
  );

  const stats: EnrichmentStats = {
    llmReturned: rawRecommendations.length,
    survivedLookup: recommendations.length,
    dropped: rawRecommendations.length - recommendations.length,
  };

  return { recommendations, stats };
}

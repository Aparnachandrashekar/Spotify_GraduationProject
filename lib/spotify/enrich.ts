import type { RawRecommendation, Recommendation } from "@/lib/types";
import { lookupItunesPreviewUrl } from "@/lib/preview/resolve";
import { lookupTrack, resolvePreviewUrl } from "./search";

export async function enrichRecommendation(
  raw: RawRecommendation,
): Promise<Recommendation | null> {
  try {
    let track = await lookupTrack(raw.title, raw.artist);

    if (!track) {
      return null;
    }

    if (!track.previewUrl) {
      const previewUrl =
        (await resolvePreviewUrl(track.id)) ??
        (await lookupItunesPreviewUrl(raw.title, raw.artist));

      if (previewUrl) {
        track = { ...track, previewUrl };
      }
    }

    return {
      title: raw.title,
      artist: raw.artist,
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
): Promise<Recommendation[]> {
  const results = await Promise.all(
    rawRecommendations.map((raw) => enrichRecommendation(raw)),
  );

  return results.filter(
    (item): item is Recommendation => item !== null,
  );
}

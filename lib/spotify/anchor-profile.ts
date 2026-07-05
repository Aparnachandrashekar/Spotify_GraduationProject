import type { Anchor } from "@/lib/types";
import {
  getTrackAudioProfile,
  type TrackAudioProfile,
} from "./audio-features";
import { lookupTrack } from "./search";

export async function resolveAnchorAudioProfile(
  anchor: Anchor,
): Promise<{ spotifyId: string | null; profile: TrackAudioProfile | null }> {
  if (anchor.spotifyId) {
    const profile = await getTrackAudioProfile(anchor.spotifyId);

    return {
      spotifyId: anchor.spotifyId,
      profile,
    };
  }

  const track = await lookupTrack(anchor.title, anchor.artist);

  if (!track) {
    return { spotifyId: null, profile: null };
  }

  const profile = await getTrackAudioProfile(track.id);

  return {
    spotifyId: track.id,
    profile,
  };
}

import { SPOTIFY_FETCH_TIMEOUT_MS } from "@/lib/constants";
import { clearTokenCache, getAccessToken } from "./auth";
import { logSpotifyCall } from "./logger";
import {
  getSpotifyCooldownMs,
  markSpotifyRateLimited,
  parseRetryAfterSeconds,
  spotifyBusyMessage,
  waitForSpotifyCooldown,
} from "./rate-limit";

const AUDIO_FEATURES_URL = "https://api.spotify.com/v1/audio-features";
const CACHE_TTL_MS = 60 * 60_000;

export type TrackAudioProfile = {
  tempo: number;
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
};

type SpotifyAudioFeaturesResponse = {
  tempo: number;
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
};

type BatchAudioFeaturesResponse = {
  audio_features: Array<SpotifyAudioFeaturesResponse | null>;
};

const cache = new Map<string, { profile: TrackAudioProfile | null; expiresAt: number }>();

function normalizeProfile(
  data: SpotifyAudioFeaturesResponse,
): TrackAudioProfile {
  return {
    tempo: data.tempo,
    energy: data.energy,
    valence: data.valence,
    danceability: data.danceability,
    acousticness: data.acousticness,
    instrumentalness: data.instrumentalness,
  };
}

async function spotifyFetch(url: string, retryAuth = true): Promise<Response> {
  const canProceed = await waitForSpotifyCooldown();

  if (!canProceed) {
    throw new Error(spotifyBusyMessage());
  }

  const accessToken = await getAccessToken();

  logSpotifyCall("audio-features", url.replace("https://api.spotify.com/v1/", ""));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(SPOTIFY_FETCH_TIMEOUT_MS),
  });

  if (response.status === 401 && retryAuth) {
    clearTokenCache();
    return spotifyFetch(url, false);
  }

  if (response.status === 429) {
    const retryAfterSeconds = parseRetryAfterSeconds(
      response.headers.get("retry-after"),
    );
    markSpotifyRateLimited(retryAfterSeconds);
    throw new Error(spotifyBusyMessage());
  }

  return response;
}

export async function getTrackAudioProfile(
  trackId: string,
): Promise<TrackAudioProfile | null> {
  const cached = cache.get(trackId);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.profile;
  }

  const response = await spotifyFetch(`${AUDIO_FEATURES_URL}/${trackId}`);

  if (response.status === 404) {
    cache.set(trackId, { profile: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as SpotifyAudioFeaturesResponse;
  const profile = normalizeProfile(data);

  cache.set(trackId, { profile, expiresAt: Date.now() + CACHE_TTL_MS });

  return profile;
}

export async function getSeveralTrackAudioProfiles(
  trackIds: string[],
): Promise<Map<string, TrackAudioProfile>> {
  const uniqueIds = [...new Set(trackIds.filter(Boolean))];
  const profiles = new Map<string, TrackAudioProfile>();
  const missing: string[] = [];

  for (const id of uniqueIds) {
    const cached = cache.get(id);

    if (cached && Date.now() < cached.expiresAt && cached.profile) {
      profiles.set(id, cached.profile);
      continue;
    }

    missing.push(id);
  }

  for (let index = 0; index < missing.length; index += 100) {
    const batch = missing.slice(index, index + 100);
    const params = new URLSearchParams({ ids: batch.join(",") });
    const response = await spotifyFetch(`${AUDIO_FEATURES_URL}?${params.toString()}`);

    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as BatchAudioFeaturesResponse;

    batch.forEach((id, batchIndex) => {
      const feature = data.audio_features[batchIndex];

      if (!feature) {
        cache.set(id, { profile: null, expiresAt: Date.now() + CACHE_TTL_MS });
        return;
      }

      const profile = normalizeProfile(feature);
      profiles.set(id, profile);
      cache.set(id, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
    });
  }

  return profiles;
}

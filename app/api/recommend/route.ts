import {
  AllModelsQuotaError,
  getRecommendations,
  assertLlmConfigured,
} from "@/lib/llm/recommend";
import {
  getCachedRecommendations,
  setCachedRecommendations,
} from "@/lib/gemini/recommend-cache";
import { rerankRecommendationsByInference } from "@/lib/recommendations/inference-rank";
import { rerankRecommendationsByAudio } from "@/lib/recommendations/audio-rank";
import { resolveAnchorAudioProfile } from "@/lib/spotify/anchor-profile";
import { assertSpotifyConfigured } from "@/lib/spotify/auth";
import { enrichRecommendations } from "@/lib/spotify/enrich";
import { apiError } from "@/lib/api/response";
import {
  getErrorStatus,
  getFriendlyErrorMessage,
  getRetryAfterSeconds,
} from "@/lib/errors";
import { isAxis } from "@/lib/constants";
import type {
  RecommendRequestBody,
  RecommendResponse,
} from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

function isAnchor(value: unknown): value is RecommendRequestBody["anchor"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  const hasOptionalAlbum =
    record.albumName === undefined ||
    record.albumName === null ||
    typeof record.albumName === "string";
  const hasOptionalYear =
    record.releaseYear === undefined ||
    record.releaseYear === null ||
    typeof record.releaseYear === "number";

  const hasOptionalSpotifyId =
    record.spotifyId === undefined ||
    record.spotifyId === null ||
    typeof record.spotifyId === "string";

  return (
    typeof record.title === "string" &&
    typeof record.artist === "string" &&
    record.title.trim().length > 0 &&
    record.artist.trim().length > 0 &&
    hasOptionalAlbum &&
    hasOptionalYear &&
    hasOptionalSpotifyId
  );
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<RecommendResponse | { error: string; retryAfterSeconds?: number }>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request.", 400);
  }

  if (!body || typeof body !== "object") {
    return apiError("Invalid request.", 400);
  }

  const record = body as Record<string, unknown>;

  if (!isAnchor(record.anchor)) {
    return apiError("Invalid anchor. Provide title and artist.", 400);
  }

  if (!isAxis(record.axis)) {
    return apiError("Invalid axis. Must be beat, mood, or lyrics.", 400);
  }

  const anchor = {
    title: record.anchor.title.trim(),
    artist: record.anchor.artist.trim(),
    albumName:
      typeof record.anchor.albumName === "string"
        ? record.anchor.albumName.trim()
        : null,
    releaseYear:
      typeof record.anchor.releaseYear === "number"
        ? record.anchor.releaseYear
        : null,
    spotifyId:
      typeof record.anchor.spotifyId === "string"
        ? record.anchor.spotifyId.trim()
        : null,
  };
  const axis = record.axis;

  try {
    assertLlmConfigured();
    assertSpotifyConfigured();

    const { profile: audioProfile } = await resolveAnchorAudioProfile(anchor);

    const cached = getCachedRecommendations(anchor.title, anchor.artist, axis);
    const rawRecommendations =
      cached ??
      (await getRecommendations(anchor, axis, {
        audioProfile,
      }));

    if (!cached) {
      setCachedRecommendations(
        anchor.title,
        anchor.artist,
        axis,
        rawRecommendations,
      );
    }

    const { recommendations, stats } = await enrichRecommendations(
      rawRecommendations,
      anchor,
    );

    const rankedByInference = rerankRecommendationsByInference(
      recommendations,
      anchor,
      axis,
    );

    const rankedRecommendations = audioProfile
      ? await rerankRecommendationsByAudio(
          rankedByInference,
          audioProfile,
          axis,
        )
      : rankedByInference;

    console.info(
      `[recommend] "${anchor.title}" by ${anchor.artist} (${axis}): LLM returned ${stats.llmReturned}, ${stats.survivedLookup} survived Spotify lookup, ${stats.dropped} dropped`,
    );

    return NextResponse.json({ axis, recommendations: rankedRecommendations });
  } catch (error) {
    if (error instanceof AllModelsQuotaError) {
      return NextResponse.json(
        {
          error: error.message,
          retryAfterSeconds: error.isDailyLimit ? 0 : error.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    const friendlyMessage = getFriendlyErrorMessage(message);
    const status = getErrorStatus(friendlyMessage);
    const retryAfterSeconds = getRetryAfterSeconds(friendlyMessage, status);

    if (status === 429 || status === 503) {
      return NextResponse.json(
        {
          error: friendlyMessage,
          retryAfterSeconds,
        },
        { status },
      );
    }

    return apiError(friendlyMessage, status);
  }
}

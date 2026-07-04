import { assertSpotifyConfigured } from "@/lib/spotify/auth";
import { getSpotifyCooldownSeconds } from "@/lib/spotify/rate-limit";
import { getSpotifyCallCount, resetSpotifyCallCount } from "@/lib/spotify/logger";
import { searchTracks } from "@/lib/spotify/search";
import { apiError } from "@/lib/api/response";
import { getErrorStatus } from "@/lib/errors";
import type { SearchResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<SearchResponse | { error: string }>> {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return apiError("Search query is required.", 400);
  }

  try {
    assertSpotifyConfigured();
    resetSpotifyCallCount();
    console.info(`[spotify] search route q="${query}"`);
    const tracks = await searchTracks(query);
    const spotifyCalls = getSpotifyCallCount();
    console.info(
      `[spotify] search route done q="${query}" spotifyCalls=${spotifyCalls}`,
    );

    return NextResponse.json({ tracks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    const retryAfterSeconds = getSpotifyCooldownSeconds();
    const status = getErrorStatus(message);

    if (retryAfterSeconds > 0 && /spotify is busy/i.test(message)) {
      return NextResponse.json(
        { error: message, retryAfterSeconds },
        { status: 429 },
      );
    }

    return apiError(message, status);
  }
}

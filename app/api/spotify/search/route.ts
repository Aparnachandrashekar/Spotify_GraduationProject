import { assertSpotifyConfigured } from "@/lib/spotify/auth";
import { searchTracks } from "@/lib/spotify/search";
import { apiError } from "@/lib/api/response";
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
    const tracks = await searchTracks(query);

    return NextResponse.json({ tracks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return apiError(message);
  }
}

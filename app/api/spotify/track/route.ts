import { lookupItunesPreviewUrl, resolvePlayablePreviewUrl } from "@/lib/preview/resolve";
import { getTrackById, resolvePreviewUrl } from "@/lib/spotify/search";
import { apiError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";

  if (!id) {
    return apiError("Track id is required.", 400);
  }

  try {
    const track = await getTrackById(id);

    if (!track) {
      return apiError("Track not found.", 404);
    }

    const previewUrl = await resolvePlayablePreviewUrl({
      spotifyPreviewUrl: track.previewUrl,
      title: track.title,
      artist: track.artist,
      resolveSpotifyPreview: () => resolvePreviewUrl(id),
    });

    return NextResponse.json({
      id: track.id,
      previewUrl,
      spotifyUrl: track.spotifyUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return apiError(message);
  }
}

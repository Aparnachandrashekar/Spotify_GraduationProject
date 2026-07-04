export type Track = {
  id: string;
  title: string;
  artist: string;
  albumName: string | null;
  releaseYear: number | null;
  albumArtUrl: string | null;
  spotifyUrl: string;
  previewUrl: string | null;
};

export type Axis = "beat" | "mood" | "lyrics";

export type Anchor = {
  title: string;
  artist: string;
  albumName?: string | null;
  releaseYear?: number | null;
};

export type RawRecommendation = {
  title: string;
  artist: string;
  reason: string;
};

export type Recommendation = {
  rank: number;
  title: string;
  artist: string;
  reason: string;
  spotifyId: string;
  albumArtUrl: string | null;
  spotifyUrl: string;
  previewUrl: string | null;
};

export type PlayableTrack = {
  spotifyId: string;
  title: string;
  artist: string;
  albumArtUrl: string | null;
  spotifyUrl: string;
  previewUrl: string | null;
};

export type SavedTrack = {
  spotifyId: string;
  title: string;
  artist: string;
  albumArtUrl: string | null;
  spotifyUrl: string;
  previewUrl: string | null;
  reason?: string;
};

export type SearchResponse = {
  tracks: Track[];
};

export type RecommendResponse = {
  axis: Axis;
  recommendations: Recommendation[];
};

export type ApiErrorResponse = {
  error: string;
  retryAfterSeconds?: number;
};

export type RecommendRequestBody = {
  anchor: Anchor;
  axis: Axis;
};

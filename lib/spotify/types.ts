export type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

export type SpotifyArtist = {
  name: string;
};

export type SpotifyAlbum = {
  name: string;
  release_date: string;
  images: SpotifyImage[];
};

export type SpotifyTrackItem = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
  external_urls: {
    spotify?: string;
  };
};

export type SpotifySearchResponse = {
  tracks: {
    items: SpotifyTrackItem[];
  };
};

"use client";

import { PlayerBar } from "@/components/PlayerBar";
import type { PlayableTrack, Track } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type PlaybackContextValue = {
  nowPlaying: PlayableTrack | null;
  nowPlayingId: string | null;
  isPlaying: boolean;
  isLoadingPreview: boolean;
  play: (track: PlayableTrack) => void;
  togglePlay: () => void;
  clearPlaying: () => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function trackToPlayable(track: Track): PlayableTrack {
  return {
    spotifyId: track.id,
    title: track.title,
    artist: track.artist,
    albumArtUrl: track.albumArtUrl,
    spotifyUrl: track.spotifyUrl,
    previewUrl: track.previewUrl,
  };
}

async function fetchPreviewUrl(spotifyId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/spotify/track?id=${encodeURIComponent(spotifyId)}`,
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { previewUrl?: string | null };

    return data.previewUrl ?? null;
  } catch {
    return null;
  }
}

export function PlaybackProvider({
  children,
  useShellPlayer = false,
}: {
  children: React.ReactNode;
  useShellPlayer?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [nowPlaying, setNowPlaying] = useState<PlayableTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-player", nowPlaying !== null);

    return () => {
      document.body.classList.remove("has-player");
    };
  }, [nowPlaying]);

  const startPlayback = useCallback((track: PlayableTrack) => {
    const audio = audioRef.current;

    if (!audio || !track.previewUrl) {
      setIsPlaying(false);
      return;
    }

    audio.src = track.previewUrl;
    void audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false),
    );
  }, []);

  const resolveAndPlay = useCallback(
    async (track: PlayableTrack) => {
      setNowPlaying(track);

      if (track.previewUrl) {
        startPlayback(track);
        return;
      }

      setIsLoadingPreview(true);

      const previewUrl = await fetchPreviewUrl(track.spotifyId);
      setIsLoadingPreview(false);

      if (previewUrl) {
        const withPreview = { ...track, previewUrl };
        setNowPlaying(withPreview);
        startPlayback(withPreview);
      }
    },
    [startPlayback],
  );

  const play = useCallback(
    (track: PlayableTrack) => {
      const isSameTrack = nowPlaying?.spotifyId === track.spotifyId;

      if (isSameTrack) {
        const audio = audioRef.current;
        const previewUrl = nowPlaying?.previewUrl ?? track.previewUrl;

        if (!previewUrl) {
          void resolveAndPlay(track);
          return;
        }

        if (audio) {
          if (audio.paused) {
            void audio.play().then(
              () => setIsPlaying(true),
              () => setIsPlaying(false),
            );
          } else {
            audio.pause();
            setIsPlaying(false);
          }
        }

        return;
      }

      void resolveAndPlay(track);
    },
    [nowPlaying, resolveAndPlay],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;

    if (!nowPlaying) {
      return;
    }

    if (!nowPlaying.previewUrl && !isLoadingPreview) {
      void resolveAndPlay(nowPlaying);
      return;
    }

    if (!audio || !nowPlaying.previewUrl) {
      return;
    }

    if (audio.paused) {
      void audio.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false),
      );
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [nowPlaying, isLoadingPreview, resolveAndPlay]);

  const clearPlaying = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }

    setNowPlaying(null);
    setIsPlaying(false);
    setIsLoadingPreview(false);
  }, []);

  const value = useMemo(
    () => ({
      nowPlaying,
      nowPlayingId: nowPlaying?.spotifyId ?? null,
      isPlaying,
      isLoadingPreview,
      play,
      togglePlay,
      clearPlaying,
    }),
    [nowPlaying, isPlaying, isLoadingPreview, play, togglePlay, clearPlaying],
  );

  return (
    <PlaybackContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      {mounted && nowPlaying && !useShellPlayer
        ? createPortal(
            <PlayerBar
              track={nowPlaying}
              isPlaying={isPlaying}
              isLoadingPreview={isLoadingPreview}
              onTogglePlay={togglePlay}
              onClose={clearPlaying}
            />,
            document.body,
          )
        : null}
    </PlaybackContext.Provider>
  );
}

export function usePlayback(): PlaybackContextValue {
  const context = useContext(PlaybackContext);

  if (!context) {
    throw new Error("usePlayback must be used within PlaybackProvider.");
  }

  return context;
}

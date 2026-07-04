"use client";

import type { Recommendation, SavedTrack } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type SavedTracksContextValue = {
  savedTracks: SavedTrack[];
  isSaved: (spotifyId: string) => boolean;
  toggleSave: (track: SavedTrack) => void;
  removeSaved: (spotifyId: string) => void;
};

const SavedTracksContext = createContext<SavedTracksContextValue | null>(null);

export function recommendationToSavedTrack(
  recommendation: Recommendation,
): SavedTrack {
  return {
    spotifyId: recommendation.spotifyId,
    title: recommendation.title,
    artist: recommendation.artist,
    albumArtUrl: recommendation.albumArtUrl,
    spotifyUrl: recommendation.spotifyUrl,
    previewUrl: recommendation.previewUrl,
    reason: recommendation.reason,
  };
}

export function SavedTracksProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);

  const isSaved = useCallback(
    (spotifyId: string) =>
      savedTracks.some((track) => track.spotifyId === spotifyId),
    [savedTracks],
  );

  const toggleSave = useCallback((track: SavedTrack) => {
    setSavedTracks((current) => {
      const exists = current.some((item) => item.spotifyId === track.spotifyId);

      if (exists) {
        return current.filter((item) => item.spotifyId !== track.spotifyId);
      }

      return [...current, track];
    });
  }, []);

  const removeSaved = useCallback((spotifyId: string) => {
    setSavedTracks((current) =>
      current.filter((track) => track.spotifyId !== spotifyId),
    );
  }, []);

  const value = useMemo(
    () => ({
      savedTracks,
      isSaved,
      toggleSave,
      removeSaved,
    }),
    [savedTracks, isSaved, toggleSave, removeSaved],
  );

  return (
    <SavedTracksContext.Provider value={value}>
      {children}
    </SavedTracksContext.Provider>
  );
}

export function useSavedTracks(): SavedTracksContextValue {
  const context = useContext(SavedTracksContext);

  if (!context) {
    throw new Error("useSavedTracks must be used within SavedTracksProvider.");
  }

  return context;
}

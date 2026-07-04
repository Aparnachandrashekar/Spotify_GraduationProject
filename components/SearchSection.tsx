"use client";

import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from "@/lib/constants";
import type { ApiErrorResponse, SearchResponse, Track } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./SearchSection.module.css";

type SearchSectionProps = {
  hasAnchor?: boolean;
  onAnchorChange?: (track: Track | null) => void;
};

export function SearchSection({
  hasAnchor = false,
  onAnchorChange,
}: SearchSectionProps) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isChangingAnchor, setIsChangingAnchor] = useState(false);

  const requestIdRef = useRef(0);

  const runSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    const requestId = ++requestIdRef.current;

    if (trimmed.length < SEARCH_MIN_LENGTH) {
      setTracks([]);
      setHasSearched(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(trimmed)}`,
      );

      const data = (await response.json()) as SearchResponse | ApiErrorResponse;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        const message =
          "error" in data ? data.error : "Failed to search Spotify.";
        setTracks([]);
        setHasSearched(true);
        setError(message);
        return;
      }

      const success = data as SearchResponse;
      setTracks(success.tracks);
      setHasSearched(true);
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setTracks([]);
      setHasSearched(true);
      setError("Failed to search Spotify.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void runSearch(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query, runSearch]);

  function handleSelectTrack(track: Track) {
    setSelectedTrack(track);
    setQuery("");
    setTracks([]);
    setHasSearched(false);
    setIsChangingAnchor(false);
    onAnchorChange?.(track);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (hasAnchor) {
      setIsChangingAnchor(true);
    }
  }

  const showSearchResults =
    !hasAnchor || isChangingAnchor
      ? hasSearched && query.trim().length >= SEARCH_MIN_LENGTH
      : false;

  return (
    <section className={styles.section} aria-label="Song search">
      <SearchBar value={query} onChange={handleQueryChange} />

      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}

      {isLoading ? <LoadingState message="Searching Spotify…" /> : null}

      {!isLoading && showSearchResults ? (
        <SearchResults
          tracks={tracks}
          selectedTrackId={selectedTrack?.id}
          onSelectTrack={handleSelectTrack}
        />
      ) : null}

      {!isLoading &&
      !hasSearched &&
      query.trim().length > 0 &&
      query.trim().length < SEARCH_MIN_LENGTH ? (
        <p className={styles.hint} role="status">
          Type at least {SEARCH_MIN_LENGTH} characters to search.
        </p>
      ) : null}

      {hasAnchor && !isChangingAnchor && !isLoading ? (
        <p className={styles.hint} role="status">
          Search above to pick a different anchor song.
        </p>
      ) : null}
    </section>
  );
}

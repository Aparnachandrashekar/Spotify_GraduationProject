"use client";

import { AxisDiscovery } from "@/components/AxisDiscovery";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import { usePlayback } from "@/hooks/usePlayback";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { DEFAULT_AXIS, SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from "@/lib/constants";
import type { ApiErrorResponse, Axis, SearchResponse, Track } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import styles from "./DiscoveryScreen.module.css";

export function DiscoveryScreen() {
  const { clearPlaying } = usePlayback();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [anchor, setAnchor] = useState<Track | null>(null);
  const [axis, setAxis] = useState<Axis>(DEFAULT_AXIS);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const searchRequestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < SEARCH_MIN_LENGTH) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = ++searchRequestId.current;

      try {
        const response = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(trimmed)}`,
        );
        const data = (await response.json()) as SearchResponse | ApiErrorResponse;

        if (requestId !== searchRequestId.current) {
          return;
        }

        if (!response.ok) {
          const message =
            "error" in data ? data.error : "Failed to search Spotify.";
          setSearchResults([]);
          setShowResults(true);
          setError(getFriendlyErrorMessage(message));
          return;
        }

        const success = data as SearchResponse;
        setSearchResults(success.tracks);
        setShowResults(true);
        setError(null);
      } catch {
        if (requestId !== searchRequestId.current) {
          return;
        }
        setSearchResults([]);
        setShowResults(true);
        setError(getFriendlyErrorMessage("Failed to search Spotify."));
      } finally {
        if (requestId === searchRequestId.current) {
          setIsSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setError(null);

    if (value.trim().length < SEARCH_MIN_LENGTH) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
  }

  function handleSelectAnchor(track: Track) {
    setAnchor(track);
    setAxis(DEFAULT_AXIS);
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    clearPlaying();
  }

  function handleAxisChange(nextAxis: Axis) {
    if (nextAxis !== axis) {
      setAxis(nextAxis);
    }
  }

  function handleChangeSong() {
    setAnchor(null);
    setAxis(DEFAULT_AXIS);
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    clearPlaying();
  }

  return (
    <div className={styles.screen}>
      {!anchor ? (
        <>
          <p className={styles.lead}>
            Search for a song, then pick an axis to explore what &ldquo;similar&rdquo;
            means.
          </p>
          <SearchBar value={query} onChange={handleQueryChange} />
          {error ? (
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          ) : null}
          {isSearching ? <LoadingState message="Searching Spotify…" /> : null}
          {!isSearching && showResults ? (
            <SearchResults
              tracks={searchResults}
              onSelectTrack={handleSelectAnchor}
            />
          ) : null}
        </>
      ) : (
        <AxisDiscovery
          key={anchor.id}
          anchor={anchor}
          axis={axis}
          onAxisChange={handleAxisChange}
          onChangeSong={handleChangeSong}
        />
      )}
    </div>
  );
}

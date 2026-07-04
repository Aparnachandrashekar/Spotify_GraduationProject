"use client";

import { AxisDiscovery } from "@/components/AxisDiscovery";
import { ContentFilterPills } from "@/components/ContentFilterPills";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import { usePlayback } from "@/hooks/usePlayback";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { DEFAULT_AXIS, SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH, SEARCH_TIMEOUT_MS } from "@/lib/constants";
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
  const searchAbortRef = useRef<AbortController | null>(null);
  const lastFetchedQueryRef = useRef("");

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < SEARCH_MIN_LENGTH) {
      setIsSearching(false);
      return;
    }

    if (trimmed === lastFetchedQueryRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const requestId = ++searchRequestId.current;

      console.info(`[spotify] client search scheduled "${trimmed}"`);

      void (async () => {
        const timeoutId = window.setTimeout(() => {
          controller.abort();
        }, SEARCH_TIMEOUT_MS);

        try {
          const response = await fetch(
            `/api/spotify/search?q=${encodeURIComponent(trimmed)}`,
            { signal: controller.signal },
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
          lastFetchedQueryRef.current = trimmed;
          setSearchResults(success.tracks);
          setShowResults(true);
          setError(null);
        } catch (fetchError) {
          if (requestId !== searchRequestId.current) {
            return;
          }

          if (
            fetchError instanceof DOMException &&
            fetchError.name === "AbortError"
          ) {
            return;
          }

          setSearchResults([]);
          setShowResults(true);

          if (
            fetchError instanceof DOMException &&
            fetchError.name === "TimeoutError"
          ) {
            setError(
              getFriendlyErrorMessage(
                "Spotify search timed out. Check your connection and try again.",
              ),
            );
            return;
          }

          setError(getFriendlyErrorMessage("Failed to search Spotify."));
        } finally {
          window.clearTimeout(timeoutId);
          if (requestId === searchRequestId.current) {
            setIsSearching(false);
          }
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setError(null);

    if (value.trim().length < SEARCH_MIN_LENGTH) {
      searchAbortRef.current?.abort();
      lastFetchedQueryRef.current = "";
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    if (value.trim() !== lastFetchedQueryRef.current) {
      setIsSearching(true);
    }

    setShowResults(true);
  }

  function handleSelectAnchor(track: Track) {
    searchAbortRef.current?.abort();
    lastFetchedQueryRef.current = "";
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

  function handleReturnToLanding() {
    setAnchor(null);
    setAxis(DEFAULT_AXIS);
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    clearPlaying();
  }

  const isSearchActive = query.length > 0;

  return (
    <div className={styles.screen}>
      <ContentFilterPills
        axisActive
        onAxisSelect={handleReturnToLanding}
      />

      <div
        key={anchor ? `discovery-${anchor.id}` : "landing"}
        className={styles.viewPanel}
      >
        {!anchor ? (
          <div
            className={`${styles.landing} ${isSearchActive ? styles.landingCompact : ""}`}
          >
            <div
              className={`${styles.landingColumn} ${isSearchActive ? styles.landingColumnCompact : ""}`}
            >
              <header
                className={`${styles.landingHeader} ${isSearchActive ? styles.landingHeaderCompact : ""}`}
              >
                <h1 className={styles.landingTitle}>
                  You decide what &ldquo;similar&rdquo; means.
                </h1>
                <p className={styles.landingLead}>
                  Beat, mood, or lyrics — you choose how we match. Preview and
                  save in seconds.
                </p>
              </header>

              <div className={styles.searchBlock}>
                <SearchBar
                  value={query}
                  onChange={handleQueryChange}
                  variant="landing"
                />
              </div>

              {error ? (
                <div className={styles.feedbackBlock}>
                  <ErrorBanner message={error} onDismiss={() => setError(null)} />
                </div>
              ) : null}
              {isSearching ? (
                <div className={styles.feedbackBlock}>
                  <LoadingState message="Searching Spotify…" />
                </div>
              ) : null}
              {!isSearching && showResults ? (
                <div className={styles.resultsBlock}>
                  <SearchResults
                    tracks={searchResults}
                    onSelectTrack={handleSelectAnchor}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className={styles.discoveryWrap}>
            <AxisDiscovery
              anchor={anchor}
              axis={axis}
              onAxisChange={handleAxisChange}
              onChangeSong={handleReturnToLanding}
            />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import type {
  ApiErrorResponse,
  Axis,
  Recommendation,
  RecommendResponse,
  Track,
} from "@/lib/types";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { RECOMMEND_TIMEOUT_MS } from "@/lib/constants";
import { trackToAnchor } from "@/lib/spotify/search";
import { useCallback, useEffect, useRef, useState } from "react";

type UseRecommendationsResult = {
  recommendations: Recommendation[];
  loadedAxis: Axis | null;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  clearError: () => void;
  retry: () => void;
  cooldownSeconds: number;
};

type CacheEntry = {
  recommendations: Recommendation[];
  loadedAxis: Axis;
};

type FetchResult =
  | { ok: true; recommendations: Recommendation[]; loadedAxis: Axis }
  | { ok: false; error: string; retryAfterSeconds?: number };

const cacheByKey = new Map<string, CacheEntry>();
const inflightByKey = new Map<string, Promise<FetchResult>>();

let geminiCooldownUntil = 0;

function getCooldownRemainingSeconds(): number {
  const remainingMs = geminiCooldownUntil - Date.now();

  if (remainingMs <= 0) {
    return 0;
  }

  return Math.ceil(remainingMs / 1000);
}

async function fetchRecommendations(
  fetchKey: string,
  anchor: Track,
  axis: Axis,
): Promise<FetchResult> {
  const existing = inflightByKey.get(fetchKey);

  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<FetchResult> => {
    const anchorPayload = trackToAnchor(anchor);

    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        anchor: anchorPayload,
        axis,
      }),
      signal: AbortSignal.timeout(RECOMMEND_TIMEOUT_MS),
    });

    const data = (await response.json()) as
      | RecommendResponse
      | ApiErrorResponse;

    if (!response.ok) {
      const message =
        "error" in data ? data.error : "Failed to get recommendations.";

      return {
        ok: false,
        error: message,
        retryAfterSeconds:
          "retryAfterSeconds" in data && typeof data.retryAfterSeconds === "number"
            ? data.retryAfterSeconds
            : undefined,
      };
    }

    const success = data as RecommendResponse;

    return {
      ok: true,
      recommendations: success.recommendations,
      loadedAxis: success.axis,
    };
  })().catch((error): FetchResult => {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return {
        ok: false,
        error: "Recommendations timed out. Try again in a moment.",
      };
    }

    return {
      ok: false,
      error: "Failed to get recommendations.",
    };
  }).finally(() => {
    inflightByKey.delete(fetchKey);
  });

  inflightByKey.set(fetchKey, promise);

  return promise;
}

export function useRecommendations(
  anchor: Track | null,
  axis: Axis | null,
): UseRecommendationsResult {
  const anchorId = anchor?.id ?? null;
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadedAxis, setLoadedAxis] = useState<Axis | null>(null);
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(anchor?.id && axis),
  );
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const requestIdRef = useRef(0);

  const clearError = useCallback(() => setError(null), []);

  const retry = useCallback(() => {
    if (!anchorId || !axis) {
      return;
    }

    cacheByKey.delete(`${anchorId}:${axis}`);
    setRetryNonce((value) => value + 1);
  }, [anchorId, axis]);

  useEffect(() => {
    function tick() {
      setCooldownSeconds(getCooldownRemainingSeconds());
    }

    tick();
    const intervalId = window.setInterval(tick, 1000);

    return () => window.clearInterval(intervalId);
  }, [error, isLoading, retryNonce]);

  useEffect(() => {
    if (!anchorId || !axis) {
      return;
    }

    const activeAxis = axis;
    const fetchKey = `${anchorId}:${activeAxis}`;
    const cached = cacheByKey.get(fetchKey);

    if (cached) {
      setRecommendations(cached.recommendations);
      setLoadedAxis(cached.loadedAxis);
      setHasFetched(true);
      setIsLoading(false);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;

    setRecommendations([]);
    setLoadedAxis(null);
    setHasFetched(false);
    setIsLoading(true);
    setError(null);

    async function runFetch() {
      const currentAnchor = anchorRef.current;

      if (!currentAnchor) {
        return;
      }

      const result = await fetchRecommendations(
        fetchKey,
        currentAnchor,
        activeAxis,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!result.ok) {
        if (result.retryAfterSeconds && result.retryAfterSeconds > 0) {
          geminiCooldownUntil = Date.now() + result.retryAfterSeconds * 1000;
        }

        setRecommendations([]);
        setLoadedAxis(activeAxis);
        setHasFetched(true);
        setError(
          result.retryAfterSeconds && result.retryAfterSeconds > 0
            ? result.error
            : getFriendlyErrorMessage(result.error),
        );
        return;
      }

      geminiCooldownUntil = 0;
      cacheByKey.set(fetchKey, {
        recommendations: result.recommendations,
        loadedAxis: result.loadedAxis,
      });
      setRecommendations(result.recommendations);
      setLoadedAxis(result.loadedAxis);
      setHasFetched(true);
      setError(null);
    }

    void runFetch().finally(() => {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    });

    return () => {
      requestIdRef.current += 1;
    };
  }, [anchorId, axis, retryNonce]);

  return {
    recommendations,
    loadedAxis,
    isLoading,
    error,
    hasFetched,
    clearError,
    retry,
    cooldownSeconds,
  };
}

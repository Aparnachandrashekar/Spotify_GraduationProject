"use client";

import type { Track } from "@/lib/types";
import { useState } from "react";
import styles from "./SearchResults.module.css";

type SearchResultsProps = {
  tracks: Track[];
  selectedTrackId?: string | null;
  onSelectTrack?: (track: Track) => void;
};

function AlbumArt({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className={styles.artPlaceholder} aria-label={`${title} artwork`}>
        ♪
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Spotify CDN URLs
    <img
      src={url}
      alt={`${title} artwork`}
      className={styles.art}
      width={48}
      height={48}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function SearchResults({
  tracks,
  selectedTrackId,
  onSelectTrack,
}: SearchResultsProps) {
  if (tracks.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <p className={styles.emptyTitle}>No songs found</p>
        <p className={styles.emptyHint}>
          Try a different spelling or artist name.
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.list} aria-label="Search results">
      {tracks.map((track) => {
        const isSelected = track.id === selectedTrackId;

        return (
          <li key={track.id}>
            <button
              type="button"
              className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}
              onClick={() => onSelectTrack?.(track)}
            >
              <AlbumArt url={track.albumArtUrl} title={track.title} />
              <span className={styles.meta}>
                <span className={styles.title}>{track.title}</span>
                <span className={styles.artist}>{track.artist}</span>
              </span>
              {isSelected ? (
                <span className={styles.selectedBadge}>Anchor</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

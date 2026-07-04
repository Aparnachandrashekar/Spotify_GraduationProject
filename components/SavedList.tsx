"use client";

import { AlbumArt } from "@/components/AlbumArt";
import { HeartIcon } from "@/components/HeartIcon";
import { usePlayback } from "@/hooks/usePlayback";
import { useSavedTracks } from "@/hooks/useSavedTracks";
import type { SavedTrack } from "@/lib/types";
import styles from "./SavedList.module.css";

type SavedListProps = {
  visible?: boolean;
  variant?: "panel" | "strip";
};

function SavedRow({ track }: { track: SavedTrack }) {
  const { nowPlayingId, play } = usePlayback();
  const { toggleSave } = useSavedTracks();
  const isPlaying = nowPlayingId === track.spotifyId;

  function handlePlay() {
    play({
      spotifyId: track.spotifyId,
      title: track.title,
      artist: track.artist,
      albumArtUrl: track.albumArtUrl,
      spotifyUrl: track.spotifyUrl,
      previewUrl: track.previewUrl,
    });
  }

  return (
    <li className={`${styles.row} ${isPlaying ? styles.rowPlaying : ""}`}>
      <button
        type="button"
        className={styles.playControl}
        onClick={handlePlay}
        aria-label={`Play preview of ${track.title}`}
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>

      <AlbumArt url={track.albumArtUrl} title={track.title} />

      <div className={styles.meta}>
        <p className={styles.title}>{track.title}</p>
        <p className={styles.artist}>{track.artist}</p>
      </div>

      <button
        type="button"
        className={styles.saveButton}
        onClick={() => toggleSave(track)}
        aria-label={`Remove ${track.title} from saved list`}
        aria-pressed
      >
        <HeartIcon filled />
      </button>
    </li>
  );
}

function SavedStripCard({ track }: { track: SavedTrack }) {
  const { nowPlayingId, play } = usePlayback();
  const { toggleSave } = useSavedTracks();
  const isPlaying = nowPlayingId === track.spotifyId;

  function handlePlay() {
    play({
      spotifyId: track.spotifyId,
      title: track.title,
      artist: track.artist,
      albumArtUrl: track.albumArtUrl,
      spotifyUrl: track.spotifyUrl,
      previewUrl: track.previewUrl,
    });
  }

  return (
    <li
      className={`${styles.stripCard} ${isPlaying ? styles.stripCardPlaying : ""}`}
    >
      <button
        type="button"
        className={styles.stripArtButton}
        onClick={handlePlay}
        aria-label={`Play preview of ${track.title}`}
      >
        <AlbumArt url={track.albumArtUrl} title={track.title} size={56} />
      </button>
      <div className={styles.stripMeta}>
        <p className={styles.stripTitle}>{track.title}</p>
        <p className={styles.stripArtist}>{track.artist}</p>
      </div>
      <button
        type="button"
        className={styles.stripSaveButton}
        onClick={() => toggleSave(track)}
        aria-label={`Remove ${track.title} from saved list`}
        aria-pressed
      >
        <HeartIcon filled />
      </button>
    </li>
  );
}

export function SavedList({ visible = true, variant = "panel" }: SavedListProps) {
  const { savedTracks } = useSavedTracks();

  if (!visible) {
    return null;
  }

  if (variant === "strip") {
    return (
      <section className={styles.stripSection} aria-label="Saved tracks">
        <div className={styles.stripHeader}>
          <h2 className={styles.heading}>Saved this session</h2>
          <p className={styles.note}>Clears when you refresh</p>
        </div>

        {savedTracks.length === 0 ? (
          <div className={styles.stripEmpty} role="status">
            <p className={styles.emptyHint}>
              Tap the heart on any recommendation to save it here.
            </p>
          </div>
        ) : (
          <ol className={styles.stripList}>
            {savedTracks.map((track) => (
              <SavedStripCard key={track.spotifyId} track={track} />
            ))}
          </ol>
        )}
      </section>
    );
  }

  return (
    <section className={styles.section} aria-label="Saved tracks">
      <div className={styles.header}>
        <h2 className={styles.heading}>Saved this session</h2>
        <p className={styles.note}>Clears when you refresh</p>
      </div>

      {savedTracks.length === 0 ? (
        <div className={styles.empty} role="status">
          <p className={styles.emptyTitle}>Songs you like will appear here</p>
          <p className={styles.emptyHint}>
            Tap the heart on any recommendation to save it.
          </p>
        </div>
      ) : (
        <ol className={styles.list}>
          {savedTracks.map((track) => (
            <SavedRow key={track.spotifyId} track={track} />
          ))}
        </ol>
      )}
    </section>
  );
}

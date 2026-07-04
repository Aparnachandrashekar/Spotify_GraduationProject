"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { AlbumArt } from "@/components/AlbumArt";
import { usePlayback } from "@/hooks/usePlayback";
import {
  ListMusic,
  Maximize2,
  Mic2,
  MonitorSpeaker,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import styles from "./ShellPlayerBar.module.css";

const ICON_SIZE = 22;
const SKIP_ICON_SIZE = 24;

const PLACEHOLDER = {
  title: "Sally, when the wine runs out",
  artist: "ROLE MODEL",
};

export function ShellPlayerBar() {
  const { nowPlaying, isPlaying, isLoadingPreview, togglePlay } = usePlayback();
  const active = nowPlaying !== null;

  return (
    <footer
      className={`${styles.playerBar} ${active ? styles.playerBarActive : ""}`}
      aria-label={active ? "Now playing" : undefined}
      aria-hidden={active ? undefined : true}
    >
      <div className={styles.left}>
        {active && nowPlaying ? (
          <>
            <div className={styles.thumbLive}>
              <AlbumArt
                url={nowPlaying.albumArtUrl}
                title={nowPlaying.title}
                size={64}
              />
            </div>
            <div className={styles.trackMeta}>
              <p className={styles.trackTitle}>{nowPlaying.title}</p>
              <p className={styles.trackArtist}>{nowPlaying.artist}</p>
            </div>
            <span className={styles.likeButton}>
              <Image
                src="/shell/like-icon.png"
                alt=""
                width={29}
                height={29}
              />
            </span>
          </>
        ) : (
          <>
            <div className={styles.thumb} />
            <div className={styles.trackMeta}>
              <p className={styles.trackTitle}>{PLACEHOLDER.title}</p>
              <p className={styles.trackArtist}>{PLACEHOLDER.artist}</p>
            </div>
            <span className={styles.likeButton}>
              <Image
                src="/shell/like-icon.png"
                alt=""
                width={29}
                height={29}
              />
            </span>
          </>
        )}
      </div>

      <div className={styles.center}>
        <div className={styles.controls}>
          <span className={styles.control}>
            <Shuffle size={ICON_SIZE} strokeWidth={2} />
          </span>
          <span className={styles.control}>
            <SkipBack size={SKIP_ICON_SIZE} strokeWidth={2} />
          </span>
          <button
            type="button"
            className={`${styles.control} ${styles.controlPlay}`}
            onClick={active ? togglePlay : undefined}
            disabled={!active || isLoadingPreview}
            aria-label={
              isLoadingPreview
                ? "Loading preview"
                : isPlaying
                  ? "Pause preview"
                  : "Play preview"
            }
          >
            {isPlaying ? (
              <Pause size={ICON_SIZE} strokeWidth={0} fill="currentColor" />
            ) : (
              <Play
                size={ICON_SIZE}
                strokeWidth={0}
                fill="currentColor"
                className={styles.playGlyph}
              />
            )}
          </button>
          <span className={styles.control}>
            <SkipForward size={SKIP_ICON_SIZE} strokeWidth={2} />
          </span>
          <span className={styles.control}>
            <Repeat size={ICON_SIZE} strokeWidth={2} />
          </span>
        </div>

        <div className={styles.progress}>
          <span className={styles.time}>0:00</span>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: active && isPlaying ? "24%" : "0%" }}
            />
          </div>
          <span className={styles.time}>0:30</span>
        </div>
      </div>

      <div className={styles.right}>
        <span className={styles.control}>
          <Mic2 size={ICON_SIZE} strokeWidth={2} />
        </span>
        <span className={styles.control}>
          <ListMusic size={ICON_SIZE} strokeWidth={2} />
        </span>
        <span className={styles.control}>
          <MonitorSpeaker size={ICON_SIZE} strokeWidth={2} />
        </span>
        <span className={styles.control}>
          <Volume2 size={ICON_SIZE} strokeWidth={2} />
        </span>
        <div className={styles.volumeTrack}>
          <div className={styles.volumeFill} />
        </div>
        <span className={styles.control}>
          <Maximize2 size={ICON_SIZE} strokeWidth={2} />
        </span>
      </div>
    </footer>
  );
}

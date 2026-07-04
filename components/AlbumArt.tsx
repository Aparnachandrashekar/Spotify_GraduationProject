"use client";

import { useState } from "react";
import styles from "./AlbumArt.module.css";

type AlbumArtProps = {
  url: string | null;
  title: string;
  size?: number;
};

export function AlbumArt({ url, title, size = 48 }: AlbumArtProps) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div
        className={styles.placeholder}
        style={{ width: size, height: size }}
        aria-label={`${title} artwork`}
      >
        ♪
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Spotify CDN URLs
    <img
      src={url}
      alt={`${title} artwork`}
      className={styles.image}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

"use client";

import { AlbumArt } from "@/components/AlbumArt";
import { usePlayback } from "@/hooks/usePlayback";
import { PanelCollapseRightIcon } from "./ShellIcons";
import styles from "./ShellNowPlaying.module.css";

const QUEUE = [
  { title: "After hours", artist: "The Weeknd" },
  { title: "Save your tears", artist: "The Weeknd" },
  { title: "Starboy", artist: "The Weeknd, Daft Punk" },
];

type ShellNowPlayingProps = {
  onCollapse: () => void;
};

export function ShellNowPlaying({ onCollapse }: ShellNowPlayingProps) {
  const { nowPlaying } = usePlayback();
  const isLive = nowPlaying !== null;

  return (
    <aside className={styles.wrapper} aria-hidden={!isLive}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.collapseButton}
            aria-label="Collapse now playing panel"
            onClick={onCollapse}
          >
            <PanelCollapseRightIcon size={26} />
          </button>
          <h2 className={styles.headerTitle}>Now playing</h2>
        </div>

        {isLive && nowPlaying ? (
          <>
            <div className={styles.coverLive}>
              <AlbumArt
                url={nowPlaying.albumArtUrl}
                title={nowPlaying.title}
                size={320}
              />
            </div>

            <div className={styles.trackMeta}>
              <h2 className={styles.title}>{nowPlaying.title}</h2>
              <p className={styles.artist}>{nowPlaying.artist}</p>
            </div>
          </>
        ) : (
          <>
            <div className={styles.cover} />

            <div className={styles.trackMeta}>
              <h2 className={styles.title}>Blinding lights</h2>
              <p className={styles.artist}>The Weeknd</p>
            </div>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>About the artist</h3>
              <p className={styles.blurb}>
                The Weeknd is a Canadian singer-songwriter known for blending
                R&amp;B, pop, and dark synth-driven production. His chart-topping
                albums After Hours and Dawn FM defined a neon-noir sound for a
                generation.
              </p>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Next in queue</h3>
              <ul className={styles.queueList}>
                {QUEUE.map((item) => (
                  <li key={item.title} className={styles.queueItem}>
                    <div className={styles.queueThumb} />
                    <div>
                      <p className={styles.queueTitle}>{item.title}</p>
                      <p className={styles.queueArtist}>{item.artist}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Credits</h3>
              <dl className={styles.credits}>
                <div className={styles.creditRow}>
                  <dt>Written by</dt>
                  <dd>Abel Tesfaye, Ahmad Balshe, Jason Quenneville</dd>
                </div>
                <div className={styles.creditRow}>
                  <dt>Produced by</dt>
                  <dd>Max Martin, Oscar Holter, The Weeknd</dd>
                </div>
              </dl>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}

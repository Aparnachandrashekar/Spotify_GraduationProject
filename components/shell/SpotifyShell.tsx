"use client";

import { useEffect, useState } from "react";
import { usePlayback } from "@/hooks/usePlayback";
import styles from "./SpotifyShell.module.css";
import { PanelExpandRightIcon } from "./ShellIcons";
import { ShellNowPlaying } from "./ShellNowPlaying";
import { ShellPlayerBar } from "./ShellPlayerBar";
import { ShellSidebar } from "./ShellSidebar";
import { ShellTopBar } from "./ShellTopBar";

type SpotifyShellProps = {
  children?: React.ReactNode;
};

export function SpotifyShell({ children }: SpotifyShellProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [nowPlayingExpanded, setNowPlayingExpanded] = useState(false);
  const { nowPlaying } = usePlayback();

  useEffect(() => {
    if (nowPlaying) {
      setNowPlayingExpanded(true);
    }
  }, [nowPlaying?.spotifyId, nowPlaying]);

  const panelsCollapsed = !sidebarExpanded && !nowPlayingExpanded;

  const bodyClassName = [
    styles.body,
    sidebarExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed,
    nowPlayingExpanded ? styles.nowPlayingExpanded : styles.nowPlayingCollapsed,
  ].join(" ");

  return (
    <div className={styles.shell} aria-label="Spotify shell">
      <ShellTopBar panelsCollapsed={panelsCollapsed} />

      <div className={bodyClassName}>
        <ShellSidebar
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded((value) => !value)}
        />

        <main className={styles.center} aria-label="Main content">
          {children}
        </main>

        <div className={styles.nowPlayingSlot}>
          <ShellNowPlaying
            onCollapse={() => setNowPlayingExpanded(false)}
          />
        </div>

        <button
          type="button"
          className={`${styles.nowPlayingExpandTab} ${nowPlayingExpanded ? styles.nowPlayingExpandTabHidden : ""}`}
          aria-label="Show now playing panel"
          aria-hidden={nowPlayingExpanded}
          tabIndex={nowPlayingExpanded ? -1 : 0}
          onClick={() => setNowPlayingExpanded(true)}
        >
          <PanelExpandRightIcon size={26} />
        </button>
      </div>

      <ShellPlayerBar />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const { nowPlaying } = usePlayback();

  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((value) => !value);
  }, []);

  useEffect(() => {
    if (nowPlaying) {
      setNowPlayingOpen(true);
    }
  }, [nowPlaying?.spotifyId, nowPlaying]);

  const panelsCollapsed = !sidebarExpanded && !nowPlayingOpen;

  const bodyClassName = [
    styles.body,
    sidebarExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed,
    nowPlayingOpen ? styles.nowPlayingExpanded : styles.nowPlayingCollapsed,
  ].join(" ");

  return (
    <div className={styles.shell} aria-label="Spotify shell">
      <ShellTopBar panelsCollapsed={panelsCollapsed} />

      <div className={bodyClassName}>
        <div className={styles.sidebarSlot}>
          <ShellSidebar
            layout={sidebarExpanded ? "expanded" : "collapsed"}
            onToggle={toggleSidebar}
          />
        </div>

        <div className={styles.centerWrap}>
          <main className={styles.center} aria-label="Main content">
            {children}
          </main>

          <button
            type="button"
            className={`${styles.nowPlayingExpandTab} ${nowPlayingOpen ? styles.nowPlayingExpandTabHidden : ""}`}
            aria-label="Show now playing panel"
            aria-hidden={nowPlayingOpen}
            tabIndex={nowPlayingOpen ? -1 : 0}
            onClick={() => setNowPlayingOpen(true)}
          >
            <PanelExpandRightIcon size={26} />
          </button>
        </div>

        <div className={styles.nowPlayingSlot}>
          <ShellNowPlaying
            onCollapse={() => setNowPlayingOpen(false)}
          />
        </div>
      </div>

      <ShellPlayerBar />
    </div>
  );
}

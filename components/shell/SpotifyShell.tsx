"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayback } from "@/hooks/usePlayback";
import styles from "./SpotifyShell.module.css";
import { PanelExpandRightIcon } from "./ShellIcons";
import { ShellNowPlaying } from "./ShellNowPlaying";
import { ShellPlayerBar } from "./ShellPlayerBar";
import { ShellSidebar } from "./ShellSidebar";
import { ShellTopBar } from "./ShellTopBar";

const PANEL_MS = 400;

type SpotifyShellProps = {
  children?: React.ReactNode;
};

export function SpotifyShell({ children }: SpotifyShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarLayout, setSidebarLayout] = useState<"collapsed" | "expanded">(
    "collapsed",
  );
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const { nowPlaying } = usePlayback();
  const sidebarTimerRef = useRef<number | null>(null);

  const clearSidebarTimer = useCallback(() => {
    if (sidebarTimerRef.current !== null) {
      window.clearTimeout(sidebarTimerRef.current);
      sidebarTimerRef.current = null;
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    clearSidebarTimer();

    if (sidebarOpen) {
      // Switch to icon rail immediately so expanded content never squishes in a narrow column.
      setSidebarLayout("collapsed");
      setSidebarOpen(false);
      return;
    }

    setSidebarOpen(true);
    sidebarTimerRef.current = window.setTimeout(() => {
      setSidebarLayout("expanded");
      sidebarTimerRef.current = null;
    }, PANEL_MS);
  }, [clearSidebarTimer, sidebarOpen]);

  useEffect(() => {
    return () => clearSidebarTimer();
  }, [clearSidebarTimer]);

  useEffect(() => {
    if (!sidebarOpen && sidebarLayout === "expanded") {
      setSidebarLayout("collapsed");
    }
  }, [sidebarOpen, sidebarLayout]);

  useEffect(() => {
    if (nowPlaying) {
      setNowPlayingOpen(true);
    }
  }, [nowPlaying?.spotifyId, nowPlaying]);

  const panelsCollapsed = !sidebarOpen && !nowPlayingOpen;

  const bodyClassName = [
    styles.body,
    sidebarOpen ? styles.sidebarExpanded : styles.sidebarCollapsed,
    nowPlayingOpen ? styles.nowPlayingExpanded : styles.nowPlayingCollapsed,
  ].join(" ");

  return (
    <div className={styles.shell} aria-label="Spotify shell">
      <ShellTopBar panelsCollapsed={panelsCollapsed} />

      <div className={bodyClassName}>
        <div className={styles.sidebarSlot}>
          <ShellSidebar
            layout={
              sidebarOpen && sidebarLayout === "expanded"
                ? "expanded"
                : "collapsed"
            }
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

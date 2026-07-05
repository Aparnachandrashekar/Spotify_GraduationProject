"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayback } from "@/hooks/usePlayback";
import styles from "./SpotifyShell.module.css";
import { PanelExpandRightIcon } from "./ShellIcons";
import { ShellNowPlaying } from "./ShellNowPlaying";
import { ShellPlayerBar } from "./ShellPlayerBar";
import { ShellSidebar } from "./ShellSidebar";
import { ShellTopBar } from "./ShellTopBar";

const SIDEBAR_ANIM_MS = 520;

type SpotifyShellProps = {
  children?: React.ReactNode;
};

export function SpotifyShell({ children }: SpotifyShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContentExpanded, setSidebarContentExpanded] = useState(false);
  const [sidebarRevealed, setSidebarRevealed] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const { nowPlaying } = usePlayback();
  const sidebarSlotRef = useRef<HTMLDivElement>(null);
  const sidebarOpenRef = useRef(sidebarOpen);
  const sidebarTimerRef = useRef<number | null>(null);

  sidebarOpenRef.current = sidebarOpen;

  const finishSidebarOpen = useCallback(() => {
    if (!sidebarOpenRef.current) {
      return;
    }

    setSidebarContentExpanded(true);
    window.requestAnimationFrame(() => {
      setSidebarRevealed(true);
    });
  }, []);

  const clearSidebarTimer = useCallback(() => {
    if (sidebarTimerRef.current !== null) {
      window.clearTimeout(sidebarTimerRef.current);
      sidebarTimerRef.current = null;
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    clearSidebarTimer();

    if (sidebarOpen) {
      setSidebarRevealed(false);
      setSidebarContentExpanded(false);
      setSidebarOpen(false);
      return;
    }

    setSidebarRevealed(false);
    setSidebarContentExpanded(false);
    setSidebarOpen(true);

    if (reducedMotion) {
      finishSidebarOpen();
      return;
    }

    sidebarTimerRef.current = window.setTimeout(() => {
      sidebarTimerRef.current = null;
      finishSidebarOpen();
    }, SIDEBAR_ANIM_MS);
  }, [clearSidebarTimer, finishSidebarOpen, sidebarOpen]);

  useEffect(() => {
    const slot = sidebarSlotRef.current;

    if (!slot) {
      return;
    }

    function handleTransitionEnd(event: TransitionEvent) {
      if (event.target !== slot || event.propertyName !== "width") {
        return;
      }

      clearSidebarTimer();

      if (!sidebarOpenRef.current) {
        return;
      }

      finishSidebarOpen();
    }

    slot.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      slot.removeEventListener("transitionend", handleTransitionEnd);
      clearSidebarTimer();
    };
  }, [clearSidebarTimer, finishSidebarOpen]);

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
        <div ref={sidebarSlotRef} className={styles.sidebarSlot}>
          <ShellSidebar
            layout={sidebarContentExpanded ? "expanded" : "collapsed"}
            revealed={sidebarRevealed}
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
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
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContentExpanded, setSidebarContentExpanded] = useState(false);
  const [sidebarRevealed, setSidebarRevealed] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const { nowPlaying } = usePlayback();
  const sidebarSlotRef = useRef<HTMLDivElement>(null);
  const sidebarOpenRef = useRef(sidebarOpen);
  const sidebarTimerRef = useRef<number | null>(null);

  sidebarOpenRef.current = sidebarOpen;

  const closeSidebar = useCallback(() => {
    setSidebarRevealed(false);
    setSidebarContentExpanded(false);
    setSidebarOpen(false);
  }, []);

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
    clearSidebarTimer();

    if (sidebarOpen) {
      closeSidebar();
      return;
    }

    setSidebarRevealed(false);
    setSidebarContentExpanded(false);
    setSidebarOpen(true);

    if (isMobile) {
      finishSidebarOpen();
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      finishSidebarOpen();
      return;
    }

    sidebarTimerRef.current = window.setTimeout(() => {
      sidebarTimerRef.current = null;
      finishSidebarOpen();
    }, SIDEBAR_ANIM_MS);
  }, [clearSidebarTimer, closeSidebar, finishSidebarOpen, isMobile, sidebarOpen]);

  useEffect(() => {
    if (isMobile) {
      return;
    }

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
  }, [clearSidebarTimer, finishSidebarOpen, isMobile]);

  useEffect(() => {
    if (nowPlaying) {
      setNowPlayingOpen(true);
    }
  }, [nowPlaying?.spotifyId, nowPlaying]);

  useEffect(() => {
    if (!isMobile || !sidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, sidebarOpen]);

  const panelsCollapsed = !sidebarOpen && !nowPlayingOpen;

  const bodyClassName = [
    styles.body,
    sidebarOpen ? styles.sidebarExpanded : styles.sidebarCollapsed,
    nowPlayingOpen ? styles.nowPlayingExpanded : styles.nowPlayingCollapsed,
  ].join(" ");

  return (
    <div className={styles.shell} aria-label="Spotify shell">
      <ShellTopBar
        panelsCollapsed={panelsCollapsed}
        onOpenLibrary={toggleSidebar}
        libraryOpen={sidebarOpen}
      />

      {isMobile && sidebarOpen ? (
        <button
          type="button"
          className={styles.mobileBackdrop}
          aria-label="Close library"
          onClick={closeSidebar}
        />
      ) : null}

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

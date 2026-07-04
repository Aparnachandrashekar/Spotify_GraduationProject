"use client";

import { DiscoveryScreen } from "@/components/DiscoveryScreen";
import { PlaybackProvider } from "@/hooks/usePlayback";
import { SavedTracksProvider } from "@/hooks/useSavedTracks";

export function DiscoveryApp() {
  return (
    <SavedTracksProvider>
      <PlaybackProvider>
        <DiscoveryScreen />
      </PlaybackProvider>
    </SavedTracksProvider>
  );
}

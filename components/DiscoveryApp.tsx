"use client";

import { DiscoveryScreen } from "@/components/DiscoveryScreen";
import { PlaybackProvider } from "@/hooks/usePlayback";
import { SavedTracksProvider } from "@/hooks/useSavedTracks";
import { SpotifyShell } from "@/components/shell/SpotifyShell";

export function DiscoveryApp() {
  return (
    <SavedTracksProvider>
      <PlaybackProvider useShellPlayer>
        <SpotifyShell>
          <DiscoveryScreen />
        </SpotifyShell>
      </PlaybackProvider>
    </SavedTracksProvider>
  );
}

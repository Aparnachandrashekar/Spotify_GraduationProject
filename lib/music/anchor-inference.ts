import type { Anchor } from "@/lib/types";
import type { Axis } from "@/lib/types";

export type BeatEnergy = "low" | "medium" | "high";
export type TempoFeel = "slow" | "mid" | "fast";

export type InferredAnchorProfile = {
  beatEnergy: BeatEnergy;
  tempoFeel: TempoFeel;
  moodTone: string;
  songType: string;
};

const HIGH_ENERGY_CUES = [
  "vaathi",
  "coming",
  "raid",
  "mass",
  "doluma",
  "kuthu",
  "rowdy",
  "beast",
  "jailer",
  "local",
  "maari",
  "arabic",
  "disco",
  "donu",
  "verithanam",
  "thalapathy",
  "badass",
  "asuran",
  "suriya",
  "pumped",
  "party",
  "dance",
  "club",
  "nashe",
  "hook",
  "banger",
];

const LOW_ENERGY_CUES = [
  "kannamma",
  "munbe",
  "vaseegara",
  "anbe",
  "ennodu",
  "pogadhe",
  "kanave",
  "melody",
  "lullaby",
  "pathos",
  "yaayum",
  "naan pizhai",
  "visai",
  "agaram",
  "malare",
  "kannalane",
  "uyire",
  "po nee po",
  "maruvaarthai",
  "tum hi ho",
  "agar tum",
  "perfect",
  "khamoshiyan",
  "raabta",
  "chalte",
  "acoustic",
  "unplugged",
  "ballad",
  "slow",
  "melanchol",
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function countCueHits(text: string, cues: readonly string[]): number {
  return cues.reduce((total, cue) => (text.includes(cue) ? total + 1 : total), 0);
}

function inferBeatEnergy(text: string): BeatEnergy {
  const highHits = countCueHits(text, HIGH_ENERGY_CUES);
  const lowHits = countCueHits(text, LOW_ENERGY_CUES);

  if (highHits > lowHits && highHits > 0) {
    return "high";
  }

  if (lowHits > highHits && lowHits > 0) {
    return "low";
  }

  if (text.includes("sid sriram") && highHits === 0) {
    return "low";
  }

  if (text.includes("arijit singh") && lowHits === 0 && highHits === 0) {
    return "medium";
  }

  return "medium";
}

function inferTempoFeel(energy: BeatEnergy): TempoFeel {
  if (energy === "low") {
    return "slow";
  }

  if (energy === "high") {
    return "fast";
  }

  return "mid";
}

function inferMoodTone(text: string, energy: BeatEnergy): string {
  if (energy === "high") {
    if (text.includes("rowdy") || text.includes("vaathi") || text.includes("raid")) {
      return "confident swagger / mass energy";
    }

    return "upbeat / celebratory / high-intensity";
  }

  if (energy === "low") {
    return "romantic / melancholic / intimate";
  }

  if (text.includes("devotional") || text.includes("kun faya")) {
    return "devotional / spiritual";
  }

  return "mixed emotional tone";
}

function inferSongType(text: string, energy: BeatEnergy): string {
  if (energy === "high") {
    return "high-energy film dance / mass beat track";
  }

  if (energy === "low") {
    return "slow melodic film ballad / romantic song";
  }

  if (text.includes("hip hop tamizha") || text.includes("hiphop tamizha")) {
    return "Tamil hip-hop / fusion track";
  }

  return "mid-tempo film song";
}

export function inferAnchorProfile(anchor: Anchor): InferredAnchorProfile {
  const text = normalize(
    `${anchor.title} ${anchor.artist} ${anchor.albumName ?? ""}`,
  );
  const beatEnergy = inferBeatEnergy(text);
  const tempoFeel = inferTempoFeel(beatEnergy);

  return {
    beatEnergy,
    tempoFeel,
    moodTone: inferMoodTone(text, beatEnergy),
    songType: inferSongType(text, beatEnergy),
  };
}

export function inferTitleBeatEnergy(title: string): BeatEnergy {
  return inferBeatEnergy(normalize(title));
}

export function energyMatchScore(
  anchorEnergy: BeatEnergy,
  candidateEnergy: BeatEnergy,
): number {
  const order: BeatEnergy[] = ["low", "medium", "high"];
  const distance = Math.abs(
    order.indexOf(anchorEnergy) - order.indexOf(candidateEnergy),
  );

  return 2 - distance;
}

export function buildInferredProfileBlock(
  profile: InferredAnchorProfile,
  axis: Axis,
): string {
  if (axis === "beat") {
    return `
ANCHOR SOUND PROFILE (inferred — treat as ground truth):
- Song type: ${profile.songType}
- Energy level: ${profile.beatEnergy}
- Tempo feel: ${profile.tempoFeel}
Recommend songs with the SAME energy and tempo feel. Do NOT recommend fast dance/mass tracks for a slow ballad anchor, or slow ballads for a mass dance anchor.`;
  }

  if (axis === "mood") {
    return `
ANCHOR MOOD PROFILE (inferred — treat as ground truth):
- Emotional tone: ${profile.moodTone}
- Song type: ${profile.songType}
- Energy level: ${profile.beatEnergy}
Match this emotional atmosphere — not just any popular song in the same language.`;
  }

  return `
ANCHOR CONTEXT (for lyrical inference):
- Song type: ${profile.songType}
- Emotional tone: ${profile.moodTone}
Infer what this specific recording is about before matching lyrical themes.`;
}

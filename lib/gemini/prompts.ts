import type { Axis, Anchor } from "@/lib/types";
import { RECOMMENDATION_REQUEST_COUNT } from "@/lib/constants";
import {
  buildInferredProfileBlock,
  inferAnchorProfile,
  type InferredAnchorProfile,
} from "@/lib/music/anchor-inference";
import type { TrackAudioProfile } from "@/lib/spotify/audio-features";
import {
  type AnchorScene,
  detectAnchorScene,
} from "@/lib/music/anchor-scene";

export type RecommendPromptOptions = {
  strictScene?: boolean;
  audioProfile?: TrackAudioProfile | null;
  anchorAssessment?: string | null;
  inferredProfile?: InferredAnchorProfile | null;
};

const AXIS_INSTRUCTIONS: Record<
  Axis,
  { match: string; ignore: string; reasonHint: string; focus: string }
> = {
  beat: {
    match: "tempo, rhythm, energy level, and instrumentation/production feel",
    ignore: "lyrical content and mood",
    focus:
      "Prioritize BPM, drum patterns, groove, and production intensity. Pick songs a DJ would call 'same energy' even if the mood or lyrics differ.",
    reasonHint:
      'Start with anchor tempo/energy assessment, then the match (e.g. "Anchor is a slow, mellow cover (~70 BPM)—matched on soft brushed drums and low energy, not the famous upbeat original.").',
  },
  mood: {
    match: "emotional feeling or atmosphere",
    ignore: "genre, tempo, and instrumentation differences",
    focus:
      "Prioritize how the song FEELS (lonely, euphoric, bittersweet, nostalgic). Tempo and genre may differ wildly from the anchor.",
    reasonHint:
      'e.g. "Matched on bittersweet late-night loneliness, not tempo or genre."',
  },
  lyrics: {
    match: "subject matter, themes, and storytelling",
    ignore: "musical similarity, tempo, and production",
    focus:
      "Prioritize narrative, metaphors, and what the song is ABOUT. The sound can be completely different from the anchor.",
    reasonHint:
      'e.g. "Matched on songs about heartbreak and moving on, not sound."',
  },
};

const AXIS_LABELS: Record<Axis, string> = {
  beat: "beat & energy",
  mood: "mood & vibe",
  lyrics: "lyrical theme",
};

const AXIS_AVOID: Record<Axis, string> = {
  beat: "Do NOT pick songs mainly because they share a sad/happy mood or lyrical theme — only tempo, rhythm, and energy.",
  mood: "Do NOT pick songs mainly because they share the same BPM or production style — only emotional atmosphere.",
  lyrics: "Do NOT pick songs mainly because they sound similar or share tempo — only lyrical subject and story.",
};

function sanitizeField(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildAnchorAssessmentBlock(assessment: string, axis: Axis): string {
  return `
EXPERT ANCHOR ANALYSIS (${axis} axis — ground truth, do not contradict):
${assessment}

Every recommendation must genuinely match this assessment on the active axis.`;
}

function buildAudioProfileBlock(profile: TrackAudioProfile, axis: Axis): string {
  const energyLabel =
    profile.energy < 0.35 ? "low" : profile.energy < 0.65 ? "moderate" : "high";
  const valenceLabel =
    profile.valence < 0.35
      ? "melancholic"
      : profile.valence < 0.65
        ? "mixed"
        : "uplifting";

  if (axis === "beat") {
    return `
SPOTIFY AUDIO DATA (ground truth):
- Tempo: ${Math.round(profile.tempo)} BPM | Energy: ${profile.energy.toFixed(2)} (${energyLabel})`;
  }

  if (axis === "mood") {
    return `
SPOTIFY AUDIO DATA (ground truth):
- Valence: ${profile.valence.toFixed(2)} (${valenceLabel}) | Energy: ${profile.energy.toFixed(2)} (${energyLabel})`;
  }

  return "";
}

function formatAnchorMetadata(anchor: Anchor): string {
  const lines = [
    `- Title (exact recording name, including any version tags): "${sanitizeField(anchor.title)}"`,
    `- Artist: ${sanitizeField(anchor.artist)}`,
  ];

  if (anchor.albumName) {
    lines.push(`- Album: ${sanitizeField(anchor.albumName)}`);
  }

  if (anchor.releaseYear) {
    lines.push(`- Release year: ${anchor.releaseYear}`);
  }

  return lines.join("\n");
}

function buildRegionalBlock(
  scene: AnchorScene | null,
  axis: Axis,
  recommendationCount: number,
  strictScene = false,
): string {
  if (!scene) {
    return "";
  }

  const languageRule =
    scene.language === "indian"
      ? "Recommend Indian film / pop songs in the same regional scene as the anchor (South Asian catalogs only)."
      : `Every song MUST be in ${scene.label} — same language and music industry as the anchor.`;

  const strictNote = strictScene
    ? "\nSTRICT RETRY: Your previous list included Western English songs. That was wrong. This list must contain ONLY songs from the anchor's language scene."
    : "";

  return `
LANGUAGE CONSTRAINT (apply while matching the axis above):
- The anchor is ${scene.label}.
- ${languageRule}
- Candidates must be from that scene on Spotify — but rank by ${axis} fit first, language second.
- Do NOT recommend English-language Western pop/rock/indie songs unless the anchor itself is Western English.
- Use exact Spotify track titles (native script when applicable).
- Do not substitute songs from other Indian languages (e.g. no Hindi picks for a Tamil anchor).${strictNote}`;
}

function buildBeatAxisBlock(anchor: Anchor): string {
  const titleLower = anchor.title.toLowerCase();
  const versionHints = [
    "cover",
    "acoustic",
    "slow",
    "mellow",
    "piano",
    "stripped",
    "unplugged",
    "ballad",
    "remix",
    "live",
    "version",
    "reprise",
  ];
  const hasVersionCue =
    versionHints.some((hint) => titleLower.includes(hint)) ||
    Boolean(anchor.albumName?.toLowerCase().includes("cover"));

  const versionNote = hasVersionCue
    ? "The title or album suggests this may be a cover, remix, acoustic, or alternate version—take that literally."
    : "Even if the title looks like a well-known hit, treat the metadata below as the exact recording the user picked—it may still be a cover or slow arrangement.";

  return `
CRITICAL — beat & energy matching rules:
${versionNote}

The user selected THIS SPECIFIC RECORDING on Spotify, not a generic song title and not the most famous original version.

- Match the tempo, rhythm, and energy of THIS version as described by its title, album, and context.
- Do NOT default to the well-known original's tempo or energy (e.g. do not recommend upbeat dance tracks for a slow/acoustic/cover version of an upbeat hit).
- If the anchor appears to be a slow, acoustic, piano, or mellow cover/remix, recommend other slow/mellow songs with similar energy—not the famous fast originals.
- Infer tempo/energy from the recording name (e.g. "(Cover)", "Acoustic", "Slowed", "Piano Version"), album name, and artist context.
- When uncertain, err toward lower energy and slower tempo if any version cue is present.

Reason format for beat & energy:
- The FIRST recommendation's "reason" MUST begin with your assumed tempo/energy of the anchor recording (e.g. "Anchor is a slow, mellow cover (~70 BPM)—").
- Every "reason" must reference beat/energy and must NOT recommend songs that contradict the anchor's inferred tempo/energy.`;
}

function buildMoodAxisBlock(scene: AnchorScene | null): string {
  const diversityRule = scene
    ? "- Stay within the anchor's language/music industry. Emotional vibe must match using songs from that same scene — never swap in Western English equivalents."
    : "- Vary eras and genres across the list — mood matches should feel surprising, not obvious playlist filler.";

  return `
CRITICAL — mood & vibe matching rules:
- Match emotional atmosphere only. A slow ballad anchor can match an upbeat song IF the feeling is the same (e.g. both defiant).
- Do NOT recommend songs that merely share genre or tempo with the anchor.
${diversityRule}
- Each "reason" must name the specific emotion or vibe, not production details.`;
}

function buildLyricsAxisBlock(scene: AnchorScene | null): string {
  const regionalLyrics = scene
    ? `
- For ${scene.label} film/pop songs: infer the lyrical theme from the title's meaning, the film/album context, and song type (romantic ballad, heartbreak, celebration, devotion, street swagger, etc.).
- Do NOT recommend songs only because they share the same composer or singer — the story/theme must align.
- Ignore beat, tempo, and production entirely on this axis.`
    : "";

  return `
CRITICAL — lyrical theme matching rules:
- First identify what the anchor song is ABOUT (love, loss, longing, rebellion, celebration, devotion, heartbreak, nostalgia, etc.).
- Match subject matter, narrative arc, and themes. Production and tempo are irrelevant.
- Include songs from different sonic styles if the story/theme aligns.
- Each "reason" must cite the shared lyrical theme explicitly.${regionalLyrics}`;
}

function buildAxisBlock(anchor: Anchor, axis: Axis, scene: AnchorScene | null): string {
  if (axis === "beat") {
    return buildBeatAxisBlock(anchor);
  }

  if (axis === "mood") {
    return buildMoodAxisBlock(scene);
  }

  return buildLyricsAxisBlock(scene);
}

export function getAxisTemperature(
  axis: Axis,
  hasGrounding: boolean,
): number {
  if (axis === "beat") {
    return hasGrounding ? 0.38 : 0.55;
  }

  if (axis === "mood") {
    return hasGrounding ? 0.52 : 0.72;
  }

  return 0.75;
}

export function buildRecommendPrompt(
  anchor: Anchor,
  axis: Axis,
  options: RecommendPromptOptions = {},
): string {
  const rules = AXIS_INSTRUCTIONS[axis];
  const axisLabel = AXIS_LABELS[axis];
  const metadataBlock = formatAnchorMetadata(anchor);
  const scene = detectAnchorScene(anchor);
  const recommendationCount = scene
    ? RECOMMENDATION_REQUEST_COUNT + 4
    : RECOMMENDATION_REQUEST_COUNT;
  const inferredProfile =
    options.inferredProfile ??
    (scene ? inferAnchorProfile(anchor) : null);
  const inferredBlock = inferredProfile
    ? buildInferredProfileBlock(inferredProfile, axis)
    : "";
  const assessmentBlock = options.anchorAssessment
    ? buildAnchorAssessmentBlock(options.anchorAssessment, axis)
    : "";
  const audioProfileBlock = options.audioProfile
    ? buildAudioProfileBlock(options.audioProfile, axis)
    : "";
  const axisBlock = buildAxisBlock(anchor, axis, scene);
  const regionalBlock = buildRegionalBlock(
    scene,
    axis,
    recommendationCount,
    options.strictScene,
  );

  return `You are a music expert recommending real, existing songs.

ACTIVE AXIS: ${axisLabel.toUpperCase()} (id: ${axis})
This list must be tailored ONLY to ${axisLabel}. A different axis (beat, mood, or lyrics) would produce a DIFFERENT ranked list for the same anchor.

The user selected this exact anchor recording on Spotify:
${metadataBlock}
${inferredBlock}
${assessmentBlock}
${audioProfileBlock}
${axisBlock}
${regionalBlock}

Similarity axis: ${axisLabel}

Recommend exactly ${recommendationCount} real songs that exist on major streaming platforms (Spotify).

Rank them by similarity on ${axisLabel} ONLY — strongest match first. Position 1 is the closest match; position ${recommendationCount} is the weakest but still relevant.

For this axis:
- ${rules.focus}
- Match on ${rules.match}.
- Explicitly IGNORE ${rules.ignore}.
- ${AXIS_AVOID[axis]}

Requirements:
- Return ONLY a JSON array in ranked order (best match first). No preamble, no markdown fences, no commentary.
- Each item must be an object with exactly these string fields: "title", "artist", "reason".
- "reason" must be one sentence that explicitly references the ${axisLabel} dimension (${rules.reasonHint}).
- Do NOT include the anchor song or any duplicate tracks (no repeat titles, no live/remix/acoustic variants of the same song already listed).
- Every song must be a distinct track — different title or different primary artist.
- Avoid lazy generic picks (e.g. do not default to the same mainstream hits like "Eastside" unless they are genuinely the #1 match on THIS axis).
- All songs must be real and findable on Spotify.

Example format:
[
  {
    "title": "Song Name",
    "artist": "Artist Name",
    "reason": "Matched on ..."
  }
]`;
}

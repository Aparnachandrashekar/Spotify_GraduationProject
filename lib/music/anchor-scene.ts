import type { Anchor, RawRecommendation } from "@/lib/types";

export type IndianLanguage =
  | "hindi"
  | "tamil"
  | "telugu"
  | "malayalam"
  | "kannada"
  | "punjabi";

export type AnchorScene = {
  language: IndianLanguage | "indian";
  label: string;
};

const DEVANAGARI = /[\u0900-\u097F]/;
const TAMIL = /[\u0B80-\u0BFF]/;
const TELUGU = /[\u0C00-\u0C7F]/;
const KANNADA = /[\u0C80-\u0CFF]/;
const MALAYALAM = /[\u0D00-\u0D7F]/;
const GURMUKHI = /[\u0A00-\u0A7F]/;

const LANGUAGE_ARTIST_SIGNALS: Record<IndianLanguage, readonly string[]> = {
  hindi: [
    "arijit singh",
    "pritam",
    "shreya ghoshal",
    "vishal-shekhar",
    "vishal shekhar",
    "atif aslam",
    "jubin nautiyal",
    "neha kakkar",
    "badshah",
    "mohit chauhan",
    "sonu nigam",
    "sukhwinder singh",
    "rahat fateh ali khan",
    "tanishk bagchi",
    "sachin-jigar",
    "amit trivedi",
    "ajay-atul",
    "kk",
    "k.k.",
    "shaan",
    "benny dayal",
    "sunidhi chauhan",
    "kumar sanu",
    "udit narayan",
    "alka yagnik",
    "javed ali",
    "irshad kamil",
    "sameer anjaan",
    "rochak kohli",
    "ayushmann khurrana",
    "mithoon",
    "kshitij tarey",
    "shilpa rao",
  ],
  tamil: [
    "anirudh ravichander",
    "anirudh",
    "dhanush",
    "yuvan shankar raja",
    "yuvan",
    "ilaiyaraaja",
    "ilaayaraja",
    "hip hop tamizha",
    "g. v. prakash",
    "gv prakash",
    "sid sriram",
    "thamarai",
    "vijay",
    "karthi",
    "chinmayi",
    "d. imman",
    "sean roldan",
    "sathyaprakash",
    "harish swaminathan",
    "mervin solomon",
    "santhosh narayanan",
    "hiphop tamizha",
    "a.r. rahman",
    "ar rahman",
    "shankar mahadevan",
    "vijay prakash",
    "swetha mohan",
    "pa. vijay",
    "haricharan",
    "karthik",
    "saindhavi",
    "benny dayal",
    "harris jayaraj",
    "girishh g",
    "sam c.s.",
    "justin prabhakaran",
    "hip hop tamizha",
  ],
  telugu: [
    "devi sri prasad",
    "thaman s",
    "thaman",
    "anup rubens",
    "mani sharma",
    "mm keeravani",
    "keeravani",
    "s. p. balasubrahmanyam",
    "sp balasubrahmanyam",
    "ram charan",
    "prabhas",
  ],
  malayalam: [
    "vidyasagar",
    "gopi sundar",
    "deepak dev",
    "bijibal",
    "m. jayachandran",
    "sooraj santhosh",
  ],
  kannada: [
    "arjun janya",
    "v. harikrishna",
    "harikrishna",
    "raghu dixit",
    "judah sandhy",
  ],
  punjabi: [
    "diljit dosanjh",
    "sidhu moose wala",
    "karan aujla",
    "ap dhillon",
    "shubh",
    "b praak",
    "guru randhawa",
    "honey singh",
    "yo yo honey singh",
  ],
};

const SHARED_INDIAN_SIGNALS = [
  "a.r. rahman",
  "ar rahman",
  "jonita gandhi",
  "shreya ghoshal",
  "badshah",
  "arr",
] as const;

const SCENE_LABELS: Record<IndianLanguage | "indian", string> = {
  hindi: "Hindi (Bollywood / Hindi pop)",
  tamil: "Tamil (Kollywood / Tamil pop)",
  telugu: "Telugu (Tollywood / Telugu pop)",
  malayalam: "Malayalam film / pop",
  kannada: "Kannada film / pop",
  punjabi: "Punjabi pop / bhangra",
  indian: "Indian regional film / pop",
};

const TAMIL_ROMANIZED_HINTS = [
  "adiye",
  "ammamma",
  "annan",
  "chillena",
  "irundhaal",
  "irundhal",
  "kadhal",
  "kaadhal",
  "kannamma",
  "kolaveri",
  "maari",
  "manasu",
  "marana",
  "mersal",
  "nenjukk",
  "poove",
  "raasa",
  "senjitaley",
  "thendral",
  "unakkul",
  "vaathi",
  "yennai",
  "thalapathy",
  "jailer",
  "master",
  "petta",
  "kaala",
  "theri",
  "bigil",
  "pogadhe",
  "munbe",
  "vaseegara",
  "enakkul",
  "oorvasi",
  "oorvas",
  "tamizha",
  "tamizhan",
] as const;

const WESTERN_ARTIST_SIGNALS = [
  "taylor swift",
  "drake",
  "ed sheeran",
  "bruno mars",
  "mark ronson",
  "black eyed peas",
  "coldplay",
  "radiohead",
  "eminem",
  "sia",
  "imagine dragons",
  "foster the people",
  "queen",
  "jeff buckley",
  "gary jules",
  "red hot chili peppers",
  "american authors",
  "arctic monkeys",
  "the weeknd",
  "post malone",
  "dua lipa",
  "billie eilish",
  "ariana grande",
  "justin bieber",
  "adele",
  "beyonce",
  "rihanna",
  "kanye west",
  "metallica",
  "nirvana",
  "green day",
  "linkin park",
  "maroon 5",
  "onerepublic",
  "passenger",
  "james arthur",
  "lewis capaldi",
  "hozier",
  "michael andrews",
  "nate dogg",
  "bruno mars",
  "harry styles",
  "olivia rodrigo",
  "doja cat",
  "the chainsmokers",
  "calvin harris",
  "david guetta",
  "avicii",
  "marshmello",
  "kygo",
  "alan walker",
] as const;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^\w\s.&'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectScriptLanguage(text: string): IndianLanguage | null {
  if (DEVANAGARI.test(text)) {
    return "hindi";
  }

  if (TAMIL.test(text)) {
    return "tamil";
  }

  if (TELUGU.test(text)) {
    return "telugu";
  }

  if (KANNADA.test(text)) {
    return "kannada";
  }

  if (MALAYALAM.test(text)) {
    return "malayalam";
  }

  if (GURMUKHI.test(text)) {
    return "punjabi";
  }

  return null;
}

function hasFilmSoundtrackMarker(text: string): boolean {
  return (
    /\(from\s+["']/i.test(text) ||
    /original motion picture/i.test(text) ||
    /\bsoundtrack\b/i.test(text) ||
    /\bost\b/i.test(text)
  );
}

function matchesSignals(text: string, signals: readonly string[]): boolean {
  return signals.some((signal) => text.includes(signal));
}

function matchesTamilRomanizedHints(text: string): boolean {
  return TAMIL_ROMANIZED_HINTS.some((hint) => text.includes(hint));
}

function looksLikeWesternEnglish(title: string, artist: string): boolean {
  const rawText = `${title} ${artist}`;
  const text = normalizeText(rawText);

  if (detectScriptLanguage(rawText)) {
    return false;
  }

  if (hasFilmSoundtrackMarker(title)) {
    return false;
  }

  if (matchesSignals(text, SHARED_INDIAN_SIGNALS)) {
    return false;
  }

  for (const signals of Object.values(LANGUAGE_ARTIST_SIGNALS)) {
    if (matchesSignals(text, signals)) {
      return false;
    }
  }

  return WESTERN_ARTIST_SIGNALS.some((signal) => text.includes(signal));
}

function scoreLanguage(text: string): IndianLanguage | null {
  let bestLanguage: IndianLanguage | null = null;
  let bestScore = 0;

  for (const [language, signals] of Object.entries(LANGUAGE_ARTIST_SIGNALS) as Array<
    [IndianLanguage, readonly string[]]
  >) {
    const score = signals.reduce(
      (total, signal) => (text.includes(signal) ? total + 1 : total),
      0,
    );

    if (score > bestScore) {
      bestScore = score;
      bestLanguage = language;
    }
  }

  return bestScore > 0 ? bestLanguage : null;
}

export function detectAnchorScene(anchor: Anchor): AnchorScene | null {
  const combined = normalizeText(
    `${anchor.title} ${anchor.artist} ${anchor.albumName ?? ""}`,
  );

  const scriptLanguage = detectScriptLanguage(
    `${anchor.title} ${anchor.artist} ${anchor.albumName ?? ""}`,
  );

  if (scriptLanguage) {
    return {
      language: scriptLanguage,
      label: SCENE_LABELS[scriptLanguage],
    };
  }

  const scoredLanguage = scoreLanguage(combined);

  if (scoredLanguage) {
    return {
      language: scoredLanguage,
      label: SCENE_LABELS[scoredLanguage],
    };
  }

  if (matchesTamilRomanizedHints(combined)) {
    return {
      language: "tamil",
      label: SCENE_LABELS.tamil,
    };
  }

  const hasFilmMarker = hasFilmSoundtrackMarker(
    `${anchor.title} ${anchor.albumName ?? ""}`,
  );

  if (hasFilmMarker) {
    return {
      language: "indian",
      label: SCENE_LABELS.indian,
    };
  }

  const hasIndianArtist = matchesSignals(combined, SHARED_INDIAN_SIGNALS);

  if (hasIndianArtist) {
    return {
      language: "indian",
      label: SCENE_LABELS.indian,
    };
  }

  return null;
}

export function isIndianAnchor(anchor: Anchor): boolean {
  return detectAnchorScene(anchor) !== null;
}

function isIndianRecommendation(
  recommendation: RawRecommendation,
  scene: AnchorScene,
): boolean {
  const rawText = `${recommendation.title} ${recommendation.artist}`;

  if (looksLikeWesternEnglish(recommendation.title, recommendation.artist)) {
    return false;
  }

  const text = normalizeText(rawText);
  const scriptLanguage = detectScriptLanguage(rawText);

  if (scriptLanguage) {
    if (scene.language === "indian") {
      return true;
    }

    return scriptLanguage === scene.language;
  }

  if (scene.language === "indian") {
    if (hasFilmSoundtrackMarker(recommendation.title)) {
      return true;
    }

    if (matchesSignals(text, SHARED_INDIAN_SIGNALS)) {
      return true;
    }

    for (const signals of Object.values(LANGUAGE_ARTIST_SIGNALS)) {
      if (matchesSignals(text, signals)) {
        return true;
      }
    }

    if (matchesTamilRomanizedHints(text)) {
      return true;
    }

    return false;
  }

  const matchesScene = matchesSignals(
    text,
    LANGUAGE_ARTIST_SIGNALS[scene.language],
  );
  const matchesOtherLanguage = (
    Object.entries(LANGUAGE_ARTIST_SIGNALS) as Array<
      [IndianLanguage, readonly string[]]
    >
  ).some(
    ([language, signals]) =>
      language !== scene.language && matchesSignals(text, signals),
  );

  if (matchesOtherLanguage && !matchesScene) {
    return false;
  }

  if (matchesScene) {
    return true;
  }

  if (scene.language === "tamil" && matchesTamilRomanizedHints(text)) {
    return true;
  }

  if (hasFilmSoundtrackMarker(recommendation.title)) {
    return matchesSignals(text, LANGUAGE_ARTIST_SIGNALS[scene.language]);
  }

  return false;
}

export function isRecommendationMatchForScene(
  recommendation: Pick<RawRecommendation, "title" | "artist">,
  scene: AnchorScene | null,
): boolean {
  if (!scene) {
    return true;
  }

  return isIndianRecommendation(
    { ...recommendation, reason: "" },
    scene,
  );
}

export function filterRecommendationsForScene(
  recommendations: RawRecommendation[],
  scene: AnchorScene | null,
): RawRecommendation[] {
  if (!scene) {
    return recommendations;
  }

  return recommendations.filter((item) => isIndianRecommendation(item, scene));
}

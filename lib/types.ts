// Core domain types for My Reading Tracker

export interface OpenLibraryBook {
  key: string; // e.g. "/works/OL12345W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  isbn?: string[];
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  docs: OpenLibraryBook[];
}

export const MOOD_TAGS = [
  "Reflective",
  "Adventurous",
  "Cozy",
  "Melancholy",
  "Inspired",
  "Tense",
  "Hopeful",
  "Calm",
] as const;

export type MoodTag = (typeof MOOD_TAGS)[number];

export const THEME_TAGS = [
  "Family",
  "Identity",
  "Love",
  "Power",
  "Survival",
  "Nature",
  "Politics",
  "Coming of Age",
  "War",
  "Technology",
  "Spirituality",
  "Friendship",
] as const;

export type ThemeTag = (typeof THEME_TAGS)[number];

export type EnjoymentAnswer =
  | "Loved it"
  | "Liked it"
  | "It was ok"
  | "Didn't vibe";

export type DrewYouInAnswer =
  | "The writing style"
  | "The characters"
  | "The plot"
  | "The world / setting"
  | "The ideas / themes"
  | "A recommendation";

export type ReadSimilarAnswer = "Definitely" | "Maybe" | "Probably not";

/** Answers to the post-read taste interview, stored alongside a BookEntry. */
export interface TasteInterview {
  enjoyment?: EnjoymentAnswer;
  rating: number; // 1–5
  themeTags: ThemeTag[];
  moodTags: MoodTag[];
  drewYouIn?: DrewYouInAnswer;
  readSimilar?: ReadSimilarAnswer;
  notes: string;
}

export interface BookEntry {
  id: string; // UUID
  // From Open Library
  openLibraryKey: string;
  title: string;
  author: string;
  firstPublishYear?: number;
  coverId?: number;
  subjects?: string[];
  // User-logged fields (kept at top level for backwards compat + quick access)
  rating: number; // 1–5
  dateFinished: string; // ISO date string YYYY-MM-DD
  moodTags: MoodTag[];
  themeTags: ThemeTag[];
  enjoyment?: EnjoymentAnswer;
  notes: string;
  // Full interview answers (superset of the fields above)
  interview?: TasteInterview;
  // Metadata
  addedAt: string; // ISO datetime
}

export const STORAGE_KEY = "reading_tracker_books";
export const PROFILE_STORAGE_KEY = "reading_tracker_profile";

// ─── Reading Profile ────────────────────────────────────────────────────────

/** Frequency map: label → count */
export type FrequencyMap = Record<string, number>;

/**
 * Aggregated taste profile built from all completed interviews.
 * Updated incrementally each time the user finishes a check-in.
 */
export interface ReadingProfile {
  /** Total number of interviews completed */
  interviewCount: number;
  /** Mood tag frequencies */
  moodFrequency: FrequencyMap;
  /** Theme tag frequencies */
  themeFrequency: FrequencyMap;
  /** EnjoymentAnswer frequencies */
  enjoymentFrequency: FrequencyMap;
  /** DrewYouIn answer frequencies */
  drewYouInFrequency: FrequencyMap;
  /** ReadSimilar answer frequencies */
  readSimilarFrequency: FrequencyMap;
  /** Sum of all ratings (divide by interviewCount for average) */
  ratingSum: number;
  /** ISO datetime of last update */
  updatedAt: string;
}

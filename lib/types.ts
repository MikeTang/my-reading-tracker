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

export interface BookEntry {
  id: string; // UUID
  // From Open Library
  openLibraryKey: string;
  title: string;
  author: string;
  firstPublishYear?: number;
  coverId?: number;
  subjects?: string[];
  // User-logged fields
  rating: number; // 1–5
  dateFinished: string; // ISO date string YYYY-MM-DD
  moodTags: MoodTag[];
  themeTags: ThemeTag[];
  enjoyment?: EnjoymentAnswer;
  notes: string;
  // Metadata
  addedAt: string; // ISO datetime
}

export const STORAGE_KEY = "reading_tracker_books";

"use client";

/**
 * TasteInterviewModal
 *
 * Shown immediately after a book is saved. Asks 6 short questions,
 * stores answers on the BookEntry, and updates the ReadingProfile in
 * localStorage. The modal design mirrors the bottom-right floating
 * check-in panel from the design mockup (amber header + white body).
 */

import { useState } from "react";
import {
  BookEntry,
  TasteInterview,
  MOOD_TAGS,
  MoodTag,
  THEME_TAGS,
  ThemeTag,
  EnjoymentAnswer,
  DrewYouInAnswer,
  ReadSimilarAnswer,
} from "@/lib/types";
import { saveBook } from "@/lib/books";
import { applyInterview } from "@/lib/profile";
import StarRating from "./StarRating";

interface Props {
  book: BookEntry;
  onDone: (updated: BookEntry) => void;
  onSkip: () => void;
}

const ENJOYMENT_OPTIONS: { label: EnjoymentAnswer; emoji: string }[] = [
  { label: "Loved it", emoji: "😍" },
  { label: "Liked it", emoji: "😊" },
  { label: "It was ok", emoji: "😐" },
  { label: "Didn't vibe", emoji: "😕" },
];

const DREW_YOU_IN_OPTIONS: DrewYouInAnswer[] = [
  "The writing style",
  "The characters",
  "The plot",
  "The world / setting",
  "The ideas / themes",
  "A recommendation",
];

const READ_SIMILAR_OPTIONS: {
  label: ReadSimilarAnswer;
  color: string;
}[] = [
  {
    label: "Definitely",
    color:
      "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium",
  },
  {
    label: "Maybe",
    color: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    label: "Probably not",
    color: "border-slate-200 bg-slate-50 text-slate-500",
  },
];

// Mood icon mapping
const MOOD_ICON: Record<MoodTag, string> = {
  Reflective: "🌙",
  Adventurous: "⚡",
  Cozy: "☕",
  Melancholy: "🌧️",
  Inspired: "✨",
  Tense: "😤",
  Hopeful: "🌅",
  Calm: "🌿",
};

export default function TasteInterviewModal({ book, onDone, onSkip }: Props) {
  const [enjoyment, setEnjoyment] = useState<EnjoymentAnswer | "">("");
  const [rating, setRating] = useState(book.rating ?? 0);
  const [themeTags, setThemeTags] = useState<ThemeTag[]>(book.themeTags ?? []);
  const [moodTags, setMoodTags] = useState<MoodTag[]>(book.moodTags ?? []);
  const [drewYouIn, setDrewYouIn] = useState<DrewYouInAnswer | "">("");
  const [readSimilar, setReadSimilar] = useState<ReadSimilarAnswer | "">("");
  const [notes, setNotes] = useState(book.notes ?? "");
  const [saving, setSaving] = useState(false);

  const toggleTheme = (tag: ThemeTag) =>
    setThemeTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 3
        ? [...prev, tag]
        : prev
    );

  const toggleMood = (tag: MoodTag) =>
    setMoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleSave = () => {
    setSaving(true);

    const interview: TasteInterview = {
      enjoyment: enjoyment || undefined,
      rating,
      themeTags,
      moodTags,
      drewYouIn: drewYouIn || undefined,
      readSimilar: readSimilar || undefined,
      notes,
    };

    // Persist interview answers back onto the BookEntry
    const updated: BookEntry = {
      ...book,
      rating,
      moodTags,
      themeTags,
      enjoyment: enjoyment || undefined,
      notes,
      interview,
    };

    saveBook(updated);
    applyInterview(interview);
    onDone(updated);
  };

  return (
    <div
      className="fixed inset-0 modal-overlay z-50 flex items-end sm:items-center justify-end sm:justify-center p-4 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onSkip()}
    >
      {/* Panel — matches the bottom-right floating preview in the mockup */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Amber gradient header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-medium opacity-80">
                You just finished
              </p>
              <h3 className="text-white font-lora font-semibold text-base mt-0.5 truncate max-w-[200px]">
                {book.title}
              </h3>
            </div>
            <button
              onClick={onSkip}
              className="text-white/60 hover:text-white text-xl leading-none ml-2 flex-shrink-0"
              aria-label="Skip check-in"
            >
              ×
            </button>
          </div>
        </div>

        {/* Questions body */}
        <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Q1 – Enjoyment */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              😊 Did you enjoy this book?
            </p>
            <div className="flex gap-1.5">
              {ENJOYMENT_OPTIONS.map(({ label }) => (
                <button
                  key={label}
                  onClick={() =>
                    setEnjoyment((prev) => (prev === label ? "" : label))
                  }
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition ${
                    enjoyment === label
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-medium"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2 – Star rating */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              ⭐ Your rating
            </p>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          {/* Q3 – Themes */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              🎭 Which themes resonated?{" "}
              <span className="text-slate-400 font-normal">(pick up to 3)</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {THEME_TAGS.map((tag) => {
                const active = themeTags.includes(tag);
                const atMax = themeTags.length >= 3 && !active;
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTheme(tag)}
                    disabled={atMax}
                    className={`tag-pill cursor-pointer border transition ${
                      active
                        ? "bg-violet-100 text-violet-700 border-violet-300"
                        : atMax
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-default"
                        : "bg-slate-100 text-slate-500 border-transparent hover:border-slate-300"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q4 – Mood */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              🌙 What was your reading mood?
            </p>
            <div className="grid grid-cols-4 gap-1">
              {MOOD_TAGS.map((tag) => {
                const active = moodTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleMood(tag)}
                    className={`text-center py-2 rounded-xl border text-xs transition ${
                      active
                        ? "bg-blue-50 border-blue-200 text-blue-600 font-medium"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {MOOD_ICON[tag]}
                    <br />
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q5 – What drew you in */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              💡 What drew you in?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DREW_YOU_IN_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() =>
                    setDrewYouIn((prev) => (prev === opt ? "" : opt))
                  }
                  className={`tag-pill border transition ${
                    drewYouIn === opt
                      ? "bg-indigo-100 text-indigo-700 border-indigo-300 font-medium"
                      : "bg-slate-100 text-slate-500 border-transparent hover:border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q6 – Read something similar */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              📚 Would you read something similar?
            </p>
            <div className="flex gap-2">
              {READ_SIMILAR_OPTIONS.map(({ label, color }) => (
                <button
                  key={label}
                  onClick={() =>
                    setReadSimilar((prev) => (prev === label ? "" : label))
                  }
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition ${
                    readSimilar === label
                      ? color
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Q7 – Notes (optional) */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              📝 Any notes?{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What will you remember about this book?"
              className="w-full text-xs border border-slate-200 rounded-xl p-3 resize-none text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder-slate-300"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition"
          >
            {saving ? "Saving…" : "Save to my Library ✓"}
          </button>
          <p className="text-center text-xs text-slate-400 pb-1">
            Shelf will use this to sharpen your recommendations
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import { searchBooks, coverUrl } from "@/lib/openLibrary";
import { saveBook, isAlreadyLogged, generateId } from "@/lib/books";
import {
  OpenLibraryBook,
  BookEntry,
  MOOD_TAGS,
  MoodTag,
  THEME_TAGS,
  ThemeTag,
  EnjoymentAnswer,
} from "@/lib/types";
import StarRating from "./StarRating";

interface Props {
  onClose: () => void;
  onSaved: (entry: BookEntry) => void;
}

type Step = "search" | "log";

const ENJOYMENT_OPTIONS: EnjoymentAnswer[] = [
  "Loved it",
  "Liked it",
  "It was ok",
  "Didn't vibe",
];

// Deterministic spine colour so the same book always gets the same colour
const SPINE_CLASSES = [
  "book-spine",
  "book-spine-2",
  "book-spine-3",
  "book-spine-4",
  "book-spine-5",
  "book-spine-6",
];

function spineClass(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return SPINE_CLASSES[Math.abs(hash) % SPINE_CLASSES.length];
}

export default function AddBookModal({ onClose, onSaved }: Props) {
  // ── Search state
  const [titleQuery, setTitleQuery] = useState("");
  const [authorQuery, setAuthorQuery] = useState("");
  const [results, setResults] = useState<OpenLibraryBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // ── Log state
  const [step, setStep] = useState<Step>("search");
  const [selectedBook, setSelectedBook] = useState<OpenLibraryBook | null>(null);
  const [rating, setRating] = useState(0);
  const [dateFinished, setDateFinished] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [moodTags, setMoodTags] = useState<MoodTag[]>([]);
  const [themeTags, setThemeTags] = useState<ThemeTag[]>([]);
  const [enjoyment, setEnjoyment] = useState<EnjoymentAnswer | "">("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  // ── Handlers

  const handleSearch = useCallback(async () => {
    if (!titleQuery.trim()) return;
    setSearching(true);
    setSearchError("");
    setResults([]);

    // Cancel any in-flight search
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const books = await searchBooks({
        title: titleQuery,
        author: authorQuery || undefined,
        limit: 10,
      });
      setResults(books);
      if (books.length === 0) setSearchError("No results found. Try a different title.");
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setSearchError("Search failed. Check your connection and try again.");
      }
    } finally {
      setSearching(false);
    }
  }, [titleQuery, authorQuery]);

  const handleSelectBook = (book: OpenLibraryBook) => {
    setSelectedBook(book);
    setStep("log");
  };

  const toggleMood = (tag: MoodTag) =>
    setMoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const toggleTheme = (tag: ThemeTag) =>
    setThemeTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 3
        ? [...prev, tag]
        : prev
    );

  const handleSave = () => {
    if (!selectedBook) return;
    if (rating === 0) { setSaveError("Please give a star rating."); return; }
    if (!dateFinished) { setSaveError("Please set the date you finished."); return; }

    setSaving(true);
    setSaveError("");

    try {
      const entry: BookEntry = {
        id: generateId(),
        openLibraryKey: selectedBook.key,
        title: selectedBook.title,
        author: selectedBook.author_name?.[0] ?? "Unknown Author",
        firstPublishYear: selectedBook.first_publish_year,
        coverId: selectedBook.cover_i,
        subjects: selectedBook.subject?.slice(0, 10),
        rating,
        dateFinished,
        moodTags,
        themeTags,
        enjoyment: enjoyment || undefined,
        notes,
        addedAt: new Date().toISOString(),
      };

      saveBook(entry);
      onSaved(entry);
      onClose();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save. Please try again."
      );
      setSaving(false);
    }
  };

  const alreadyLogged = selectedBook
    ? isAlreadyLogged(selectedBook.key)
    : false;

  // ── Render

  return (
    <div
      className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {step === "log" && (
              <button
                onClick={() => setStep("search")}
                className="text-slate-400 hover:text-slate-600 transition mr-1"
                aria-label="Back to search"
              >
                ←
              </button>
            )}
            <h2 className="font-lora font-semibold text-slate-800 text-lg">
              {step === "search" ? "Add a Book" : "Log this Book"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {step === "search" ? (
            <SearchStep
              titleQuery={titleQuery}
              setTitleQuery={setTitleQuery}
              authorQuery={authorQuery}
              setAuthorQuery={setAuthorQuery}
              results={results}
              searching={searching}
              searchError={searchError}
              onSearch={handleSearch}
              onSelect={handleSelectBook}
            />
          ) : (
            <LogStep
              book={selectedBook!}
              alreadyLogged={alreadyLogged}
              rating={rating}
              setRating={setRating}
              dateFinished={dateFinished}
              setDateFinished={setDateFinished}
              moodTags={moodTags}
              toggleMood={toggleMood}
              themeTags={themeTags}
              toggleTheme={toggleTheme}
              enjoyment={enjoyment}
              setEnjoyment={setEnjoyment}
              notes={notes}
              setNotes={setNotes}
              saveError={saveError}
              saving={saving}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────── Search step ───────────────────────────────

interface SearchStepProps {
  titleQuery: string;
  setTitleQuery: (v: string) => void;
  authorQuery: string;
  setAuthorQuery: (v: string) => void;
  results: OpenLibraryBook[];
  searching: boolean;
  searchError: string;
  onSearch: () => void;
  onSelect: (book: OpenLibraryBook) => void;
}

function SearchStep({
  titleQuery,
  setTitleQuery,
  authorQuery,
  setAuthorQuery,
  results,
  searching,
  searchError,
  onSearch,
  onSelect,
}: SearchStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Search Open Library by title. Add an author to narrow results.
      </p>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
          Book Title <span className="text-violet-500">*</span>
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
            />
          </svg>
          <input
            type="text"
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="e.g. The Covenant of Water"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 text-slate-700 placeholder-slate-400"
            autoFocus
          />
        </div>
      </div>

      {/* Author filter */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
          Author <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={authorQuery}
          onChange={(e) => setAuthorQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="e.g. Abraham Verghese"
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 text-slate-700 placeholder-slate-400"
        />
      </div>

      <button
        onClick={onSearch}
        disabled={!titleQuery.trim() || searching}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2"
      >
        {searching ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Searching…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
            </svg>
            Search Open Library
          </>
        )}
      </button>

      {/* Error */}
      {searchError && (
        <p className="text-sm text-red-500 text-center">{searchError}</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 mt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {results.length} result{results.length !== 1 ? "s" : ""} — pick one
          </p>
          {results.map((book) => (
            <SearchResultRow
              key={book.key}
              book={book}
              onSelect={onSelect}
              alreadyLogged={isAlreadyLogged(book.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultRow({
  book,
  onSelect,
  alreadyLogged,
}: {
  book: OpenLibraryBook;
  onSelect: (b: OpenLibraryBook) => void;
  alreadyLogged: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(book)}
      className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50 transition group"
    >
      {/* Cover or spine swatch */}
      <div className={`w-10 h-14 rounded-lg flex-shrink-0 shadow-sm flex items-end p-1 ${spineClass(book.key)}`}>
        {book.cover_i ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl(book.cover_i, "S")}
            alt=""
            className="w-full h-full object-cover rounded-lg absolute inset-0"
          />
        ) : (
          <span className="text-white text-xs font-lora italic leading-tight line-clamp-2" style={{ fontSize: "0.55rem" }}>
            {book.title}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{book.title}</p>
        <p className="text-xs text-slate-400">
          {book.author_name?.[0] ?? "Unknown"}
          {book.first_publish_year ? ` · ${book.first_publish_year}` : ""}
        </p>
      </div>

      {alreadyLogged ? (
        <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
          Logged ✓
        </span>
      ) : (
        <span className="text-xs text-violet-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
          Select →
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────── Log step ──────────────────────────────────

interface LogStepProps {
  book: OpenLibraryBook;
  alreadyLogged: boolean;
  rating: number;
  setRating: (v: number) => void;
  dateFinished: string;
  setDateFinished: (v: string) => void;
  moodTags: MoodTag[];
  toggleMood: (t: MoodTag) => void;
  themeTags: ThemeTag[];
  toggleTheme: (t: ThemeTag) => void;
  enjoyment: EnjoymentAnswer | "";
  setEnjoyment: (v: EnjoymentAnswer) => void;
  notes: string;
  setNotes: (v: string) => void;
  saveError: string;
  saving: boolean;
  onSave: () => void;
}

function LogStep({
  book,
  alreadyLogged,
  rating,
  setRating,
  dateFinished,
  setDateFinished,
  moodTags,
  toggleMood,
  themeTags,
  toggleTheme,
  enjoyment,
  setEnjoyment,
  notes,
  setNotes,
  saveError,
  saving,
  onSave,
}: LogStepProps) {
  return (
    <div className="space-y-5">
      {/* Book header */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className={`w-12 h-16 rounded-lg flex-shrink-0 shadow ${spineClass(book.key)} flex items-end p-1`}>
          <span className="text-white font-lora italic leading-tight" style={{ fontSize: "0.55rem" }}>
            {book.title}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-800 text-sm leading-snug">{book.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {book.author_name?.[0] ?? "Unknown"}
            {book.first_publish_year ? ` · ${book.first_publish_year}` : ""}
          </p>
          {alreadyLogged && (
            <p className="text-xs text-amber-500 mt-1 font-medium">
              ⚠ You&apos;ve already logged this book. Saving will add another entry.
            </p>
          )}
        </div>
      </div>

      {/* Q1: Enjoyment */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">
          😊 Did you enjoy this book?
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {ENJOYMENT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setEnjoyment(opt)}
              className={`flex-1 min-w-fit text-xs py-1.5 px-2 rounded-lg border font-medium transition ${
                enjoyment === opt
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Q2: Star rating */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">
          ⭐ Your rating <span className="text-violet-500">*</span>
        </p>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Q3: Themes */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">
          🎭 Which themes resonated?{" "}
          <span className="text-slate-400 font-normal">(pick up to 3)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {THEME_TAGS.map((tag) => {
            const selected = themeTags.includes(tag);
            const disabled = !selected && themeTags.length >= 3;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTheme(tag)}
                disabled={disabled}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  selected
                    ? "bg-violet-100 text-violet-700 border-violet-300"
                    : disabled
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Q4: Mood */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">
          🌙 What mood were you in while reading?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MOOD_TAGS.map((tag) => {
            const selected = moodTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleMood(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  selected
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date finished */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">
          📅 Date finished <span className="text-violet-500">*</span>
        </label>
        <input
          type="date"
          value={dateFinished}
          onChange={(e) => setDateFinished(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 text-slate-700"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">
          📝 Notes{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Your thoughts, favourite quotes, memories…"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 text-slate-700 placeholder-slate-400 resize-none"
        />
      </div>

      {/* Error */}
      {saveError && (
        <p className="text-sm text-red-500">{saveError}</p>
      )}

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Save to My Library
          </>
        )}
      </button>
    </div>
  );
}

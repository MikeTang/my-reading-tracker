"use client";

/**
 * BookDetailModal
 *
 * Shows full detail for a logged BookEntry:
 *  - Cover, title, author, year
 *  - Rating, dateFinished, mood tags, theme tags
 *  - Notes and taste-interview answers
 *  - Edit mode (inline) + delete with confirmation
 *
 * Rendered as a fixed full-screen overlay (modal-overlay class from globals).
 */

import { useState } from "react";
import {
  BookEntry,
  MOOD_TAGS,
  MoodTag,
  THEME_TAGS,
  ThemeTag,
  EnjoymentAnswer,
  DrewYouInAnswer,
  ReadSimilarAnswer,
} from "@/lib/types";
import { saveBook, deleteBook } from "@/lib/books";
import { coverUrl } from "@/lib/openLibrary";
import StarRating from "./StarRating";

// ── Spine colours ────────────────────────────────────────────────────────────
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
  for (let i = 0; i < key.length; i++)
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return SPINE_CLASSES[Math.abs(hash) % SPINE_CLASSES.length];
}

// ── Mood pill colours ─────────────────────────────────────────────────────────
const MOOD_COLOURS: Record<MoodTag, string> = {
  Reflective: "bg-violet-100 text-violet-700",
  Adventurous: "bg-orange-100 text-orange-700",
  Cozy: "bg-amber-100 text-amber-700",
  Melancholy: "bg-blue-100 text-blue-700",
  Inspired: "bg-emerald-100 text-emerald-700",
  Tense: "bg-rose-100 text-rose-700",
  Hopeful: "bg-sky-100 text-sky-700",
  Calm: "bg-teal-100 text-teal-700",
};

const ENJOYMENT_OPTIONS: { label: EnjoymentAnswer; emoji: string }[] = [
  { label: "Loved it", emoji: "😍" },
  { label: "Liked it", emoji: "😊" },
  { label: "It was ok", emoji: "😐" },
  { label: "Didn't vibe", emoji: "😕" },
];

const DREW_OPTIONS: DrewYouInAnswer[] = [
  "The writing style",
  "The characters",
  "The plot",
  "The world / setting",
  "The ideas / themes",
  "A recommendation",
];

const SIMILAR_OPTIONS: { label: ReadSimilarAnswer; cls: string }[] = [
  { label: "Definitely", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { label: "Maybe", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  { label: "Probably not", cls: "border-slate-200 bg-slate-100 text-slate-500" },
];

interface Props {
  book: BookEntry;
  onClose: () => void;
  onUpdated: (book: BookEntry) => void;
  onDeleted: (id: string) => void;
}

// ── Edit-form state shape ─────────────────────────────────────────────────────
interface EditState {
  rating: number;
  dateFinished: string;
  moodTags: MoodTag[];
  themeTags: ThemeTag[];
  enjoyment: EnjoymentAnswer | "";
  drewYouIn: DrewYouInAnswer | "";
  readSimilar: ReadSimilarAnswer | "";
  notes: string;
}

function toEditState(b: BookEntry): EditState {
  return {
    rating: b.rating,
    dateFinished: b.dateFinished,
    moodTags: [...b.moodTags],
    themeTags: [...b.themeTags],
    enjoyment: b.enjoyment ?? b.interview?.enjoyment ?? "",
    drewYouIn: b.interview?.drewYouIn ?? "",
    readSimilar: b.interview?.readSimilar ?? "",
    notes: b.notes,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TagToggle<T extends string>({
  label,
  options,
  selected,
  colour,
  onChange,
}: {
  label: string;
  options: readonly T[];
  selected: T[];
  colour: (t: T) => string;
  onChange: (next: T[]) => void;
}) {
  function toggle(t: T) {
    onChange(
      selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t]
    );
  }
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className={`text-xs px-2.5 py-1 rounded-full border transition ${
              selected.includes(t)
                ? `${colour(t)} border-transparent font-medium`
                : "border-slate-200 text-slate-400 hover:border-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BookDetailModal({
  book,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [edit, setEdit] = useState<EditState>(() => toEditState(book));
  const [saving, setSaving] = useState(false);

  const spine = spineClass(book.openLibraryKey);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function handleSave() {
    setSaving(true);
    const updated: BookEntry = {
      ...book,
      rating: edit.rating,
      dateFinished: edit.dateFinished,
      moodTags: edit.moodTags,
      themeTags: edit.themeTags,
      enjoyment: edit.enjoyment || undefined,
      notes: edit.notes,
      interview: book.interview
        ? {
            ...book.interview,
            rating: edit.rating,
            moodTags: edit.moodTags,
            themeTags: edit.themeTags,
            enjoyment: edit.enjoyment || undefined,
            drewYouIn: edit.drewYouIn || undefined,
            readSimilar: edit.readSimilar || undefined,
            notes: edit.notes,
          }
        : undefined,
    };
    saveBook(updated);
    setSaving(false);
    setEditing(false);
    onUpdated(updated);
  }

  function handleDelete() {
    deleteBook(book.id);
    onDeleted(book.id);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  const displayDate = new Date(book.dateFinished + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  const interviewAnswers = book.interview ?? {
    enjoyment: book.enjoyment,
    drewYouIn: undefined as DrewYouInAnswer | undefined,
    readSimilar: undefined as ReadSimilarAnswer | undefined,
  };

  return (
    <div
      className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4 md:p-6"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Header: cover + title block ─────────────────────────────────── */}
        <div className="flex gap-5 p-6 border-b border-slate-100">
          {/* Cover */}
          <div
            className={`w-20 h-28 rounded-xl flex-shrink-0 shadow-md relative overflow-hidden ${spine}`}
          >
            {book.coverId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl(book.coverId, "M")}
                alt={book.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <span className="absolute bottom-2 left-2 right-2 text-white font-lora italic text-xs leading-snug z-10">
                {book.title.split(" ").slice(0, 3).join(" ")}
              </span>
            )}
          </div>

          {/* Title / meta */}
          <div className="flex-1 min-w-0">
            <h2 className="font-lora text-xl font-semibold text-slate-800 leading-snug">
              {book.title}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {book.author}
              {book.firstPublishYear ? ` · ${book.firstPublishYear}` : ""}
            </p>

            {/* Star rating (readonly in view mode, interactive in edit) */}
            <div className="mt-2">
              {editing ? (
                <StarRating value={edit.rating} onChange={(r) => setEdit((s) => ({ ...s, rating: r }))} size="lg" />
              ) : (
                <StarRating value={book.rating} size="lg" readonly />
              )}
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Finished{" "}
              {editing ? (
                <input
                  type="date"
                  value={edit.dateFinished}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, dateFinished: e.target.value }))
                  }
                  className="border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-300 ml-1"
                />
              ) : (
                <span className="font-medium text-slate-600">{displayDate}</span>
              )}
            </p>
          </div>

          {/* Top-right actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {!editing && (
              <button
                onClick={() => { setEdit(toEditState(book)); setEditing(true); setConfirmDelete(false); }}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Mood tags */}
          {editing ? (
            <TagToggle
              label="🌙 Mood tags"
              options={MOOD_TAGS}
              selected={edit.moodTags}
              colour={(t) => MOOD_COLOURS[t]}
              onChange={(next) => setEdit((s) => ({ ...s, moodTags: next as MoodTag[] }))}
            />
          ) : book.moodTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Mood</p>
              <div className="flex flex-wrap gap-1.5">
                {book.moodTags.map((t) => (
                  <span
                    key={t}
                    className={`text-xs px-2.5 py-1 rounded-full ${MOOD_COLOURS[t]}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Theme tags */}
          {editing ? (
            <TagToggle
              label="🎭 Theme tags"
              options={THEME_TAGS}
              selected={edit.themeTags}
              colour={() => "bg-indigo-100 text-indigo-700"}
              onChange={(next) => setEdit((s) => ({ ...s, themeTags: next as ThemeTag[] }))}
            />
          ) : book.themeTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Themes</p>
              <div className="flex flex-wrap gap-1.5">
                {book.themeTags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Taste interview answers ───────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Taste Interview
            </p>
            <div className="space-y-4 bg-slate-50 rounded-xl p-4">

              {/* Enjoyment */}
              {editing ? (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">😊 Did you enjoy it?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ENJOYMENT_OPTIONS.map(({ label, emoji }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setEdit((s) => ({
                            ...s,
                            enjoyment: s.enjoyment === label ? "" : label,
                          }))
                        }
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          edit.enjoyment === label
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-medium"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : interviewAnswers.enjoyment ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-28 shrink-0">Enjoyment</span>
                  <span className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-700">
                    {ENJOYMENT_OPTIONS.find((o) => o.label === interviewAnswers.enjoyment)?.emoji}{" "}
                    {interviewAnswers.enjoyment}
                  </span>
                </div>
              ) : null}

              {/* Drew you in */}
              {editing ? (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">✨ What drew you in?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DREW_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setEdit((s) => ({
                            ...s,
                            drewYouIn: s.drewYouIn === opt ? "" : opt,
                          }))
                        }
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          edit.drewYouIn === opt
                            ? "border-violet-300 bg-violet-50 text-violet-700 font-medium"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : interviewAnswers.drewYouIn ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-28 shrink-0">Drew you in</span>
                  <span className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-700">
                    {interviewAnswers.drewYouIn}
                  </span>
                </div>
              ) : null}

              {/* Read similar */}
              {editing ? (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">📚 Would you read something similar?</p>
                  <div className="flex gap-2">
                    {SIMILAR_OPTIONS.map(({ label, cls }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setEdit((s) => ({
                            ...s,
                            readSimilar: s.readSimilar === label ? "" : label,
                          }))
                        }
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          edit.readSimilar === label
                            ? cls + " font-medium"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : interviewAnswers.readSimilar ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-28 shrink-0">Read similar?</span>
                  <span className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-700">
                    {interviewAnswers.readSimilar}
                  </span>
                </div>
              ) : null}

              {/* No interview data at all in read mode */}
              {!editing &&
                !interviewAnswers.enjoyment &&
                !interviewAnswers.drewYouIn &&
                !interviewAnswers.readSimilar && (
                  <p className="text-xs text-slate-400 italic">
                    No taste-interview answers yet.
                  </p>
                )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</p>
            {editing ? (
              <textarea
                value={edit.notes}
                onChange={(e) => setEdit((s) => ({ ...s, notes: e.target.value }))}
                rows={4}
                placeholder="Your thoughts…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none placeholder-slate-300"
              />
            ) : book.notes ? (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {book.notes}
              </p>
            ) : (
              <p className="text-sm text-slate-300 italic">No notes added.</p>
            )}
          </div>
        </div>

        {/* ── Footer: actions ─────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-white">
          {/* Delete side */}
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <p className="text-xs text-rose-600 font-medium">Remove this book?</p>
                <button
                  onClick={handleDelete}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg transition font-medium"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-600 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>

          {/* Edit / save side */}
          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={() => { setEditing(false); setConfirmDelete(false); }}
                  className="text-xs text-slate-500 hover:text-slate-700 transition px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg transition font-medium"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-700 transition px-3 py-1.5"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

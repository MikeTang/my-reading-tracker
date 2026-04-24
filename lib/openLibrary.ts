// Thin wrapper around the Open Library Search API.
// No API key required. Rate-limit: be reasonable (1 request at a time is fine).

import { OpenLibraryBook, OpenLibrarySearchResponse } from "./types";

const BASE = "https://openlibrary.org/search.json";

export interface SearchParams {
  title: string;
  author?: string;
  limit?: number;
}

/**
 * Search Open Library by title with an optional author filter.
 * Returns up to `limit` (default 10) results.
 *
 * Edge case: if the network fails or OL returns an unexpected shape,
 * we throw so callers can show an error state rather than silent failure.
 */
export async function searchBooks(params: SearchParams): Promise<OpenLibraryBook[]> {
  const { title, author, limit = 10 } = params;

  if (!title.trim()) return [];

  const query = new URLSearchParams({
    title: title.trim(),
    limit: String(limit),
    fields: "key,title,author_name,first_publish_year,cover_i,subject,isbn",
  });

  if (author?.trim()) {
    query.set("author", author.trim());
  }

  const url = `${BASE}?${query.toString()}`;

  const res = await fetch(url, {
    // Abort after 10 s to avoid hanging forever
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Open Library returned ${res.status}`);
  }

  const json: OpenLibrarySearchResponse = await res.json();

  if (!Array.isArray(json.docs)) {
    throw new Error("Unexpected response shape from Open Library");
  }

  return json.docs;
}

export function coverUrl(coverId: number, size: "S" | "M" | "L" = "M"): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

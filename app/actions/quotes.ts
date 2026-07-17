"use server";

import {
  getQuoteById,
  listQuotes,
  type QuoteListItem,
  type QuoteRow,
} from "@/lib/crm/quotes";

export async function listQuotesAction(
  limit = 100,
): Promise<{ ok: true; quotes: QuoteListItem[] } | { ok: false; error: string }> {
  try {
    const quotes = await listQuotes(limit);

    return { ok: true, quotes };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load quotes.",
    };
  }
}

export async function getQuoteAction(
  id: number,
): Promise<
  | { ok: true; quote: QuoteRow }
  | { ok: false; error: string; notFound?: boolean }
> {
  try {
    const quote = await getQuoteById(id);

    if (!quote) {
      return { ok: false, error: `Quote ${id} not found.`, notFound: true };
    }

    return { ok: true, quote };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load quote.",
    };
  }
}
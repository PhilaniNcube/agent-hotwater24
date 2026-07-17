import { getQuoteById as rawGetQuoteById, type QuoteRow } from "./quotes";

export async function getCachedQuote(id: number): Promise<QuoteRow | null> {
  "use cache";
  return rawGetQuoteById(id);
}

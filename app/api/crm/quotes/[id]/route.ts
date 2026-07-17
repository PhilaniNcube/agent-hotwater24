import { NextResponse } from "next/server";
import { getQuoteById } from "@/lib/crm/quotes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const quoteId = parseInt(id, 10);
    
    if (isNaN(quoteId)) {
      return NextResponse.json({ ok: false, error: "Invalid quote ID" }, { status: 400 });
    }

    const quote = await getQuoteById(quoteId);
    
    if (!quote) {
      return NextResponse.json({ ok: false, error: `Quote ${quoteId} not found.` }, { status: 404 });
    }

    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load quote.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

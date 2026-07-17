import { NextResponse } from "next/server";
import { listQuotes } from "@/lib/crm/quotes";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    
    if (isNaN(limit)) {
      return NextResponse.json({ ok: false, error: "Invalid limit parameter" }, { status: 400 });
    }

    const quotes = await listQuotes(limit);
    return NextResponse.json({ ok: true, quotes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load quotes.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

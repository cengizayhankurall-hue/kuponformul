import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = 'https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=28/10/2026&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://arsiv.mackolik.com/Genis-Iddaa-Programi',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const text = await res.text();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      length: text.length,
      snippet: text.slice(0, 300)
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack
    });
  }
}

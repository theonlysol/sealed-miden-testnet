import { NextResponse } from 'next/server';

export async function GET() {
  const GIST_ID = process.env.GIST_ID || process.env.NEXT_PUBLIC_GIST_ID;
  try {
    const res = await fetch(
      `https://gist.githubusercontent.com/theonlysol/${GIST_ID}/raw/syndex-activity.json`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { participants: 0, updates: [], registrations: [] }
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

const MAX_UPDATES = 500;
const MAX_REGISTRATIONS = 500;

// Simple in-memory rate limiting counter
const requestLog: Map<string, number[]> = new Map();
const RATE_LIMIT = 10; // max 10 requests per minute
const WINDOW_MS = 60000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = requestLog.get(ip) || [];
  const recent = times.filter(t => now - t < WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function sanitizeText(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')  // strip HTML tags
    .replace(/[<>"'&]/g, '')  // strip dangerous chars
    .slice(0, 2000);           // enforce max length
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' }, { status: 429 }
      );
    }

    const body = await req.json();
    
    // 2. Input Validation — reject malformed payloads
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid payload' }, { status: 400 }
      );
    }
    if (body.updates?.length > MAX_UPDATES ||
        body.registrations?.length > MAX_REGISTRATIONS) {
      return NextResponse.json(
        { error: 'Payload exceeds maximum size' }, 
        { status: 400 }
      );
    }

    // 3. Sanitize all text fields before writing
    if (Array.isArray(body.updates)) {
      body.updates = body.updates.map((update: any) => {
        if (update && typeof update === 'object') {
          if (update.desc !== undefined) update.desc = sanitizeText(update.desc);
          if (update.description !== undefined) update.description = sanitizeText(update.description);
        }
        return update;
      });
    }
    if (Array.isArray(body.registrations)) {
      body.registrations = body.registrations.map((reg: any) => {
        if (reg && typeof reg === 'object') {
          if (reg.institutionName !== undefined) reg.institutionName = sanitizeText(reg.institutionName);
        }
        return reg;
      });
    }

    // Gist config
    const GIST_ID = process.env.GIST_ID || process.env.NEXT_PUBLIC_GIST_ID;
    const TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GIST_ID || !TOKEN) {
      console.error("Gist config missing. GIST_ID:", GIST_ID, "hasToken:", !!TOKEN);
      return NextResponse.json(
        { error: 'Server configuration missing GIST_ID or GITHUB_TOKEN' },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://api.github.com/gists/${GIST_ID}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          files: {
            'syndex-activity.json': {
              content: JSON.stringify(body, null, 2)
            }
          }
        })
      }
    );
    
    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 403 || res.status === 429) {
        console.warn('Gist rate limited, will retry on next submission. Status:', res.status, errText);
        return NextResponse.json({ success: true, rateLimited: true });
      }
      console.error("GitHub API patch failed:", res.status, errText);
      return NextResponse.json(
        { error: 'Gist update failed', status: res.status, details: errText },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message || err },
      { status: 500 }
    );
  }
}

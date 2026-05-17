/* eslint-disable @typescript-eslint/no-explicit-any */

function sanitize(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').slice(0, 2000);
}

export async function readSharedActivity() {
  try {
    const res = await fetch('/api/read-gist', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch raw activity: ${res.statusText}`);
    }
    return await res.json();
  } catch (e) {
    console.error("Failed to read shared activity:", e);
    return { participants: 0, updates: [], registrations: [] };
  }
}

export async function writeSharedActivity(
  type: 'REGISTER' | 'SUBMIT',
  data: Record<string, unknown>
) {
  if (typeof window !== 'undefined') {
    const lastWrite = localStorage.getItem('syndex_gist_last_write');
    const now = Date.now();
    if (lastWrite && now - parseInt(lastWrite) < 60000) {
      console.log('Gist write skipped - cooldown active');
      return;
    }
  }

  // Sanitize data values
  const sanitizedData: Record<string, any> = { ...data };
  
  if (sanitizedData.schema !== undefined) {
    sanitizedData.schema = sanitize(sanitizedData.schema);
  }
  if (sanitizedData.desc !== undefined) {
    sanitizedData.desc = sanitize(sanitizedData.desc);
  }
  if (sanitizedData.institutionName !== undefined) {
    sanitizedData.institutionName = sanitize(sanitizedData.institutionName);
  }
  if (sanitizedData.gradientHash !== undefined) {
    sanitizedData.gradientHash = sanitize(sanitizedData.gradientHash);
  }
  if (sanitizedData.institutionId !== undefined) {
    const parsed = parseInt(String(sanitizedData.institutionId), 10);
    sanitizedData.institutionId = isNaN(parsed) ? 0 : parsed;
  }

  try {
    const current = await readSharedActivity();
    
    if (type === 'REGISTER') {
      const exists = current.registrations.find(
        (r: any) => r.institutionId === sanitizedData.institutionId
      );
      if (!exists) {
        current.registrations.push({
          ...sanitizedData,
          timestamp: sanitizedData.timestamp || Date.now()
        });
        current.participants = current.registrations.length;
      }
    }
    
    if (type === 'SUBMIT') {
      const exists = current.updates.find(
        (u: any) => 
          (u.gradientHash && u.gradientHash === sanitizedData.gradientHash) || 
          (u.txId && u.txId === sanitizedData.txId)
      );
      if (!exists) {
        current.updates.push({
          ...sanitizedData,
          timestamp: sanitizedData.timestamp || Date.now()
        });
      }
    }
    
    const res = await fetch('/api/update-gist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current)
    });
    
    if (!res.ok) {
      console.error('Gist update failed:', await res.text());
    } else {
      const respData = await res.json().catch(() => ({}));
      if (respData.rateLimited) {
        console.warn('Gist rate limited, will retry on next submission');
      } else {
        console.log('Gist updated successfully:', type);
        if (typeof window !== 'undefined') {
          localStorage.setItem('syndex_gist_last_write', Date.now().toString());
        }
      }
    }
  } catch (e) {
    console.error('Shared store write failed:', e);
  }
}

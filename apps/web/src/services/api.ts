import { HardwareProfile, SEED_PROFILES } from '@exifguard/seed-profiles';

function buildUrl(endpoint: string): string {
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_API_URL;
  let base = (envUrl !== undefined && envUrl !== null && envUrl !== '') ? envUrl : '';

  if (base.endsWith('/api') && endpoint.startsWith('/api')) {
    base = base.slice(0, -4);
  } else if (base.endsWith('/api/') && endpoint.startsWith('/api')) {
    base = base.slice(0, -5);
  }

  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${cleanBase}${cleanEndpoint}`;
}

/**
 * Fetch all crowdsourced hardware profiles from the official database API.
 */
export async function fetchPublicProfiles(): Promise<HardwareProfile[]> {
  try {
    const url = buildUrl('/api/profiles');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
      return data.profiles;
    }
  } catch (err) {
    console.warn('Public Database API unavailable. Falling back to local seed profiles.', err);
  }
  return SEED_PROFILES;
}

/**
 * Submit an anonymized hardware profile to the central public database.
 */
export async function submitPublicProfile(profile: HardwareProfile): Promise<boolean> {
  try {
    const url = buildUrl('/api/profiles');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('Failed to publish profile to database:', err);
    return false;
  }
}

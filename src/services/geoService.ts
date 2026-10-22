export interface GeoData {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  org: string;
  ip: string;
}

// In-memory cache for IP lookups (cleared on restart, avoids rate limits)
const geoCache = new Map<string, { data: GeoData; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const isPrivateIp = (ip: string): boolean => {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '').trim();
  if (clean === '127.0.0.1' || clean === '::1' || clean === 'localhost') return true;
  if (clean.startsWith('10.') || clean.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(clean)) return true;
  return false;
};

// When in local development, fetch current public IP to test realistic location
let cachedPublicIp: string | null = null;
const getPublicIpForDev = async (): Promise<string | null> => {
  if (cachedPublicIp) return cachedPublicIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const json = (await res.json()) as { ip: string };
      cachedPublicIp = json.ip;
      return cachedPublicIp;
    }
  } catch (err) {
    // ignore
  }
  return null;
};

export const lookupIpGeo = async (clientIp: string): Promise<GeoData> => {
  let targetIp = clientIp.replace(/^::ffff:/, '').trim();

  // If local / loopback IP, resolve public IP for local testing fidelity
  if (isPrivateIp(targetIp)) {
    const pub = await getPublicIpForDev();
    if (pub) {
      targetIp = pub;
    }
  }

  // Check cache
  const cached = geoCache.get(targetIp);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Default fallback if all providers fail
  const fallback: GeoData = {
    country: 'Unknown',
    countryCode: 'XX',
    region: 'Unknown',
    city: 'Unknown',
    postalCode: '',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
    isp: 'Local / Private Network',
    org: 'Private Network',
    ip: targetIp,
  };

  // If still private IP and no public IP found
  if (isPrivateIp(targetIp)) {
    return fallback;
  }

  // Primary Provider: ip-api.com
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(targetIp)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.status === 'success') {
        const result: GeoData = {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'XX',
          region: data.regionName || data.region || 'Unknown',
          city: data.city || 'Unknown',
          postalCode: data.zip || '',
          latitude: Number(data.lat) || 0,
          longitude: Number(data.lon) || 0,
          timezone: data.timezone || 'UTC',
          isp: data.isp || 'Unknown',
          org: data.org || data.as || 'Unknown',
          ip: targetIp,
        };
        geoCache.set(targetIp, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
      }
    }
  } catch (err) {
    console.warn(`[GeoService] Primary lookup failed for ${targetIp}:`, (err as Error).message);
  }

  // Secondary Provider Fallback: ipapi.co
  try {
    const res2 = await fetch(`https://ipapi.co/${encodeURIComponent(targetIp)}/json/`, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'devAltec-VisitorAnalytics/1.0' },
    });
    if (res2.ok) {
      const d = (await res2.json()) as any;
      if (!d.error && d.country_name) {
        const result: GeoData = {
          country: d.country_name || 'Unknown',
          countryCode: d.country_code || 'XX',
          region: d.region || 'Unknown',
          city: d.city || 'Unknown',
          postalCode: d.postal || '',
          latitude: Number(d.latitude) || 0,
          longitude: Number(d.longitude) || 0,
          timezone: d.timezone || 'UTC',
          isp: d.org || 'Unknown',
          org: d.org || 'Unknown',
          ip: targetIp,
        };
        geoCache.set(targetIp, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
      }
    }
  } catch (err2) {
    console.warn(`[GeoService] Fallback lookup failed for ${targetIp}:`, (err2 as Error).message);
  }

  return fallback;
};

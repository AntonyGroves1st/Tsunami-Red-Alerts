import AsyncStorage from '@react-native-async-storage/async-storage';

const GEO_CACHE_KEY = 'emperial_geo_check';
const GEO_CACHE_TTL = 60 * 60 * 1000;
const BLOCKED_COUNTRIES = ['GB', 'UK', 'RU', 'CN', 'KP', 'IR', 'CU', 'SY', 'VE'];
const ALLOWED_COUNTRY = 'US';

interface GeoResult {
  allowed: boolean;
  country: string;
  countryName: string;
  reason?: string;
}

interface CachedGeo {
  result: GeoResult;
  timestamp: number;
}

export async function checkGeoRestriction(): Promise<GeoResult> {
  try {
    const cached = await AsyncStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const parsed: CachedGeo = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < GEO_CACHE_TTL) {
        console.log('[Geo] Using cached geo result:', parsed.result.country);
        return parsed.result;
      }
    }
  } catch {
    console.log('[Geo] Cache read failed');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.log('[Geo] API response not ok, allowing access by default');
      return { allowed: true, country: 'US', countryName: 'United States' };
    }

    const data = await response.json();
    const countryCode = (data.country_code || data.country || '').toUpperCase();
    const countryName = data.country_name || countryCode;

    console.log('[Geo] Detected country:', countryCode, countryName);

    const result: GeoResult = {
      allowed: countryCode === ALLOWED_COUNTRY,
      country: countryCode,
      countryName,
      reason: countryCode !== ALLOWED_COUNTRY
        ? `Access restricted. Emperial Bot is currently available only within the United States. Your detected location: ${countryName}. If you believe this is an error, contact support@emperialbot.com.`
        : undefined,
    };

    try {
      const cacheData: CachedGeo = { result, timestamp: Date.now() };
      await AsyncStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cacheData));
    } catch {
      console.log('[Geo] Cache write failed');
    }

    return result;
  } catch (err) {
    console.log('[Geo] Geo check failed, allowing access:', err);
    return { allowed: true, country: 'US', countryName: 'United States' };
  }
}

export async function clearGeoCache(): Promise<void> {
  await AsyncStorage.removeItem(GEO_CACHE_KEY);
}

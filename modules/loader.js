/**
 * modules/loader.js
 * 统一数据加载接口
 */

const cache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the loadJSON cache. Exported for testing.
 */
export function clearCache() {
  for (const key of Object.keys(cache)) {
    delete cache[key];
  }
}

/**
 * Normalize URL for use as cache key: strip query params and resolve relative paths.
 */
function normalizeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    // Strip query string and hash
    return parsed.pathname;
  } catch {
    // Fallback for relative paths: remove query string manually
    return url.split('?')[0].split('#')[0];
  }
}

/**
 * Validate that URL is a safe, same-origin relative path.
 * Only allows paths starting with ./ or /
 */
function isValidUrl(url) {
  return typeof url === 'string' && (url.startsWith('./') || url.startsWith('/'));
}

export async function loadJSON(url) {
  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL: ${url} — only relative paths starting with ./ or / are allowed`);
  }

  const cacheKey = normalizeUrl(url);
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  const data = await response.json();
  cache[cacheKey] = { data, timestamp: Date.now() };
  return data;
}

export async function loadTypes() {
  return loadJSON('./data/types.json');
}

export async function loadQuestions() {
  return loadJSON('./data/questions.json');
}

export async function loadRestaurants() {
  try {
    return await loadJSON('./data/restaurants.json');
  } catch (e) {
    console.warn('[FBTI] loadRestaurants failed, returning {}:', e instanceof Error ? e.message : String(e));
    return {};
  }
}

export async function loadRestaurantSettings() {
  try {
    return await loadJSON('./data/restaurant-settings.json');
  } catch (e) {
    console.warn('[FBTI] loadRestaurantSettings failed, returning defaults:', e instanceof Error ? e.message : String(e));
    return Object.assign({}, { maxPerType: 5 });
  }
}

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

/**
 * Fetch restaurants for a given category from the API.
 * @param {string} category - The taste type category code (e.g. 'HUAE')
 * @returns {Promise<{ok: boolean, data: Array, count: number, maxPerType: number}>}
 */
export async function fetchRestaurants(category) {
  const url = `./api/restaurants.php?category=${encodeURIComponent(category)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

/**
 * Submit a new restaurant recommendation.
 * @param {string} category - The taste type category code
 * @param {string} name - Restaurant name
 * @param {string} [by] - Submitter name, defaults to '匿名'
 * @returns {Promise<{ok: boolean, message?: string, res_id?: number, error?: string}>}
 */
export async function submitRestaurant(category, name, by) {
  const response = await fetch('./api/restaurants.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, name, by: by || '匿名' })
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

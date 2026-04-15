/**
 * tests/test_loader_api.js
 * TDD tests for modules/loader.js API functions (fetchRestaurants, submitRestaurant)
 *
 * Uses Node.js built-in test runner (node --test).
 * Mocks globalThis.fetch for API calls.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const originalFetch = globalThis.fetch;

describe('fetchRestaurants', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns parsed JSON from the API endpoint', async () => {
    const mockData = {
      ok: true,
      data: [
        { id: 1, name: '鼎泰丰', by: '小王', date: '2026-04-14' },
        { id: 2, name: '避风港', by: '小李', date: '2026-04-13' },
      ],
      count: 2,
      maxPerType: 5,
    };
    globalThis.fetch = async (url) => {
      assert.ok(url.includes('./api/restaurants.php'), 'should call restaurants.php');
      assert.ok(url.includes('category=HUAE'), 'should encode category in query');
      return { ok: true, json: async () => mockData };
    };

    const { fetchRestaurants } = await import('../modules/loader.js');
    const result = await fetchRestaurants('HUAE');

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.count, 2);
    assert.strictEqual(result.data[0].name, '鼎泰丰');
  });

  it('encodes category parameter properly', async () => {
    globalThis.fetch = async (url) => {
      assert.ok(url.includes('category=%E4%B8%AD%E5%9B%BD'), 'should URL-encode Chinese category');
      return { ok: true, json: async () => ({ ok: true, data: [], count: 0, maxPerType: 5 }) };
    };

    const { fetchRestaurants } = await import('../modules/loader.js');
    await fetchRestaurants('中国');
  });

  it('throws error when API returns non-ok response', async () => {
    globalThis.fetch = async (url) => {
      return { ok: false, status: 500 };
    };

    const { fetchRestaurants } = await import('../modules/loader.js');
    await assert.rejects(
      async () => await fetchRestaurants('HUAE'),
      /API error: 500/
    );
  });

  it('throws error when fetch fails', async () => {
    globalThis.fetch = async (url) => {
      throw new Error('network failure');
    };

    const { fetchRestaurants } = await import('../modules/loader.js');
    await assert.rejects(
      async () => await fetchRestaurants('HUAE'),
      /network failure/
    );
  });
});

describe('submitRestaurant', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns parsed JSON response from POST to api/restaurants.php', async () => {
    const mockResponse = { ok: true, message: 'added', res_id: 42 };
    globalThis.fetch = async (url, options) => {
      assert.ok(url.includes('./api/restaurants.php'), 'should POST to restaurants.php');
      assert.strictEqual(options.method, 'POST', 'should use POST method');
      assert.strictEqual(options.headers['Content-Type'], 'application/json', 'should set JSON content-type');
      const body = JSON.parse(options.body);
      assert.strictEqual(body.category, 'HUAE');
      assert.strictEqual(body.name, '测试餐厅');
      assert.strictEqual(body.by, '小王');
      return { ok: true, json: async () => mockResponse };
    };

    const { submitRestaurant } = await import('../modules/loader.js');
    const result = await submitRestaurant('HUAE', '测试餐厅', '小王');

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.res_id, 42);
  });

  it('defaults by to 匿名 when not provided', async () => {
    globalThis.fetch = async (url, options) => {
      const body = JSON.parse(options.body);
      assert.strictEqual(body.by, '匿名', 'should default by to 匿名');
      return { ok: true, json: async () => ({ ok: true, res_id: 1 }) };
    };

    const { submitRestaurant } = await import('../modules/loader.js');
    await submitRestaurant('HUAE', '测试餐厅');
  });

  it('returns error response when API returns { ok: false }', async () => {
    const mockError = { ok: false, error: 'validation_error', message: 'name required' };
    globalThis.fetch = async (url, options) => {
      return { ok: true, json: async () => mockError };
    };

    const { submitRestaurant } = await import('../modules/loader.js');
    const result = await submitRestaurant('HUAE', '', '小王');

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.error, 'validation_error');
  });

  it('throws when fetch throws', async () => {
    globalThis.fetch = async (url, options) => {
      throw new Error('connection refused');
    };

    const { submitRestaurant } = await import('../modules/loader.js');
    await assert.rejects(
      async () => await submitRestaurant('HUAE', '测试餐厅', '小王'),
      /connection refused/
    );
  });
});

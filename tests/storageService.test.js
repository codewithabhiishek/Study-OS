import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeUserId,
  getScopedKey,
  getLuffyCacheKey,
  createScopedStorage,
  OFFLINE_QUEUE_KEY,
  SETTINGS_KEY,
  TIMER_STATE_KEY,
  LUFFY_CACHE_KEY,
} from '../src/lib/storageService.js';

describe('storageService unit tests', () => {
  const originalLocalStorage = globalThis.localStorage;
  let mockStore = new Map();

  beforeEach(() => {
    mockStore.clear();
    globalThis.localStorage = {
      getItem: (key) => mockStore.get(key) ?? null,
      setItem: (key, val) => mockStore.set(key, String(val)),
      removeItem: (key) => mockStore.delete(key),
      clear: () => mockStore.clear(),
      get length() {
        return mockStore.size;
      },
      key: (idx) => Array.from(mockStore.keys())[idx] ?? null,
    };
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  describe('sanitizeUserId', () => {
    test('returns "anon" for empty or non-string values', () => {
      assert.strictEqual(sanitizeUserId(null), 'anon');
      assert.strictEqual(sanitizeUserId(undefined), 'anon');
      assert.strictEqual(sanitizeUserId(''), 'anon');
      assert.strictEqual(sanitizeUserId('   '), 'anon');
      assert.strictEqual(sanitizeUserId(123), 'anon');
    });

    test('trims and replaces illegal characters with underscores', () => {
      assert.strictEqual(sanitizeUserId('  user@email.com!  '), 'user_email_com_');
      assert.strictEqual(sanitizeUserId('student#42$'), 'student_42_');
      assert.strictEqual(sanitizeUserId('valid-user_01'), 'valid-user_01');
    });

    test('truncates user IDs longer than 64 characters', () => {
      const longId = 'a'.repeat(100);
      assert.strictEqual(sanitizeUserId(longId).length, 64);
    });
  });

  describe('getScopedKey & getLuffyCacheKey', () => {
    test('scopes keys to sanitized user IDs', () => {
      const keyA = getScopedKey(SETTINGS_KEY, 'usr_a');
      const keyB = getScopedKey(SETTINGS_KEY, 'usr_b');
      const keyAnon = getScopedKey(SETTINGS_KEY, null);

      assert.strictEqual(keyA, `${SETTINGS_KEY}.usr_a`);
      assert.strictEqual(keyB, `${SETTINGS_KEY}.usr_b`);
      assert.strictEqual(keyAnon, `${SETTINGS_KEY}.anon`);
    });

    test('generates isolated daily luffy cache keys', () => {
      const cacheA = getLuffyCacheKey('usr_a', '2026-11-14');
      const cacheB = getLuffyCacheKey('usr_b', '2026-11-14');
      const cacheAnon = getLuffyCacheKey(null, '2026-11-14');

      assert.strictEqual(cacheA, `${LUFFY_CACHE_KEY}.usr_a.2026-11-14`);
      assert.strictEqual(cacheB, `${LUFFY_CACHE_KEY}.usr_b.2026-11-14`);
      assert.strictEqual(cacheAnon, `${LUFFY_CACHE_KEY}.anon.2026-11-14`);
      assert.notStrictEqual(cacheA, cacheB);
    });
  });

  describe('createScopedStorage adapter', () => {
    test('isolates reads and writes between distinct users', () => {
      const storageA = createScopedStorage('alice');
      const storageB = createScopedStorage('bob');

      storageA.setItem(SETTINGS_KEY, { pomodoro: true, minutes: 25 });
      storageB.setItem(SETTINGS_KEY, { pomodoro: false, minutes: 50 });

      const loadedA = JSON.parse(storageA.getItem(SETTINGS_KEY));
      const loadedB = JSON.parse(storageB.getItem(SETTINGS_KEY));

      assert.strictEqual(loadedA.pomodoro, true);
      assert.strictEqual(loadedA.minutes, 25);
      assert.strictEqual(loadedB.pomodoro, false);
      assert.strictEqual(loadedB.minutes, 50);
    });

    test('removeItem removes only the targeted user key', () => {
      const storageA = createScopedStorage('alice');
      const storageB = createScopedStorage('bob');

      storageA.setItem(TIMER_STATE_KEY, { running: true });
      storageB.setItem(TIMER_STATE_KEY, { running: false });

      storageA.removeItem(TIMER_STATE_KEY);

      assert.strictEqual(storageA.getItem(TIMER_STATE_KEY), null);
      assert.notStrictEqual(storageB.getItem(TIMER_STATE_KEY), null);
    });

    test('clearUserData purges all keys for this user without affecting others', () => {
      const storageA = createScopedStorage('alice');
      const storageB = createScopedStorage('bob');

      storageA.setItem(SETTINGS_KEY, 'settingsA');
      storageA.setItem(TIMER_STATE_KEY, 'timerA');
      storageA.setItem(OFFLINE_QUEUE_KEY, 'queueA');

      storageB.setItem(SETTINGS_KEY, 'settingsB');
      storageB.setItem(TIMER_STATE_KEY, 'timerB');

      const cleared = storageA.clearUserData();
      assert.strictEqual(cleared, 3);

      assert.strictEqual(storageA.getItem(SETTINGS_KEY), null);
      assert.strictEqual(storageA.getItem(TIMER_STATE_KEY), null);
      assert.strictEqual(storageA.getItem(OFFLINE_QUEUE_KEY), null);

      assert.strictEqual(storageB.getItem(SETTINGS_KEY), 'settingsB');
      assert.strictEqual(storageB.getItem(TIMER_STATE_KEY), 'timerB');
    });

    test('handles SSR gracefully when localStorage is undefined', () => {
      delete globalThis.localStorage;
      const storage = createScopedStorage('test_user');

      assert.doesNotThrow(() => {
        assert.strictEqual(storage.getItem('any'), null);
        storage.setItem('any', 'value');
        storage.removeItem('any');
        assert.strictEqual(storage.clearUserData(), 0);
      });
    });
  });
});


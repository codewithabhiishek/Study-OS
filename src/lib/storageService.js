/**
 * storageService.js
 * Multi-user and multi-session scoped storage engine for StudyOS.
 * Ensures complete data segregation between users and guest sessions.
 */

export const OFFLINE_QUEUE_KEY = 'studyos.focus.offline_queue.v1';
export const SETTINGS_KEY = 'studyos.focus.settings.v1';
export const TIMER_STATE_KEY = 'studyos.focus.timer.v1';
export const LUFFY_CACHE_KEY = 'studyos.luffy.motivation.v1';

/**
 * Sanitizes a userId string to prevent storage key injection.
 * @param {string|null|undefined} userId
 * @returns {string}
 */
export function sanitizeUserId(userId) {
  if (!userId || typeof userId !== 'string') return 'anon';
  const clean = userId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return clean || 'anon';
}

/**
 * Returns a storage key strictly scoped to a specific user.
 * @param {string} baseKey
 * @param {string|null|undefined} userId
 * @returns {string}
 */
export function getScopedKey(baseKey, userId) {
  const safeId = sanitizeUserId(userId);
  return `${baseKey}.${safeId}`;
}

/**
 * Returns a cache key for daily motivational companion messages.
 * @param {string|null|undefined} userId
 * @param {string} date
 * @returns {string}
 */
export function getLuffyCacheKey(userId, date) {
  const safeId = sanitizeUserId(userId);
  return `${LUFFY_CACHE_KEY}.${safeId}.${date}`;
}

/**
 * Drop-in scoped storage adapter for user-specific operations.
 * @param {string|null|undefined} userId
 */
export function createScopedStorage(userId) {
  const safeId = sanitizeUserId(userId);

  return {
    userId: safeId,
    getItem(baseKey) {
      if (typeof localStorage === 'undefined') return null;
      try {
        return localStorage.getItem(getScopedKey(baseKey, safeId));
      } catch {
        return null;
      }
    },
    setItem(baseKey, value) {
      if (typeof localStorage === 'undefined') return;
      try {
        const str = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(getScopedKey(baseKey, safeId), str);
      } catch (err) {
        console.warn('Storage setItem failed:', err);
      }
    },
    removeItem(baseKey) {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.removeItem(getScopedKey(baseKey, safeId));
      } catch {
        // ignore
      }
    },
    clearUserData() {
      if (typeof localStorage === 'undefined') return 0;
      try {
        let cleared = 0;
        const keysToRemove = [];
        const suffix = `.${safeId}`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.endsWith(suffix) && key.startsWith('studyos.')) {
            keysToRemove.push(key);
          }
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k);
          cleared++;
        }
        return cleared;
      } catch {
        return 0;
      }
    },
  };
}


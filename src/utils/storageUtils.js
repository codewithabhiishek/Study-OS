/**
 * Utility functions for user-scoped storage in StudyOS.
 * Prevents cross-account data leaks, cache collisions, and timer mismatches.
 */

export {
  OFFLINE_QUEUE_KEY,
  SETTINGS_KEY,
  TIMER_STATE_KEY,
  LUFFY_CACHE_KEY,
  sanitizeUserId,
  getScopedKey,
  getLuffyCacheKey,
  createScopedStorage,
} from '../lib/storageService.js';

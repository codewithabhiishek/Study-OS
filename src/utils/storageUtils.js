/**
 * Utility functions for user-scoped storage in StudyOS.
 * Prevents cross-account data leaks, cache collisions, and timer mismatches.
 */

export const OFFLINE_QUEUE_KEY = 'studyos.focus.offline_queue.v1';
export const SETTINGS_KEY = 'studyos.focus.settings.v1';
export const TIMER_STATE_KEY = 'studyos.focus.timer.v1';

/**
 * Returns a storage key scoped to a specific user.
 * @param {string} baseKey 
 * @param {string|null|undefined} userId 
 * @returns {string}
 */
export function getScopedKey(baseKey, userId) {
  if (typeof userId === 'string' && userId.trim()) {
    return `${baseKey}.${userId.trim()}`;
  }
  return `${baseKey}.anon`;
}

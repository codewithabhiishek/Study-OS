/**
 * hapticsService.js
 * SSR-safe tactile haptic feedback engine for StudyOS.
 * Wraps navigator.vibrate with named patterns for task completions, focus sessions, and navigation.
 */

export const HAPTIC_PATTERNS = {
  tap: 8,
  select: 12,
  correct: [15, 50, 20],
  wrong: [20, 40, 20],
  streak: [15, 60, 25],
  complete: [25, 20, 25, 20, 40],
  delete: [25, 45, 30],
  error: [35, 50, 35],
};

/**
 * Triggers a vibration pattern if supported by the client browser/hardware.
 * Accepts a named pattern key, duration in ms, or pattern array.
 * Silently no-ops in SSR or unsupported environments.
 * @param {keyof typeof HAPTIC_PATTERNS | number | number[]} typeOrDuration
 */
export function triggerHaptic(typeOrDuration = 15) {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      if (typeof typeOrDuration === 'string' && HAPTIC_PATTERNS[typeOrDuration]) {
        navigator.vibrate(HAPTIC_PATTERNS[typeOrDuration]);
      } else if (typeof typeOrDuration === 'number' && typeOrDuration > 0) {
        navigator.vibrate(typeOrDuration);
      } else if (Array.isArray(typeOrDuration)) {
        navigator.vibrate(typeOrDuration);
      }
    } catch {
      // Ignore vibration errors on unsupported hardware
    }
  }
}

/** Convenience object with semantic haptic triggers */
export const haptics = {
  tap: () => triggerHaptic('tap'),
  select: () => triggerHaptic('select'),
  correct: () => triggerHaptic('correct'),
  wrong: () => triggerHaptic('wrong'),
  streak: () => triggerHaptic('streak'),
  complete: () => triggerHaptic('complete'),
  delete: () => triggerHaptic('delete'),
  error: () => triggerHaptic('error'),
};

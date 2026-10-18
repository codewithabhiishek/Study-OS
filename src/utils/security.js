/**
 * Strix Defensive Security Controls & Mobile Ergonomics for StudyOS
 */

/* eslint-disable no-control-regex */

/**
 * Sanitizes plain text inputs: strips HTML tags, control characters, and enforces length bounds.
 */
export function sanitizeInput(text, maxLength = 254) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates bot submissions using dual honeypot traps and speed-trap analysis.
 */
export function isBotSubmission({ botcheck, gotcha, loadTime, submitTime }) {
  if (botcheck === true || botcheck === 'true' || botcheck === '1' || botcheck === 'on') return true;
  if (typeof gotcha === 'string' && gotcha.trim().length > 0) return true;
  if (typeof submitTime === 'number' && typeof loadTime === 'number') {
    if (submitTime - loadTime < 1800) return true; // Speed trap (< 1.8s)
  }
  return false;
}

/**
 * Safe mobile tactile haptic feedback utilizing navigator.vibrate
 */
export function triggerHaptic(duration = 15) {
  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignore vibration errors on unsupported hardware
    }
  }
}

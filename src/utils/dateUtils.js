/**
 * Date and timezone utilities for StudyOS.
 * Provides safe local date parsing and resilient countdown calculations.
 */

/**
 * Parses a date string or Date object into a local Date representing midnight (00:00:00.000).
 * Prevents timezone shifting and invalid time value errors with ISO strings.
 * 
 * @param {string|Date|number|null|undefined} dateInput 
 * @returns {Date}
 */
export function parseLocalDate(dateInput) {
  if (!dateInput) return new Date(0);

  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date(0) : dateInput;
  }

  const str = String(dateInput).trim();
  if (!str) return new Date(0);

  // If starts with YYYY-MM-DD or contains date portion
  const datePart = str.split('T')[0].split(' ')[0];
  const parts = datePart.split('-').map(Number);

  if (parts.length === 3 && parts.every((n) => !isNaN(n) && Number.isFinite(n))) {
    const [year, month, day] = parts;
    const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    return isNaN(localDate.getTime()) ? new Date(0) : localDate;
  }

  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

/**
 * Parses a deadline or target date into a local Date targeting the end of that day (23:59:59.999).
 * 
 * @param {string|Date|number|null|undefined} targetDate
 * @returns {Date|null}
 */
export function parseTargetDate(targetDate) {
  if (!targetDate) return null;

  if (targetDate instanceof Date) {
    return isNaN(targetDate.getTime()) ? null : targetDate;
  }

  const str = String(targetDate).trim();
  if (!str) return null;

  const datePart = str.split('T')[0].split(' ')[0];
  const parts = datePart.split('-').map(Number);

  if (parts.length === 3 && parts.every((n) => !isNaN(n) && Number.isFinite(n))) {
    const [year, month, day] = parts;
    const target = new Date(year, month - 1, day, 23, 59, 59, 999);
    return isNaN(target.getTime()) ? null : target;
  }

  const parsed = new Date(targetDate);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Computes remaining time until a target deadline.
 * Resilient against invalid dates, expired targets, and NaN calculations.
 * 
 * @param {string|Date|number|null|undefined} targetDate
 * @returns {{ expired: boolean, days: number, hours: number, minutes: number, seconds: number }}
 */
export function calculateTimeRemaining(targetDate) {
  const target = parseTargetDate(targetDate);
  if (!target || isNaN(target.getTime())) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    expired: false,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

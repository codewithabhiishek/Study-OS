import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { format } from 'date-fns';
import {
  parseLocalDate,
  parseTargetDate,
  calculateTimeRemaining,
} from '../src/utils/dateUtils.js';

describe('dateUtils unit tests', () => {
  describe('parseLocalDate', () => {
    test('safely handles standard YYYY-MM-DD date strings', () => {
      const d = parseLocalDate('2026-11-25');
      assert.strictEqual(d.getFullYear(), 2026);
      assert.strictEqual(d.getMonth(), 10); // 0-indexed November
      assert.strictEqual(d.getDate(), 25);
      assert.strictEqual(d.getHours(), 0);
      assert.strictEqual(d.getMinutes(), 0);
      assert.strictEqual(d.getSeconds(), 0);
    });

    test('safely parses ISO timestamp strings without invalid time value crash', () => {
      const isoStr = '2026-11-25T14:22:47.000Z';
      const d = parseLocalDate(isoStr);
      assert.strictEqual(d.getFullYear(), 2026);
      assert.strictEqual(d.getMonth(), 10);
      assert.strictEqual(d.getDate(), 25);
      
      // Integration check: date-fns format must not throw RangeError
      assert.doesNotThrow(() => {
        const formatted = format(d, 'MMM d, yyyy');
        assert.strictEqual(formatted, 'Nov 25, 2026');
      });
    });

    test('handles date strings with spaces and time suffixes', () => {
      const d = parseLocalDate('2026-11-25 09:30:00');
      assert.strictEqual(d.getFullYear(), 2026);
      assert.strictEqual(d.getMonth(), 10);
      assert.strictEqual(d.getDate(), 25);
    });

    test('handles null, empty, and invalid dates gracefully without throwing', () => {
      const nullDate = parseLocalDate(null);
      assert.ok(nullDate instanceof Date);
      assert.strictEqual(nullDate.getTime(), 0);

      const emptyDate = parseLocalDate('');
      assert.ok(emptyDate instanceof Date);
      assert.strictEqual(emptyDate.getTime(), 0);

      const invalidDate = parseLocalDate('not-a-real-date');
      assert.ok(invalidDate instanceof Date);
      assert.strictEqual(invalidDate.getTime(), 0);
    });

    test('passes through existing Date objects safely', () => {
      const input = new Date(2026, 5, 15);
      const output = parseLocalDate(input);
      assert.strictEqual(output.getTime(), input.getTime());
    });
  });

  describe('parseTargetDate', () => {
    test('targets 23:59:59.999 local time for deadline dates', () => {
      const target = parseTargetDate('2026-12-31');
      assert.ok(target instanceof Date);
      assert.strictEqual(target.getFullYear(), 2026);
      assert.strictEqual(target.getMonth(), 11);
      assert.strictEqual(target.getDate(), 31);
      assert.strictEqual(target.getHours(), 23);
      assert.strictEqual(target.getMinutes(), 59);
      assert.strictEqual(target.getSeconds(), 59);
    });

    test('returns null for null, empty, or invalid target inputs', () => {
      assert.strictEqual(parseTargetDate(null), null);
      assert.strictEqual(parseTargetDate(''), null);
      assert.strictEqual(parseTargetDate('invalid-date-string'), null);
    });
  });

  describe('calculateTimeRemaining', () => {
    test('returns expired: true and zeroed values for past dates', () => {
      const past = calculateTimeRemaining('2020-01-01');
      assert.strictEqual(past.expired, true);
      assert.strictEqual(past.days, 0);
      assert.strictEqual(past.hours, 0);
      assert.strictEqual(past.minutes, 0);
      assert.strictEqual(past.seconds, 0);
    });

    test('returns expired: true and zeroed values for null/invalid dates (never NaN)', () => {
      const res = calculateTimeRemaining(null);
      assert.strictEqual(res.expired, true);
      assert.strictEqual(isNaN(res.days), false);
      assert.strictEqual(isNaN(res.hours), false);
      assert.strictEqual(isNaN(res.minutes), false);
      assert.strictEqual(isNaN(res.seconds), false);
    });

    test('accurately calculates countdown for future dates', () => {
      const futureDate = new Date(Date.now() + 2 * 86400000 + 3 * 3600000 + 10 * 60000);
      const res = calculateTimeRemaining(futureDate);
      assert.strictEqual(res.expired, false);
      assert.strictEqual(res.days, 2);
      assert.strictEqual(res.hours, 3);
      assert.ok(res.minutes >= 9 && res.minutes <= 10);
    });
  });
});

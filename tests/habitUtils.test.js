import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStreak } from '../src/utils/habitUtils.js';

const getLocalDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

test('calculateStreak returns 0 for empty or invalid inputs', () => {
  assert.equal(calculateStreak(null), 0);
  assert.equal(calculateStreak(undefined), 0);
  assert.equal(calculateStreak([]), 0);
  assert.equal(calculateStreak("2026-03-20"), 0);
  assert.equal(calculateStreak({}), 0);
});

test('calculateStreak returns 0 if neither today nor yesterday was completed', () => {
  const twoDaysAgo = getLocalDate(2);
  const threeDaysAgo = getLocalDate(3);
  assert.equal(calculateStreak([twoDaysAgo, threeDaysAgo]), 0);
});

test('calculateStreak counts streak when completed today', () => {
  const today = getLocalDate(0);
  const yesterday = getLocalDate(1);
  const twoDaysAgo = getLocalDate(2);

  assert.equal(calculateStreak([today]), 1);
  assert.equal(calculateStreak([today, yesterday]), 2);
  assert.equal(calculateStreak([today, yesterday, twoDaysAgo]), 3);
});

test('calculateStreak maintains streak if completed yesterday but not yet today', () => {
  const yesterday = getLocalDate(1);
  const twoDaysAgo = getLocalDate(2);
  const threeDaysAgo = getLocalDate(3);

  assert.equal(calculateStreak([yesterday]), 1);
  assert.equal(calculateStreak([yesterday, twoDaysAgo]), 2);
  assert.equal(calculateStreak([yesterday, twoDaysAgo, threeDaysAgo]), 3);
});

test('calculateStreak handles duplicate dates and ISO timestamp strings safely', () => {
  const today = getLocalDate(0);
  const yesterday = getLocalDate(1);

  // Duplicates should not increase count
  assert.equal(calculateStreak([today, today, today]), 1);

  // Full ISO strings
  const todayIso = `${today}T14:30:00.000Z`;
  const yesterdayIso = `${yesterday}T09:15:00.000Z`;
  assert.equal(calculateStreak([todayIso, yesterdayIso]), 2);
});

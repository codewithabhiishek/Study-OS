import test from 'node:test';
import assert from 'node:assert/strict';
import { createPageUrl } from '../src/utils/index.ts';

test('createPageUrl converts page titles into hyphenated URL paths', () => {
  assert.equal(createPageUrl('dashboard'), '/dashboard');
  assert.equal(createPageUrl('today focus'), '/today-focus');
  assert.equal(createPageUrl('Exam Review Session'), '/Exam-Review-Session');
});

test('createPageUrl gracefully handles invalid or non-string inputs', () => {
  assert.equal(createPageUrl(''), '/');
  assert.equal(createPageUrl(null), '/');
  assert.equal(createPageUrl(undefined), '/');
  assert.equal(createPageUrl(123), '/');
  assert.equal(createPageUrl({}), '/');
});

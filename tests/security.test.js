/* eslint-disable no-control-regex */
import test from 'node:test';
import assert from 'node:assert/strict';

// Helper simulating Strix form defense logic
function isBotSubmission({ botcheck, gotcha, loadTime, submitTime }) {
  if (botcheck === true) return true;
  if (gotcha && gotcha.trim().length > 0) return true;
  if (submitTime - loadTime < 1800) return true; // Speed trap (< 1.8s)
  return false;
}

function sanitizeInput(text, maxLength = 254) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

test('isBotSubmission flags hidden honeypot fields', () => {
  // Legitimate human submission
  assert.equal(
    isBotSubmission({
      botcheck: false,
      gotcha: '',
      loadTime: 1000,
      submitTime: 4500, // 3.5s later
    }),
    false
  );

  // Bot filled hidden checkbox
  assert.equal(
    isBotSubmission({
      botcheck: true,
      gotcha: '',
      loadTime: 1000,
      submitTime: 5000,
    }),
    true
  );

  // Bot filled decoy input
  assert.equal(
    isBotSubmission({
      botcheck: false,
      gotcha: 'http://spam.org',
      loadTime: 1000,
      submitTime: 5000,
    }),
    true
  );
});

test('isBotSubmission flags automated speed-trap submissions (< 1.8s)', () => {
  assert.equal(
    isBotSubmission({
      botcheck: false,
      gotcha: '',
      loadTime: 1000,
      submitTime: 2200, // 1.2s -> bot
    }),
    true
  );

  assert.equal(
    isBotSubmission({
      botcheck: false,
      gotcha: '',
      loadTime: 1000,
      submitTime: 2800, // Exactly 1.8s -> human threshold passed
    }),
    false
  );
});

test('sanitizeInput strips tags and control characters while enforcing bounds', () => {
  const xss = '<script>alert("hack")</script>user@example.com';
  assert.equal(sanitizeInput(xss), 'alert("hack")user@example.com');

  const controlChars = 'admin\x00\x1F@school.edu';
  assert.equal(sanitizeInput(controlChars), 'admin@school.edu');

  const longEmail = 'a'.repeat(300) + '@domain.com';
  assert.equal(sanitizeInput(longEmail, 254).length, 254);
});

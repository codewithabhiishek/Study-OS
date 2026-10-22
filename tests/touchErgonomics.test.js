import test from 'node:test';
import assert from 'node:assert/strict';
import { triggerHaptic, sanitizeInput } from '../src/utils/security.js';

test('triggerHaptic executes gracefully without error in any environment', () => {
  assert.doesNotThrow(() => {
    triggerHaptic(10);
    triggerHaptic(0);
    triggerHaptic(-5);
    triggerHaptic(null);
    triggerHaptic(undefined);
  });
});

test('sanitizeInput handles multi-device touch text payloads safely', () => {
  const clean = sanitizeInput('  Deep Work: Math 101 \n\t ');
  assert.equal(clean, 'Deep Work: Math 101');

  const empty = sanitizeInput(null);
  assert.equal(empty, '');

  const overflow = 'a'.repeat(400);
  assert.equal(sanitizeInput(overflow, 50).length, 50);
});

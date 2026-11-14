import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { triggerHaptic, haptics, HAPTIC_PATTERNS } from '../src/lib/hapticsService.js';

describe('hapticsService unit tests', () => {
  let vibrateCalls = [];

  beforeEach(() => {
    vibrateCalls = [];
    Object.defineProperty(navigator, 'vibrate', {
      value: (pattern) => {
        vibrateCalls.push(pattern);
        return true;
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    delete navigator.vibrate;
  });

  test('triggerHaptic accepts named pattern keys', () => {
    triggerHaptic('tap');
    assert.deepStrictEqual(vibrateCalls[0], HAPTIC_PATTERNS.tap);

    triggerHaptic('correct');
    assert.deepStrictEqual(vibrateCalls[1], HAPTIC_PATTERNS.correct);

    triggerHaptic('wrong');
    assert.deepStrictEqual(vibrateCalls[2], HAPTIC_PATTERNS.wrong);

    triggerHaptic('streak');
    assert.deepStrictEqual(vibrateCalls[3], HAPTIC_PATTERNS.streak);

    triggerHaptic('complete');
    assert.deepStrictEqual(vibrateCalls[4], HAPTIC_PATTERNS.complete);

    triggerHaptic('delete');
    assert.deepStrictEqual(vibrateCalls[5], HAPTIC_PATTERNS.delete);

    triggerHaptic('error');
    assert.deepStrictEqual(vibrateCalls[6], HAPTIC_PATTERNS.error);
  });

  test('triggerHaptic accepts raw number and array patterns', () => {
    triggerHaptic(42);
    assert.deepStrictEqual(vibrateCalls[0], 42);

    triggerHaptic([10, 20, 30]);
    assert.deepStrictEqual(vibrateCalls[1], [10, 20, 30]);
  });

  test('triggerHaptic uses default 15ms when called without parameters', () => {
    triggerHaptic();
    assert.deepStrictEqual(vibrateCalls[0], 15);
  });

  test('triggerHaptic ignores zero, negative, null, and unknown inputs gracefully', () => {
    triggerHaptic(0);
    triggerHaptic(-10);
    triggerHaptic(null);
    triggerHaptic('non_existent_pattern');
    assert.strictEqual(vibrateCalls.length, 0);
  });

  test('haptics convenience object invokes corresponding named patterns', () => {
    haptics.tap();
    assert.deepStrictEqual(vibrateCalls[0], HAPTIC_PATTERNS.tap);

    haptics.select();
    assert.deepStrictEqual(vibrateCalls[1], HAPTIC_PATTERNS.select);

    haptics.correct();
    assert.deepStrictEqual(vibrateCalls[2], HAPTIC_PATTERNS.correct);

    haptics.wrong();
    assert.deepStrictEqual(vibrateCalls[3], HAPTIC_PATTERNS.wrong);

    haptics.complete();
    assert.deepStrictEqual(vibrateCalls[4], HAPTIC_PATTERNS.complete);

    haptics.delete();
    assert.deepStrictEqual(vibrateCalls[5], HAPTIC_PATTERNS.delete);
  });

  test('SSR-safe: operates without throwing when navigator.vibrate is undefined', () => {
    delete navigator.vibrate;
    assert.doesNotThrow(() => {
      triggerHaptic('tap');
      haptics.complete();
    });
  });

  test('resilient to internal navigator.vibrate errors', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: () => {
        throw new Error('Hardware failure');
      },
      configurable: true,
      writable: true,
    });
    assert.doesNotThrow(() => {
      triggerHaptic(20);
      haptics.tap();
    });
  });
});

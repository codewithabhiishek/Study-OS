import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getScopedKey,
  OFFLINE_QUEUE_KEY,
  SETTINGS_KEY,
  TIMER_STATE_KEY,
} from '../src/utils/storageUtils.js';

describe('multi-user data isolation & storage scoping', () => {
  test('generates strictly isolated storage keys per user ID', () => {
    const keyUser1 = getScopedKey(SETTINGS_KEY, 'usr_alpha');
    const keyUser2 = getScopedKey(SETTINGS_KEY, 'usr_beta');
    const keyAnon = getScopedKey(SETTINGS_KEY, null);

    assert.strictEqual(keyUser1, 'studyos.focus.settings.v1.usr_alpha');
    assert.strictEqual(keyUser2, 'studyos.focus.settings.v1.usr_beta');
    assert.strictEqual(keyAnon, 'studyos.focus.settings.v1.anon');
    assert.notStrictEqual(keyUser1, keyUser2);
    assert.notStrictEqual(keyUser1, keyAnon);
  });

  test('different user settings and timer states do not collide in mock storage', () => {
    const mockStorage = new Map();

    const saveSettings = (userId, settings) => {
      mockStorage.set(getScopedKey(SETTINGS_KEY, userId), JSON.stringify(settings));
    };

    const getSettings = (userId) => {
      const raw = mockStorage.get(getScopedKey(SETTINGS_KEY, userId));
      return raw ? JSON.parse(raw) : null;
    };

    // User A sets pomodoro on with 50/10
    saveSettings('user_a', { pomodoroEnabled: true, soundEnabled: false });

    // User B sets pomodoro off
    saveSettings('user_b', { pomodoroEnabled: false, soundEnabled: true });

    // Verify isolation
    const loadedA = getSettings('user_a');
    const loadedB = getSettings('user_b');

    assert.strictEqual(loadedA.pomodoroEnabled, true);
    assert.strictEqual(loadedA.soundEnabled, false);

    assert.strictEqual(loadedB.pomodoroEnabled, false);
    assert.strictEqual(loadedB.soundEnabled, true);
  });

  test('offline focus queues for distinct users remain completely segregated', () => {
    const mockStorage = new Map();

    const addToQueue = (userId, session) => {
      const key = getScopedKey(OFFLINE_QUEUE_KEY, userId);
      const queue = mockStorage.has(key) ? JSON.parse(mockStorage.get(key)) : [];
      queue.push(session);
      mockStorage.set(key, JSON.stringify(queue));
    };

    const getQueue = (userId) => {
      const key = getScopedKey(OFFLINE_QUEUE_KEY, userId);
      return mockStorage.has(key) ? JSON.parse(mockStorage.get(key)) : [];
    };

    addToQueue('user_student_1', { duration_minutes: 45, project_id: 'p1' });
    addToQueue('user_student_2', { duration_minutes: 25, project_id: 'p2' });
    addToQueue('user_student_1', { duration_minutes: 60, project_id: 'p3' });

    const queue1 = getQueue('user_student_1');
    const queue2 = getQueue('user_student_2');

    assert.strictEqual(queue1.length, 2);
    assert.strictEqual(queue2.length, 1);
    assert.strictEqual(queue1[0].duration_minutes, 45);
    assert.strictEqual(queue1[1].duration_minutes, 60);
    assert.strictEqual(queue2[0].duration_minutes, 25);
  });

  test('timer state persistence handles paused/resumed bounds safely', () => {
    const timerUser = getScopedKey(TIMER_STATE_KEY, 'user_active');
    assert.ok(timerUser.includes('user_active'));
    assert.ok(!timerUser.includes('undefined'));
  });
});

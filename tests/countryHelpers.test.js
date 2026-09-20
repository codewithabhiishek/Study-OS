import test from 'node:test';
import assert from 'node:assert/strict';
import { getCountryFlag, COUNTRIES } from '../src/utils/countryHelpers.js';

test('getCountryFlag maps known country names case-insensitively', () => {
  assert.equal(getCountryFlag('Austria'), '🇦🇹');
  assert.equal(getCountryFlag('austria'), '🇦🇹');
  assert.equal(getCountryFlag('GERMANY'), '🇩🇪');
  assert.equal(getCountryFlag('France'), '🇫🇷');
  assert.equal(getCountryFlag('Japan'), '🌍'); // Not in list -> globe
});

test('getCountryFlag handles aliases for UK and US', () => {
  assert.equal(getCountryFlag('uk'), '🇬🇧');
  assert.equal(getCountryFlag('UK'), '🇬🇧');
  assert.equal(getCountryFlag('us'), '🇺🇸');
  assert.equal(getCountryFlag('usa'), '🇺🇸');
  assert.equal(getCountryFlag('USA'), '🇺🇸');
});

test('getCountryFlag returns empty string for null, undefined, or empty inputs', () => {
  assert.equal(getCountryFlag(''), '');
  assert.equal(getCountryFlag(null), '');
  assert.equal(getCountryFlag(undefined), '');
  assert.equal(getCountryFlag(123), '');
  assert.equal(getCountryFlag({}), '');
});

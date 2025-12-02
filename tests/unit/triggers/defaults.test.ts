import { describe, expect, it } from 'vitest';
import { getDefaultTrigger } from '../../../src/triggers/defaults.js';

describe('triggers/defaults', () => {
  it('uses submit for forms', () => {
    const form = document.createElement('form');
    expect(getDefaultTrigger(form)).toBe('submit');
  });

  it('uses change for inputs/select/textarea', () => {
    const input = document.createElement('input');
    const select = document.createElement('select');
    const textarea = document.createElement('textarea');
    expect(getDefaultTrigger(input)).toBe('change');
    expect(getDefaultTrigger(select)).toBe('change');
    expect(getDefaultTrigger(textarea)).toBe('change');
  });

  it('defaults to click for other elements', () => {
    const div = document.createElement('div');
    expect(getDefaultTrigger(div)).toBe('click');
  });
});


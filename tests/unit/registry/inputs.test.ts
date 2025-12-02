import { afterEach, describe, expect, it } from 'vitest';
import { clearInputReaders, getInputReader, listInputTypes, registerInput } from '../../../src/registry/inputs.js';

describe('registry/inputs', () => {
  afterEach(() => {
    clearInputReaders();
  });

  it('registers and lists input readers', () => {
    const reader = () => ({ name: 'x', value: '1' });
    registerInput('custom-input', reader);
    expect(listInputTypes()).toEqual(['custom-input']);
    expect(getInputReader('custom-input')).toBe(reader);
  });

  it('returns undefined for missing readers', () => {
    expect(getInputReader('unknown')).toBeUndefined();
  });
});


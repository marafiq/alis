import { describe, expect, it } from 'vitest';
import ALIS from '../../../src/index.js';

describe('ALIS.process', () => {
  it('returns zero by default', () => {
    expect(ALIS.process()).toBe(0);
  });
});


import { describe, expect, it } from 'vitest';
import ALIS from '../../../src/index.js';

describe('ALIS.init', () => {
  it('returns cloned config object', () => {
    const config = { timeout: 1000 };
    const result = ALIS.init(config);

    expect(result.config).toEqual(config);
    expect(result.config).not.toBe(config);
  });
});


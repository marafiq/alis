import { describe, it, expect } from 'vitest';
import ALIS from '../../src/index.js';

describe('ALIS Public API', () => {
  it('exports a global object', () => {
    expect(ALIS).toBeDefined();
    expect(typeof ALIS).toBe('object');
  });

  it('has an init method', () => {
    expect(typeof ALIS.init).toBe('function');
  });

  it('has a version', () => {
    expect(ALIS.version).toBe('0.0.1');
  });
});


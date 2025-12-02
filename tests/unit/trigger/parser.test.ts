import { describe, expect, it } from 'vitest';
import { parseOne, parseTrigger } from '../../../src/trigger/parser.js';

describe('trigger/parser', () => {
  it('parses simple event', () => {
    expect(parseTrigger('click')).toEqual([{ selector: null, event: 'click' }]);
  });

  it('parses selector@event entries', () => {
    const entries = parseTrigger('.btn@click, input@change');
    expect(entries).toEqual([
      { selector: '.btn', event: 'click' },
      { selector: 'input', event: 'change' }
    ]);
  });

  it('parses single entry', () => {
    expect(parseOne('.item@click')).toEqual({ selector: '.item', event: 'click' });
  });
});


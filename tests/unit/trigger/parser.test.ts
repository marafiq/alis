import { describe, expect, it } from 'vitest';
import { parseOne, parseTrigger } from '../../../src/trigger/parser.js';

describe('trigger/parser', () => {
  it('parses simple event', () => {
    expect(parseTrigger('click')).toEqual([{ selector: null, event: 'click', delay: 0, throttle: 0 }]);
  });

  it('parses selector@event entries', () => {
    const entries = parseTrigger('.btn@click, input@change');
    expect(entries).toEqual([
      { selector: '.btn', event: 'click', delay: 0, throttle: 0 },
      { selector: 'input', event: 'change', delay: 0, throttle: 0 }
    ]);
  });

  it('parses single entry', () => {
    expect(parseOne('.item@click')).toEqual({ selector: '.item', event: 'click', delay: 0, throttle: 0 });
  });

  it('parses debounce modifier', () => {
    const entries = parseTrigger('input delay:500ms');
    expect(entries).toEqual([{ selector: null, event: 'input', delay: 500, throttle: 0 }]);
  });

  it('parses throttle modifier', () => {
    const entries = parseTrigger('scroll throttle:200ms');
    expect(entries).toEqual([{ selector: null, event: 'scroll', delay: 0, throttle: 200 }]);
  });

  it('parses both delay and throttle', () => {
    const entries = parseTrigger('change delay:300ms throttle:100ms');
    expect(entries).toEqual([{ selector: null, event: 'change', delay: 300, throttle: 100 }]);
  });
});


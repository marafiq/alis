import { describe, expect, it } from 'vitest';
import { matchesTrigger, normalizeEventType } from '../../../src/trigger/matcher.js';

describe('trigger/matcher', () => {
  it('matches explicit trigger', () => {
    const button = document.createElement('button');
    button.setAttribute('data-alis-trigger', '.child@click');
    const child = document.createElement('span');
    child.className = 'child';
    button.appendChild(child);

    const event = new Event('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: child });

    expect(matchesTrigger(button, event)).toBe(true);
  });

  it('normalizes enter key', () => {
    const keyEvent = new KeyboardEvent('keyup', { key: 'Enter' });
    expect(normalizeEventType('keyup', keyEvent)).toBe('keyenter');
  });
});


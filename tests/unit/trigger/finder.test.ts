import { describe, expect, it } from 'vitest';
import { findTriggerElement } from '../../../src/trigger/finder.js';

describe('trigger/finder', () => {
  it('returns element with data-alis when trigger matches', () => {
    const form = document.createElement('form');
    form.setAttribute('data-alis', '');
    form.setAttribute('data-alis-trigger', 'click');
    const button = document.createElement('button');
    form.appendChild(button);
    document.body.appendChild(form);

    let found = null;
    const handler = (event: Event) => {
      found = findTriggerElement(event);
      event.preventDefault();
    };
    document.addEventListener('click', handler);
    button.click();
    document.removeEventListener('click', handler);

    expect(found).not.toBeNull();

    document.body.removeChild(form);
  });
});


import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { findTriggerElement, getTriggerConfig } from '../../../src/trigger/finder.js';

describe('trigger/finder', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('findTriggerElement', () => {
    it('returns element with data-alis when trigger matches', () => {
      const form = document.createElement('form');
      form.setAttribute('data-alis', '');
      form.setAttribute('data-alis-trigger', 'click');
      const button = document.createElement('button');
      form.appendChild(button);
      document.body.appendChild(form);

      let found: Element | null = null;
      const handler = (event: Event) => {
        found = findTriggerElement(event);
        event.preventDefault();
      };
      document.addEventListener('click', handler);
      button.click();
      document.removeEventListener('click', handler);

      expect(found).toBe(form);
    });

    it('returns element with data-alis-get attribute', () => {
      const button = document.createElement('button');
      button.setAttribute('data-alis-get', '/api/data');
      button.setAttribute('data-alis-trigger', 'click');
      document.body.appendChild(button);

      let found: Element | null = null;
      const handler = (event: Event) => {
        found = findTriggerElement(event);
      };
      document.addEventListener('click', handler);
      button.click();
      document.removeEventListener('click', handler);

      expect(found).toBe(button);
    });

    it('returns element with data-alis-post attribute', () => {
      const form = document.createElement('form');
      form.setAttribute('data-alis-post', '/api/save');
      document.body.appendChild(form);

      let found: Element | null = null;
      const handler = (event: Event) => {
        found = findTriggerElement(event);
      };
      document.addEventListener('submit', handler);
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      document.removeEventListener('submit', handler);

      expect(found).toBe(form);
    });

    it('returns null when no ALIS element found', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      let found: Element | null = null;
      const handler = (event: Event) => {
        found = findTriggerElement(event);
      };
      document.addEventListener('click', handler);
      div.click();
      document.removeEventListener('click', handler);

      expect(found).toBeNull();
    });

    it('returns null when event target is not an element', () => {
      const event = new Event('click');
      Object.defineProperty(event, 'target', { value: null });
      expect(findTriggerElement(event)).toBeNull();
    });

    it('finds ALIS element in parent hierarchy', () => {
      const form = document.createElement('form');
      form.setAttribute('data-alis-post', '/api/save');
      const div = document.createElement('div');
      const button = document.createElement('button');
      div.appendChild(button);
      form.appendChild(div);
      document.body.appendChild(form);

      let found: Element | null = null;
      const handler = (event: Event) => {
        found = findTriggerElement(event);
      };
      document.addEventListener('submit', handler);
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      document.removeEventListener('submit', handler);

      expect(found).toBe(form);
    });

    it('respects trigger attribute matching', () => {
      const input = document.createElement('input');
      input.setAttribute('data-alis-get', '/api/search');
      input.setAttribute('data-alis-trigger', 'input');
      document.body.appendChild(input);

      let foundOnInput: Element | null = null;
      let foundOnClick: Element | null = null;

      const inputHandler = (event: Event) => {
        foundOnInput = findTriggerElement(event);
      };
      const clickHandler = (event: Event) => {
        foundOnClick = findTriggerElement(event);
      };

      document.addEventListener('input', inputHandler);
      document.addEventListener('click', clickHandler);

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.click();

      document.removeEventListener('input', inputHandler);
      document.removeEventListener('click', clickHandler);

      expect(foundOnInput).toBe(input);
      expect(foundOnClick).toBeNull();
    });
  });

  describe('getTriggerConfig', () => {
    it('returns zero delay and throttle when no trigger attribute', () => {
      const element = document.createElement('button');
      const config = getTriggerConfig(element);
      expect(config).toEqual({ delay: 0, throttle: 0 });
    });

    it('extracts delay from trigger attribute', () => {
      const element = document.createElement('input');
      element.setAttribute('data-alis-trigger', 'input delay:500ms');
      const config = getTriggerConfig(element);
      expect(config.delay).toBe(500);
      expect(config.throttle).toBe(0);
    });

    it('extracts throttle from trigger attribute', () => {
      const element = document.createElement('input');
      element.setAttribute('data-alis-trigger', 'input throttle:200ms');
      const config = getTriggerConfig(element);
      expect(config.delay).toBe(0);
      expect(config.throttle).toBe(200);
    });

    it('extracts both delay and throttle', () => {
      const element = document.createElement('input');
      element.setAttribute('data-alis-trigger', 'input delay:300ms throttle:100ms');
      const config = getTriggerConfig(element);
      expect(config.delay).toBe(300);
      expect(config.throttle).toBe(100);
    });

    it('handles trigger without modifiers', () => {
      const element = document.createElement('button');
      element.setAttribute('data-alis-trigger', 'click');
      const config = getTriggerConfig(element);
      expect(config).toEqual({ delay: 0, throttle: 0 });
    });

    it('uses first trigger config when multiple triggers defined', () => {
      const element = document.createElement('input');
      element.setAttribute('data-alis-trigger', 'input delay:100ms, change delay:200ms');
      const config = getTriggerConfig(element);
      expect(config.delay).toBe(100);
    });
  });
});

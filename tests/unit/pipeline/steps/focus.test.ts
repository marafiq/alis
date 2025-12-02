import { describe, it, expect, beforeEach, vi } from 'vitest';
import { focusStep } from '../../../../src/pipeline/steps/focus.js';

describe('focusStep', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses trigger element if focusable', () => {
    const button = document.createElement('button');
    button.textContent = 'Click me';
    document.body.appendChild(button);

    const ctx = {
      element: button,
      config: {},
      id: 'test-1',
    };

    // @ts-expect-error - partial context for testing
    focusStep(ctx);

    expect(document.activeElement).toBe(button);
  });

  it('focuses input element after request', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'search';
    document.body.appendChild(input);

    const ctx = {
      element: input,
      config: {},
      id: 'test-2',
    };

    // @ts-expect-error - partial context for testing
    focusStep(ctx);

    expect(document.activeElement).toBe(input);
  });

  it('focuses select element after request', () => {
    const select = document.createElement('select');
    select.innerHTML = '<option value="1">One</option>';
    document.body.appendChild(select);

    const ctx = {
      element: select,
      config: {},
      id: 'test-3',
    };

    // @ts-expect-error - partial context for testing
    focusStep(ctx);

    expect(document.activeElement).toBe(select);
  });

  it('does not focus disabled elements', () => {
    const button = document.createElement('button');
    button.disabled = true;
    document.body.appendChild(button);

    const otherElement = document.createElement('div');
    document.body.appendChild(otherElement);
    otherElement.focus();

    const ctx = {
      element: button,
      config: {},
      id: 'test-4',
    };

    // @ts-expect-error - partial context for testing
    focusStep(ctx);

    expect(document.activeElement).not.toBe(button);
  });

  it('focuses explicit target from config.focus', () => {
    const button = document.createElement('button');
    button.id = 'trigger';
    document.body.appendChild(button);

    const input = document.createElement('input');
    input.id = 'focus-target';
    document.body.appendChild(input);

    const ctx = {
      element: button,
      config: { focus: '#focus-target' },
      id: 'test-5',
    };

    // @ts-expect-error - partial context for testing
    focusStep(ctx);

    expect(document.activeElement).toBe(input);
  });

  it('skips focus on error', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);

    const ctx = {
      element: button,
      config: {},
      id: 'test-6',
      error: new Error('Something went wrong'),
    };

    // @ts-expect-error - partial context for testing
    focusStep(ctx);

    expect(document.activeElement).not.toBe(button);
  });

  it('does not change focus if element already focused', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const focusSpy = vi.spyOn(input, 'focus');

    const ctx = {
      element: input,
      config: {},
      id: 'test-7',
    };

    // @ts-expect-error - partial context for testing
    focusStep(ctx);

    // Should not call focus again since it's already focused
    expect(focusSpy).not.toHaveBeenCalled();
  });
});


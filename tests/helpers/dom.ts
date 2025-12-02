import { vi } from 'vitest';

type FieldConfig = Record<string, string> & {
  tag?: string;
};

export function createElement(
  tag: string,
  attrs: Record<string, string> = {},
  children = ''
): HTMLElement {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
  if (children) {
    el.innerHTML = children;
  }
  document.body.appendChild(el);
  return el;
}

export function createForm(
  attrs: Record<string, string> = {},
  fields: FieldConfig[] = []
): HTMLFormElement {
  const form = createElement('form', attrs) as HTMLFormElement;
  fields.forEach(field => {
    const { tag = 'input', ...rest } = field;
    const input = document.createElement(tag);
    Object.entries(rest).forEach(([key, value]) => {
      if (key !== 'tag') {
        input.setAttribute(key, String(value));
      }
    });
    form.appendChild(input);
  });
  return form;
}

type MockResponse = {
  body: unknown;
  status?: number;
  headers?: Record<string, string>;
};

export function mockFetch(responses: MockResponse | MockResponse[]) {
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  globalThis.fetch = vi.fn(() => {
    const next = queue.shift() ?? queue[0];
    return Promise.resolve(
      new Response(
        typeof next.body === 'string' ? next.body : JSON.stringify(next.body),
        {
          status: next.status ?? 200,
          headers: next.headers
        }
      )
    );
  });
}

export function fireEvent(element: Element, eventType: string, options: EventInit = {}) {
  const event = new window.Event(eventType, { bubbles: true, ...options });
  element.dispatchEvent(event);
  return event;
}

export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));


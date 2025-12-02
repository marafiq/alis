import { describe, expect, it, beforeEach } from 'vitest';
import { AdapterRegistry } from '../../../../src/validation/adapters/AdapterRegistry.js';

interface Adapter {
  name: string;
  matches: (element: Element) => boolean;
  getValue: (element: Element) => unknown;
  getVisibleElement: (element: Element) => Element;
  getBlurTarget: (element: Element) => Element;
}

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;
  let mockAdapter: Adapter;

  beforeEach(() => {
    registry = new AdapterRegistry();
    mockAdapter = {
      name: 'mock',
      matches: (element: Element) => element.classList.contains('mock-component'),
      getValue: (element: Element) => (element as HTMLInputElement).value,
      getVisibleElement: (element: Element) => element,
      getBlurTarget: (element: Element) => element
    };
  });

  it('registers an adapter', () => {
    registry.register(mockAdapter);
    expect(registry.has('mock')).toBe(true);
  });

  it('retrieves adapter for matching element', () => {
    registry.register(mockAdapter);
    
    const element = document.createElement('input');
    element.classList.add('mock-component');
    
    const adapter = registry.getAdapter(element);
    expect(adapter?.name).toBe('mock');
  });

  it('returns DefaultAdapter if no match', () => {
    const element = document.createElement('input');
    const adapter = registry.getAdapter(element);
    expect(adapter?.name).toBe('default');
  });

  it('adapter has getValue method', () => {
    registry.register(mockAdapter);
    
    const element = document.createElement('input');
    element.classList.add('mock-component');
    element.value = 'test value';
    
    const adapter = registry.getAdapter(element);
    expect(adapter?.getValue(element)).toBe('test value');
  });

  it('adapter has getVisibleElement method', () => {
    registry.register(mockAdapter);
    
    const element = document.createElement('input');
    element.classList.add('mock-component');
    
    const adapter = registry.getAdapter(element);
    expect(adapter?.getVisibleElement(element)).toBe(element);
  });

  it('adapter has getBlurTarget method', () => {
    registry.register(mockAdapter);
    
    const element = document.createElement('input');
    element.classList.add('mock-component');
    
    const adapter = registry.getAdapter(element);
    expect(adapter?.getBlurTarget(element)).toBe(element);
  });
});


import { createRegistry } from './base.js';
import { serialize as jsonSerializer } from '../serializers/json.js';
import { serialize as formDataSerializer } from '../serializers/formdata.js';
import { serialize as urlencodedSerializer } from '../serializers/urlencoded.js';

const registry = createRegistry({ name: 'ALIS.serialize', allowOverride: true });

registry.register('json', jsonSerializer);
registry.register('formdata', formDataSerializer);
registry.register('urlencoded', urlencodedSerializer);

export function getSerializer(name = 'json') {
  const serializer = registry.get(name);
  if (!serializer) {
    throw new Error(`Unknown serializer "${name}"`);
  }
  return serializer;
}

/**
 * @param {string} name
 * @param {(data: any) => { body: any; contentType: string | null | undefined }} serializer
 */
export function registerSerializer(name, serializer) {
  return registry.register(name, serializer, { override: true });
}

export function listSerializers() {
  return registry.keys();
}

export function clearSerializers() {
  registry.clear();
  registry.register('json', jsonSerializer);
  registry.register('formdata', formDataSerializer);
  registry.register('urlencoded', urlencodedSerializer);
}


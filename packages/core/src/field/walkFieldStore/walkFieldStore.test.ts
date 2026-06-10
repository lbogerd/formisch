import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { walkFieldStore } from './walkFieldStore.ts';

describe('walkFieldStore', () => {
  test('should call callback for single value field', () => {
    const store = createTestStore({ initialInput: { name: undefined } });
    const names: string[] = [];
    walkFieldStore(store.children.name, (field) => names.push(field.name));
    expect(names).toStrictEqual(['["name"]']);
  });

  test('should walk object fields in depth-first order', () => {
    const store = createTestStore({
      initialInput: { a: undefined, b: undefined },
    });
    const names: string[] = [];
    walkFieldStore(store, (field) => names.push(field.name));
    expect(names).toStrictEqual(['[]', '["a"]', '["b"]']);
  });

  test('should walk array fields in depth-first order', () => {
    const store = createTestStore({ initialInput: { items: ['a', 'b'] } });
    const names: string[] = [];
    walkFieldStore(store.children.items, (field) => names.push(field.name));
    expect(names).toStrictEqual(['["items"]', '["items",0]', '["items",1]']);
  });

  test('should walk array children only up to items length', () => {
    const store = createTestStore({ initialInput: { items: ['a', 'b'] } });
    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      itemsStore.items.value = itemsStore.items.value.slice(0, 1);
      const names: string[] = [];
      walkFieldStore(itemsStore, (field) => names.push(field.name));
      expect(names).toStrictEqual(['["items"]', '["items",0]']);
    }
  });

  test('should walk nested structures', () => {
    const store = createTestStore({
      initialInput: { user: { name: undefined, age: undefined } },
    });
    const names: string[] = [];
    walkFieldStore(store, (field) => names.push(field.name));
    expect(names).toStrictEqual([
      '[]',
      '["user"]',
      '["user","name"]',
      '["user","age"]',
    ]);
  });

  test('should walk mixed array and object structures', () => {
    const store = createTestStore({
      initialInput: { users: [{ name: 'John' }] },
    });
    const names: string[] = [];
    walkFieldStore(store, (field) => names.push(field.name));
    expect(names).toStrictEqual([
      '[]',
      '["users"]',
      '["users",0]',
      '["users",0,"name"]',
    ]);
  });
});

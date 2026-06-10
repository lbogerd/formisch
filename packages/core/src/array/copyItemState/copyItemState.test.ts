// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { copyItemState } from './copyItemState.ts';

describe('copyItemState', () => {
  describe('value fields', () => {
    test('should copy basic state between value fields', () => {
      const store = createTestStore({
        initialInput: { source: 'hello', target: '' },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      // Modify source state
      expect(sourceStore.kind).toBe('value');
      if (sourceStore.kind === 'value') {
        sourceStore.input.value = 'modified';
      }
      sourceStore.isTouched.value = true;
      sourceStore.isDirty.value = true;
      sourceStore.errors.value = ['Error'];

      copyItemState(sourceStore, targetStore);

      expect(targetStore.input.value).toBe('modified');
      expect(targetStore.startInput.value).toBe('hello');
      expect(targetStore.isTouched.value).toBe(true);
      expect(targetStore.isDirty.value).toBe(true);
      expect(targetStore.errors.value).toEqual(['Error']);
    });

    test('should copy elements array', () => {
      const store = createTestStore({
        initialInput: { source: '', target: '' },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      const mockElement = document.createElement('input');
      sourceStore.elements = [mockElement];

      copyItemState(sourceStore, targetStore);

      expect(targetStore.elements).toEqual([mockElement]);
    });
  });

  describe('object fields', () => {
    test('should copy nested object state recursively', () => {
      const store = createTestStore({
        initialInput: {
          source: { name: 'John', age: 30 },
          target: { name: '', age: 0 },
        },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      expect(sourceStore.kind).toBe('object');
      expect(targetStore.kind).toBe('object');

      if (sourceStore.kind === 'object' && targetStore.kind === 'object') {
        sourceStore.children.name.isTouched.value = true;

        copyItemState(sourceStore, targetStore);

        expect(targetStore.children.name.input.value).toBe('John');
        expect(targetStore.children.name.isTouched.value).toBe(true);
        expect(targetStore.children.age.input.value).toBe(30);
      }
    });

    test('should initialize missing object children when copying', () => {
      const store = createTestStore({
        initialInput: {
          source: { name: 'John', email: 'john@example.com' },
          target: { name: '' },
        },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      expect(sourceStore.kind).toBe('object');
      expect(targetStore.kind).toBe('object');

      if (sourceStore.kind === 'object' && targetStore.kind === 'object') {
        expect(targetStore.children.email).toBeUndefined();

        copyItemState(sourceStore, targetStore);

        expect(targetStore.children.name.input.value).toBe('John');
        expect(targetStore.children.email.input.value).toBe('john@example.com');
        expect(targetStore.children.email.startInput.value).toBe(
          'john@example.com'
        );
      }
    });

    test('should handle asymmetric object children', () => {
      const store = createTestStore({
        initialInput: {
          source: { name: 'John', email: 'john@example.com' },
          target: { name: '', phone: '123' },
        },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      expect(sourceStore.kind).toBe('object');
      expect(targetStore.kind).toBe('object');

      if (sourceStore.kind === 'object' && targetStore.kind === 'object') {
        copyItemState(sourceStore, targetStore);

        // Source-only keys are created on the target and copied
        expect(targetStore.children.name.input.value).toBe('John');
        expect(targetStore.children.email.input.value).toBe('john@example.com');

        // Target-only keys are left untouched
        expect(targetStore.children.phone.input.value).toBe('123');
        expect(sourceStore.children.phone).toBeUndefined();
      }
    });
  });

  describe('array fields', () => {
    test('should copy array state including items', () => {
      const store = createTestStore({
        initialInput: {
          source: ['a', 'b'],
          target: ['x', 'y'],
        },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      expect(sourceStore.kind).toBe('array');
      expect(targetStore.kind).toBe('array');

      if (sourceStore.kind === 'array' && targetStore.kind === 'array') {
        sourceStore.isTouched.value = true;

        copyItemState(sourceStore, targetStore);

        expect(targetStore.items.value).toEqual(sourceStore.items.value);
        expect(targetStore.startItems.value).toEqual(
          sourceStore.startItems.value
        );
        expect(targetStore.isTouched.value).toBe(true);
        expect(targetStore.children[0].input.value).toBe('a');
        expect(targetStore.children[1].input.value).toBe('b');
      }
    });

    test('should initialize missing children when copying larger array', () => {
      const store = createTestStore({
        initialInput: {
          source: ['a', 'b', 'c'],
          target: ['x'],
        },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      expect(sourceStore.kind).toBe('array');
      expect(targetStore.kind).toBe('array');

      if (sourceStore.kind === 'array' && targetStore.kind === 'array') {
        expect(targetStore.children.length).toBe(1);

        copyItemState(sourceStore, targetStore);

        expect(targetStore.children.length).toBe(3);
        expect(targetStore.children[1].input.value).toBe('b');
        expect(targetStore.children[2].input.value).toBe('c');
      }
    });
  });

  describe('value field upgrades', () => {
    test('should upgrade value store to object when copying from object store', () => {
      // A key with an `undefined` initial input creates a value store
      const store = createTestStore({
        initialInput: {
          source: { name: 'John', age: 30 },
          target: undefined,
        },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      expect(sourceStore.kind).toBe('object');
      expect(targetStore.kind).toBe('value');

      sourceStore.isTouched.value = true;

      copyItemState(sourceStore, targetStore);

      expect(targetStore.kind).toBe('object');
      if (targetStore.kind === 'object') {
        expect(targetStore.input.value).toBe(true);
        expect(targetStore.startInput.value).toBe(true);
        expect(targetStore.isTouched.value).toBe(true);
        expect(targetStore.children.name.input.value).toBe('John');
        expect(targetStore.children.age.input.value).toBe(30);
      }
    });

    test('should upgrade value store to array and copy deeply', () => {
      // A key with an `undefined` initial input creates a value store
      const store = createTestStore({
        initialInput: {
          source: [{ label: 'a' }, { label: 'b' }],
          target: undefined,
        },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      expect(sourceStore.kind).toBe('array');
      expect(targetStore.kind).toBe('value');

      copyItemState(sourceStore, targetStore);

      expect(targetStore.kind).toBe('array');
      if (sourceStore.kind === 'array' && targetStore.kind === 'array') {
        expect(targetStore.input.value).toBe(true);
        expect(targetStore.items.value).toEqual(sourceStore.items.value);
        expect(targetStore.startItems.value).toEqual(
          sourceStore.startItems.value
        );
        expect(targetStore.children.length).toBe(2);

        // Lazily created children are upgraded and copied deeply
        const firstChild = targetStore.children[0];
        expect(firstChild.kind).toBe('object');
        if (firstChild.kind === 'object') {
          expect(firstChild.children.label.input.value).toBe('a');
        }
        const secondChild = targetStore.children[1];
        expect(secondChild.kind).toBe('object');
        if (secondChild.kind === 'object') {
          expect(secondChild.children.label.input.value).toBe('b');
        }
      }
    });
  });

  describe('edge cases', () => {
    test('should handle null errors', () => {
      const store = createTestStore({
        initialInput: { source: '', target: '' },
      });

      const sourceStore = store.children.source;
      const targetStore = store.children.target;

      targetStore.errors.value = ['Old error'];
      sourceStore.errors.value = null;

      copyItemState(sourceStore, targetStore);

      expect(targetStore.errors.value).toBe(null);
    });
  });
});

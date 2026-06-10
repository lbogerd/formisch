import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createTestSchema } from '../../vitest/index.ts';
import { createFormStore } from './createFormStore.ts';

describe('createFormStore', () => {
  describe('default configuration', () => {
    test('should use default validation modes when not specified', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: {},
      });

      expect(store.validate).toBe('submit');
      expect(store.revalidate).toBe('input');
    });

    test('should initialize validators to 0', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: {},
      });

      expect(store.validators).toBe(0);
    });

    test('should initialize all boolean signals to false', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: {},
      });

      expect(store.isSubmitting.value).toBe(false);
      expect(store.isSubmitted.value).toBe(false);
      expect(store.isValidating.value).toBe(false);
    });

    test('should assign the schema', () => {
      const schema = createTestSchema();
      const store = createFormStore({ schema, initialInput: {} });

      expect(store.schema).toBe(schema);
    });

    test('should assign any Standard Schema', () => {
      const schema = v.object({ name: v.string() });
      const store = createFormStore({ schema, initialInput: { name: '' } });

      expect(store.schema).toBe(schema);
    });
  });

  describe('custom configuration', () => {
    test('should use custom validate mode', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: {},
        validate: 'blur',
      });

      expect(store.validate).toBe('blur');
    });

    test('should use custom revalidate mode', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: {},
        revalidate: 'change',
      });

      expect(store.revalidate).toBe('change');
    });

    test('should use both custom validation modes', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: {},
        validate: 'touch',
        revalidate: 'blur',
      });

      expect(store.validate).toBe('touch');
      expect(store.revalidate).toBe('blur');
    });
  });

  describe('field store initialization', () => {
    test('should initialize simple object input', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: { name: undefined },
      });

      expect(store.kind).toBe('object');
      expect(store.name).toBe('[]');
      expect(store.children).toHaveProperty('name');
      expect(store.children.name.kind).toBe('value');
    });

    test('should initialize with initial input values', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: { name: 'John' },
      });

      expect(store.children.name.input.value).toBe('John');
    });

    test('should initialize nested object input', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: { user: { name: undefined, age: undefined } },
      });

      expect(store.kind).toBe('object');
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.children.name.kind).toBe('value');
        expect(userStore.children.age.kind).toBe('value');
      }
    });

    test('should initialize array input', () => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: { items: ['a', 'b'] },
      });

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.children).toHaveLength(2);
        expect(itemsStore.children[0].input.value).toBe('a');
        expect(itemsStore.children[1].input.value).toBe('b');
      }
    });
  });

  describe('validation modes', () => {
    test.each([
      'initial',
      'touch',
      'input',
      'change',
      'blur',
      'submit',
    ] as const)('should accept "%s" as validate mode', (mode) => {
      const store = createFormStore({
        schema: createTestSchema(),
        initialInput: {},
        validate: mode,
      });

      expect(store.validate).toBe(mode);
    });

    test.each(['touch', 'input', 'change', 'blur', 'submit'] as const)(
      'should accept "%s" as revalidate mode',
      (mode) => {
        const store = createFormStore({
          schema: createTestSchema(),
          initialInput: {},
          revalidate: mode,
        });

        expect(store.revalidate).toBe(mode);
      }
    );
  });

  describe('invalid initial input', () => {
    test('should throw for null initial input', () => {
      expect(() =>
        createFormStore({
          schema: createTestSchema(),
          // @ts-expect-error
          initialInput: null,
        })
      ).toThrow('The initial input of a form must be a plain object');
    });

    test('should throw for undefined initial input', () => {
      expect(() =>
        createFormStore({
          schema: createTestSchema(),
          // @ts-expect-error
          initialInput: undefined,
        })
      ).toThrow('The initial input of a form must be a plain object');
    });

    test('should throw for array initial input', () => {
      expect(() =>
        createFormStore({
          schema: createTestSchema(),
          // @ts-expect-error
          initialInput: ['a', 'b'],
        })
      ).toThrow('The initial input of a form must be a plain object');
    });

    test('should throw for Date initial input', () => {
      expect(() =>
        createFormStore({
          schema: createTestSchema(),
          // @ts-expect-error
          initialInput: new Date(),
        })
      ).toThrow('The initial input of a form must be a plain object');
    });
  });
});

import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { reconcileFieldStore } from './reconcileFieldStore.ts';

describe('reconcileFieldStore', () => {
  describe('matching kind', () => {
    test('should do nothing for object field accessed as object', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John' } },
      });
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        const children = userStore.children;
        reconcileFieldStore(userStore, 'object');
        expect(userStore.kind).toBe('object');
        expect(userStore.children).toBe(children);
        expect(userStore.children.name.input.value).toBe('John');
      }
    });

    test('should do nothing for array field accessed as array', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        const children = itemsStore.children;
        const items = itemsStore.items;
        reconcileFieldStore(itemsStore, 'array');
        expect(itemsStore.kind).toBe('array');
        expect(itemsStore.children).toBe(children);
        expect(itemsStore.items).toBe(items);
      }
    });
  });

  describe('value to object upgrade', () => {
    test('should upgrade value field with undefined input', () => {
      const store = createTestStore({ initialInput: { field: undefined } });
      const field = store.children.field;
      expect(field.kind).toBe('value');
      reconcileFieldStore(field, 'object');
      expect(field.kind).toBe('object');
      if (field.kind === 'object') {
        expect(field.children).toStrictEqual({});
        expect(field.initialInput.value).toBeUndefined();
        expect(field.startInput.value).toBeUndefined();
        expect(field.input.value).toBeUndefined();
      }
    });

    test('should upgrade value field with null input', () => {
      const store = createTestStore({ initialInput: { field: null } });
      const field = store.children.field;
      reconcileFieldStore(field, 'object');
      expect(field.kind).toBe('object');
      if (field.kind === 'object') {
        expect(field.children).toStrictEqual({});
        expect(field.initialInput.value).toBeNull();
        expect(field.startInput.value).toBeNull();
        expect(field.input.value).toBeNull();
      }
    });

    test('should distribute composite raw input into children', () => {
      const store = createTestStore({ initialInput: { field: undefined } });
      const field = store.children.field;
      expect(field.kind).toBe('value');
      if (field.kind === 'value') {
        field.input.value = { name: 'John', age: 30 };
      }
      reconcileFieldStore(field, 'object');
      expect(field.kind).toBe('object');
      if (field.kind === 'object') {
        expect(field.children.name.kind).toBe('value');
        expect(field.children.name.name).toBe('["field","name"]');
        expect(field.children.name.input.value).toBe('John');
        expect(field.children.age.input.value).toBe(30);
        // Initial and start input stay undefined while input becomes present
        expect(field.initialInput.value).toBeUndefined();
        expect(field.startInput.value).toBeUndefined();
        expect(field.input.value).toBe(true);
      }
    });

    test('should preserve base state and signal identity', () => {
      const store = createTestStore({ initialInput: { field: undefined } });
      const field = store.children.field;
      const errorsSignal = field.errors;
      const isTouchedSignal = field.isTouched;
      const isDirtySignal = field.isDirty;
      const initialInputSignal = field.initialInput;
      const startInputSignal = field.startInput;
      const inputSignal = field.input;
      const elements = field.elements;
      reconcileFieldStore(field, 'object');
      expect(field.kind).toBe('object');
      expect(field.name).toBe('["field"]');
      expect(field.errors).toBe(errorsSignal);
      expect(field.isTouched).toBe(isTouchedSignal);
      expect(field.isDirty).toBe(isDirtySignal);
      expect(field.initialInput).toBe(initialInputSignal);
      expect(field.startInput).toBe(startInputSignal);
      expect(field.input).toBe(inputSignal);
      expect(field.elements).toBe(elements);
    });
  });

  describe('value to array upgrade', () => {
    test('should upgrade value field with undefined input', () => {
      const store = createTestStore({ initialInput: { field: undefined } });
      const field = store.children.field;
      expect(field.kind).toBe('value');
      reconcileFieldStore(field, 'array');
      expect(field.kind).toBe('array');
      if (field.kind === 'array') {
        expect(field.children).toStrictEqual([]);
        expect(field.initialItems.value).toStrictEqual([]);
        expect(field.startItems.value).toStrictEqual([]);
        expect(field.items.value).toStrictEqual([]);
        expect(field.initialInput.value).toBeUndefined();
        expect(field.startInput.value).toBeUndefined();
        expect(field.input.value).toBeUndefined();
      }
    });

    test('should distribute composite raw input into children', () => {
      const store = createTestStore({ initialInput: { field: undefined } });
      const field = store.children.field;
      expect(field.kind).toBe('value');
      if (field.kind === 'value') {
        field.input.value = ['a', 'b'];
      }
      reconcileFieldStore(field, 'array');
      expect(field.kind).toBe('array');
      if (field.kind === 'array') {
        expect(field.children).toHaveLength(2);
        expect(field.children[0].kind).toBe('value');
        expect(field.children[0].name).toBe('["field",0]');
        expect(field.children[0].input.value).toBe('a');
        expect(field.children[1].input.value).toBe('b');
        // Items are created with unique IDs for each child while initial
        // and start items reflect the nullish baseline
        expect(field.items.value).toStrictEqual(['id-0', 'id-1']);
        expect(field.initialItems.value).toStrictEqual([]);
        expect(field.startItems.value).toStrictEqual([]);
        // Initial and start input stay undefined while input becomes present
        expect(field.initialInput.value).toBeUndefined();
        expect(field.startInput.value).toBeUndefined();
        expect(field.input.value).toBe(true);
        // Field and children are dirty as the baseline was undefined
        expect(field.isDirty.value).toBe(true);
        expect(field.children[0].isDirty.value).toBe(true);
        // Children baseline stays undefined instead of the current input
        expect(field.children[0].initialInput.value).toBeUndefined();
        expect(field.children[0].startInput.value).toBeUndefined();
      }
    });

    test('should seed children baseline from raw initial and start input', () => {
      const store = createTestStore({ initialInput: { field: undefined } });
      const field = store.children.field;
      expect(field.kind).toBe('value');
      if (field.kind === 'value') {
        // Simulate a value field whose baseline holds a composite value
        field.initialInput.value = ['a'];
        field.startInput.value = ['a'];
        field.input.value = ['a', 'b'];
      }
      reconcileFieldStore(field, 'array');
      expect(field.kind).toBe('array');
      if (field.kind === 'array') {
        expect(field.children[0].initialInput.value).toBe('a');
        expect(field.children[0].startInput.value).toBe('a');
        expect(field.children[0].isDirty.value).toBe(false);
        expect(field.children[1].initialInput.value).toBeUndefined();
        expect(field.children[1].startInput.value).toBeUndefined();
        expect(field.children[1].isDirty.value).toBe(true);
        expect(field.initialItems.value).toHaveLength(1);
        expect(field.startItems.value).toHaveLength(1);
        expect(field.items.value).toHaveLength(2);
        // Field is dirty as items length differs from start items length
        expect(field.isDirty.value).toBe(true);
      }
    });

    test('should preserve base state and signal identity', () => {
      const store = createTestStore({ initialInput: { field: undefined } });
      const field = store.children.field;
      const errorsSignal = field.errors;
      const isTouchedSignal = field.isTouched;
      const isDirtySignal = field.isDirty;
      const initialInputSignal = field.initialInput;
      const startInputSignal = field.startInput;
      const inputSignal = field.input;
      const elements = field.elements;
      reconcileFieldStore(field, 'array');
      expect(field.kind).toBe('array');
      expect(field.name).toBe('["field"]');
      expect(field.errors).toBe(errorsSignal);
      expect(field.isTouched).toBe(isTouchedSignal);
      expect(field.isDirty).toBe(isDirtySignal);
      expect(field.initialInput).toBe(initialInputSignal);
      expect(field.startInput).toBe(startInputSignal);
      expect(field.input).toBe(inputSignal);
      expect(field.elements).toBe(elements);
    });
  });

  describe('strict mode', () => {
    test('should throw when object field is accessed as array', () => {
      const store = createTestStore({ initialInput: { user: {} } });
      expect(() => reconcileFieldStore(store.children.user, 'array')).toThrow(
        'Field store "["user"]" initialized as "object" cannot be accessed as "array"'
      );
    });

    test('should throw when array field is accessed as object', () => {
      const store = createTestStore({ initialInput: { items: [] } });
      expect(() => reconcileFieldStore(store.children.items, 'object')).toThrow(
        'Field store "["items"]" initialized as "array" cannot be accessed as "object"'
      );
    });

    test('should throw when value field holds incompatible value', () => {
      const store = createTestStore({ initialInput: { field: 'foo' } });
      expect(() => reconcileFieldStore(store.children.field, 'object')).toThrow(
        'Field store "["field"]" holds an incompatible value and cannot be accessed as "object"'
      );
      expect(() => reconcileFieldStore(store.children.field, 'array')).toThrow(
        'Field store "["field"]" holds an incompatible value and cannot be accessed as "array"'
      );
    });
  });

  describe('non-strict mode', () => {
    test('should do nothing when object field is accessed as array', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John' } },
      });
      const userStore = store.children.user;
      reconcileFieldStore(userStore, 'array', false);
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.children.name.input.value).toBe('John');
      }
    });

    test('should do nothing when value field holds incompatible value', () => {
      const store = createTestStore({ initialInput: { field: 'foo' } });
      const field = store.children.field;
      reconcileFieldStore(field, 'object', false);
      expect(field.kind).toBe('value');
      expect(field.input.value).toBe('foo');
    });
  });
});

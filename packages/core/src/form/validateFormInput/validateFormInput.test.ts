// @vitest-environment jsdom
import * as v from 'valibot';
import { describe, expect, test, vi } from 'vitest';
import * as z from 'zod';
import type { FormSchema, StandardSchemaV1 } from '../../types/index.ts';
import {
  arrayPath,
  createTestStore,
  objectPath,
  schemaIssue,
  validationIssue,
} from '../../vitest/index.ts';
import { validateFormInput } from './validateFormInput.ts';

describe('validateFormInput', () => {
  describe('successful validation', () => {
    test('should call schema validate with current form input', async () => {
      const store = createTestStore({
        initialInput: { name: 'John', tags: ['a', 'b'] },
      });

      await validateFormInput(store);

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
      expect(store.schema['~standard'].validate).toHaveBeenCalledWith({
        name: 'John',
        tags: ['a', 'b'],
      });
    });

    test('should return success result when no issues', async () => {
      const store = createTestStore({ initialInput: { name: 'John' } });

      const result = await validateFormInput(store);

      expect(result).toStrictEqual({ value: { name: 'John' } });
    });

    test('should set all field errors to null on success', async () => {
      const store = createTestStore({
        initialInput: { name: 'John', email: 'a@b.c' },
      });

      // Set some initial errors
      store.errors.value = ['root error'];
      store.children.name.errors.value = ['name error'];

      await validateFormInput(store);

      expect(store.errors.value).toBeNull();
      expect(store.children.name.errors.value).toBeNull();
      expect(store.children.email.errors.value).toBeNull();
    });
  });

  describe('root errors', () => {
    test('should assign root errors for issues without path', async () => {
      const store = createTestStore({
        initialInput: { name: 'John' },
        issues: [schemaIssue('Invalid type')],
      });

      await validateFormInput(store);

      expect(store.errors.value).toStrictEqual(['Invalid type']);
      expect(store.children.name.errors.value).toBeNull();
    });

    test('should assign root errors for issues with empty path', async () => {
      const store = createTestStore({
        initialInput: { name: 'John' },
        issues: [validationIssue('Invalid type', [])],
      });

      await validateFormInput(store);

      expect(store.errors.value).toStrictEqual(['Invalid type']);
    });

    test('should handle multiple root errors', async () => {
      const store = createTestStore({
        initialInput: { name: '' },
        issues: [
          schemaIssue('First root error'),
          schemaIssue('Second root error'),
        ],
      });

      await validateFormInput(store);

      expect(store.errors.value).toStrictEqual([
        'First root error',
        'Second root error',
      ]);
    });
  });

  describe('nested errors', () => {
    test('should assign nested errors for issues with segment path', async () => {
      const store = createTestStore({
        initialInput: { name: '' },
        issues: [validationIssue('Name is required', [objectPath('name')])],
      });

      await validateFormInput(store);

      expect(store.errors.value).toBeNull();
      expect(store.children.name.errors.value).toStrictEqual([
        'Name is required',
      ]);
    });

    test('should assign nested errors for issues with bare key path', async () => {
      const store = createTestStore({
        initialInput: { email: '' },
        issues: [validationIssue('Email is invalid', ['email'])],
      });

      await validateFormInput(store);

      expect(store.errors.value).toBeNull();
      expect(store.children.email.errors.value).toStrictEqual([
        'Email is invalid',
      ]);
    });

    test('should accumulate multiple errors on same field', async () => {
      const store = createTestStore({
        initialInput: { email: '' },
        issues: [
          validationIssue('Email is required', [objectPath('email')]),
          validationIssue('Invalid email format', ['email']),
        ],
      });

      await validateFormInput(store);

      expect(store.children.email.errors.value).toStrictEqual([
        'Email is required',
        'Invalid email format',
      ]);
    });

    test('should handle nested object path', async () => {
      const store = createTestStore({
        initialInput: { user: { name: '' } },
        issues: [
          validationIssue('Name is required', [
            objectPath('user'),
            objectPath('name'),
          ]),
        ],
      });

      await validateFormInput(store);

      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.errors.value).toBeNull();
        expect(userStore.children.name.errors.value).toStrictEqual([
          'Name is required',
        ]);
      }
    });
  });

  describe('array paths', () => {
    test('should handle segment path with array index', async () => {
      const store = createTestStore({
        initialInput: { items: ['a', ''] },
        issues: [
          validationIssue('Item is required', [
            objectPath('items'),
            arrayPath(1),
          ]),
        ],
      });

      await validateFormInput(store);

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.children[0].errors.value).toBeNull();
        expect(itemsStore.children[1].errors.value).toStrictEqual([
          'Item is required',
        ]);
      }
    });

    test('should resolve numeric string keys to array items', async () => {
      const store = createTestStore({
        initialInput: { todos: [{ label: '' }] },
        issues: [validationIssue('Label is required', ['todos', '0', 'label'])],
      });

      await validateFormInput(store);

      const todosStore = store.children.todos;
      expect(todosStore.kind).toBe('array');
      if (todosStore.kind === 'array') {
        const itemStore = todosStore.children[0];
        expect(itemStore.kind).toBe('object');
        if (itemStore.kind === 'object') {
          expect(itemStore.children.label.errors.value).toStrictEqual([
            'Label is required',
          ]);
        }
      }
    });

    test('should handle bare key path into array of objects', async () => {
      const store = createTestStore({
        initialInput: { todos: [{ label: '' }] },
        issues: [validationIssue('Label is required', ['todos', 0, 'label'])],
      });

      await validateFormInput(store);

      const todosStore = store.children.todos;
      expect(todosStore.kind).toBe('array');
      if (todosStore.kind === 'array') {
        const itemStore = todosStore.children[0];
        expect(itemStore.kind).toBe('object');
        if (itemStore.kind === 'object') {
          expect(itemStore.children.label.errors.value).toStrictEqual([
            'Label is required',
          ]);
        }
      }
    });
  });

  describe('path clamping', () => {
    test('should attach error to deepest reachable field at symbol keys', async () => {
      const store = createTestStore({
        initialInput: { nested: { child: '' } },
        issues: [validationIssue('Symbol key error', ['nested', Symbol('x')])],
      });

      await validateFormInput(store);

      // Path resolution stops at symbol key, so error is assigned to 'nested'
      expect(store.errors.value).toBeNull();
      const nestedStore = store.children.nested;
      expect(nestedStore.errors.value).toStrictEqual(['Symbol key error']);
      expect(nestedStore.kind).toBe('object');
      if (nestedStore.kind === 'object') {
        expect(nestedStore.children.child.errors.value).toBeNull();
      }
    });

    test('should assign root errors for path starting with symbol key', async () => {
      const store = createTestStore({
        initialInput: { name: '' },
        issues: [validationIssue('Symbol key error', [Symbol('x'), 'name'])],
      });

      await validateFormInput(store);

      // No path segment is reachable, so error is assigned to the root
      expect(store.errors.value).toStrictEqual(['Symbol key error']);
      expect(store.children.name.errors.value).toBeNull();
    });

    test('should attach error to nearest ancestor for missing object child', async () => {
      const store = createTestStore({
        initialInput: { user: { name: '' } },
        issues: [validationIssue('Unknown field error', ['user', 'unknown'])],
      });

      await validateFormInput(store);

      // Resolution stops at missing 'unknown' child, so error lands on 'user'
      expect(store.errors.value).toBeNull();
      expect(store.children.user.errors.value).toStrictEqual([
        'Unknown field error',
      ]);
    });

    test('should assign root errors for fully unknown top-level path', async () => {
      const store = createTestStore({
        initialInput: { name: '' },
        issues: [validationIssue('Unknown field error', ['missing', 'deep'])],
      });

      await validateFormInput(store);

      expect(store.errors.value).toStrictEqual(['Unknown field error']);
      expect(store.children.name.errors.value).toBeNull();
    });

    test('should attach error to value field for path beyond leaf', async () => {
      const store = createTestStore({
        initialInput: { email: '' },
        issues: [validationIssue('Leaf error', ['email', 'extra'])],
      });

      await validateFormInput(store);

      // Value fields have no children, so error is assigned to 'email'
      expect(store.errors.value).toBeNull();
      expect(store.children.email.errors.value).toStrictEqual(['Leaf error']);
    });

    test('should attach error to array field for index out of bounds', async () => {
      const store = createTestStore({
        initialInput: { todos: [{ label: '' }] },
        issues: [validationIssue('Hidden item error', ['todos', 1, 'label'])],
      });

      await validateFormInput(store);

      // Index 1 exceeds the visible items, so error lands on the array itself
      const todosStore = store.children.todos;
      expect(todosStore.errors.value).toStrictEqual(['Hidden item error']);
      expect(todosStore.kind).toBe('array');
      if (todosStore.kind === 'array') {
        expect(todosStore.children[0].errors.value).toBeNull();
      }
    });

    test('should attach error to array field for non-numeric index', async () => {
      const store = createTestStore({
        initialInput: { todos: ['a'] },
        issues: [validationIssue('String index error', ['todos', 'foo'])],
      });

      await validateFormInput(store);

      // Array fields only resolve numeric keys, so error lands on the array
      const todosStore = store.children.todos;
      expect(todosStore.errors.value).toStrictEqual(['String index error']);
      expect(todosStore.kind).toBe('array');
      if (todosStore.kind === 'array') {
        expect(todosStore.children[0].errors.value).toBeNull();
      }
    });
  });

  describe('focus behavior', () => {
    test('should focus first error field when shouldFocus is true', async () => {
      const store = createTestStore({
        initialInput: { name: '', email: '' },
        issues: [
          validationIssue('Name is required', [objectPath('name')]),
          validationIssue('Email is required', [objectPath('email')]),
        ],
      });

      const inputElement = document.createElement('input');
      const mockFocus = vi.spyOn(inputElement, 'focus');
      store.children.name.elements = [inputElement];

      await validateFormInput(store, { shouldFocus: true });

      expect(mockFocus).toHaveBeenCalledOnce();
    });

    test('should not focus when shouldFocus is false', async () => {
      const store = createTestStore({
        initialInput: { name: '' },
        issues: [validationIssue('Name is required', [objectPath('name')])],
      });

      const inputElement = document.createElement('input');
      const mockFocus = vi.spyOn(inputElement, 'focus');
      store.children.name.elements = [inputElement];

      await validateFormInput(store, { shouldFocus: false });

      expect(mockFocus).not.toHaveBeenCalled();
    });

    test('should not focus when shouldFocus is undefined', async () => {
      const store = createTestStore({
        initialInput: { name: '' },
        issues: [validationIssue('Name is required', [objectPath('name')])],
      });

      const inputElement = document.createElement('input');
      const mockFocus = vi.spyOn(inputElement, 'focus');
      store.children.name.elements = [inputElement];

      await validateFormInput(store);

      expect(mockFocus).not.toHaveBeenCalled();
    });

    test('should only focus first field with error', async () => {
      const store = createTestStore({
        initialInput: { name: '', email: '' },
        issues: [
          validationIssue('Name is required', [objectPath('name')]),
          validationIssue('Email is required', [objectPath('email')]),
        ],
      });

      const nameInput = document.createElement('input');
      const emailInput = document.createElement('input');
      const mockFocusName = vi.spyOn(nameInput, 'focus');
      const mockFocusEmail = vi.spyOn(emailInput, 'focus');
      store.children.name.elements = [nameInput];
      store.children.email.elements = [emailInput];

      await validateFormInput(store, { shouldFocus: true });

      expect(mockFocusName).toHaveBeenCalledOnce();
      expect(mockFocusEmail).not.toHaveBeenCalled();
    });
  });

  describe('validation state management', () => {
    test('should set isValidating to true while async validation is pending', async () => {
      let resolveValidation: (result: StandardSchemaV1.Result<unknown>) => void;
      const schema: FormSchema = {
        '~standard': {
          version: 1,
          vendor: 'formisch-test',
          validate: () =>
            new Promise<StandardSchemaV1.Result<unknown>>((resolve) => {
              resolveValidation = resolve;
            }),
        },
      };
      const store = createTestStore({
        schema,
        initialInput: { name: 'John' },
      });

      const validation = validateFormInput(store);

      expect(store.validators).toBe(1);
      expect(store.isValidating.value).toBe(true);

      resolveValidation!({ value: { name: 'John' } });
      await validation;

      expect(store.validators).toBe(0);
      expect(store.isValidating.value).toBe(false);
    });

    test('should handle synchronous validation results', async () => {
      const store = createTestStore({ initialInput: { name: 'John' } });

      expect(store.validators).toBe(0);
      const result = await validateFormInput(store);

      expect(result).toStrictEqual({ value: { name: 'John' } });
      expect(store.validators).toBe(0);
      expect(store.isValidating.value).toBe(false);
    });

    test('should handle concurrent validations', async () => {
      let resolveFirst: (result: StandardSchemaV1.Result<unknown>) => void;
      let resolveSecond: (result: StandardSchemaV1.Result<unknown>) => void;

      const validateFirst = new Promise<StandardSchemaV1.Result<unknown>>(
        (resolve) => {
          resolveFirst = resolve;
        }
      );
      const validateSecond = new Promise<StandardSchemaV1.Result<unknown>>(
        (resolve) => {
          resolveSecond = resolve;
        }
      );

      let callCount = 0;
      const schema: FormSchema = {
        '~standard': {
          version: 1,
          vendor: 'formisch-test',
          validate: vi.fn(() => {
            callCount++;
            return callCount === 1 ? validateFirst : validateSecond;
          }),
        },
      };
      const store = createTestStore({
        schema,
        initialInput: { name: 'John' },
      });

      // Start two validations
      const validation1 = validateFormInput(store);
      const validation2 = validateFormInput(store);

      expect(store.validators).toBe(2);
      expect(store.isValidating.value).toBe(true);

      // Resolve first validation
      resolveFirst!({ value: { name: 'John' } });
      await validation1;

      expect(store.validators).toBe(1);
      expect(store.isValidating.value).toBe(true);

      // Resolve second validation
      resolveSecond!({ value: { name: 'Jane' } });
      await validation2;

      expect(store.validators).toBe(0);
      expect(store.isValidating.value).toBe(false);
    });

    test('should restore validation state when schema throws synchronously', async () => {
      const schema: FormSchema = {
        '~standard': {
          version: 1,
          vendor: 'formisch-test',
          validate: () => {
            throw new Error('Validation crashed');
          },
        },
      };
      const store = createTestStore({
        schema,
        initialInput: { name: 'John' },
      });

      await expect(validateFormInput(store)).rejects.toThrow(
        'Validation crashed'
      );

      expect(store.validators).toBe(0);
      expect(store.isValidating.value).toBe(false);
    });

    test('should restore validation state when async schema rejects', async () => {
      const schema: FormSchema = {
        '~standard': {
          version: 1,
          vendor: 'formisch-test',
          validate: () => Promise.reject(new Error('Validation crashed')),
        },
      };
      const store = createTestStore({
        schema,
        initialInput: { name: 'John' },
      });

      await expect(validateFormInput(store)).rejects.toThrow(
        'Validation crashed'
      );

      expect(store.validators).toBe(0);
      expect(store.isValidating.value).toBe(false);
    });
  });

  describe('end-to-end with real schema libraries', () => {
    test('should map issues of Zod schema to field errors', async () => {
      const schema = z.object({
        email: z.email('Email is invalid'),
        todos: z.array(
          z.object({ label: z.string().min(1, 'Label is required') })
        ),
      });
      const store = createTestStore({
        schema,
        initialInput: { email: 'invalid', todos: [{ label: '' }] },
      });

      const result = await validateFormInput(store);

      expect(result.issues).toBeDefined();
      expect(store.errors.value).toBeNull();
      expect(store.children.email.errors.value).toStrictEqual([
        'Email is invalid',
      ]);
      const todosStore = store.children.todos;
      expect(todosStore.kind).toBe('array');
      if (todosStore.kind === 'array') {
        const itemStore = todosStore.children[0];
        expect(itemStore.kind).toBe('object');
        if (itemStore.kind === 'object') {
          expect(itemStore.children.label.errors.value).toStrictEqual([
            'Label is required',
          ]);
        }
      }
    });

    test('should return success result of Zod schema', async () => {
      const schema = z.object({
        email: z.email('Email is invalid'),
        todos: z.array(
          z.object({ label: z.string().min(1, 'Label is required') })
        ),
      });
      const store = createTestStore({
        schema,
        initialInput: { email: 'jane@example.com', todos: [{ label: 'Foo' }] },
      });

      const result = await validateFormInput(store);

      expect(result).toStrictEqual({
        value: { email: 'jane@example.com', todos: [{ label: 'Foo' }] },
      });
      expect(store.errors.value).toBeNull();
      expect(store.children.email.errors.value).toBeNull();
    });

    test('should map issues of Valibot schema to field errors', async () => {
      const schema = v.object({
        email: v.pipe(v.string(), v.email('Email is invalid')),
        todos: v.array(
          v.object({
            label: v.pipe(v.string(), v.nonEmpty('Label is required')),
          })
        ),
      });
      const store = createTestStore({
        schema,
        initialInput: { email: 'invalid', todos: [{ label: '' }] },
      });

      const result = await validateFormInput(store);

      expect(result.issues).toBeDefined();
      expect(store.errors.value).toBeNull();
      expect(store.children.email.errors.value).toStrictEqual([
        'Email is invalid',
      ]);
      const todosStore = store.children.todos;
      expect(todosStore.kind).toBe('array');
      if (todosStore.kind === 'array') {
        const itemStore = todosStore.children[0];
        expect(itemStore.kind).toBe('object');
        if (itemStore.kind === 'object') {
          expect(itemStore.children.label.errors.value).toStrictEqual([
            'Label is required',
          ]);
        }
      }
    });

    test('should return success result of Valibot schema', async () => {
      const schema = v.object({
        email: v.pipe(v.string(), v.email('Email is invalid')),
      });
      const store = createTestStore({
        schema,
        initialInput: { email: 'jane@example.com' },
      });

      const result = await validateFormInput(store);

      expect(result.issues).toBeUndefined();
      if (!result.issues) {
        expect(result.value).toStrictEqual({ email: 'jane@example.com' });
      }
      expect(store.errors.value).toBeNull();
      expect(store.children.email.errors.value).toBeNull();
    });
  });
});

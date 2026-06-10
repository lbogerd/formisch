// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest';
import {
  createTestStore,
  objectPath,
  validationIssue,
} from '../vitest/index.ts';
import { validate } from './validate.ts';

describe('validate', () => {
  test('should validate form and return success result', async () => {
    const store = createTestStore({
      initialInput: { name: 'John' },
    });

    const result = await validate(store);

    expect(result.issues).toBeUndefined();
    expect(result.issues ? undefined : result.value).toEqual({ name: 'John' });
  });

  test('should return failure result when validation fails', async () => {
    const store = createTestStore({
      initialInput: { name: '' },
      issues: [validationIssue('Name is required', [objectPath('name')])],
    });

    const result = await validate(store);

    expect(result.issues).toEqual([
      validationIssue('Name is required', [objectPath('name')]),
    ]);
  });

  test('should set errors on field stores when validation fails', async () => {
    const store = createTestStore({
      initialInput: { name: '' },
      issues: [validationIssue('Name is required', [objectPath('name')])],
    });

    await validate(store);

    expect(store.children.name.errors.value).toEqual(['Name is required']);
  });

  test('should focus first error field when shouldFocus is true', async () => {
    const store = createTestStore({
      initialInput: { name: undefined },
      issues: [validationIssue('Name is required', [objectPath('name')])],
    });
    const input = document.createElement('input');
    const focusSpy = vi.spyOn(input, 'focus');
    store.children.name.elements = [input];

    await validate(store, { shouldFocus: true });

    expect(focusSpy).toHaveBeenCalledOnce();
  });

  test('should not focus when shouldFocus is false', async () => {
    const store = createTestStore({
      initialInput: { name: undefined },
      issues: [validationIssue('Name is required', [objectPath('name')])],
    });
    const input = document.createElement('input');
    const focusSpy = vi.spyOn(input, 'focus');
    store.children.name.elements = [input];

    await validate(store, { shouldFocus: false });

    expect(focusSpy).not.toHaveBeenCalled();
  });
});

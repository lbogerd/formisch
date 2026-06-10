import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { validateIfRequired } from './validateIfRequired.ts';

describe('validateIfRequired', () => {
  describe('validate = initial', () => {
    test('should use revalidate mode when validate is initial', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'initial',
        revalidate: 'input',
      });

      // When validate='initial', it should use revalidate mode
      // So 'input' mode should trigger validation
      validateIfRequired(store, store.children.name, 'input');

      // Validation triggered because mode matches revalidate
      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });

    test('should not validate when mode does not match revalidate', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'initial',
        revalidate: 'input',
      });

      validateIfRequired(store, store.children.name, 'blur');

      expect(store.schema['~standard'].validate).not.toHaveBeenCalled();
    });
  });

  describe('validate = submit', () => {
    test('should use revalidate mode when form is submitted', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'submit',
        revalidate: 'input',
      });

      // Mark form as submitted
      store.isSubmitted.value = true;

      validateIfRequired(store, store.children.name, 'input');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });

    test('should use validate mode when form is not submitted', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'submit',
        revalidate: 'input',
      });

      // Form is not submitted (default)
      validateIfRequired(store, store.children.name, 'submit');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });

    test('should not validate when mode does not match and not submitted', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'submit',
        revalidate: 'input',
      });

      // Form is not submitted, mode is 'input' but validate='submit'
      validateIfRequired(store, store.children.name, 'input');

      expect(store.schema['~standard'].validate).not.toHaveBeenCalled();
    });
  });

  describe('validate = input (non-submit, non-initial)', () => {
    test('should use revalidate mode when field has errors', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'input',
        revalidate: 'blur',
      });

      // Set error on field
      store.children.name.errors.value = ['Error'];

      validateIfRequired(store, store.children.name, 'blur');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });

    test('should use validate mode when field has no errors', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'input',
        revalidate: 'blur',
      });

      // No errors on field
      validateIfRequired(store, store.children.name, 'input');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });

    test('should not validate when mode does not match and no errors', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'input',
        revalidate: 'blur',
      });

      // No errors, mode is 'blur' but validate='input'
      validateIfRequired(store, store.children.name, 'blur');

      expect(store.schema['~standard'].validate).not.toHaveBeenCalled();
    });
  });

  describe('validate = blur', () => {
    test('should validate on blur when no errors', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'blur',
        revalidate: 'input',
      });

      validateIfRequired(store, store.children.name, 'blur');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });

    test('should validate on input when has errors (revalidate)', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'blur',
        revalidate: 'input',
      });

      store.children.name.errors.value = ['Error'];

      validateIfRequired(store, store.children.name, 'input');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });
  });

  describe('validate = touch', () => {
    test('should validate on touch when no errors', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'touch',
        revalidate: 'change',
      });

      validateIfRequired(store, store.children.name, 'touch');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });

    test('should validate on change when has errors (revalidate)', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'touch',
        revalidate: 'change',
      });

      store.children.name.errors.value = ['Error'];

      validateIfRequired(store, store.children.name, 'change');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });
  });

  describe('validate = change', () => {
    test('should validate on change when no errors', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'change',
        revalidate: 'blur',
      });

      validateIfRequired(store, store.children.name, 'change');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });

    test('should validate on blur when has errors (revalidate)', () => {
      const store = createTestStore({
        initialInput: { name: '' },
        validate: 'change',
        revalidate: 'blur',
      });

      store.children.name.errors.value = ['Error'];

      validateIfRequired(store, store.children.name, 'blur');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });
  });

  describe('nested field errors', () => {
    test('should check nested field errors for arrays', () => {
      const store = createTestStore({
        initialInput: { items: ['a', 'b'] },
        validate: 'blur',
        revalidate: 'input',
      });

      // Set error on nested field
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        itemsStore.children[0].errors.value = ['Error'];
      }

      // getFieldBool should detect nested error
      validateIfRequired(store, store.children.items, 'input');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });

    test('should check nested field errors for objects', () => {
      const store = createTestStore({
        initialInput: { user: { name: '' } },
        validate: 'blur',
        revalidate: 'input',
      });

      // Set error on nested field
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        userStore.children.name.errors.value = ['Error'];
      }

      // getFieldBool should detect nested error
      validateIfRequired(store, store.children.user, 'input');

      expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
    });
  });

  describe('mode matching', () => {
    test.each([
      ['initial', 'touch', 'touch'],
      ['initial', 'input', 'input'],
      ['initial', 'change', 'change'],
      ['initial', 'blur', 'blur'],
      ['initial', 'submit', 'submit'],
    ] as const)(
      'validate=%s with revalidate=%s should match mode=%s',
      (validate, revalidate, mode) => {
        const store = createTestStore({
          initialInput: { name: '' },
          validate,
          revalidate,
        });

        validateIfRequired(store, store.children.name, mode);

        expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
      }
    );

    test.each([
      ['touch', 'touch'],
      ['input', 'input'],
      ['change', 'change'],
      ['blur', 'blur'],
      ['submit', 'submit'],
    ] as const)(
      'validate=%s (no errors) should match mode=%s',
      (validate, mode) => {
        const store = createTestStore({
          initialInput: { name: '' },
          validate,
          revalidate: 'input',
        });

        validateIfRequired(store, store.children.name, mode);

        expect(store.schema['~standard'].validate).toHaveBeenCalledOnce();
      }
    );
  });
});

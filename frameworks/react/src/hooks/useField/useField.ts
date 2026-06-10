import {
  type FormSchema,
  getElementInput,
  getFieldBool,
  getFieldInput,
  getFieldStore,
  INTERNAL,
  type RequiredPath,
  setFieldBool,
  setFieldInput,
  type StandardSchemaV1,
  untrack,
  validateIfRequired,
  type ValidPath,
} from '@formisch/core/react';
import { useEffect, useMemo } from 'react';
import type { FieldStore, FormStore } from '../../types/index.ts';
import { useSignals } from '../useSignals/index.ts';

/**
 * Use field config interface.
 */
export interface UseFieldConfig<
  TSchema extends FormSchema = FormSchema,
  TFieldPath extends RequiredPath = RequiredPath,
> {
  /**
   * The path to the field within the form schema.
   */
  readonly path: ValidPath<StandardSchemaV1.InferInput<TSchema>, TFieldPath>;
}

/**
 * Creates a reactive field store of a specific field within a form store.
 *
 * @param form The form store instance.
 * @param config The field configuration.
 *
 * @returns The field store with reactive properties and element props.
 */
export function useField<
  TSchema extends FormSchema,
  TFieldPath extends RequiredPath,
>(
  form: FormStore<TSchema>,
  config: UseFieldConfig<TSchema, TFieldPath>
): FieldStore<TSchema, TFieldPath>;

// @__NO_SIDE_EFFECTS__
export function useField(form: FormStore, config: UseFieldConfig): FieldStore {
  useSignals();

  const internalFormStore = form[INTERNAL];
  const internalFieldStore = getFieldStore(internalFormStore, config.path);

  useEffect(() => {
    // If the form was already submitted, revalidate after mount so that
    // lazily created fields (e.g. a union branch that mounts after the
    // discriminator changes) pick up their validation errors. The last
    // validation ran before these fields were part of the form input.
    if (untrack(() => internalFormStore.isSubmitted.value)) {
      validateIfRequired(internalFormStore, internalFieldStore, 'input');
    }
    return () => {
      internalFieldStore.elements = internalFieldStore.elements.filter(
        (element) => element.isConnected
      );
    };
  }, [internalFormStore, internalFieldStore]);

  return useMemo(
    () => ({
      path: config.path,
      get input() {
        return getFieldInput(internalFieldStore);
      },
      get errors() {
        return internalFieldStore.errors.value;
      },
      get isTouched() {
        return getFieldBool(internalFieldStore, 'isTouched');
      },
      get isDirty() {
        return getFieldBool(internalFieldStore, 'isDirty');
      },
      get isValid() {
        return !getFieldBool(internalFieldStore, 'errors');
      },
      onChange(value) {
        setFieldInput(internalFormStore, config.path, value);
        validateIfRequired(internalFormStore, internalFieldStore, 'input');
        validateIfRequired(internalFormStore, internalFieldStore, 'change');
      },
      props: {
        name: internalFieldStore.name,
        autoFocus: !!internalFieldStore.errors.value,
        ref(element) {
          if (element) {
            internalFieldStore.elements.push(element);
          }
        },
        onFocus() {
          setFieldBool(internalFieldStore, 'isTouched', true);
          validateIfRequired(internalFormStore, internalFieldStore, 'touch');
        },
        onChange(event) {
          setFieldInput(
            internalFormStore,
            config.path,
            getElementInput(event.currentTarget, internalFieldStore)
          );
          validateIfRequired(internalFormStore, internalFieldStore, 'input');
          validateIfRequired(internalFormStore, internalFieldStore, 'change');
        },
        onBlur() {
          validateIfRequired(internalFormStore, internalFieldStore, 'blur');
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [internalFormStore, internalFieldStore]
  );
}

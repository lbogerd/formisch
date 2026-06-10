import {
  type FormSchema,
  getFieldBool,
  getFieldStore,
  INTERNAL,
  type InternalArrayStore,
  type RequiredPath,
  type StandardSchemaV1,
  type ValidArrayPath,
} from '@formisch/core/react';
import { useMemo } from 'react';
import type { FieldArrayStore, FormStore } from '../../types/index.ts';
import { useSignals } from '../useSignals/index.ts';

/**
 * Use field array config interface.
 */
export interface UseFieldArrayConfig<
  TSchema extends FormSchema = FormSchema,
  TFieldArrayPath extends RequiredPath = RequiredPath,
> {
  /**
   * The path to the array field within the form schema.
   */
  readonly path: ValidArrayPath<
    StandardSchemaV1.InferInput<TSchema>,
    TFieldArrayPath
  >;
}

/**
 * Creates a reactive field array store of a specific field array within a form store.
 *
 * @param form The form store instance.
 * @param config The field array configuration.
 *
 * @returns The field array store with reactive properties for array management.
 */
export function useFieldArray<
  TSchema extends FormSchema,
  TFieldArrayPath extends RequiredPath,
>(
  form: FormStore<TSchema>,
  config: UseFieldArrayConfig<TSchema, TFieldArrayPath>
): FieldArrayStore<TSchema, TFieldArrayPath>;

// @__NO_SIDE_EFFECTS__
export function useFieldArray(
  form: FormStore,
  config: UseFieldArrayConfig
): FieldArrayStore {
  useSignals();

  const internalFormStore = form[INTERNAL];
  // Hint: The 'array' kind upgrades field stores of array fields that are
  // missing from the initial input. This mutation is idempotent, so repeated
  // renders (e.g. React strict mode) are safe.
  const internalFieldStore = getFieldStore(
    internalFormStore,
    config.path,
    'array'
  ) as InternalArrayStore;

  return useMemo(
    () => ({
      path: config.path,
      get items() {
        return internalFieldStore.items.value;
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [internalFormStore, internalFieldStore]
  );
}

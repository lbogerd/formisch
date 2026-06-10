import {
  type BaseFormStore,
  type FormSchema,
  getFieldStore,
  INTERNAL,
  type RequiredPath,
  type StandardSchemaV1,
  type ValidPath,
} from '@formisch/core';

/**
 * Focus field config interface.
 */
export interface FocusFieldConfig<
  TSchema extends FormSchema,
  TFieldPath extends RequiredPath,
> {
  /**
   * The path to the field to focus.
   */
  readonly path: ValidPath<StandardSchemaV1.InferInput<TSchema>, TFieldPath>;
}

/**
 * Focuses the first input element of a field. This is useful for
 * programmatically setting focus to a specific field, such as after
 * validation errors or user interactions.
 *
 * @param form The form store containing the field.
 * @param config The focus field configuration.
 */
export function focus<
  TSchema extends FormSchema,
  TFieldPath extends RequiredPath,
>(
  form: BaseFormStore<TSchema>,
  config: FocusFieldConfig<TSchema, TFieldPath>
): void {
  getFieldStore(form[INTERNAL], config.path).elements[0]?.focus();
}

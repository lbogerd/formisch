import {
  type BaseFormStore,
  type FormSchema,
  INTERNAL,
  type StandardSchemaV1,
  validateFormInput,
} from '@formisch/core';

/**
 * Validate form config interface.
 */
export interface ValidateFormConfig {
  /**
   * Whether to focus the first field with errors after validation. Defaults to false.
   */
  readonly shouldFocus?: boolean | undefined;
}

/**
 * Validates the entire form input against its schema. Returns a Standard
 * Schema result indicating success (`value`) or failure (`issues`).
 * Optionally focuses the first field with validation errors.
 *
 * @param form The form store to validate.
 * @param config The validate form configuration specifying focus behavior.
 *
 * @returns A promise resolving to the validation result.
 */
export function validate<TSchema extends FormSchema>(
  form: BaseFormStore<TSchema>,
  config?: ValidateFormConfig
): Promise<StandardSchemaV1.Result<StandardSchemaV1.InferOutput<TSchema>>> {
  return validateFormInput(form[INTERNAL], config) as Promise<
    StandardSchemaV1.Result<StandardSchemaV1.InferOutput<TSchema>>
  >;
}

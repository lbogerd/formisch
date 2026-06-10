import type { NoSerialize } from '@qwik.dev/core';
import type { INTERNAL } from '../../values.ts';
import type { InternalObjectStore } from '../field/field.qwik.ts';
import type { FormSchema } from '../schema/index.ts';
import type { StandardSchemaV1 } from '../schema/standard.ts';
import type { Signal } from '../signal/index.ts';
import type {
  SubmitEventHandler,
  SubmitHandler,
  ValidationMode,
} from './form.ts';

/**
 * Form config interface.
 */
export interface FormConfig<TSchema extends FormSchema = FormSchema> {
  /**
   * The schema of the form.
   */
  readonly schema: TSchema;
  /**
   * The initial input of the form.
   *
   * Hint: The field structure of the form is derived from this value, so it
   * is required and must be a plain object.
   */
  readonly initialInput: StandardSchemaV1.InferInput<TSchema>;
  /**
   * The validation mode of the form.
   */
  readonly validate?: ValidationMode | undefined;
  /**
   * The revalidation mode of the form.
   */
  readonly revalidate?: Exclude<ValidationMode, 'initial'> | undefined;
}

/**
 * Internal form store interface.
 */
export interface InternalFormStore<TSchema extends FormSchema = FormSchema>
  extends InternalObjectStore {
  /**
   * The element of the form.
   */
  element?: HTMLFormElement | undefined;

  /**
   * The number of active validators.
   */
  validators: number;
  /**
   * The validation mode of the form.
   */
  validate: ValidationMode;
  /**
   * The revalidation mode of the form.
   */
  revalidate: Exclude<ValidationMode, 'initial'>;
  /**
   * The schema of the form.
   */
  schema: NoSerialize<TSchema>;

  /**
   * The submitting state of the form.
   */
  isSubmitting: Signal<boolean>;
  /**
   * The submitted state of the form.
   */
  isSubmitted: Signal<boolean>;
  /**
   * The validating state of the form.
   */
  isValidating: Signal<boolean>;
}

/**
 * Base form store interface.
 */
export interface BaseFormStore<TSchema extends FormSchema = FormSchema> {
  /**
   * The internal form store.
   *
   * @internal
   */
  readonly [INTERNAL]: InternalFormStore<TSchema>;
}

export type { ValidationMode, SubmitHandler, SubmitEventHandler };

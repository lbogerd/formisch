import type { FormEvent } from 'react';
import type { FormSchema } from '../schema/index.ts';
import type { StandardSchemaV1 } from '../schema/standard.ts';
import type { MaybePromise } from '../utils/index.ts';

// Re-export all other types from the base form module
export type {
  ValidationMode,
  FormConfig,
  InternalFormStore,
  BaseFormStore,
} from './form.ts';

/**
 * Submit handler type.
 */
export type SubmitHandler<TSchema extends FormSchema> = (
  output: StandardSchemaV1.InferOutput<TSchema>
) => MaybePromise<unknown>;

/**
 * Submit event handler type.
 */
export type SubmitEventHandler<TSchema extends FormSchema> = (
  output: StandardSchemaV1.InferOutput<TSchema>,
  event: FormEvent<HTMLFormElement>
) => MaybePromise<unknown>;

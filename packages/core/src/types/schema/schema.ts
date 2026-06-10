import type { StandardSchemaV1 } from './standard.ts';

/**
 * Schema type. Any Standard Schema is supported.
 */
export type Schema = StandardSchemaV1;

/**
 * Form schema type.
 *
 * Hint: Forms must have an object root. Standard Schema cannot express this
 * structurally, so the inferred input type is constrained instead. The runtime
 * check lives in `createFormStore`, which throws if `initialInput` is not a
 * plain object.
 */
export type FormSchema = StandardSchemaV1<Record<string, unknown>, unknown>;

import { vi } from 'vitest';
import { createFormStore } from '../form/createFormStore/createFormStore.ts';
import type {
  FormSchema,
  InternalFormStore,
  StandardSchemaV1,
  ValidationMode,
} from '../types/index.ts';

/**
 * Configuration options for creating a test schema.
 */
interface CreateTestSchemaConfig {
  issues?: StandardSchemaV1.Issue[] | undefined;
}

/**
 * Creates a mock Standard Schema for testing. The schema's validate function
 * returns the provided issues, or the input value as successful output.
 *
 * @param config Optional configuration for the schema.
 *
 * @returns A mock Standard Schema.
 */
export function createTestSchema(
  config: CreateTestSchemaConfig = {}
): FormSchema {
  return {
    '~standard': {
      version: 1,
      vendor: 'formisch-test',
      validate: vi.fn((value: unknown) =>
        config.issues?.length
          ? { issues: config.issues }
          : { value: value as Record<string, unknown> }
      ),
    },
  };
}

/**
 * Configuration options for creating a test store.
 */
interface CreateTestStoreConfig {
  schema?: FormSchema | undefined;
  validate?: ValidationMode | undefined;
  revalidate?: Exclude<ValidationMode, 'initial'> | undefined;
  initialInput?: Record<string, unknown> | undefined;
  issues?: StandardSchemaV1.Issue[] | undefined;
}

/**
 * Creates a form store for testing. The field structure is derived from the
 * initial input. Unless a schema is provided, a mock Standard Schema is used
 * whose validate function returns the configured issues, or the input value
 * as successful output.
 *
 * @param config Optional configuration for the store.
 *
 * @returns An internal form store for testing.
 */
export function createTestStore(
  config: CreateTestStoreConfig = {}
): InternalFormStore {
  const { schema, validate, revalidate, initialInput, issues } = config;
  return createFormStore({
    schema: schema ?? createTestSchema({ issues }),
    initialInput: initialInput ?? {},
    validate,
    revalidate,
  });
}

/**
 * Creates an object path segment for testing validation issues.
 *
 * @param key The object key.
 *
 * @returns An object path segment.
 */
export function objectPath(key: string): StandardSchemaV1.PathSegment {
  return { key };
}

/**
 * Creates an array path segment for testing validation issues.
 *
 * @param key The array index.
 *
 * @returns An array path segment.
 */
export function arrayPath(key: number): StandardSchemaV1.PathSegment {
  return { key };
}

/**
 * Creates a validation issue for testing.
 *
 * @param message The error message.
 * @param path The path to the field.
 *
 * @returns A Standard Schema issue object.
 */
export function validationIssue(
  message: string,
  path?: ReadonlyArray<PropertyKey | StandardSchemaV1.PathSegment>
): StandardSchemaV1.Issue {
  return { message, path };
}

/**
 * Creates a schema-level issue for testing.
 *
 * @param message The error message.
 *
 * @returns A Standard Schema issue object.
 */
export function schemaIssue(message: string): StandardSchemaV1.Issue {
  return { message };
}

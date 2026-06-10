import {
  type BaseFormStore,
  createFormStore,
  type FormSchema,
  initializeFieldStore,
  INTERNAL,
  type InternalArrayStore,
  type InternalFormStore,
  type PathKey,
  type StandardSchemaV1,
  type ValidationMode,
} from '@formisch/core';
import { vi } from 'vitest';

/**
 * Configuration options for creating a test store.
 */
interface CreateTestStoreConfig<
  TInput extends Record<string, unknown> = Record<string, unknown>,
> {
  validate?: ValidationMode | undefined;
  revalidate?: Exclude<ValidationMode, 'initial'> | undefined;
  initialInput?: TInput | undefined;
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
  config: { issues?: StandardSchemaV1.Issue[] | undefined } = {}
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
 * Creates a form store for testing with a mock Standard Schema. The field
 * structure is derived from the initial input, and the schema's input type is
 * inferred from it so that paths stay fully type-checked.
 *
 * @param config Optional configuration for the store.
 *
 * @returns A form store for testing with access to internal state.
 */
export function createTestStore<
  TInput extends Record<string, unknown> = Record<string, unknown>,
>(
  config: CreateTestStoreConfig<TInput> = {}
): BaseFormStore<StandardSchemaV1<TInput, TInput>> & InternalFormStore {
  const {
    validate = 'submit',
    revalidate = 'input',
    initialInput,
    issues,
  } = config;

  // Create internal form store using the real core function
  const internalStore = createFormStore({
    schema: createTestSchema({ issues }),
    initialInput: initialInput ?? {},
    validate,
    revalidate,
  });

  // Create a wrapper object that has both INTERNAL and direct properties
  // This mimics how BaseFormStore works
  const wrapper = {
    [INTERNAL]: internalStore,
  } as BaseFormStore<StandardSchemaV1<TInput, TInput>> & InternalFormStore;

  // Proxy all properties from internal to wrapper for easy access
  for (const key of Object.keys(internalStore)) {
    Object.defineProperty(wrapper, key, {
      get() {
        return (internalStore as unknown as Record<string, unknown>)[key];
      },
      set(value: unknown) {
        (internalStore as unknown as Record<string, unknown>)[key] = value;
      },
      enumerable: true,
    });
  }

  return wrapper;
}

/**
 * Creates an object path segment for testing validation issues.
 *
 * @param key The key of the object property.
 *
 * @returns An object path segment.
 */
export function objectPath(key: string): StandardSchemaV1.PathSegment {
  return { key };
}

/**
 * Creates an array path segment for testing validation issues.
 *
 * @param key The index of the array item.
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
 * @param path The path to the issue location.
 *
 * @returns A validation issue object.
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
 * @returns A schema issue object.
 */
export function schemaIssue(message: string): StandardSchemaV1.Issue {
  return { message };
}

/**
 * Pre-initializes a child slot in an array store to enable testing
 * of insert operations at specific indices.
 *
 * @param arrayStore The internal array store.
 * @param index The index to initialize.
 */
export function initializeChildSlot(
  arrayStore: InternalArrayStore,
  index: number
): void {
  if (!arrayStore.children[index]) {
    const path = JSON.parse(arrayStore.name) as PathKey[];
    path.push(index);
    // @ts-expect-error - Creating empty object to be initialized
    arrayStore.children[index] = {};
    initializeFieldStore(arrayStore.children[index], undefined, path);
  }
}

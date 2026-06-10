import { getFieldInput, walkFieldStore } from '../../field/index.ts';
import { batch, untrack } from '../../framework/index.ts';
import type {
  InternalArrayStore,
  InternalFieldStore,
  InternalFormStore,
  PathKey,
  StandardSchemaV1,
} from '../../types/index.ts';

/**
 * Validate form input config interface.
 */
export interface ValidateFormInputConfig {
  /**
   * Whether to focus the first field with an error.
   */
  readonly shouldFocus?: boolean | undefined;
}

/**
 * Validates the form input using the configured Standard Schema. Parses the
 * current form input, processes validation issues, assigns errors to fields,
 * and optionally focuses the first field with an error.
 *
 * Hint: Issues whose path cannot be fully resolved against the field store
 * tree (e.g. symbol keys or fields that were never mounted) are assigned to
 * the deepest reachable ancestor field, with the form root as last resort.
 *
 * @param internalFormStore The form store to validate.
 * @param config The validation configuration.
 *
 * @returns The Standard Schema validation result.
 */
export async function validateFormInput(
  internalFormStore: InternalFormStore,
  config?: ValidateFormInputConfig
): Promise<StandardSchemaV1.Result<unknown>> {
  // Update validation state
  internalFormStore.validators++;
  internalFormStore.isValidating.value = true;

  // Validate form input with Standard Schema
  let result = internalFormStore.schema['~standard'].validate(
    untrack(() => getFieldInput(internalFormStore))
  );

  // Await result if schema validates asynchronously
  if (result instanceof Promise) {
    result = await result;
  }

  // Create variables for root and nested errors
  let rootErrors: [string, ...string[]] | undefined;
  let nestedErrors:
    | Record<string, [string, ...string[]] | undefined>
    | undefined;

  // Process validation issues into error variables
  if (result.issues) {
    // Initialize nested errors object
    nestedErrors = {};

    // Process each validation issue
    for (const issue of result.issues) {
      // Create variable for name of deepest reachable field
      let name: string | undefined;

      // If issue has path, resolve it against the field store tree
      if (issue.path?.length) {
        // Initialize path array
        const path: PathKey[] = [];

        // Start resolution at form store root
        let internalFieldStore: InternalFieldStore = internalFormStore;

        // Resolve each path segment to its field store
        for (const pathSegment of issue.path) {
          // Extract key from path segment
          const key =
            typeof pathSegment === 'object' && pathSegment !== null
              ? pathSegment.key
              : pathSegment;

          // Stop at unsupported keys (e.g. symbols)
          if (typeof key !== 'string' && typeof key !== 'number') {
            break;
          }

          // Stop at array fields if key is not a visible index
          if (internalFieldStore.kind === 'array') {
            const arrayFieldStore: InternalArrayStore = internalFieldStore;
            if (
              typeof key !== 'number' ||
              key >= untrack(() => arrayFieldStore.items.value).length ||
              !arrayFieldStore.children[key]
            ) {
              break;
            }
            internalFieldStore = arrayFieldStore.children[key];

            // Stop at object fields if child does not exist
          } else if (internalFieldStore.kind === 'object') {
            if (!internalFieldStore.children[key]) {
              break;
            }
            internalFieldStore = internalFieldStore.children[key];

            // Stop at value fields as they have no children
          } else {
            break;
          }

          // Add key to path
          path.push(key);
        }

        // Set name if any path segment could be resolved
        if (path.length) {
          name = JSON.stringify(path);
        }
      }

      // If issue maps to a nested field, append or initialize nested errors
      if (name) {
        const fieldErrors = nestedErrors[name];
        if (fieldErrors) {
          fieldErrors.push(issue.message);
        } else {
          nestedErrors[name] = [issue.message];
        }

        // Otherwise, assign to root errors
      } else {
        if (rootErrors) {
          rootErrors.push(issue.message);
        } else {
          rootErrors = [issue.message];
        }
      }
    }
  }

  // Create variable to decide if first error field should be focused
  let shouldFocus = config?.shouldFocus ?? false;

  // Batch all state updates for optimal reactivity performance
  batch(() => {
    // Set or reset errors on each field store
    walkFieldStore(internalFormStore, (internalFieldStore) => {
      if (internalFieldStore.name === '[]') {
        internalFieldStore.errors.value = rootErrors ?? null;
      } else {
        const fieldErrors = nestedErrors?.[internalFieldStore.name] ?? null;
        internalFieldStore.errors.value = fieldErrors;

        // Focus first field with error if configured
        if (shouldFocus && fieldErrors) {
          internalFieldStore.elements[0]?.focus();
          shouldFocus = false;
        }
      }
    });

    // Update validation state of form
    internalFormStore.validators--;
    internalFormStore.isValidating.value = internalFormStore.validators > 0;
  });

  // Return validation result
  return result;
}

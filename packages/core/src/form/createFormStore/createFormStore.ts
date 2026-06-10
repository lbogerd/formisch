import { initializeFieldStore } from '../../field/index.ts';
import { createSignal } from '../../framework/index.ts';
import type { FormConfig, InternalFormStore } from '../../types/index.ts';
import { isPlainObject } from '../../values.ts';

/**
 * Creates a new internal form store from the provided configuration.
 * Initializes the field store hierarchy based on the initial input, sets
 * validation modes, and creates form state signals.
 *
 * @param config The form configuration.
 *
 * @returns The internal form store.
 */
export function createFormStore(config: FormConfig): InternalFormStore {
  // If initial input is not a plain object, throw error
  // Hint: The field structure of the form is derived from the initial input,
  // so forms always require a plain object at the root.
  if (!isPlainObject(config.initialInput)) {
    throw new Error('The initial input of a form must be a plain object');
  }

  // Create partial store object
  const store: Partial<InternalFormStore> = {};

  // Initialize field store hierarchy from initial input
  initializeFieldStore(store, config.initialInput, []);

  // Set form config and validation
  store.validators = 0;
  store.validate = config.validate ?? 'submit';
  store.revalidate = config.revalidate ?? 'input';
  store.schema = config.schema;

  // Initialize form state signals
  store.isSubmitting = createSignal(false);
  store.isSubmitted = createSignal(false);
  store.isValidating = createSignal(false);

  // Return initialized store
  return store as InternalFormStore;
}

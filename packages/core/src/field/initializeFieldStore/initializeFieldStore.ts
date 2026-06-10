import { createId, createSignal } from '../../framework/index.ts';
import type {
  FieldElement,
  InternalFieldStore,
  PathKey,
} from '../../types/index.ts';
import { isPlainObject } from '../../values.ts';

/**
 * Initializes a field store recursively based on the shape of the initial
 * input. Arrays become array fields, plain objects become object fields, and
 * everything else (incl. `null`, `undefined`, `Date` and `File`) becomes a
 * value field. Fields not present in the initial input are created lazily
 * when first accessed and upgraded via `reconcileFieldStore` if necessary.
 *
 * @param internalFieldStore The partial field store to initialize.
 * @param initialInput The initial input value.
 * @param path The path to the field in the form.
 */
export function initializeFieldStore(
  internalFieldStore: Partial<InternalFieldStore>,
  initialInput: unknown,
  path: PathKey[]
): void {
  // Set basic properties
  internalFieldStore.name = JSON.stringify(path);

  // Initialize elements array
  const initialElements: FieldElement[] = [];
  internalFieldStore.initialElements = initialElements;
  internalFieldStore.elements = initialElements;

  // Initialize common signals
  internalFieldStore.errors = createSignal(null);
  internalFieldStore.isTouched = createSignal(false);
  internalFieldStore.isDirty = createSignal(false);

  // If initial input is an array, initialize as array field
  if (Array.isArray(initialInput)) {
    // Set kind to array
    internalFieldStore.kind = 'array';

    // Initialize array-specific properties
    if (internalFieldStore.kind === 'array') {
      // Initialize children array
      internalFieldStore.children = [];

      // Initialize child for each input item
      for (let index = 0; index < initialInput.length; index++) {
        // Create empty child object
        // @ts-expect-error
        internalFieldStore.children[index] = {};

        // Add current index to path
        path.push(index);

        // Initialize field store for child
        initializeFieldStore(
          internalFieldStore.children[index],
          initialInput[index],
          path
        );

        // Remove index from path for next iteration
        path.pop();
      }

      // Set array input to present
      internalFieldStore.initialInput = createSignal(true);
      internalFieldStore.startInput = createSignal(true);
      internalFieldStore.input = createSignal(true);

      // Set items with unique IDs for each child
      const initialItems = internalFieldStore.children.map(createId);
      internalFieldStore.initialItems = createSignal(initialItems);
      internalFieldStore.startItems = createSignal(initialItems);
      internalFieldStore.items = createSignal(initialItems);
    }

    // Otherwise, if initial input is a plain object, initialize as object
    // field
  } else if (isPlainObject(initialInput)) {
    // Set kind to object
    internalFieldStore.kind = 'object';

    // Initialize object-specific properties
    if (internalFieldStore.kind === 'object') {
      // Initialize children object
      internalFieldStore.children = {};

      // Initialize child for each object entry
      for (const key in initialInput) {
        // Create empty child object
        // @ts-expect-error
        internalFieldStore.children[key] = {};

        // Add current key to path
        path.push(key);

        // Initialize field store for child
        initializeFieldStore(
          internalFieldStore.children[key],
          initialInput[key],
          path
        );

        // Remove key from path for next iteration
        path.pop();
      }

      // Set object input to present
      internalFieldStore.initialInput = createSignal(true);
      internalFieldStore.startInput = createSignal(true);
      internalFieldStore.input = createSignal(true);
    }

    // Otherwise, initialize as value field (leaf node)
  } else {
    // Set kind to value
    internalFieldStore.kind = 'value';

    // Initialize value-specific properties
    if (internalFieldStore.kind === 'value') {
      // Set initial input
      internalFieldStore.initialInput = createSignal(initialInput);

      // Set start input
      internalFieldStore.startInput = createSignal(initialInput);

      // Set current input
      internalFieldStore.input = createSignal(initialInput);
    }
  }
}

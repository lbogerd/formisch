import { batch, createId, untrack } from '../../framework/index.ts';
import type {
  InternalFieldStore,
  InternalFormStore,
  Path,
  PathKey,
} from '../../types/index.ts';
import { isPlainObject } from '../../values.ts';
import { getFieldStore } from '../getFieldStore/index.ts';
import { initializeFieldStore } from '../initializeFieldStore/index.ts';
import { reconcileFieldStore } from '../reconcileFieldStore/index.ts';

/**
 * Sets the input for a nested field store and all its children, updating
 * touched and dirty states accordingly. Handles dynamic array resizing.
 *
 * @param internalFieldStore The field store to update.
 * @param input The new input value.
 */
function setNestedInput(
  internalFieldStore: InternalFieldStore,
  input: unknown
): void {
  // Mark field as touched
  internalFieldStore.isTouched.value = true;

  // If value field receives a composite input, upgrade it first
  if (internalFieldStore.kind === 'value') {
    if (Array.isArray(input)) {
      reconcileFieldStore(internalFieldStore, 'array');
    } else if (isPlainObject(input)) {
      reconcileFieldStore(internalFieldStore, 'object');
    }
  }

  // If field store is array, handle array input
  if (internalFieldStore.kind === 'array') {
    // Normalize input to empty array if nullish
    const arrayInput = input ?? [];
    const items = internalFieldStore.items.value;

    // If new array is shorter, truncate items
    if (
      // @ts-expect-error
      arrayInput.length < items.length
    ) {
      internalFieldStore.items.value = items.slice(
        0,
        // @ts-expect-error
        arrayInput.length
      );

      // Otherwise, if new array is longer, extend items
    } else if (
      // @ts-expect-error
      arrayInput.length > items.length
    ) {
      // If new items exceed children capacity, initialize new children
      // @ts-expect-error
      if (arrayInput.length > internalFieldStore.children.length) {
        // TODO: Check if we can merge this for loop with the one below
        // Parse path for child initialization
        const path = JSON.parse(internalFieldStore.name) as PathKey[];

        // Initialize missing children
        for (
          let index = internalFieldStore.children.length;
          // @ts-expect-error
          index < arrayInput.length;
          index++
        ) {
          // Create empty child object
          // @ts-expect-error
          internalFieldStore.children[index] = {};

          // Add current index to path
          path.push(index);

          // Initialize field store for new child
          initializeFieldStore(
            internalFieldStore.children[index],
            // @ts-expect-error
            arrayInput[index],
            path
          );

          // Remove index from path for next iteration
          path.pop();
        }
      }

      // Extend items array with new items
      internalFieldStore.items.value = [
        ...items,
        // @ts-expect-error
        ...arrayInput.slice(items.length).map(createId),
      ];
    }

    // Set input for each array item
    for (
      let index = 0;
      // @ts-expect-error
      index < arrayInput.length;
      index++
    ) {
      // Recursively set nested input
      setNestedInput(
        internalFieldStore.children[index],
        // @ts-expect-error
        arrayInput[index]
      );
    }

    // Set array input
    internalFieldStore.input.value = input == null ? input : true;

    // Update dirty state based on input or items length change
    internalFieldStore.isDirty.value =
      internalFieldStore.startInput.value !== internalFieldStore.input.value ||
      internalFieldStore.startItems.value.length !==
        internalFieldStore.items.value.length;

    // Otherwise, if field store is object, handle object input
  } else if (internalFieldStore.kind === 'object') {
    // If input contains unknown keys, initialize children for them
    if (isPlainObject(input)) {
      // Initialize path variable for lazy parsing
      let path: PathKey[] | undefined;

      // Initialize child for each unknown input key
      for (const key in input) {
        if (!internalFieldStore.children[key]) {
          // Parse path only when needed
          path ??= JSON.parse(internalFieldStore.name) as PathKey[];

          // Create empty child object
          // @ts-expect-error
          internalFieldStore.children[key] = {};

          // Add current key to path
          path.push(key);

          // Initialize field store for new child
          // Hint: The initial input is `undefined` because the key was not
          // part of the initial input, so the field is marked as dirty.
          initializeFieldStore(
            internalFieldStore.children[key],
            undefined,
            path
          );

          // Remove key from path for next iteration
          path.pop();
        }
      }
    }

    // Set input for each object property
    for (const key in internalFieldStore.children) {
      // Recursively set nested input
      setNestedInput(
        internalFieldStore.children[key],
        // @ts-expect-error
        input?.[key]
      );
    }

    // Set object input
    internalFieldStore.input.value = input == null ? input : true;

    // Update dirty state based on input change
    internalFieldStore.isDirty.value =
      internalFieldStore.startInput.value !== internalFieldStore.input.value;

    // Otherwise, handle value field input
  } else {
    // Set value input
    internalFieldStore.input.value = input;

    // TODO: Should we add support for Dates and Files?
    // Get start input for comparison
    const startInput = internalFieldStore.startInput.value;

    // Update dirty state with special handling for empty string and NaN
    internalFieldStore.isDirty.value =
      startInput !== input &&
      // Hint: This check ensures that an empty string or `NaN` does not mark
      // the field as dirty if the start input was `undefined` or `null`.
      (startInput != null || (input !== '' && !Number.isNaN(input)));
  }
}

/**
 * Sets the input for a field at the specified path in the form store,
 * traversing the path and updating all parent fields along the way.
 *
 * @param internalFormStore The form store containing the field.
 * @param path The path to the field.
 * @param input The new input value.
 */
export function setFieldInput(
  internalFormStore: InternalFormStore,
  path: Path,
  input: unknown
): void {
  // Batch all state updates for optimal reactivity performance
  batch(() => {
    // Untrack to avoid creating reactive dependencies during update
    untrack(() => {
      // Resolve target field store and lazily create missing stores
      const targetFieldStore = getFieldStore(internalFormStore, path);

      // Start at form store root
      let internalFieldStore: InternalFieldStore = internalFormStore;

      // Traverse path and mark parent inputs as truthy
      for (let index = 0; index < path.length - 1; index++) {
        // Navigate to child at current path key
        // @ts-expect-error
        internalFieldStore = internalFieldStore.children[path[index]];
        internalFieldStore.input.value = true;
      }

      // Set nested input on target field
      setNestedInput(targetFieldStore, input);
    });
  });
}

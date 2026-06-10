import { batch, createId } from '../../framework/index.ts';
import type { InternalFieldStore, PathKey } from '../../types/index.ts';
import { isPlainObject } from '../../values.ts';
import { initializeFieldStore } from '../initializeFieldStore/index.ts';
import { reconcileFieldStore } from '../reconcileFieldStore/index.ts';

/**
 * Sets the initial input for a field store and all its children recursively.
 * For arrays and objects, initializes missing children if needed. Updates
 * `initialInput` and `initialItems` properties.
 *
 * @param internalFieldStore The field store to update.
 * @param initialInput The initial input value.
 */
export function setInitialFieldInput(
  internalFieldStore: InternalFieldStore,
  initialInput: unknown
): void {
  // Batch all state updates for optimal reactivity performance
  batch(() => {
    // If value field receives a composite initial input, upgrade it first
    if (internalFieldStore.kind === 'value') {
      if (Array.isArray(initialInput)) {
        reconcileFieldStore(internalFieldStore, 'array');
      } else if (isPlainObject(initialInput)) {
        reconcileFieldStore(internalFieldStore, 'object');
      }
    }

    // If field store is array, handle array initial input
    if (internalFieldStore.kind === 'array') {
      // Set array input
      internalFieldStore.input.value =
        initialInput == null ? initialInput : true;

      // Normalize input to empty array if nullish
      const initialArrayInput = initialInput ?? [];

      // If initial input exceeds children capacity, initialize new children
      if (
        // @ts-expect-error
        initialArrayInput.length > internalFieldStore.children.length
      ) {
        // Parse path for child initialization
        const path = JSON.parse(internalFieldStore.name) as PathKey[];

        // Initialize missing children
        for (
          let index = internalFieldStore.children.length;
          // @ts-expect-error
          index < initialArrayInput.length;
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
            initialArrayInput[index],
            path
          );

          // Remove index from path for next iteration
          path.pop();
        }
      }

      // Set initial items with unique IDs
      internalFieldStore.initialItems.value =
        // @ts-expect-error
        initialArrayInput.map(createId);

      // Set initial input for each array item
      for (let index = 0; index < internalFieldStore.children.length; index++) {
        // Recursively set initial input for child
        setInitialFieldInput(
          internalFieldStore.children[index],
          // @ts-expect-error
          initialArrayInput[index]
        );
      }

      // Otherwise, if field store is object, handle object initial input
    } else if (internalFieldStore.kind === 'object') {
      // Set object input
      internalFieldStore.input.value =
        initialInput == null ? initialInput : true;

      // If initial input contains unknown keys, initialize children for them
      if (isPlainObject(initialInput)) {
        // Initialize path variable for lazy parsing
        let path: PathKey[] | undefined;

        // Initialize child for each unknown initial input key
        for (const key in initialInput) {
          if (!internalFieldStore.children[key]) {
            // Parse path only when needed
            path ??= JSON.parse(internalFieldStore.name) as PathKey[];

            // Create empty child object
            // @ts-expect-error
            internalFieldStore.children[key] = {};

            // Add current key to path
            path.push(key);

            // Initialize field store for new child
            initializeFieldStore(
              internalFieldStore.children[key],
              initialInput[key],
              path
            );

            // Remove key from path for next iteration
            path.pop();
          }
        }
      }

      // Set initial input for each object property
      for (const key in internalFieldStore.children) {
        // Recursively set initial input for child
        setInitialFieldInput(
          internalFieldStore.children[key],
          // @ts-expect-error
          initialInput?.[key]
        );
      }

      // Otherwise, handle value field initial input
    } else {
      // Set initial input
      internalFieldStore.initialInput.value = initialInput;
    }
  });
}

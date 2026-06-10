import { initializeFieldStore } from '../../field/initializeFieldStore/index.ts';
import { reconcileFieldStore } from '../../field/reconcileFieldStore/index.ts';
import { batch, untrack } from '../../framework/index.ts';
import type { InternalFieldStore, PathKey } from '../../types/index.ts';

/**
 * Initializes a missing child of a field store with an empty value field.
 *
 * @param internalFieldStore The parent field store.
 * @param key The key of the missing child.
 * @param path The parsed path of the parent field store.
 */
function initializeMissingChild(
  internalFieldStore: InternalFieldStore,
  key: PathKey,
  path: PathKey[]
): void {
  // Create empty child object
  // @ts-expect-error
  internalFieldStore.children[key] = {};

  // Add current key to path
  path.push(key);

  // Initialize field store for new child
  // @ts-expect-error
  initializeFieldStore(internalFieldStore.children[key], undefined, path);

  // Remove key from path for next iteration
  path.pop();
}

/**
 * Swaps the deeply nested state (signal values) between two field stores. This
 * includes the `elements`, `errors`, `startInput`, `input`, `isTouched`,
 * `isDirty`, and for arrays `startItems` and `items` properties. Recursively
 * walks through the field stores and swaps all signal values.
 *
 * @param firstInternalFieldStore The first field store to swap.
 * @param secondInternalFieldStore The second field store to swap.
 */
export function swapItemState(
  firstInternalFieldStore: InternalFieldStore,
  secondInternalFieldStore: InternalFieldStore
): void {
  // Batch all state updates for optimal reactivity performance
  batch(() => {
    // Untrack to avoid creating reactive dependencies during swap operation
    untrack(() => {
      // Upgrade value field store to the other store's kind if possible
      if (firstInternalFieldStore.kind !== 'value') {
        reconcileFieldStore(
          secondInternalFieldStore,
          firstInternalFieldStore.kind,
          false
        );
      } else if (secondInternalFieldStore.kind !== 'value') {
        reconcileFieldStore(
          firstInternalFieldStore,
          secondInternalFieldStore.kind,
          false
        );
      }

      // Swap elements references
      const tempElements = firstInternalFieldStore.elements;
      firstInternalFieldStore.elements = secondInternalFieldStore.elements;
      secondInternalFieldStore.elements = tempElements;

      // Swap errors
      const tempErrors = firstInternalFieldStore.errors.value;
      firstInternalFieldStore.errors.value =
        secondInternalFieldStore.errors.value;
      secondInternalFieldStore.errors.value = tempErrors;

      // Swap start input
      const tempStartInput = firstInternalFieldStore.startInput.value;
      firstInternalFieldStore.startInput.value =
        secondInternalFieldStore.startInput.value;
      secondInternalFieldStore.startInput.value = tempStartInput;

      // Swap current input
      const tempInput = firstInternalFieldStore.input.value;
      firstInternalFieldStore.input.value =
        secondInternalFieldStore.input.value;
      secondInternalFieldStore.input.value = tempInput;

      // Swap touched state
      const tempIsTouched = firstInternalFieldStore.isTouched.value;
      firstInternalFieldStore.isTouched.value =
        secondInternalFieldStore.isTouched.value;
      secondInternalFieldStore.isTouched.value = tempIsTouched;

      // Swap dirty state
      const tempIsDirty = firstInternalFieldStore.isDirty.value;
      firstInternalFieldStore.isDirty.value =
        secondInternalFieldStore.isDirty.value;
      secondInternalFieldStore.isDirty.value = tempIsDirty;

      // If both stores are arrays, swap array-specific state
      if (
        firstInternalFieldStore.kind === 'array' &&
        secondInternalFieldStore.kind === 'array'
      ) {
        // Get current items arrays for later use
        const firstItems = firstInternalFieldStore.items.value;
        const secondItems = secondInternalFieldStore.items.value;

        // Swap start items
        const tempStartItems = firstInternalFieldStore.startItems.value;
        firstInternalFieldStore.startItems.value =
          secondInternalFieldStore.startItems.value;
        secondInternalFieldStore.startItems.value = tempStartItems;

        // Swap current items
        firstInternalFieldStore.items.value = secondItems;
        secondInternalFieldStore.items.value = firstItems;

        // Calculate maximum length to ensure all children are swapped
        const maxLength = Math.max(firstItems.length, secondItems.length);

        // Initialize path variables for lazy parsing
        let firstPath: PathKey[] | undefined;
        let secondPath: PathKey[] | undefined;

        // Swap state for each array item
        for (let index = 0; index < maxLength; index++) {
          // If first store child doesn't exist, initialize it
          if (!firstInternalFieldStore.children[index]) {
            firstPath ??= JSON.parse(firstInternalFieldStore.name) as PathKey[];
            initializeMissingChild(firstInternalFieldStore, index, firstPath);
          }

          // If second store child doesn't exist, initialize it
          if (!secondInternalFieldStore.children[index]) {
            secondPath ??= JSON.parse(
              secondInternalFieldStore.name
            ) as PathKey[];
            initializeMissingChild(secondInternalFieldStore, index, secondPath);
          }

          // Recursively swap children
          swapItemState(
            firstInternalFieldStore.children[index],
            secondInternalFieldStore.children[index]
          );
        }

        // Otherwise, if both stores are objects, swap object children
      } else if (
        firstInternalFieldStore.kind === 'object' &&
        secondInternalFieldStore.kind === 'object'
      ) {
        // Initialize path variables for lazy parsing
        let firstPath: PathKey[] | undefined;
        let secondPath: PathKey[] | undefined;

        // Swap state for each object property of either store
        // Hint: Children can diverge between the two stores because field
        // stores are created lazily, so the union of keys is swapped.
        for (const key of new Set([
          ...Object.keys(firstInternalFieldStore.children),
          ...Object.keys(secondInternalFieldStore.children),
        ])) {
          // If first store child doesn't exist, initialize it
          if (!firstInternalFieldStore.children[key]) {
            firstPath ??= JSON.parse(firstInternalFieldStore.name) as PathKey[];
            initializeMissingChild(firstInternalFieldStore, key, firstPath);
          }

          // If second store child doesn't exist, initialize it
          if (!secondInternalFieldStore.children[key]) {
            secondPath ??= JSON.parse(
              secondInternalFieldStore.name
            ) as PathKey[];
            initializeMissingChild(secondInternalFieldStore, key, secondPath);
          }

          // Recursively swap children
          swapItemState(
            firstInternalFieldStore.children[key],
            secondInternalFieldStore.children[key]
          );
        }
      }
    });
  });
}

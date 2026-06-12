import { initializeFieldStore } from '../../field/initializeFieldStore/index.ts';
import { reconcileFieldStore } from '../../field/reconcileFieldStore/index.ts';
import { batch, untrack } from '../../framework/index.ts';
import type { InternalFieldStore, PathKey } from '../../types/index.ts';
import { resetItemState } from '../resetItemState/index.ts';

/**
 * Copies the deeply nested state (signal values) from one field store to
 * another. This includes the `elements`, `errors`, `startInput`, `input`,
 * `isTouched`, `isDirty`, and for arrays `startItems` and `items` properties.
 * Recursively walks through the field stores and copies all signal values.
 *
 * @param fromInternalFieldStore The source field store to copy from.
 * @param toInternalFieldStore The destination field store to copy to.
 */
export function copyItemState(
  fromInternalFieldStore: InternalFieldStore,
  toInternalFieldStore: InternalFieldStore
): void {
  // Batch all state updates for optimal reactivity performance
  batch(() => {
    // Untrack to avoid creating reactive dependencies during copy operation
    untrack(() => {
      // Upgrade destination field store to source kind if possible
      if (fromInternalFieldStore.kind !== 'value') {
        reconcileFieldStore(
          toInternalFieldStore,
          fromInternalFieldStore.kind,
          false
        );
      }

      // Skip copy entirely if kinds still differ after reconciliation, as a
      // partial copy between incompatible stores corrupts presence signals
      if (fromInternalFieldStore.kind !== toInternalFieldStore.kind) {
        return;
      }

      // Copy elements reference
      toInternalFieldStore.elements = fromInternalFieldStore.elements;

      // Copy errors
      toInternalFieldStore.errors.value = fromInternalFieldStore.errors.value;

      // Copy start input
      toInternalFieldStore.startInput.value =
        fromInternalFieldStore.startInput.value;

      // Copy current input
      toInternalFieldStore.input.value = fromInternalFieldStore.input.value;

      // Copy touched state
      toInternalFieldStore.isTouched.value =
        fromInternalFieldStore.isTouched.value;

      // Copy dirty state
      toInternalFieldStore.isDirty.value = fromInternalFieldStore.isDirty.value;

      // If both stores are arrays, copy array-specific state
      if (
        fromInternalFieldStore.kind === 'array' &&
        toInternalFieldStore.kind === 'array'
      ) {
        // Get source items array
        const fromItems = fromInternalFieldStore.items.value;

        // Copy start items
        toInternalFieldStore.startItems.value =
          fromInternalFieldStore.startItems.value;

        // Copy current items
        toInternalFieldStore.items.value = fromItems;

        // Initialize path variable for lazy parsing
        let path: PathKey[] | undefined;

        // Calculate maximum length to ensure destination-only children are
        // cleared and do not leak state from previous items
        const maxLength = Math.max(
          fromItems.length,
          toInternalFieldStore.children.length
        );

        // Copy state for each array item
        for (let index = 0; index < maxLength; index++) {
          // If index exceeds source items, clear destination child
          if (index >= fromItems.length) {
            resetItemState(toInternalFieldStore.children[index], undefined);
            continue;
          }

          // If destination child doesn't exist, initialize it
          if (!toInternalFieldStore.children[index]) {
            // Parse path only when needed
            path ??= JSON.parse(toInternalFieldStore.name) as PathKey[];

            // Create empty child object
            // @ts-expect-error
            toInternalFieldStore.children[index] = {};

            // Add current index to path
            path.push(index);

            // Initialize field store for new child
            initializeFieldStore(
              toInternalFieldStore.children[index],
              undefined,
              path
            );

            // Remove index from path for next iteration
            path.pop();
          }

          // Recursively copy child state
          copyItemState(
            fromInternalFieldStore.children[index],
            toInternalFieldStore.children[index]
          );
        }

        // Otherwise, if both stores are objects, copy object children
      } else if (
        fromInternalFieldStore.kind === 'object' &&
        toInternalFieldStore.kind === 'object'
      ) {
        // Initialize path variable for lazy parsing
        let path: PathKey[] | undefined;

        // Copy state for each object property of either store
        // Hint: Children can diverge between the two stores because field
        // stores are created lazily, so destination-only children must be
        // cleared to not leak state from previous items.
        for (const key of new Set([
          ...Object.keys(fromInternalFieldStore.children),
          ...Object.keys(toInternalFieldStore.children),
        ])) {
          // If key is missing in source children, clear destination child
          if (!fromInternalFieldStore.children[key]) {
            resetItemState(toInternalFieldStore.children[key], undefined);
            continue;
          }

          // If destination child doesn't exist, initialize it
          if (!toInternalFieldStore.children[key]) {
            // Parse path only when needed
            path ??= JSON.parse(toInternalFieldStore.name) as PathKey[];

            // Create empty child object
            // @ts-expect-error
            toInternalFieldStore.children[key] = {};

            // Add current key to path
            path.push(key);

            // Initialize field store for new child
            initializeFieldStore(
              toInternalFieldStore.children[key],
              undefined,
              path
            );

            // Remove key from path for next iteration
            path.pop();
          }

          // Recursively copy child state
          copyItemState(
            fromInternalFieldStore.children[key],
            toInternalFieldStore.children[key]
          );
        }
      }
    });
  });
}

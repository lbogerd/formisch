import {
  batch,
  createId,
  createSignal,
  untrack,
} from '../../framework/index.ts';
import type {
  InternalFieldStore,
  InternalValueStore,
  PathKey,
} from '../../types/index.ts';
import { isPlainObject } from '../../values.ts';
import { initializeFieldStore } from '../initializeFieldStore/index.ts';

/**
 * Reconciles a field store with the specified kind. Value fields created from
 * a missing or nullish initial input are upgraded in place to array or object
 * fields when accessed as such. The store object and its base signals
 * (`errors`, `isTouched`, `isDirty`) as well as the input signals are
 * preserved so that mounted consumers keep working.
 *
 * In strict mode (default), a field store that cannot be upgraded (because it
 * is the other container kind or holds an incompatible non-nullish value)
 * causes an error. In non-strict mode the field store is left unchanged.
 *
 * @param internalFieldStore The field store to reconcile.
 * @param kind The required field store kind.
 * @param strict Whether to throw if the field store cannot be upgraded.
 */
export function reconcileFieldStore(
  internalFieldStore: InternalFieldStore,
  kind: 'array' | 'object',
  strict = true
): void {
  // If field store already has the required kind, do nothing
  if (internalFieldStore.kind === kind) {
    return;
  }

  // If field store is a different container kind, throw or skip
  if (internalFieldStore.kind !== 'value') {
    if (strict) {
      throw new Error(
        `Field store "${internalFieldStore.name}" initialized as "${internalFieldStore.kind}" cannot be accessed as "${kind}"`
      );
    }
    return;
  }

  // Capture input signals while field store is still a value field
  const valueStore: InternalValueStore = internalFieldStore;
  const initialInputSignal = valueStore.initialInput;
  const startInputSignal = valueStore.startInput;
  const inputSignal = valueStore.input;

  // Read raw input values without creating reactive dependencies
  const initialInput = untrack(() => initialInputSignal.value);
  const startInput = untrack(() => startInputSignal.value);
  const input = untrack(() => inputSignal.value);

  // If a raw input holds an incompatible non-nullish value, throw or skip
  for (const rawInput of [initialInput, startInput, input]) {
    if (
      rawInput != null &&
      (kind === 'array' ? !Array.isArray(rawInput) : !isPlainObject(rawInput))
    ) {
      if (strict) {
        throw new Error(
          `Field store "${internalFieldStore.name}" holds an incompatible value and cannot be accessed as "${kind}"`
        );
      }
      return;
    }
  }

  // Batch all state updates for optimal reactivity performance
  batch(() => {
    // Create partial store reference to allow kind upgrade
    const partialFieldStore = internalFieldStore as Partial<InternalFieldStore>;

    // Parse path for child initialization
    const path = JSON.parse(internalFieldStore.name) as PathKey[];

    // If required kind is array, upgrade to array field
    if (kind === 'array') {
      // Set kind to array
      partialFieldStore.kind = 'array';

      // Initialize array-specific properties
      if (partialFieldStore.kind === 'array') {
        // Initialize children array
        partialFieldStore.children = [];

        // Distribute composite raw input into children, if any
        const arrayInput = (input ?? []) as unknown[];
        for (let index = 0; index < arrayInput.length; index++) {
          // Create empty child object
          // @ts-expect-error
          partialFieldStore.children[index] = {};

          // Add current index to path
          path.push(index);

          // Initialize field store for child
          initializeFieldStore(
            partialFieldStore.children[index],
            arrayInput[index],
            path
          );

          // Remove index from path for next iteration
          path.pop();
        }

        // Set items with unique IDs for each child
        const initialItems = partialFieldStore.children.map(createId);
        partialFieldStore.initialItems = createSignal(initialItems);
        partialFieldStore.startItems = createSignal(initialItems);
        partialFieldStore.items = createSignal(initialItems);
      }

      // Otherwise, upgrade to object field
    } else {
      // Set kind to object
      partialFieldStore.kind = 'object';

      // Initialize object-specific properties
      if (partialFieldStore.kind === 'object') {
        // Initialize children object
        partialFieldStore.children = {};

        // Distribute composite raw input into children, if any
        const objectInput = (input ?? {}) as Record<string, unknown>;
        for (const key in objectInput) {
          // Create empty child object
          // @ts-expect-error
          partialFieldStore.children[key] = {};

          // Add current key to path
          path.push(key);

          // Initialize field store for child
          initializeFieldStore(
            partialFieldStore.children[key],
            objectInput[key],
            path
          );

          // Remove key from path for next iteration
          path.pop();
        }
      }
    }

    // Remap input signals to presence flags
    initialInputSignal.value = initialInput == null ? initialInput : true;
    startInputSignal.value = startInput == null ? startInput : true;
    inputSignal.value = input == null ? input : true;
  });
}

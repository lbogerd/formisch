import type {
  InternalFieldStore,
  InternalFormStore,
  Path,
  PathKey,
} from '../../types/index.ts';
import { initializeFieldStore } from '../initializeFieldStore/index.ts';
import { reconcileFieldStore } from '../reconcileFieldStore/index.ts';

/**
 * Returns the field store at the specified path by traversing the form store's
 * children hierarchy. Field stores not present in the initial input are
 * created lazily and parent stores are upgraded to the kind implied by the
 * path key (number keys imply arrays, string keys imply objects).
 *
 * Hint: This function is idempotent, so repeated calls (e.g. during React
 * strict mode re-renders) are safe.
 *
 * @param internalFormStore The form store to traverse.
 * @param path The path to the field store.
 * @param kind The required kind of the field store at the path, if any.
 *
 * @returns The field store.
 */
export function getFieldStore(
  internalFormStore: InternalFormStore,
  path: Path,
  kind?: 'array' | 'object'
): InternalFieldStore {
  // Start at form store root
  let internalFieldStore: InternalFieldStore = internalFormStore;

  // Traverse path to find target field store
  for (let index = 0; index < path.length; index++) {
    const key = path[index];

    // Upgrade parent field store to kind implied by path key
    reconcileFieldStore(
      internalFieldStore,
      typeof key === 'number' ? 'array' : 'object'
    );

    // If child is missing, create and initialize it lazily
    // @ts-expect-error
    if (!internalFieldStore.children[key]) {
      const childFieldStore: Partial<InternalFieldStore> = {};
      initializeFieldStore(
        childFieldStore,
        undefined,
        path.slice(0, index + 1) as PathKey[]
      );
      // @ts-expect-error
      internalFieldStore.children[key] = childFieldStore;
    }

    // Navigate to child at current path key
    // @ts-expect-error
    internalFieldStore = internalFieldStore.children[key];
  }

  // Upgrade target field store to required kind, if specified
  if (kind) {
    reconcileFieldStore(internalFieldStore, kind);
  }

  // Return found field store
  return internalFieldStore;
}

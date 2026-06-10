/**
 * Internal symbol constant.
 */
export const INTERNAL = '~internal' as const;

/**
 * Checks whether a value is a plain object. Class instances such as `Date`,
 * `File` or `Map` are not plain objects and are treated as leaf values.
 *
 * @param value The value to check.
 *
 * @returns Whether the value is a plain object.
 */
// @__NO_SIDE_EFFECTS__
export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

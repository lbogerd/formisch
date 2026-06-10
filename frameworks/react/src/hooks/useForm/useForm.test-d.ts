import type { StandardSchemaV1 } from '@formisch/core/react';
import * as v from 'valibot';
import { describe, expectTypeOf, test } from 'vitest';
import type { FormStore } from '../../types/index.ts';
import { useForm } from './useForm.ts';

describe('useForm', () => {
  test('should return a FormStore typed against the schema', () => {
    const schema = v.object({ name: v.string() });
    const form = useForm({ schema, initialInput: { name: '' } });

    expectTypeOf(form).toEqualTypeOf<FormStore<typeof schema>>();
  });

  test('should require a full initialInput and reject mistyped values', () => {
    const schema = v.object({ name: v.string(), age: v.number() });

    useForm({ schema, initialInput: { name: 'John', age: 30 } });

    // @ts-expect-error missing initialInput
    useForm({ schema });

    // @ts-expect-error partial initialInput
    useForm({ schema, initialInput: { name: 'John' } });

    // @ts-expect-error wrong leaf type
    useForm({ schema, initialInput: { name: 123, age: 30 } });
  });

  test('should type initialInput as the Standard Schema input', () => {
    const schema = v.object({
      email: v.pipe(
        v.string(),
        v.transform((input) => input.length)
      ),
    });

    type Config = Parameters<typeof useForm<typeof schema>>[0];

    expectTypeOf<Config['initialInput']>().toEqualTypeOf<
      StandardSchemaV1.InferInput<typeof schema>
    >();
    expectTypeOf<Config['initialInput']>().toEqualTypeOf<{ email: string }>();
  });
});

import * as v from 'valibot';
import { describe, expectTypeOf, test } from 'vitest';
import * as z from 'zod';
import type { FormSchema } from './schema.ts';
import type { StandardSchemaV1 } from './standard.ts';

// Mirrors how the public APIs (e.g. `useForm`, `createForm`) constrain the form
// root, so `@ts-expect-error` marks exactly the schemas a form must reject.
function acceptFormSchema<TSchema extends FormSchema>(
  schema: TSchema
): TSchema {
  return schema;
}

// Mirrors how submit handlers receive the validated output, so inference
// through `StandardSchemaV1.InferOutput` can be asserted.
declare function inferOutput<TSchema extends FormSchema>(
  schema: TSchema
): StandardSchemaV1.InferOutput<TSchema>;

// Hand-rolled Standard Schema with an object root
const customSchema: StandardSchemaV1<{ a: string }, { a: string }> = {
  '~standard': {
    version: 1,
    vendor: 'formisch-test',
    validate: (value) => ({ value: value as { a: string } }),
  },
};

// Hand-rolled Standard Schema with a primitive root
declare const customStringSchema: StandardSchemaV1<string>;

describe('FormSchema', () => {
  test('should accept Valibot object schemas at the root', () => {
    acceptFormSchema(v.object({ name: v.string() }));
    acceptFormSchema(v.looseObject({ name: v.string() }));
    acceptFormSchema(v.strictObject({ name: v.string() }));
    acceptFormSchema(v.objectAsync({ name: v.string() }));
  });

  test('should accept piped Valibot object schemas at the root', () => {
    acceptFormSchema(
      v.pipe(
        v.object({ a: v.string(), b: v.string() }),
        v.forward(
          v.partialCheck([['a'], ['b']], (input) => input.a === input.b, ''),
          ['b']
        )
      )
    );
    acceptFormSchema(
      v.pipe(
        v.object({ age: v.string() }),
        v.transform((input) => ({ age: Number(input.age) }))
      )
    );
  });

  test('should accept Valibot object combinators at the root', () => {
    acceptFormSchema(
      v.intersect([v.object({ a: v.string() }), v.object({ b: v.number() })])
    );
    acceptFormSchema(
      v.union([v.object({ a: v.string() }), v.object({ b: v.number() })])
    );
    acceptFormSchema(
      v.variant('type', [
        v.object({ type: v.literal('a'), a: v.string() }),
        v.object({ type: v.literal('b'), b: v.number() }),
      ])
    );
  });

  test('should accept Zod object schemas at the root', () => {
    acceptFormSchema(z.object({ name: z.string() }));
    acceptFormSchema(z.looseObject({ name: z.string() }));
    acceptFormSchema(z.strictObject({ name: z.string() }));
  });

  test('should accept Zod object combinators at the root', () => {
    acceptFormSchema(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), a: z.string() }),
        z.object({ type: z.literal('b'), b: z.number() }),
      ])
    );
    acceptFormSchema(
      z.union([z.object({ a: z.string() }), z.object({ b: z.number() })])
    );
  });

  test('should accept hand-rolled Standard Schemas with object roots', () => {
    acceptFormSchema(customSchema);
  });

  test('should reject non-object schemas at the root', () => {
    // @ts-expect-error primitive root
    acceptFormSchema(v.string());
    // @ts-expect-error primitive root
    acceptFormSchema(z.string());
    // @ts-expect-error primitive root
    acceptFormSchema(customStringSchema);
    // @ts-expect-error array root
    acceptFormSchema(v.array(v.object({ name: v.string() })));
    // @ts-expect-error optional-wrapped object root
    acceptFormSchema(v.optional(v.object({ name: v.string() })));
  });

  test('should reject plain non-schema objects', () => {
    // @ts-expect-error plain object is not a schema
    acceptFormSchema({});
    // @ts-expect-error plain object is not a schema
    acceptFormSchema({ name: 'string' });
    // @ts-expect-error missing standard properties
    acceptFormSchema({ '~standard': {} });
  });

  test('should infer input and output types of Valibot schemas', () => {
    const schema = v.pipe(
      v.object({ age: v.string() }),
      v.transform((input) => ({ age: Number(input.age) }))
    );
    expectTypeOf<StandardSchemaV1.InferInput<typeof schema>>().toEqualTypeOf<{
      age: string;
    }>();
    expectTypeOf<StandardSchemaV1.InferOutput<typeof schema>>().toEqualTypeOf<{
      age: number;
    }>();
    expectTypeOf(inferOutput(schema)).toEqualTypeOf<{ age: number }>();
  });

  test('should infer input and output types of Zod schemas', () => {
    const schema = z.object({ count: z.number() });
    expectTypeOf<StandardSchemaV1.InferInput<typeof schema>>().toEqualTypeOf<{
      count: number;
    }>();
    expectTypeOf<StandardSchemaV1.InferOutput<typeof schema>>().toEqualTypeOf<{
      count: number;
    }>();
    expectTypeOf(inferOutput(schema)).toEqualTypeOf<{ count: number }>();
  });

  test('should infer input and output types of hand-rolled schemas', () => {
    expectTypeOf<
      StandardSchemaV1.InferInput<typeof customSchema>
    >().toEqualTypeOf<{ a: string }>();
    expectTypeOf(inferOutput(customSchema)).toEqualTypeOf<{ a: string }>();
  });
});

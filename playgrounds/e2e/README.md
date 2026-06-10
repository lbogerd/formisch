# Playground Behavior Comparison (E2E)

Playwright suite that verifies the Standard Schema migration by comparing
the **valibot** React playground (`playgrounds/react`, pinned to the
published `@formisch/react`) against the **zod** React playground
(`playgrounds/react-zod`, using the workspace build) for 1-to-1 equal
behavior.

## How it works

Each test runs the exact same interaction sequence (typing, submitting,
array operations, resetting) against both apps in parallel and captures a
serialized behavior state after every step:

- the value of every named `input`/`select`/`textarea`
- every visible validation error message (`InputErrors` with an expanded
  `Expandable` wrapper)
- every submitted form output (the playgrounds `console.log` the validated
  output on submit, which the suite intercepts)

The two state sequences are then:

1. compared directly against each other (`expect(zod).toEqual(valibot)`)
2. recorded as a single shared snapshot in `tests/__snapshots__/` (the
   snapshot path contains no project or browser name, so both apps are
   held to the identical recorded behavior)

## Covered routes

`/login`, `/payment`, `/todos` and `/nested` are cross-compared. The
`/special` route renders intentionally different forms in the two
playgrounds (the zod version is a lazy field-store stress test), so it
cannot be cross-compared; instead `special.spec.ts` snapshot tests each
app's special form independently against its own recorded behavior. The
todo form's "Replace first" button is skipped since it inserts
`Math.random()` and `new Date()` values that can never match across two
app instances.

## Regression history

This suite originally caught a lazy field store regression in the
workspace build: object field stores created lazily (e.g. the `card` and
`paypal` union branches of the payment form) kept a nullish input, so
`getFieldInput` submitted the whole object as `undefined` instead of
collecting its mounted children, and required-field errors silently
disappeared. This was fixed by marking lazily extended object containers
as present in `packages/core/src/field/getFieldStore/getFieldStore.ts`
and revalidating after lazily created fields mount in
`frameworks/react/src/hooks/useField/useField.ts`.

## Commands

```bash
pnpm install                          # from the repo root
pnpm exec playwright install chromium # once, to download the browser
pnpm test                             # run the comparison suite
pnpm run test.update                  # re-record the behavior snapshots
```

The dev servers for both playgrounds are started automatically on ports
6171 (valibot) and 6172 (zod).

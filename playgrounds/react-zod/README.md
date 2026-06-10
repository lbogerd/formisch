# Formisch React + Zod Playground

This playground tests `@formisch/react` with [Zod](https://zod.dev) schemas via
[Standard Schema](https://standardschema.dev). It mirrors the React playground
but uses no valibot at all.

## Routes

- **Login** — baseline form with zod string/email validation.
- **Payment** — intersection of an object and a discriminated union; the
  payment type starts unselected, so the union fields are created lazily.
- **Todos** — field array exercising `insert`, `remove`, `move`, `swap`,
  `replace` and `reset`.
- **Special** — lazy field store creation stress test: a discriminated union
  whose inactive branch is missing from the initial input, an optional field
  missing from the initial input, and an optional array that is only created
  when the field array mounts.
- **Nested** — nested field arrays (items with options) with array methods at
  both levels.

## Commands

```bash
pnpm install
pnpm dev      # start dev server
pnpm build    # typecheck + build
```

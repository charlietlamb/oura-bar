---
name: effect
description: Use when adding or refactoring Effect services, layers, streams, schemas, config, HTTP APIs, database access, or tests in this repo. Requires consulting the local Effect submodule and deriving TypeScript types from Effect Schema definitions.
---

# Effect

Use this skill for Effect-based backend work in this repo.

## Source Of Truth

- Prefer local source and type definitions in `node_modules/effect` and `node_modules/@effect/platform`.
- For official docs, use `https://effect.website/docs/`.
- Before inventing a pattern, search existing `src/**` services and the installed Effect source.
- For `Effect.gen` vs `.pipe` style decisions, also use the `effect-composition` skill.

## Repo Rules

- Use Effect services via `Context.Tag`.
- Provide concrete implementations with `Layer`.
- Use `Effect.scoped` for long-lived runtimes and owned resources.
- Use `Config` for environment variables.
- Use `Clock` for all current-time/time-of-run logic inside Effect code. Avoid
  `Date.now()`; get `Clock.currentTimeMillis` or another `Clock` effect and
  derive timestamps from that value. Constructing `Date` from an existing
  timestamp/string for parsing or formatting is fine.
- Use Effect retry/schedule/stream primitives instead of ad hoc loops where practical.
- Add one clear `Effect.withSpan` to every exported service method and use
  `Effect.annotateLogs` for non-secret identifiers. Never log raw secrets,
  tokens, bearer headers, session tokens, or encrypted secret payloads.
- Keep repository and integration boundaries behind narrow services.

## Schema Rules

- Use `effect/Schema` for backend boundaries and shared contracts.
- Define the schema first, then derive TypeScript types from it.
- Do not duplicate hand-written interfaces for data that is already represented by a schema.

```ts
import { Schema } from "effect";

export const MarketSchema = Schema.Struct({
  marketId: Schema.String,
  active: Schema.Boolean,
});

export type Market = typeof MarketSchema.Type;
export type MarketEncoded = typeof MarketSchema.Encoded;
```

## API Rules

- Prefer Effect HTTP API contracts in `packages/schema`.
- Keep API response schemas in shared packages so server and clients consume the same contract.
- Keep handler code thin; domain behavior belongs in services.

## Validation

Run the relevant workspace checks after changes:

```bash
bun run check
bun run typecheck
bun run test
```

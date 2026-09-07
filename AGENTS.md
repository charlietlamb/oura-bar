# Agent guide

Bun + Effect project that renders Oura Ring stats for a small native menu bar host in `host/`. Read `README.md` for layout and scripts.

## Skills

Load before writing code:

- `.claude/skills/effect` for services, layers, schema, config
- `.claude/skills/effect-composition` for `Effect.gen` vs `.pipe`
- `.claude/skills/effect-service-design` when adding or reshaping a service
- `.claude/skills/code-standards` for file structure and comment rules

## Rules

- Services are `Context.Tag` classes with a `*Live` layer beside them.
- Anything crossing the Oura API boundary is an `effect/Schema`; derive types from it.
- No `//` comments. `/* */` blocks of three lines or fewer only, and only for a constraint the code cannot state.
- Never log tokens, secrets, or bearer headers.
- Validate with `bun run validate` before finishing.

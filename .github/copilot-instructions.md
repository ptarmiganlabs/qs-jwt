---
applyTo: '**'
---

# copilot-instructions.md

This file provides guidance to Copilot when working with code in this repository.

## Onboarding

At the start of each session, read:

1. Any `**/README.md` docs across the project
2. Any `**/README.*.md` docs across the project

## Quality Gates

When writing code, Copilot must not finish until all of these succeed:

1. `npm run lint:fix`

If any check fails, fix the issues and run checks again.

> **Note:** This project currently has no test suite. Adding tests is a TODO.

## Project Basics (read this before changing code)

- This repo is **Node.js + ESM** (`"type": "module"` in `package.json`). Use `import`/`export` — do **not** use `require`/`module.exports`.
- Primary entrypoint is `qs-jwt.js` (root-level). It is a **CLI tool** built with [Commander.js](https://github.com/tj/commander).
- All configuration is passed via CLI options — there is no config file.
- The global singleton in `globals.js` provides the winston logger and app version. Prefer using existing patterns instead of creating new global singletons.
- Core logic lives in `lib/` (JWT creation for QSEoW and QS Cloud, certificate handling, option validation).

## GitNexus Code Intelligence

This repo is indexed in GitNexus as `qs-jwt`. In this multi-repo workspace, always include `-r qs-jwt` on GitNexus CLI commands. GitNexus MCP tools may not be available in VS Code/Copilot chats, so use the CLI unless a `gitnexus_*` tool is actually exposed.

Start by checking index freshness:

```bash
npx gitnexus status
```

If the index is stale, rebuild it before relying on impact analysis:

```bash
npx gitnexus analyze
```

Before modifying a function, class, or method, run upstream impact analysis and report the blast radius to the user:

```bash
npx gitnexus impact -r qs-jwt <symbolName>
```

If the symbol name is ambiguous, inspect context with a file hint:

```bash
npx gitnexus context -r qs-jwt <symbolName> -f lib/path/file.js
```

For unfamiliar flows, query the graph before broad grepping:

```bash
npx gitnexus query -r qs-jwt "concept or behavior"
```

Before committing or finalizing a broad refactor, verify the affected scope:

```bash
npx gitnexus detect-changes -r qs-jwt --scope all
```

Warn the user before editing if impact analysis reports HIGH or CRITICAL risk. Do not rename symbols with blind find-and-replace; use a language-server rename or GitNexus-aware rename support if available, then verify with detect-changes.

## How to Run (local dev)

- Install deps: `npm ci`
- Run the app: `node qs-jwt.js <command> [options]` (e.g. `node qs-jwt.js create-qseow --help`)
- Common scripts:
    - `npm run lint:fix`
    - `npm run format`
    - `npm run security:audit`
    - `npm run security:deps`

## Testing

> **TODO:** This project currently has no test suite. When tests are added, update this section with the test framework, commands, and conventions.

## Linting, Formatting, and Diffs

- The repo enforces **Prettier** and **ESLint** (flat config with `@eslint/js` recommended + `eslint-plugin-jsdoc` + `eslint-plugin-prettier`) via ESLint v10.
- ESLint config is in `eslint.config.js` (flat config format).
- Lint covers both root-level and `lib/` files: `npx eslint ./*.js ./lib/*.js`.
- JSDoc is enforced on all functions, methods, and classes.
- Do **not** do drive-by formatting/indentation changes "by hand". Keep diffs focused on the requested change.
- Prettier config: 100 printWidth, 4 tabWidth, single quotes, trailing commas (es5).

## Security and Crypto

- Never add real secrets/keys/certificates/tokens to the repo. Keep examples in templates/README only.
- qs-jwt handles cryptographic keys (RSA private keys for JWT signing). Be careful when modifying code in `lib/certificates.js`, `lib/create-qseow.js`, and `lib/create-qscloud.js`.
- Private keys may be passed via CLI options or environment variables (`QSJWTPRIVKEY`). Never log or expose key contents.
- JWTs created by this tool provide authentication access to Qlik Sense systems — treat them like credentials.

## Logging & Error Handling

- Use the existing logger (`globals.logger`, winston-based) and keep log messages free of secrets (tokens, credentials, certificate contents).
- Logging levels: `error`, `warning`, `info`, `verbose`, `debug` (default: `info`).

## Packaging (Docker + SEA)

- Docker uses a **multi-stage build**: stage 1 installs production deps (`npm ci --omit=dev`), stage 2 copies them into a clean runtime image.
- Docker runs as the built-in non-root `node` user.
- SEA (Single Executable Application) builds: esbuild bundles ESM source → `build.cjs` (CJS format, required by Node.js SEA), then Node.js SEA creates platform-specific binaries.
- Docker/SEA builds install **production dependencies only** (`npm ci --omit=dev`). If code needs a runtime dependency, it must be in `dependencies`, not `devDependencies`.
- Avoid changes that assume developer-only tooling exists at runtime.

## Repo Hygiene

- Do not edit generated artifacts or dependencies (e.g. `node_modules/`, `build/`, `coverage/`) unless the task explicitly requires it.

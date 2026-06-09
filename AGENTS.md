<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **qs-jwt** (203 symbols, 192 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` when MCP tools are exposed, or run `npx gitnexus impact -r qs-jwt <symbolName>` in CLI. Report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** (or `npx gitnexus detect-changes -r qs-jwt --scope all` in CLI) to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` when MCP tools are exposed, or run `npx gitnexus query -r qs-jwt "concept"` in CLI. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})` when MCP tools are exposed, or run `npx gitnexus context -r qs-jwt <symbolName>` in CLI.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` (or `npx gitnexus impact -r qs-jwt <symbolName>`) on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` when MCP tools are exposed, or `npx gitnexus rename -r qs-jwt <oldName> <newName>` in CLI.
- NEVER commit changes without running `gitnexus_detect_changes()` (or `npx gitnexus detect-changes -r qs-jwt --scope all`) to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/qs-jwt/context` | Codebase overview, check index freshness |
| `gitnexus://repo/qs-jwt/clusters` | All functional areas |
| `gitnexus://repo/qs-jwt/processes` | All execution flows |
| `gitnexus://repo/qs-jwt/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## qs-jwt — Agent Guide

## Commands

- `npm ci` — install deps
- `npm run lint:fix` — required quality gate before commit
- `npm run format` — Prettier (100 printWidth, 4 tabWidth, single quotes)
- `npm run security:audit` — npm audit (high severity)
- `npm run security:deps` — lockfile lint + dependency audit
- `npm run build:bundle` — esbuild bundle → `build.cjs` (for SEA)
- `npm run build:sea:prep` — prepare SEA blob
- `npm run build:binary:linux` / `build:binary:macos` / `build:binary:win` — platform SEA builds

> **TODO:** No test suite exists yet. When tests are added, document the test command here.

## Architecture

- **Runtime entrypoint**: `qs-jwt.js` — CLI tool using Commander.js
- **Global singleton**: `globals.js` (winston logger + app version) — used by all modules
- **Core logic**: `lib/` directory:
    - `create-qseow.js` — JWT creation for client-managed Qlik Sense (QSEoW)
    - `create-qscloud.js` — JWT creation for Qlik Sense Cloud
    - `certificates.js` — RSA key pair and certificate generation (node-forge)
    - `create-assert-options.js` — CLI option validation
- **SEA support**: `src/lib/import-meta-url.js` (esbuild injection helper), `sea-config.json`
- **Docker**: Multi-stage `Dockerfile` based on `node:24-bookworm-slim`, production deps only, runs as built-in `node` user

## Conventions

- **ESM only** (`"type": "module"`) — use `import`/`export`, do not use `require`/`module.exports`
- **ESLint (flat config) + Prettier** — ESLint v10 with `eslint.config.js` (flat config), `@eslint/js` recommended + `eslint-plugin-jsdoc` + `eslint-plugin-prettier`. Lint covers `./*.js` and `./lib/*.js`. Run `npm run lint:fix` before committing
- **Logging** — use `globals.logger` (winston-based), never `console.log`; never log private keys, tokens, or certificate contents
- **CLI-driven** — all configuration via Commander.js options; no config files
- **Dependencies** — Docker/SEA builds use `--omit=dev`; runtime deps must be in `dependencies`, not `devDependencies`

## SEA (Single Executable App)

- `qs-jwt.js` is bundled via esbuild into `build.cjs` (CJS format, required by Node.js SEA)
- `sea-config.json` defines the SEA entry point and output blob
- Platform-specific build scripts in `scripts/` handle binary injection via `postject`
- `src/lib/import-meta-url.js` is an esbuild injection helper that polyfills `import.meta.url` in the CJS bundle

## Security

- No real secrets/keys/certs in repo — examples in README only
- Private keys may be passed via `--cert-privatekey` option or `QSJWTPRIVKEY` env var — never log or expose these
- JWTs provide authentication access to Qlik Sense — treat created tokens as credentials
- Be careful when modifying `lib/certificates.js` — it handles RSA key generation and certificate creation

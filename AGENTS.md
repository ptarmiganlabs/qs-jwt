<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **qs-jwt** (209 symbols, 218 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

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
- `npm run test` — run tests in watch mode
- `npm run test:run` — run tests once
- `npm run test:coverage` — run tests with coverage report

## Architecture

- **Runtime entrypoint**: `src/qs-jwt.js` — CLI tool using Commander.js
- **Global singleton**: `src/globals.js` (winston logger + app version) — used by all modules
- **Core logic**: `src/lib/` directory:
    - `create-qseow.js` — JWT creation for client-managed Qlik Sense (QSEoW)
    - `create-qscloud.js` — JWT creation for Qlik Sense Cloud
    - `certificates.js` — RSA key pair and certificate generation (node-forge)
    - `create-assert-options.js` — CLI option validation
- **SEA support**: `src/lib/import-meta-url.js` (esbuild injection helper), `src/sea-config.json`
- **Docker**: Multi-stage `Dockerfile` based on `node:24-bookworm-slim`, production deps only, runs as built-in `node` user

## Conventions

- **ESM only** (`"type": "module"`) — use `import`/`export`, do not use `require`/`module.exports`
- **ESLint (flat config) + Prettier** — ESLint v10 with `eslint.config.js` (flat config), `@eslint/js` recommended + `eslint-plugin-jsdoc` + `eslint-plugin-prettier`. Lint covers `src/**/*.js`. Run `npm run lint:fix` before committing
- **Logging** — use `globals.logger` (winston-based), never `console.log`; never log private keys, tokens, or certificate contents
- **CLI-driven** — all configuration via Commander.js options; no config files
- **Dependencies** — Docker/SEA builds use `--omit=dev`; runtime deps must be in `dependencies`, not `devDependencies`

## SEA (Single Executable App)

- `src/qs-jwt.js` is bundled via esbuild into `build.cjs` (CJS format, required by Node.js SEA)
- `src/sea-config.json` defines the SEA entry point and output blob
- Platform-specific build scripts in `scripts/` handle binary injection via `postject`
- `src/lib/import-meta-url.js` is an esbuild injection helper that polyfills `import.meta.url` in the CJS bundle

## Security

- No real secrets/keys/certs in repo — examples in README only
- Private keys may be passed via `--cert-privatekey` option or `QSJWTPRIVKEY` env var — never log or expose these
- JWTs provide authentication access to Qlik Sense — treat created tokens as credentials
- Be careful when modifying `src/lib/certificates.js` — it handles RSA key generation and certificate creation

## Documentation

Every new or materially updated feature, behavior, or configuration change **must** be accompanied by a corresponding Markdown file in `docs/to-doc-site/`. These files are the source material for the qs-jwt documentation site (`qs-jwt.ptarmiganlabs.com`) and must contain enough information for someone to write or update the doc site content.

- **One topic per file**, kebab-case naming (e.g., `jwt-creation-new-option.md`).
- **Write for the doc site audience**: Qlik Sense administrators, not Node.js developers. Explain what changed, why it matters, and how to use it.
- **Be self-contained** — each file should stand on its own without requiring cross-references.
- **Include**: what changed, motivation/reasoning, user-facing impact, examples or CLI syntax if relevant, any migration steps or breaking changes.
- **Do not include**: internal code paths, variable names, or implementation details unless directly relevant to an administrator.
- Follow the full conventions documented in `docs/to-doc-site/README.md`.

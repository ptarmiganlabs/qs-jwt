# SEA-based release workflow for qs-jwt

## Summary

`qs-jwt` uses Node.js SEA (Single Executable Applications) to create release binaries. The build system follows the same pattern as Butler SOS, with reusable scripts in `./scripts/` that work both locally and in CI.

The release targets are:

- Windows x64
- macOS arm64 (Apple Silicon)
- Linux x64

## Build flow

The release workflow creates stand-alone binaries in four stages:

1. Bundle `qs-jwt.js` into `build.cjs` using esbuild.
2. Generate a SEA blob with `node --experimental-sea-config sea-config.json`.
3. Copy the platform Node.js executable and inject the SEA blob with `postject`.
4. Re-apply platform signing, notarization, and archive packaging.

`sea-config.json` is intentionally minimal because `qs-jwt` does not need extra runtime assets bundled into the executable.

## Scripts

All build steps are encapsulated in scripts under `./scripts/`. These scripts are used both locally (for development builds) and by the CI workflow.

### Local development builds

| Platform | Command                      |
| -------- | ---------------------------- |
| Linux    | `npm run build:binary:linux` |
| macOS    | `npm run build:binary:macos` |
| Windows  | `npm run build:binary:win`   |

Local builds produce binaries with a date and commit SHA suffix (e.g., `qs-jwt--local--2025-Jun-09--a1b2c3d`). These binaries are not code-signed (macOS uses ad-hoc signing only).

### CI release builds

The CI workflow (`.github/workflows/ci.yaml`) calls the release scripts when a new release is created by release-please:

| Platform | Script                     |
| -------- | -------------------------- |
| Linux    | `scripts/release-linux.sh` |
| macOS    | `scripts/release-macos.sh` |
| Windows  | `scripts/release-win.ps1`  |

Release builds produce versioned zip files (e.g., `qs-jwt-1.12.0-linux-x64.zip`) that include the binary and `THIRD-PARTY-NOTICES.md`.

## Security and hardening

The SEA build keeps the existing release hardening in place:

- macOS binaries are code signed and notarized.
- Windows binaries have Authenticode signing code available in the scripts (currently disabled, matching Butler SOS).
- Linux release artifacts are zipped and scanned by the existing VirusTotal workflow.

In addition, the SEA build removes any pre-existing signature from the copied Node.js executable before injecting the application payload. macOS binaries are then re-signed and notarized (and Windows binaries are re-signed only when signing is enabled).

## SBOM

A Software Bill of Materials (SBOM) is generated for each release using the Microsoft SBOM Tool. The SBOM is uploaded to the GitHub release as a `.spdx.json` file and also stored as a workflow artifact.

## Repository files involved

- `.github/workflows/ci.yaml`
- `package.json`
- `package-lock.json`
- `sea-config.json`
- `src/lib/import-meta-url.js`
- `scripts/build-binary-linux.sh`
- `scripts/build-binary-macos.sh`
- `scripts/build-binary-win.ps1`
- `scripts/release-linux.sh`
- `scripts/release-macos.sh`
- `scripts/release-win.ps1`
- `scripts/check-licenses.mjs`
- `THIRD-PARTY-NOTICES.md`
- `.audit-ci.json`

## Local validation

Useful local commands when validating the SEA flow:

```bash
npm ci
npm run build:binary:linux   # or macos / win
./qs-jwt--local--* --help
```

Or the manual approach:

```bash
npm ci
npm run build:bundle
npm run build:sea:prep
cp "$(command -v node)" qs-jwt
npx postject qs-jwt NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
./qs-jwt --help
```

On macOS, `postject` also needs `--macho-segment-name NODE_SEA`.

## CI workflow structure

The CI workflow has the following jobs (all run only when release-please creates a release):

1. **release-please** — Creates the GitHub release
2. **sbom-build** — Generates and uploads the SBOM
3. **release-macos-arm64** — Builds, signs, notarizes, and uploads the macOS binary
4. **release-win64** — Builds and uploads the Windows binary
5. **release-linux** — Builds and uploads the Linux binary

Each release job follows the same pattern: checkout, setup Node, install esbuild, install dependencies, run the release script, upload the zip to the release, and clean up.

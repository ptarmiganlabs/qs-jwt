# Build scripts and npm commands

## Summary

`qs-jwt` uses a set of reusable build scripts in `./scripts/` that can be invoked via `npm run` commands or directly from the CI workflow. This approach keeps build logic in one place and ensures consistency between local development and CI.

## Available npm scripts

### Build commands

| Command | Description |
|---------|-------------|
| `npm run build:docker` | Build Docker image (`docker build -t qs-jwt:latest .`) |
| `npm run build:binary:linux` | Build Linux x64 binary (local, no signing) |
| `npm run build:binary:macos` | Build macOS arm64 binary (local, ad-hoc signing) |
| `npm run build:binary:win` | Build Windows x64 binary (local, no signing) |

### Code quality

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Run Prettier |
| `npm run knip` | Detect unused files, dependencies, and exports |

### Security

| Command | Description |
|---------|-------------|
| `npm run security:audit` | Run `npm audit` with high severity threshold |
| `npm run security:full` | Run `npm audit` + Snyk test |
| `npm run deps:audit` | Check for vulnerable dependencies using `audit-ci` |
| `npm run deps:lockfile` | Validate lockfile integrity using `lockfile-lint` |
| `npm run security:deps` | Run lockfile validation + dependency audit |

### License compliance

| Command | Description |
|---------|-------------|
| `npm run license:check` | Check all dependency licenses against allowlist |
| `npm run license:summary` | Show summary of all licenses |
| `npm run license:report` | Generate CSV license report |
| `npm run license:json` | Generate JSON license report |
| `npm run license:full` | Run summary + check + report |

The license allowlist is maintained in `scripts/check-licenses.mjs`. To add a new approved license, update the `ALLOWED_LICENSES` array in that file.

## Scripts directory

| Script | Purpose |
|--------|---------|
| `scripts/build-binary-linux.sh` | Local Linux binary build (date+SHA suffix) |
| `scripts/build-binary-macos.sh` | Local macOS binary build (ad-hoc signing) |
| `scripts/build-binary-win.ps1` | Local Windows binary build (no signing) |
| `scripts/release-linux.sh` | CI Linux release build (zip + THIRD-PARTY-NOTICES.md) |
| `scripts/release-macos.sh` | CI macOS release build (signing + notarization + zip) |
| `scripts/release-win.ps1` | CI Windows release build (zip + THIRD-PARTY-NOTICES.md) |
| `scripts/check-licenses.mjs` | License compliance checker |

## Key differences: local vs CI builds

| Aspect | Local build | CI release build |
|--------|-------------|------------------|
| Output name | `qs-jwt--local--<date>--<sha>` | `qs-jwt` |
| Signing | Ad-hoc (macOS) / none | Full code signing + notarization (macOS) |
| Packaging | Binary only | Binary + THIRD-PARTY-NOTICES.md in zip |
| Version suffix | Date + commit SHA | Release version (e.g., `1.12.0`) |

## Third-party notices

The `THIRD-PARTY-NOTICES.md` file is included in all release zips. It documents third-party packages that require notice beyond the project's MIT license. Currently, this includes `node-forge` (BSD-3-Clause).

## SBOM generation

The CI workflow generates a Software Bill of Materials (SBOM) for each release using the Microsoft SBOM Tool. The SBOM is uploaded to the GitHub release as a `.spdx.json` file.

To generate an SBOM locally (requires the SBOM tool):

```bash
curl -Lo $RUNNER_TEMP/sbom-tool https://github.com/microsoft/sbom-tool/releases/latest/download/sbom-tool-linux-x64
chmod +x $RUNNER_TEMP/sbom-tool
mkdir -p ./build
$RUNNER_TEMP/sbom-tool generate -b ./build -bc . -pn qs-jwt -pv 1.12.0 -ps "Ptarmigan Labs" -nsb https://sbom.ptarmiganlabs.com -V verbose
```

# CI workflow overview

## Summary

The CI workflow (`.github/workflows/ci.yaml`) automates the release process for `qs-jwt`. It is triggered on pushes to the `main` branch and uses release-please to manage versioning and release creation.

## Trigger

-   Manual dispatch (`workflow_dispatch`)
-   Push to `main` branch

## Jobs

### release-please

Creates a GitHub release when semantic version commits are detected. Outputs the release tag, version, and upload URL for downstream jobs.

**Runner:** `ubuntu-latest`

**Key outputs:**
-   `releases_created` — Whether a new release was created
-   `release_tag_name` — The release tag (e.g., `v1.12.0`)
-   `release_version` — The version number (e.g., `1.12.0`)
-   `release_upload_url` — URL for uploading release assets

### sbom-build

Generates a Software Bill of Materials (SBOM) using the Microsoft SBOM Tool and uploads it to the release.

**Runner:** `ubuntu-latest`

**Condition:** Only runs when a release is created

**Steps:**
1. Checkout repository
2. Setup Node.js 24
3. Install production dependencies
4. Download and run Microsoft SBOM Tool
5. Upload `.spdx.json` to GitHub release
6. Upload SBOM as workflow artifact (backup)

### release-macos-arm64

Builds, code signs, notarizes, and uploads the macOS arm64 binary.

**Runner:** `mac-build2` (self-hosted)

**Concurrency:** `qs-jwt-macos-signing-mac-build2` (prevents parallel signing jobs)

**Condition:** Only runs when a release is created

**Steps:**
1. Checkout repository
2. Setup Node.js 24
3. Install esbuild
4. Install production dependencies
5. Run `scripts/release-macos.sh` (builds, signs, notarizes, creates zip)
6. Upload zip to GitHub release
7. Clean up build artifacts

### release-win64

Builds and uploads the Windows x64 binary.

**Runner:** Self-hosted Windows x64 with code signing capability

**Condition:** Only runs when a release is created

**Steps:**
1. Checkout repository
2. Setup Node.js 24
3. Install esbuild
4. Install production dependencies
5. Run `scripts/release-win.ps1` (builds, creates zip)
6. Upload zip to GitHub release
7. Clean up build artifacts

### release-linux

Builds and uploads the Linux x64 binary.

**Runner:** `ubuntu-latest`

**Condition:** Only runs when a release is created

**Steps:**
1. Checkout repository
2. Setup Node.js 24
3. Install esbuild
4. Install production dependencies
5. Run `scripts/release-linux.sh` (builds, creates zip)
6. Upload zip to GitHub release
7. Clean up build artifacts

## Artifact naming

| Platform | Artifact name |
|----------|---------------|
| macOS arm64 | `qs-jwt-<version>-macos-arm64.zip` |
| Windows x64 | `qs-jwt-<version>-win.zip` |
| Linux x64 | `qs-jwt-<version>-linux-x64.zip` |
| SBOM | `sbom-<version>` (workflow artifact) + `.spdx.json` (release asset) |

## Secrets required

| Secret | Purpose |
|--------|---------|
| `PAT` | Personal access token for GitHub API |
| `RELEASE_PLEASE_PAT` | Token for release-please (must have repo write access) |
| `PROD_MACOS_CERTIFICATE_BASE64_CODESIGN` | Base64-encoded macOS signing certificate |
| `PROD_MACOS_CERTIFICATE_CODESIGN_PWD` | Password for macOS signing certificate |
| `PROD_MACOS_CERTIFICATE_CODESIGN_NAME` | Name of macOS signing certificate |
| `PROD_MACOS_CI_KEYCHAIN_PWD` | Password for temporary build keychain |
| `PROD_MACOS_NOTARIZATION_APPLE_ID` | Apple ID for notarization |
| `PROD_MACOS_NOTARIZATION_TEAM_ID` | Apple team ID for notarization |
| `PROD_MACOS_NOTARIZATION_PWD` | App-specific password for notarization |
| `WIN_CODESIGN_THUMBPRINT` | Thumbprint of Windows signing certificate |
| `SNYK_TOKEN` | Snyk API token (for vulnerability scanning) |

## Pinned action versions

All GitHub Actions are pinned to specific commit SHAs for supply chain security (matching Butler SOS convention).

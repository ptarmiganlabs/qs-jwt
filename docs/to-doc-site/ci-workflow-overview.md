# CI workflow overview

## Summary

The CI workflow (`.github/workflows/ci.yaml`) automates the release process for `qs-jwt`. It is triggered on pushes to the `main` branch and uses release-please to manage versioning and release creation.

## Trigger

- Manual dispatch (`workflow_dispatch`), optionally as a signing rehearsal (see below)
- Push to `main` branch

Every job runs on a GitHub-hosted runner. qs-jwt is a public repository, and Ptarmigan Labs' own build machines do not accept jobs from public repositories.

## Jobs

### release-please

Creates a GitHub release when semantic version commits are detected. Outputs the release tag, version, and upload URL for downstream jobs.

**Runner:** `ubuntu-latest`

**Key outputs:**

- `releases_created` — Whether a new release was created
- `release_tag_name` — The release tag (e.g., `v1.12.0`)
- `release_version` — The version number (e.g., `1.12.0`)
- `release_upload_url` — URL for uploading release assets
- `release_sha` — The commit that was released. Every build job checks out this commit rather than the one that started the run, so that each binary reports the version it is released as.

### sbom-build

Generates a Software Bill of Materials (SBOM) using the Microsoft SBOM Tool and uploads it to the release.

**Runner:** `ubuntu-latest`

**Condition:** Only runs when a release is created

**Steps:**

1. Check out the released commit
2. Setup Node.js 24
3. Install production dependencies
4. Download and run Microsoft SBOM Tool
5. Upload `.spdx.json` to GitHub release
6. Upload SBOM as workflow artifact (backup)

### release-macos-arm64

Builds, code signs, notarizes, and uploads the macOS arm64 binary.

**Runner:** `macos-15` (GitHub-hosted)

**Environment:** `release-signing`, which only the `main` branch may use

**Condition:** Runs when a release is created, or in a signing rehearsal

**Steps:**

1. Check out the released commit
2. Setup Node.js 24
3. Check that `package.json` holds the version being released
4. Install dependencies
5. Run `scripts/release-macos.sh` (builds, signs, notarizes, creates zip). The Apple signing secrets are given to this step only.
6. Upload zip to GitHub release (a rehearsal keeps it as a workflow artifact instead)

### Windows: build-win64, sign-win64, publish-win64

Builds the Windows x64 binary, signs it with Azure Artifact Signing, and uploads it. Three jobs, so that the job holding the signing identity runs none of the repository's code.

**Runner:** `windows-latest` for building and signing, `ubuntu-latest` for publishing (all GitHub-hosted)

**Condition:** Runs when a release is created. A signing rehearsal runs the first two jobs only.

**build-win64:**

1. Check out the released commit
2. Setup Node.js 24
3. Check that `package.json` holds the version being released
4. Install dependencies, without running any dependency's install scripts
5. Run `scripts/release-win.ps1`: builds the binary unsigned, checks that `qs-jwt.exe --version` reports the right version and that the binary carries no signature, records its SHA-256, and prepares the other files the zip holds
6. Upload the unsigned binary, and the other files, as workflow artifacts

**sign-win64** (environment `release-signing`):

1. Download the unsigned binary and check it against the recorded SHA-256
2. Log in to Azure with GitHub's OIDC token
3. Sign with Azure Artifact Signing, timestamped
4. Verify the signature with `signtool` and with Windows itself, and require the signer to be Ptarmigan Labs AB
5. Upload the signed binary as a workflow artifact

**publish-win64:**

1. Download the signed binary and the other files
2. Zip them, and check the binary in the zip is the one `sign-win64` verified
3. Upload the zip to the GitHub release

If signing fails, the release goes out without a Windows download rather than with an unsigned one.

### release-linux

Builds and uploads the Linux x64 binary.

**Runner:** `ubuntu-latest`

**Condition:** Only runs when a release is created

**Steps:**

1. Check out the released commit
2. Setup Node.js 24
3. Check that `package.json` holds the version being released
4. Install dependencies
5. Run `scripts/release-linux.sh` (builds, creates zip)
6. Upload zip to GitHub release
7. Clean up build artifacts

## Artifact naming

| Platform    | Artifact name                                                       |
| ----------- | ------------------------------------------------------------------- |
| macOS arm64 | `qs-jwt-<version>-macos-arm64.zip`                                  |
| Windows x64 | `qs-jwt-<version>-win.zip`                                          |
| Linux x64   | `qs-jwt-<version>-linux-x64.zip`                                    |
| SBOM        | `sbom-<version>` (workflow artifact) + `.spdx.json` (release asset) |

## Rehearsing the signing

A manual run with `rehearse_signing` builds the current `main` for macOS and Windows, signs both (notarizing the macOS one), verifies the signatures, and releases nothing. The signed builds are kept as workflow artifacts for three days. It is the way to prove the signing works before a release depends on it:

```bash
gh workflow run ci.yaml -R ptarmiganlabs/qs-jwt --ref main -f rehearse_signing=true
```

It must be started on `main`: the `release-signing` environment admits no other branch.

## Secrets required

| Secret                                   | Purpose                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `PAT`                                    | Personal access token for GitHub API                   |
| `RELEASE_PLEASE_PAT`                     | Token for release-please (must have repo write access) |
| `PROD_MACOS_CERTIFICATE_BASE64_CODESIGN` | Base64-encoded macOS signing certificate               |
| `PROD_MACOS_CERTIFICATE_CODESIGN_PWD`    | Password for macOS signing certificate                 |
| `PROD_MACOS_CERTIFICATE_CODESIGN_NAME`   | Name of macOS signing certificate                      |
| `PROD_MACOS_CI_KEYCHAIN_PWD`             | Password for temporary build keychain                  |
| `PROD_MACOS_NOTARIZATION_APPLE_ID`       | Apple ID for notarization                              |
| `PROD_MACOS_NOTARIZATION_TEAM_ID`        | Apple team ID for notarization                         |
| `PROD_MACOS_NOTARIZATION_PWD`            | App-specific password for notarization                 |
| `SNYK_TOKEN`                             | Snyk API token (for vulnerability scanning)            |

Windows signing uses no stored certificate or secret. The `release-signing` environment holds six variables naming the Azure app and the Artifact Signing account and profile (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `SIGNING_ENDPOINT`, `SIGNING_ACCOUNT_NAME`, `SIGNING_CERT_PROFILE_NAME`), and Azure trusts GitHub's OIDC token through a federated credential for the subject `repo:ptarmiganlabs@6304190/qs-jwt@467577124:environment:release-signing`.

## Pinned action versions

All GitHub Actions are pinned to specific commit SHAs for supply chain security (matching Butler SOS convention).

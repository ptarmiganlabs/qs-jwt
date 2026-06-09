# SEA-based release workflow for qs-jwt

## Summary

`qs-jwt` now uses Node.js SEA (Single Executable Applications) instead of `pkg` when creating release binaries.

The release targets are:

-   Windows x64
-   macOS arm64 (Apple Silicon)
-   Linux x64

## Build flow

The release workflow keeps the existing `esbuild` bundling step, but now creates stand-alone binaries in four stages:

1. Bundle `qs-jwt.js` into `build.cjs`.
2. Generate a SEA blob with `node --experimental-sea-config sea-config.json`.
3. Copy the platform Node.js executable and inject the SEA blob with `postject`.
4. Re-apply platform signing, notarization, and archive packaging.

`sea-config.json` is intentionally minimal because `qs-jwt` does not need extra runtime assets bundled into the executable.

## Security and hardening

The SEA migration keeps the existing release hardening in place:

-   macOS binaries are code signed and notarized.
-   Windows binaries are Authenticode signed.
-   Linux release artifacts continue to be zipped and scanned by the existing VirusTotal workflow.

In addition, the SEA build explicitly removes any pre-existing signature from the copied Node.js executable before injecting the application payload, then signs the final binary again.

## Repository files involved

-   `.github/workflows/ci.yaml`
-   `package.json`
-   `package-lock.json`
-   `sea-config.json`

## Local validation

Useful local commands when validating the SEA flow:

```bash
npm ci
npm run build:bundle
npm run build:sea:prep
cp "$(command -v node)" qs-jwt
npx postject qs-jwt NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
./qs-jwt --help
```

On macOS, `postject` also needs `--macho-segment-name NODE_SEA`.

# Platform: Windows only
# Requires: Node.js, the npm dependencies (npm ci), PowerShell 7, Windows SDK (signtool.exe)
#
# Builds the unsigned Windows release binary, qs-jwt.exe, and a SHA-256 digest of it,
# qs-jwt.exe.sha256, in the repository root. Signing happens elsewhere.
#
# In a release, ci.yaml's build-win64 job runs this script, sign-win64 signs the binary through
# Azure Artifact Signing, and publish-win64 zips the signed binary with the files staged in
# ./win64-zip-extras and attaches the zip to the release. sign-win64 holds the signing credential
# and runs none of this code, which is why this script stops at an unsigned binary. The digest is
# how sign-win64 knows that the file it signs is the file this built. Butler SOS, Butler Sheet Icons
# and Ctrl-Q build their Windows releases the same way.
$ErrorActionPreference = 'Stop'

# Fixed rather than configurable: ci.yaml's Windows jobs and the release asset name use it too.
$name = 'qs-jwt'
$binary = "./$name.exe"

# -------------------
# Bundle the app into one file, and turn that into the blob the executable carries.
./node_modules/.bin/esbuild "src/qs-jwt.js" --bundle --outfile=build.cjs --format=cjs --platform=node --target=node24 --inject:./src/lib/import-meta-url.js --define:import.meta.url=import_meta_url
if ($LASTEXITCODE -ne 0) { throw "esbuild failed with exit code $LASTEXITCODE" }

node --experimental-sea-config src/sea-config.json
if ($LASTEXITCODE -ne 0) { throw "Generating the SEA blob failed with exit code $LASTEXITCODE" }

# -------------------
# Start from a copy of the Node.js executable running this script.
node -e "require('fs').copyFileSync(process.execPath, '$name.exe')"
if ($LASTEXITCODE -ne 0) { throw "Copying node.exe failed with exit code $LASTEXITCODE" }

# Remove node.exe's own signature before postject changes the file. Left in place, it no longer
# matches the contents, and Windows reports the binary as tampered with rather than as unsigned.
# signtool is found by search, because the Windows SDK version in its path differs between
# machines: the 10.0.22621.0 path this script used to hard-code does not exist on windows-latest.
$signtool = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe" -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1
if (-not $signtool) { throw 'signtool.exe not found. Install the signing tools from the Windows SDK.' }
& $signtool.FullName remove /s $binary
if ($LASTEXITCODE -ne 0) { throw "signtool remove failed with exit code $LASTEXITCODE" }

npx postject $binary NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
if ($LASTEXITCODE -ne 0) { throw "postject failed with exit code $LASTEXITCODE" }

# -------------------
# Smoke-test it. A binary that cannot start is not worth signing, and this is the cheapest check
# that postject produced something that runs. Some line of its output must be the version being
# built and nothing else: a bare substring match would also accept 1.14.10 for 1.14.1, or an error
# message that happens to mention the version.
$version = node -p "require('./package.json').version"
$reported = (& $binary --version | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw "The built binary failed to run: --version exited $LASTEXITCODE." }
if ($reported -notmatch "(?m)^\s*v?$([regex]::Escape($version))\s*$") {
    throw "The built binary reports version '$reported', expected '$version'."
}
Write-Host "smoke test: --version reports $version"

# -------------------
# Check that it is unsigned rather than signed badly: sign-win64 signs a clean file or nothing.
$status = (Get-AuthenticodeSignature -LiteralPath $binary).Status
if ($status -ne 'NotSigned') { throw "The built binary should carry no signature; Windows reports '$status'." }

# -------------------
# Record what was built.
$hash = (Get-FileHash -LiteralPath $binary -Algorithm SHA256).Hash
Set-Content -LiteralPath "$binary.sha256" -Value $hash -Encoding ascii
Write-Host "unsigned SHA256: $hash"

# -------------------
# Stage the files the release zip carries beside the binary, for publish-win64, which zips them
# without checking anything out: the licence, the third-party notices, the README, and a readme.txt
# naming the version.
$extras = './win64-zip-extras'
New-Item -ItemType Directory -Force -Path $extras | Out-Null
Copy-Item -LiteralPath ./LICENSE, ./README.md, ./THIRD-PARTY-NOTICES.md -Destination $extras
(Get-Content './release-config/readme-template.txt') -replace '__VERSION__', $version | Set-Content (Join-Path $extras 'readme.txt')

# -------------------
# Clean up the intermediate build files.
Remove-Item -Force ./build.cjs, ./sea-prep.blob

Get-ChildItem $binary, "$binary.sha256", $extras

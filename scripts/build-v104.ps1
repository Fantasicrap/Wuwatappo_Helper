param([Parameter(Mandatory=$true)][string]$SourceExe,[Parameter(Mandatory=$true)][string]$IsccPath,[string]$OutputDirectory,[string]$SongsDirectory)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent $PSScriptRoot
$version=(Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw|ConvertFrom-Json).releaseVersion
$upstream=([version]$version).ToString(3)
$migrationFlag=switch($upstream){'1.0.4'{'--v104'} '1.0.5'{'--v105'} default{throw "Unsupported upstream $upstream"}}
$env:WUWA_SOURCE_EXE=(Resolve-Path -LiteralPath $SourceExe).Path
$out=if($OutputDirectory){[IO.Path]::GetFullPath($OutputDirectory)}else{Join-Path $repoRoot "dist/local-$version"}
$migration=Join-Path $repoRoot "dist/migration-$version"
$payload=Join-Path $migration 'payload.exe'
& node (Join-Path $PSScriptRoot 'inspect-upstream.cjs') $env:WUWA_SOURCE_EXE (Join-Path $repoRoot "dist/upstream-$upstream")
if($LASTEXITCODE -ne 0){throw 'Extraction failed'}
# Optional theme pictures. The script reports what it skipped and never blocks the build.
& node (Join-Path $PSScriptRoot 'build-theme-assets.cjs')
& (Join-Path $PSScriptRoot 'build-theme-packs.ps1') -OutputDirectory $out -SongsDirectory $SongsDirectory
& node (Join-Path $repoRoot 'patches/v103/build-preview.cjs') $migrationFlag
if($LASTEXITCODE -ne 0){throw "$upstream resource migration failed"}
if($upstream -eq '1.0.5' -and ([version]$version -ge [version]'1.0.5.3')){
 & node (Join-Path $repoRoot 'patches/v103/build-preview.cjs') $migrationFlag --global
 if($LASTEXITCODE -ne 0){throw 'Global resource migration failed'}
}
& node (Join-Path $PSScriptRoot 'test-v103-suite.cjs')
if($LASTEXITCODE -ne 0){throw "$upstream migration verification failed"}
& (Join-Path $PSScriptRoot 'build-controller-host.ps1') -OutputDirectory $out -PayloadPath $payload
& node (Join-Path $repoRoot 'patches/v103/build-preview.cjs') $migrationFlag --lite
if($LASTEXITCODE -ne 0){throw 'Lite resource migration failed'}
& node (Join-Path $PSScriptRoot 'test-v103-preview.cjs') --lite
if($LASTEXITCODE -ne 0){throw 'Lite migration verification failed'}
$liteOut=Join-Path $out 'lite'
& (Join-Path $PSScriptRoot 'build-controller-host.ps1') -OutputDirectory $liteOut -Lite
Copy-Item -LiteralPath (Join-Path $liteOut "Wuwatappo_Helper-$version-Lite.exe") -Destination $out -Force
& (Join-Path $PSScriptRoot 'test-launcher.ps1') -DistributionDirectory $out -PayloadPath $payload
& (Join-Path $PSScriptRoot 'test-helper-update.ps1') -DistributionDirectory $out
& (Join-Path $PSScriptRoot 'test-stream-extract.ps1') -DistributionDirectory $out -PayloadPath $payload
& (Join-Path $PSScriptRoot 'test-controller-events.ps1') -DistributionDirectory $out
& (Join-Path $PSScriptRoot 'test-raw-input.ps1') -DistributionDirectory $out
& (Join-Path $PSScriptRoot 'test-helper-http.ps1') -DistributionDirectory $out
& (Join-Path $PSScriptRoot 'package.ps1') -IsccPath $IsccPath -OutputDirectory $out
Copy-Item -LiteralPath (Join-Path $migration 'checkpoint.json') -Destination (Join-Path $out 'migration-checkpoint.json') -Force

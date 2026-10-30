param([Parameter(Mandatory=$true)][string]$SourceExe,[Parameter(Mandatory=$true)][string]$IsccPath,[string]$OutputDirectory)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent $PSScriptRoot
$out=if($OutputDirectory){[IO.Path]::GetFullPath($OutputDirectory)}else{Join-Path $repoRoot 'dist/local-1.0.3.2'}
$payload=Join-Path $repoRoot 'dist/migration-1.0.3.2/payload.exe'
& node (Join-Path $PSScriptRoot 'inspect-upstream.cjs') $SourceExe (Join-Path $repoRoot 'dist/upstream-1.0.3')
if($LASTEXITCODE -ne 0){throw 'Extraction failed'}
& node (Join-Path $repoRoot 'patches/v103/build-preview.cjs')
if($LASTEXITCODE -ne 0){throw '1.0.3 resource migration failed'}
& node (Join-Path $PSScriptRoot 'test-v103-suite.cjs')
if($LASTEXITCODE -ne 0){throw '1.0.3 migration verification failed'}
& (Join-Path $PSScriptRoot 'build-controller-host.ps1') -OutputDirectory $out -PayloadPath $payload
& (Join-Path $PSScriptRoot 'test-launcher.ps1') -DistributionDirectory $out -PayloadPath $payload
& (Join-Path $PSScriptRoot 'test-controller-events.ps1') -DistributionDirectory $out
& (Join-Path $PSScriptRoot 'test-raw-input.ps1') -DistributionDirectory $out
& (Join-Path $PSScriptRoot 'test-helper-http.ps1') -DistributionDirectory $out
& (Join-Path $PSScriptRoot 'package.ps1') -IsccPath $IsccPath -OutputDirectory $out
Copy-Item -LiteralPath (Join-Path $repoRoot 'dist/migration-1.0.3.2/checkpoint.json') -Destination (Join-Path $out 'migration-checkpoint.json') -Force

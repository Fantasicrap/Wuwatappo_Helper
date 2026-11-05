param(
    [Parameter(Mandatory=$true)][string]$SourceExe,
    [Parameter(Mandatory=$true)][string]$IsccPath,
    [string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceFile = (Resolve-Path -LiteralPath $SourceExe).Path
if((Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne 'ee829c55916619ea2882e4a13546cbaf2f880363237608285105c7a4958e70b3'){
 throw 'Only the reviewed WuwaTappo 1.0.4 source is supported'
}
$previousSource = $env:WUWA_SOURCE_EXE
$previousTarget = $env:WUWA_TEST_TARGET
try {
    $env:WUWA_SOURCE_EXE = $sourceFile
    $env:WUWA_TEST_TARGET = '1.0.4.1'
    & (Join-Path $PSScriptRoot 'build-v104.ps1') -SourceExe $sourceFile -IsccPath $IsccPath -OutputDirectory $OutputDirectory
} finally {
    $env:WUWA_SOURCE_EXE = $previousSource
    $env:WUWA_TEST_TARGET = $previousTarget
}

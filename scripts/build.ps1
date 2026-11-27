param(
    [Parameter(Mandatory=$true)][string]$SourceExe,
    [Parameter(Mandatory=$true)][string]$IsccPath,
    [string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceFile = (Resolve-Path -LiteralPath $SourceExe).Path
$releaseVersion = (Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw|ConvertFrom-Json).releaseVersion
$upstream = ([version]$releaseVersion).ToString(3)
$expectedHash = switch ($upstream) {
    '1.0.5' { '06a7222645e5da3a86baeaea3bb61a1f63c0408df1e21d5b985a9eb01054b7ae' }
    '1.0.4' { 'ee829c55916619ea2882e4a13546cbaf2f880363237608285105c7a4958e70b3' }
    default { throw "Unsupported upstream $upstream" }
}
if((Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash){
 throw "Only the reviewed WuwaTappo $upstream source is supported"
}
$previousSource = $env:WUWA_SOURCE_EXE
$previousTarget = $env:WUWA_TEST_TARGET
try {
    $env:WUWA_SOURCE_EXE = $sourceFile
    $env:WUWA_TEST_TARGET = $releaseVersion
    & (Join-Path $PSScriptRoot 'build-v104.ps1') -SourceExe $sourceFile -IsccPath $IsccPath -OutputDirectory $OutputDirectory
} finally {
    $env:WUWA_SOURCE_EXE = $previousSource
    $env:WUWA_TEST_TARGET = $previousTarget
}

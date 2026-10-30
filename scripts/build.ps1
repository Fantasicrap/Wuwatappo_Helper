param(
    [Parameter(Mandatory=$true)][string]$SourceExe,
    [Parameter(Mandatory=$true)][string]$IsccPath,
    [string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceFile = (Resolve-Path -LiteralPath $SourceExe).Path
if((Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne 'cedc37d0c11d112f4d933647fb6cf00e1dca847fc763250984c647080f849080'){
 throw 'Only the reviewed WuwaTappo 1.0.3 source is supported'
}
$previousSource = $env:WUWA_SOURCE_EXE
try {
    $env:WUWA_SOURCE_EXE = $sourceFile
    & (Join-Path $PSScriptRoot 'build-v103.ps1') -SourceExe $sourceFile -IsccPath $IsccPath -OutputDirectory $OutputDirectory
} finally { $env:WUWA_SOURCE_EXE = $previousSource }

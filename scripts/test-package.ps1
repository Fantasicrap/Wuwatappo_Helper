param([string]$TestRoot,[string]$DistributionDirectory)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$distDir = if ($DistributionDirectory) { [IO.Path]::GetFullPath($DistributionDirectory) } else { Join-Path $repoRoot 'dist' }
$taskPackage = Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json
$helperVersion = if ($taskPackage.releaseVersion) { $taskPackage.releaseVersion } else { $taskPackage.version }
if (-not $TestRoot) { $TestRoot = Join-Path $distDir ('package-test-' + [Guid]::NewGuid().ToString('N')) }
$targetPath = [System.IO.Path]::GetFullPath($TestRoot)
$allowedRoot = [System.IO.Path]::GetFullPath($distDir) + [System.IO.Path]::DirectorySeparatorChar
if (-not $targetPath.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Package test target must stay inside dist' }
if (Test-Path -LiteralPath $targetPath) { throw 'Package test target already exists; use a new empty path' }
$setupFile = Join-Path $distDir "Wuwatappo_Helper-$helperVersion-Setup.exe"
$logFile = Join-Path $distDir 'package-test.log'
$setupArgs = '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /NOCLOSEAPPLICATIONS /NORESTARTAPPLICATIONS /NOICONS /TASKS="" /PACKAGE_TEST=1 /DIR="' + $targetPath + '" /LOG="' + $logFile + '"'
$setupProcess = Start-Process -FilePath $setupFile -ArgumentList $setupArgs -WindowStyle Hidden -PassThru -Wait
if ($setupProcess.ExitCode -ne 0) { throw ('Package test installer failed: ' + $setupProcess.ExitCode) }
$files = @{
    'Wuwatappo_Helper.exe' = (Join-Path $distDir "Wuwatappo_Helper-$helperVersion.exe")
    'README.md' = (Join-Path $repoRoot 'README.md')
    'DISCLAIMER.txt' = (Join-Path $repoRoot 'DISCLAIMER.txt')
    'THIRD_PARTY_NOTICES.md' = (Join-Path $repoRoot 'THIRD_PARTY_NOTICES.md')
    '使用说明.md' = (Join-Path $repoRoot 'docs/使用说明.md')
    '库存欧非判定.md' = (Join-Path $repoRoot 'docs/库存欧非判定.md')
    '手柄使用说明.md' = (Join-Path $repoRoot 'docs/手柄使用说明.md')
    'licenses/SDL3-LICENSE.txt' = (Join-Path $repoRoot 'licenses/SDL3-LICENSE.txt')
}
foreach ($name in $files.Keys) {
    $expected = (Get-FileHash -LiteralPath $files[$name] -Algorithm SHA256).Hash
    $actual = (Get-FileHash -LiteralPath (Join-Path $targetPath $name) -Algorithm SHA256).Hash
    if ($actual -ne $expected) { throw ('Installed bytes differ: ' + $name) }
}
if (Test-Path -LiteralPath (Join-Path $targetPath 'unins000.exe')) { throw 'Package test unexpectedly created an uninstaller' }
$zipFile = Join-Path $distDir "Wuwatappo_Helper-$helperVersion-Portable.zip"
$zipTarget = $targetPath + '-zip'
Expand-Archive -LiteralPath $zipFile -DestinationPath $zipTarget
$zipExe = Join-Path $zipTarget "Wuwatappo_Helper/Wuwatappo_Helper-$helperVersion.exe"
if (@(Get-ChildItem -LiteralPath (Split-Path -Parent $zipExe) -Filter 'Wuwatappo_Helper*.exe' -File).Count -ne 1) { throw 'Portable package contains stale executable names' }
if ((Get-FileHash -LiteralPath $zipExe -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $files['Wuwatappo_Helper.exe'] -Algorithm SHA256).Hash) { throw 'Portable EXE hash mismatch' }
$result = [ordered]@{ passed=$true; installedFilesMatch=$true; portableExeMatches=$true; appStarted=$false; testModeSkipsShortcutsAndUninstallRegistry=$true; nativeUiTested=$false }
$result | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $distDir 'package-verification.json') -Encoding utf8NoBOM
$result | ConvertTo-Json

param([Parameter(Mandatory=$true)][string]$IsccPath,[string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$distDir = if ($OutputDirectory) { [IO.Path]::GetFullPath($OutputDirectory) } else { Join-Path $repoRoot 'dist' }
$taskPackage = Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json
$helperVersion = if ($taskPackage.releaseVersion) { $taskPackage.releaseVersion } else { $taskPackage.version }
$compilerFile = (Resolve-Path -LiteralPath $IsccPath).Path
& $compilerFile ('/DSourceDir=' + $distDir) ('/DOutputDir=' + $distDir) ('/DAppVersion=' + $helperVersion) (Join-Path $repoRoot 'installer/Wuwatappo_Helper.iss')
if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed' }
& (Join-Path $PSScriptRoot 'test-icon.ps1') -DistributionDirectory $distDir -IncludeInstaller
$portableDir = Join-Path $distDir 'portable/Wuwatappo_Helper'
New-Item -ItemType Directory -Path $portableDir -Force | Out-Null
Get-ChildItem -LiteralPath $portableDir -File -Filter 'Wuwatappo_Helper*.exe' | ForEach-Object { Remove-Item -LiteralPath $_.FullName }
$exeName="Wuwatappo_Helper-$helperVersion.exe"
Copy-Item -LiteralPath (Join-Path $distDir $exeName) -Destination $portableDir -Force
foreach ($name in @('README.md','DISCLAIMER.txt','THIRD_PARTY_NOTICES.md')) { Copy-Item -LiteralPath (Join-Path $repoRoot $name) -Destination $portableDir -Force }
foreach ($doc in @('使用说明.md','手柄使用说明.md','库存欧非判定.md')) { Copy-Item -LiteralPath (Join-Path $repoRoot ('docs/'+$doc)) -Destination $portableDir -Force }
New-Item -ItemType Directory -Path (Join-Path $portableDir 'docs') -Force | Out-Null
foreach ($doc in @('按需运行优化说明.md','内存优化测试说明.md')) { Copy-Item -LiteralPath (Join-Path $repoRoot ('docs/'+$doc)) -Destination (Join-Path $portableDir 'docs') -Force }
New-Item -ItemType Directory -Path (Join-Path $portableDir 'licenses') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $repoRoot 'licenses/SDL3-LICENSE.txt') -Destination (Join-Path $portableDir 'licenses') -Force
Compress-Archive -LiteralPath $portableDir -DestinationPath (Join-Path $distDir "Wuwatappo_Helper-$helperVersion-Portable.zip") -Force
$releaseNames = @($exeName,"Wuwatappo_Helper-$helperVersion-Setup.exe","Wuwatappo_Helper-$helperVersion-Portable.zip")
$checksums = foreach ($name in $releaseNames) { $digest = (Get-FileHash -LiteralPath (Join-Path $distDir $name) -Algorithm SHA256).Hash.ToLower(); "$digest  $name" }
Set-Content -LiteralPath (Join-Path $distDir 'SHA256SUMS.txt') -Value $checksums -Encoding utf8NoBOM
Write-Output "Release artifacts: $distDir"

param([Parameter(Mandatory=$true)][string]$DistributionDirectory,[switch]$IncludeInstaller)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'icon-resources.ps1')
$repoRoot=Split-Path -Parent $PSScriptRoot
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$pkg=Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw|ConvertFrom-Json
$source=Join-Path $repoRoot 'dist/migration-1.0.3.2/payload.exe'
$iconFile=Join-Path $out 'host-build/application.ico'
$icon=if(Test-Path -LiteralPath $iconFile){[IO.File]::ReadAllBytes($iconFile)}else{[WuwaHelper.IconResources]::ReadFirst($source)}
if(-not [WuwaHelper.IconResources]::MatchesAny((Join-Path $out ("Wuwatappo_Helper-"+$pkg.releaseVersion+".exe")),$icon)){throw 'Launcher icon does not preserve the original frames'}
if($IncludeInstaller -and -not [WuwaHelper.IconResources]::MatchesAny((Join-Path $out ('Wuwatappo_Helper-'+$pkg.releaseVersion+'-Setup.exe')),$icon)){throw 'Installer icon does not preserve the original frames'}
$frames=for($i=0;$i -lt [BitConverter]::ToUInt16($icon,4);$i++){$at=6+$i*16;[ordered]@{width=if($icon[$at]){[int]$icon[$at]}else{256};height=if($icon[$at+1]){[int]$icon[$at+1]}else{256};bits=[BitConverter]::ToUInt16($icon,$at+6)}}
$sha=[Security.Cryptography.SHA256]::Create()
try{$hash=[Convert]::ToHexString($sha.ComputeHash($icon)).ToLowerInvariant()}finally{$sha.Dispose()}
$report=[ordered]@{passed=$true;originalFramesPreserved=$true;launcherVerified=$true;installerVerified=[bool]$IncludeInstaller;iconSha256=$hash;frames=@($frames);applicationStarted=$false}
$report|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $out 'icon-verification.json') -Encoding utf8NoBOM
$report|ConvertTo-Json -Depth 4

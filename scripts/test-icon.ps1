param([Parameter(Mandatory=$true)][string]$DistributionDirectory,[switch]$IncludeInstaller)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'icon-resources.ps1')
$repoRoot=Split-Path -Parent $PSScriptRoot
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$pkg=Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw|ConvertFrom-Json
$source=Join-Path $repoRoot ("dist/migration-"+$pkg.releaseVersion+"/payload.exe")
# host-build/application.ico is the icon chosen for this build: the unmodified
# upstream frames, or the optional Aemeath theme icon. The launcher and the
# installer must carry exactly those frames.
$iconFile=Join-Path $out 'host-build/application.ico'
$original=if(Test-Path -LiteralPath $source){[WuwaHelper.IconResources]::ReadFirst($source)}else{$null}
$icon=if(Test-Path -LiteralPath $iconFile){[IO.File]::ReadAllBytes($iconFile)}elseif($original){$original}else{throw 'No icon reference: host-build/application.ico and the migrated payload are both missing'}
$isOriginal=($null -ne $original) -and ([Convert]::ToBase64String($icon) -eq [Convert]::ToBase64String($original))
if(-not [WuwaHelper.IconResources]::MatchesAny((Join-Path $out ("Wuwatappo_Helper-"+$pkg.releaseVersion+".exe")),$icon)){throw 'Launcher icon differs from the frames selected for this build'}
if($IncludeInstaller -and -not [WuwaHelper.IconResources]::MatchesAny((Join-Path $out ('Wuwatappo_Helper-'+$pkg.releaseVersion+'-Setup.exe')),$icon)){throw 'Installer icon differs from the frames selected for this build'}
$frames=for($i=0;$i -lt [BitConverter]::ToUInt16($icon,4);$i++){$at=6+$i*16;[ordered]@{width=if($icon[$at]){[int]$icon[$at]}else{256};height=if($icon[$at+1]){[int]$icon[$at+1]}else{256};bits=[BitConverter]::ToUInt16($icon,$at+6)}}
$sha=[Security.Cryptography.SHA256]::Create()
try{$hash=[Convert]::ToHexString($sha.ComputeHash($icon)).ToLowerInvariant()}finally{$sha.Dispose()}
$report=[ordered]@{passed=$true;iconSource=$(if($isOriginal){'original'}else{'theme'});originalFramesPreserved=$isOriginal;launcherVerified=$true;installerVerified=[bool]$IncludeInstaller;iconSha256=$hash;frames=@($frames);applicationStarted=$false}
$report|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $out 'icon-verification.json') -Encoding utf8NoBOM
$report|ConvertTo-Json -Depth 4

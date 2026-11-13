param([Parameter(Mandatory=$true)][string]$OutputDirectory,[string]$SdlPath,[string]$PayloadPath,[string]$SongsDirectory,[switch]$Lite,[switch]$Alpha,[switch]$OriginalIcon)
$ErrorActionPreference='Stop'
if($Lite -and $Alpha){throw 'Alpha requires the full Helper launcher'}
$repoRoot=Split-Path -Parent $PSScriptRoot
if(!$SongsDirectory){$SongsDirectory=Join-Path (Split-Path -Parent $repoRoot) 'Songs'}
if(-not $SdlPath){$SdlPath=Join-Path (Split-Path -Parent $repoRoot) 'Wuwatappo_Helper-tools/SDL3-3.4.18/runtime/SDL3.dll'}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if(-not (Test-Path -LiteralPath $compiler)){throw 'Windows .NET Framework C# compiler unavailable'}
$sdlSha256='2b4b128d8d510cc2d442693cf848c050d700d43dc667afe9e5fd82b0570d667e'
if(!$Lite){
 if(-not (Test-Path -LiteralPath $SdlPath)){throw 'SDL3 3.4.18 x64 runtime missing; see docs/手柄使用说明.md'}
 if((Get-FileHash -LiteralPath $SdlPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $sdlSha256){throw 'SDL3 runtime hash differs from reviewed official 3.4.18 x64 release'}
}
$out=[IO.Path]::GetFullPath($OutputDirectory)
$hostDir=Join-Path $out 'host-build'
New-Item -ItemType Directory -Path $hostDir -Force|Out-Null
$pkg=Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw|ConvertFrom-Json
$suffix=if($Lite){'-Lite'}elseif($Alpha){'-Alpha'}else{''}
$payload=if($PayloadPath){[IO.Path]::GetFullPath($PayloadPath)}else{Join-Path $repoRoot ("dist/migration-"+$pkg.releaseVersion+$suffix.ToLowerInvariant()+"/payload.exe")}
. (Join-Path $PSScriptRoot 'icon-resources.ps1')
$iconFile=Join-Path $hostDir 'application.ico'
# scripts/build-theme-assets.cjs prepares the optional Aemeath pictures. Without them,
# or with -OriginalIcon, the launcher keeps the unmodified upstream icon frames.
$themeDir=Join-Path $repoRoot 'dist/theme-assets'
$themeIcon=Join-Path $themeDir 'aemeath.ico'
$useThemeIcon=(-not $Lite) -and (-not $OriginalIcon) -and ($env:WUWA_ORIGINAL_ICON -ne '1') -and (Test-Path -LiteralPath $themeIcon)
if($useThemeIcon){[IO.File]::WriteAllBytes($iconFile,[IO.File]::ReadAllBytes($themeIcon))}else{[IO.File]::WriteAllBytes($iconFile,[WuwaHelper.IconResources]::ReadFirst($payload))}
if(!$Lite){
$core=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/controller-core.js'))
$ui=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/controller-ui.js'))
$roomCore=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/room-history-core.js'))
$roomUi=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/room-history-ui.js'))
$uiFile=Join-Path $hostDir 'controller-ui.js'
$monitor=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/monitor-preference.js'))
$updateUi=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/update-ui.js'))
$themeBackground=Join-Path $themeDir 'aemeath-background.jpg'
$themeImage=if(Test-Path -LiteralPath $themeBackground){'"data:image/jpeg;base64,'+[Convert]::ToBase64String([IO.File]::ReadAllBytes($themeBackground))+'"'}else{'""'}
$themeAssets=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/theme-assets.js'))
if(-not $themeAssets.Contains('__WT_AEMEATH_BACKGROUND__')){throw 'Theme asset placeholder missing'}
$themeAssets=$themeAssets.Replace('__WT_AEMEATH_BACKGROUND__',$themeImage)
$themeMech=Join-Path $themeDir 'aemeath-mech.webp'
$mechImage=if(Test-Path -LiteralPath $themeMech){'"data:image/webp;base64,'+[Convert]::ToBase64String([IO.File]::ReadAllBytes($themeMech))+'"'}else{'""'}
$themeAssets=$themeAssets.Replace('__WT_AEMEATH_MECH__',$mechImage)
$themeTides=Join-Path $themeDir 'aemeath-tides.webp'
$tidesImage=if(Test-Path -LiteralPath $themeTides){'"data:image/webp;base64,'+[Convert]::ToBase64String([IO.File]::ReadAllBytes($themeTides))+'"'}else{'""'}
$themeAssets=$themeAssets.Replace('__WT_AEMEATH_TIDES__',$tidesImage)
$songFiles=@()
if(Test-Path -LiteralPath $SongsDirectory -PathType Container){
 $songFiles=@(Get-ChildItem -LiteralPath $SongsDirectory -File -Recurse | Where-Object {$_.Extension -in '.mp3','.m4a','.flac','.wav','.ogg','.opus','.aac','.webm'} | Sort-Object Name,FullName)
}
$songs=@(for($i=0;$i -lt $songFiles.Count;$i++){
 $file=$songFiles[$i]
 $artist,$title=$file.BaseName -split ' - ',2
 if(!$title){$title=$artist;$artist=''}
 @{name=$title;artist=$artist;url="http://127.0.0.1:48642/music/$i$($file.Extension.ToLowerInvariant())"}
})
$songsJs=ConvertTo-Json -InputObject $songs -Compress
[IO.File]::WriteAllText($uiFile,$core+"`n"+$ui+"`n"+$roomCore+"`n"+$roomUi+"`n"+$monitor+"`n"+$updateUi+"`n"+$themeAssets+"`nexport const helperSongs="+$songsJs+";",[Text.UTF8Encoding]::new($false))
}
$versionSource=Join-Path $hostDir 'Version.cs'
[IO.File]::WriteAllText($versionSource,('[assembly: System.Reflection.AssemblyVersion("{0}")] [assembly: System.Reflection.AssemblyFileVersion("{0}")]' -f $pkg.releaseVersion))
$hash=(Get-FileHash -LiteralPath $payload -Algorithm SHA256).Hash.ToLowerInvariant()
$runtimeId=Join-Path $hostDir 'runtime-id'
[IO.File]::WriteAllText($runtimeId,($pkg.releaseVersion+'-'+$hash.Substring(0,12)))
$exe=Join-Path $out ("Wuwatappo_Helper-"+$pkg.releaseVersion+$suffix+".exe")
$license=Join-Path $repoRoot 'licenses/SDL3-LICENSE.txt'
$buildOptions=@()
$resourcesToVerify=,@('WuwaTappo.exe',$payload)
if($Lite){$buildOptions+= '/define:HELPER_LITE'}else{
 $buildOptions+=@('/resource:'+$SdlPath+',SDL3.dll';'/resource:'+$license+',SDL3-LICENSE.txt';'/resource:'+$uiFile+',controller-ui.js')
 $resourcesToVerify+=,@('SDL3.dll',$SdlPath)
 $resourcesToVerify+=,@('controller-ui.js',$uiFile)
 for($i=0;$i -lt $songFiles.Count;$i++){
  $file=$songFiles[$i]
  $resource="music/$i$($file.Extension.ToLowerInvariant())"
  $staged=Join-Path $hostDir ("song-$i"+$file.Extension.ToLowerInvariant())
  Copy-Item -LiteralPath $file.FullName -Destination $staged -Force
  $buildOptions+=('/resource:'+$staged+','+$resource)
  $resourcesToVerify+=,@($resource,$file.FullName)
 }
}
& $compiler /nologo /target:winexe /platform:x64 /optimize+ ('/win32icon:'+$iconFile) /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Core.dll ('/out:'+$exe) ('/resource:'+$payload+',WuwaTappo.exe') ('/resource:'+$runtimeId+',runtime-id') @buildOptions $versionSource (Join-Path $repoRoot 'native/ControllerHost.cs') (Join-Path $repoRoot 'native/MouseCapture.cs') (Join-Path $repoRoot 'native/HelperUpdate.cs')
if($LASTEXITCODE -ne 0){throw 'Controller launcher compilation failed'}
$asm=[Reflection.Assembly]::LoadFile($exe)
$checks=@{}
foreach($item in $resourcesToVerify){$stream=$asm.GetManifestResourceStream($item[0]);$sha=[Security.Cryptography.SHA256]::Create();try{$digest=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant()}finally{$stream.Dispose();$sha.Dispose()};$expected=(Get-FileHash -LiteralPath $item[1] -Algorithm SHA256).Hash.ToLowerInvariant();if($digest -ne $expected){throw 'Embedded resource differs'};$checks[$item[0]]=$digest}
$json=[ordered]@{passed=$true;singleExe=$true;lite=[bool]$Lite;alpha=[bool]$Alpha;icon=$(if($useThemeIcon){'aemeath'}else{'original'});resources=$checks;sdlVersion=$(if(!$Lite){'3.4.18'});controllerRealHardwareTested=$false}|ConvertTo-Json -Depth 4
[IO.File]::WriteAllText((Join-Path $out 'controller-bundle-verification.json'),$json,[Text.UTF8Encoding]::new($false))

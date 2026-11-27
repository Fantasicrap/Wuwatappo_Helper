param([Parameter(Mandatory=$true)][string]$OutputDirectory,[string]$SdlPath,[string]$PayloadPath,[string]$GlobalPayloadPath,[string]$WebViewSdkPath,[switch]$Lite,[switch]$Alpha,[switch]$OriginalIcon)
$ErrorActionPreference='Stop'
if($Lite -and $Alpha){throw 'Alpha requires the full Helper launcher'}
$repoRoot=Split-Path -Parent $PSScriptRoot
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
[IO.File]::WriteAllBytes($iconFile,[WuwaHelper.IconResources]::ReadFirst($payload))
if(!$Lite){
$core=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/controller-core.js'))
$ui=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/controller-ui.js'))
$roomCore=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/room-history-core.js'))
$roomUi=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/room-history-ui.js'))
$uiFile=Join-Path $hostDir 'controller-ui.js'
$monitor=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/monitor-preference.js'))
$updateUi=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/update-ui.js'))
$themeAssets=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/theme-assets.js'))
$deniaEffects=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/denia-theme.js'))
$phrolovaTheme=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/phrolova-theme.js'))
[IO.File]::WriteAllText($uiFile,(@($core,$ui,$roomCore,$roomUi,$monitor,$updateUi,$themeAssets,$deniaEffects,$phrolovaTheme) -join "`n"),[Text.UTF8Encoding]::new($false))
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
$globalPayload=$null
$globalDelta=$null
if($Lite){$buildOptions+= '/define:HELPER_LITE'}else{
 if(!$GlobalPayloadPath -and !$Alpha -and ([version]$pkg.releaseVersion -ge [version]'1.0.5.3')){
  $GlobalPayloadPath=Join-Path $repoRoot ("dist/migration-"+$pkg.releaseVersion+"-global/payload.exe")
 }
 if($GlobalPayloadPath){
  $globalPayload=(Resolve-Path -LiteralPath $GlobalPayloadPath).Path
  $globalDelta=Join-Path $hostDir 'global-WuwaTappo.delta'
  & node (Join-Path $PSScriptRoot 'build-payload-delta.cjs') $payload $globalPayload $globalDelta | Out-Null
  if($LASTEXITCODE -ne 0){throw 'Global payload delta generation failed'}
  $buildOptions+=('/resource:'+$globalDelta+',global/WuwaTappo.delta')
  $resourcesToVerify+=,@('global/WuwaTappo.delta',$globalDelta)
 }
 & node (Join-Path $PSScriptRoot 'localize-game.cjs') $hostDir
 if($LASTEXITCODE -ne 0){throw 'Could not build the localized game pages'}
 $deniaGame=Join-Path $hostDir 'denia-blocks.html'
 $fallingGame=Join-Path $hostDir 'denia-falling.html'
 $buildOptions+=@('/resource:'+$SdlPath+',SDL3.dll';'/resource:'+$license+',SDL3-LICENSE.txt';'/resource:'+$uiFile+',controller-ui.js';'/resource:'+$deniaGame+',denia-blocks.html';'/resource:'+$fallingGame+',denia-falling.html')
 $resourcesToVerify+=,@('SDL3.dll',$SdlPath)
 $resourcesToVerify+=,@('controller-ui.js',$uiFile)
 $resourcesToVerify+=,@('denia-blocks.html',$deniaGame)
 $resourcesToVerify+=,@('denia-falling.html',$fallingGame)
 if(!$WebViewSdkPath){$WebViewSdkPath=& (Join-Path $PSScriptRoot 'get-webview2-sdk.ps1')}
 $sdkFiles=[ordered]@{
  'Microsoft.Web.WebView2.Core.dll'='lib/net462/Microsoft.Web.WebView2.Core.dll'
  'Microsoft.Web.WebView2.WinForms.dll'='lib/net462/Microsoft.Web.WebView2.WinForms.dll'
  'WebView2Loader.dll'='runtimes/win-x64/native/WebView2Loader.dll'
  'WebView2-LICENSE.txt'='LICENSE.txt'
  'WebView2-NOTICE.txt'='NOTICE.txt'
 }
 foreach($entry in $sdkFiles.GetEnumerator()){
  $dll=Join-Path $WebViewSdkPath $entry.Value
  if(!(Test-Path -LiteralPath $dll)){throw ('Missing WebView2 SDK file: '+$entry.Value)}
  $buildOptions+=('/resource:'+$dll+','+$entry.Key)
  $resourcesToVerify+=,@($entry.Key,$dll)
  if($entry.Key -like 'Microsoft.Web.WebView2.*'){$buildOptions+=('/reference:'+$dll)}
 }
 $buildOptions+=(Join-Path $repoRoot 'native/DeniaGameWindow.cs')
 $buildOptions+=(Join-Path $repoRoot 'native/GlobalSignInWindow.cs')
}
& $compiler /nologo /target:winexe /platform:x64 /optimize+ ('/win32icon:'+$iconFile) /reference:System.Web.dll /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Core.dll /reference:System.IO.Compression.dll /reference:Microsoft.CSharp.dll ('/out:'+$exe) ('/resource:'+$payload+',WuwaTappo.exe') ('/resource:'+$runtimeId+',runtime-id') @buildOptions $versionSource (Join-Path $repoRoot 'native/ControllerHost.cs') (Join-Path $repoRoot 'native/PayloadDelta.cs') (Join-Path $repoRoot 'native/MouseCapture.cs') (Join-Path $repoRoot 'native/HelperUpdate.cs') (Join-Path $repoRoot 'native/HelperAutostart.cs') (Join-Path $repoRoot 'native/ThemePackages.cs')
if($LASTEXITCODE -ne 0){throw 'Controller launcher compilation failed'}
$asm=[Reflection.Assembly]::LoadFile($exe)
$checks=@{}
foreach($item in $resourcesToVerify){$stream=$asm.GetManifestResourceStream($item[0]);$sha=[Security.Cryptography.SHA256]::Create();try{$digest=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant()}finally{$stream.Dispose();$sha.Dispose()};$expected=(Get-FileHash -LiteralPath $item[1] -Algorithm SHA256).Hash.ToLowerInvariant();if($digest -ne $expected){throw 'Embedded resource differs'};$checks[$item[0]]=$digest}
$globalVerifiedHash=$null
if($globalPayload){
 if($asm.GetManifestResourceInfo('global/WuwaTappo.exe') -ne $null){throw 'Duplicate full global executable should not be embedded'}
 $apply=$asm.GetType('PayloadDelta',$true).GetMethod('ApplyStream',[Reflection.BindingFlags]'Static,NonPublic')
 $baseStream=$asm.GetManifestResourceStream('WuwaTappo.exe')
 $deltaStream=$asm.GetManifestResourceStream('global/WuwaTappo.delta')
 try{
  $reconstructedHashBytes=[byte[]]$apply.Invoke($null,[object[]]@($baseStream,$deltaStream,[IO.Stream]::Null))
  $globalVerifiedHash=[BitConverter]::ToString($reconstructedHashBytes).Replace('-','').ToLowerInvariant()
 }finally{$deltaStream.Dispose();$baseStream.Dispose()}
 $expectedGlobal=(Get-FileHash -LiteralPath $globalPayload -Algorithm SHA256).Hash.ToLowerInvariant()
 if($globalVerifiedHash -ne $expectedGlobal){throw 'Reconstructed global payload SHA-256 differs'}
}
$json=[ordered]@{passed=$true;singleExe=$true;lite=[bool]$Lite;alpha=[bool]$Alpha;icon='original';deduplicatedGlobal=[bool]$globalPayload;globalPayloadSha256=$globalVerifiedHash;resources=$checks;sdlVersion=$(if(!$Lite){'3.4.18'});controllerRealHardwareTested=$false}|ConvertTo-Json -Depth 4
[IO.File]::WriteAllText((Join-Path $out 'controller-bundle-verification.json'),$json,[Text.UTF8Encoding]::new($false))

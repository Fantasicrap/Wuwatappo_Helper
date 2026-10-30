param([Parameter(Mandatory=$true)][string]$OutputDirectory,[string]$SdlPath,[string]$PayloadPath)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent $PSScriptRoot
if(-not $SdlPath){$SdlPath=Join-Path (Split-Path -Parent $repoRoot) 'Wuwatappo_Helper-tools/SDL3-3.4.18/runtime/SDL3.dll'}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if(-not (Test-Path -LiteralPath $compiler)){throw 'Windows .NET Framework C# compiler unavailable'}
if(-not (Test-Path -LiteralPath $SdlPath)){throw 'SDL3 3.4.18 x64 runtime missing; see docs/手柄使用说明.md'}
$sdlSha256='2b4b128d8d510cc2d442693cf848c050d700d43dc667afe9e5fd82b0570d667e'
if((Get-FileHash -LiteralPath $SdlPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $sdlSha256){throw 'SDL3 runtime hash differs from reviewed official 3.4.18 x64 release'}
$out=[IO.Path]::GetFullPath($OutputDirectory)
$hostDir=Join-Path $out 'host-build'
New-Item -ItemType Directory -Path $hostDir -Force|Out-Null
$payload=if($PayloadPath){[IO.Path]::GetFullPath($PayloadPath)}else{Join-Path $repoRoot 'dist/migration-1.0.3.1/payload.exe'}
. (Join-Path $PSScriptRoot 'icon-resources.ps1')
$iconFile=Join-Path $hostDir 'application.ico'
[IO.File]::WriteAllBytes($iconFile,[WuwaHelper.IconResources]::ReadFirst($payload))
$core=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/controller-core.js'))
$ui=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/controller-ui.js'))
$roomCore=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/room-history-core.js'))
$roomUi=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/room-history-ui.js'))
$uiFile=Join-Path $hostDir 'controller-ui.js'
$luck=[IO.File]::ReadAllText((Join-Path $repoRoot 'patches/inventory-luck.js'))
[IO.File]::WriteAllText($uiFile,$core+"`n"+$ui+"`n"+$roomCore+"`n"+$roomUi+"`n"+$luck,[Text.UTF8Encoding]::new($false))
$pkg=Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw|ConvertFrom-Json
$hash=(Get-FileHash -LiteralPath $payload -Algorithm SHA256).Hash.ToLowerInvariant()
$runtimeId=Join-Path $hostDir 'runtime-id'
[IO.File]::WriteAllText($runtimeId,($pkg.releaseVersion+'-'+$hash.Substring(0,12)))
$exe=Join-Path $out 'Wuwatappo_Helper.exe'
$license=Join-Path $repoRoot 'licenses/SDL3-LICENSE.txt'
& $compiler /nologo /target:winexe /platform:x64 /optimize+ ('/win32icon:'+$iconFile) /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll /reference:System.Core.dll ('/out:'+$exe) ('/resource:'+$payload+',WuwaTappo.exe') ('/resource:'+$SdlPath+',SDL3.dll') ('/resource:'+$license+',SDL3-LICENSE.txt') ('/resource:'+$uiFile+',controller-ui.js') ('/resource:'+$runtimeId+',runtime-id') (Join-Path $repoRoot 'native/ControllerHost.cs') (Join-Path $repoRoot 'native/MouseCapture.cs')
if($LASTEXITCODE -ne 0){throw 'Controller launcher compilation failed'}
$asm=[Reflection.Assembly]::LoadFile($exe)
$checks=@{}
foreach($item in @(@('WuwaTappo.exe',$payload),@('SDL3.dll',$SdlPath),@('controller-ui.js',$uiFile))){$stream=$asm.GetManifestResourceStream($item[0]);$sha=[Security.Cryptography.SHA256]::Create();try{$digest=[Convert]::ToHexString($sha.ComputeHash($stream)).ToLowerInvariant()}finally{$stream.Dispose();$sha.Dispose()};$expected=(Get-FileHash -LiteralPath $item[1] -Algorithm SHA256).Hash.ToLowerInvariant();if($digest -ne $expected){throw 'Embedded resource differs'};$checks[$item[0]]=$digest}
[ordered]@{passed=$true;singleExe=$true;resources=$checks;sdlVersion='3.4.18';controllerRealHardwareTested=$false}|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $out 'controller-bundle-verification.json') -Encoding utf8NoBOM

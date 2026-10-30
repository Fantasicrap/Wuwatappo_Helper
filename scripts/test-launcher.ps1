param([Parameter(Mandatory=$true)][string]$DistributionDirectory,[string]$PayloadPath)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent $PSScriptRoot
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$pkg=Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw|ConvertFrom-Json
$exe=Join-Path $out ("Wuwatappo_Helper-"+$pkg.releaseVersion+".exe")
$assembly=[Reflection.Assembly]::LoadFile($exe)
$flags=[Reflection.BindingFlags]'Static,NonPublic'
$hostType=$assembly.GetType('HelperHost',$true)
$factory=$hostType.GetMethod('ChildStartInfo',$flags)
if(-not $factory){throw 'Launcher policy method missing'}

# Load PE resources as data; never execute the upstream program during this test.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class HelperManifestReader {
 [DllImport("kernel32",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr LoadLibraryEx(string path,IntPtr file,uint flags);
 [DllImport("kernel32",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr FindResource(IntPtr module,IntPtr name,IntPtr type);
 [DllImport("kernel32")] static extern uint SizeofResource(IntPtr module,IntPtr resource);
 [DllImport("kernel32")] static extern IntPtr LoadResource(IntPtr module,IntPtr resource);
 [DllImport("kernel32")] static extern IntPtr LockResource(IntPtr resource);
 [DllImport("kernel32")] static extern bool FreeLibrary(IntPtr module);
 public static string Read(string path) {
  IntPtr m=LoadLibraryEx(path,IntPtr.Zero,0x22);
  if(m==IntPtr.Zero)throw new System.ComponentModel.Win32Exception();
  try {IntPtr r=FindResource(m,new IntPtr(1),new IntPtr(24));if(r==IntPtr.Zero)throw new Exception("Manifest missing");
   byte[] b=new byte[SizeofResource(m,r)];Marshal.Copy(LockResource(LoadResource(m,r)),b,0,b.Length);return System.Text.Encoding.UTF8.GetString(b).TrimStart('\uFEFF');
  } finally {FreeLibrary(m);}
 }
}
'@
$payload=if($PayloadPath){[IO.Path]::GetFullPath($PayloadPath)}else{Join-Path $repoRoot 'dist/migration-1.0.3.1/payload.exe'}
if([HelperManifestReader]::Read($payload) -notmatch 'level="requireAdministrator"'){throw 'Upstream privilege declaration unexpectedly changed'}
if([HelperManifestReader]::Read($exe) -notmatch 'level="asInvoker"'){throw 'Outer launcher should not force elevation'}
$embedded=$assembly.GetManifestResourceStream('WuwaTappo.exe')
$sha=[Security.Cryptography.SHA256]::Create()
try{$embeddedHash=[Convert]::ToHexString($sha.ComputeHash($embedded))}finally{$embedded.Dispose();$sha.Dispose()}
if($embeddedHash -ne (Get-FileHash -LiteralPath $payload -Algorithm SHA256).Hash){throw 'Embedded payload differs from reviewed manifest source'}

$testDir=Join-Path $out 'launcher-test'
New-Item -ItemType Directory -Path $testDir -Force|Out-Null
$stub=Join-Path $testDir 'BenignChild.exe'
$source=Join-Path $testDir 'BenignChild.cs'
$marker=Join-Path $testDir ([Guid]::NewGuid().ToString('N')+'.txt')
[IO.File]::WriteAllText($source,'class BenignChild { static int Main(string[] a) { System.IO.File.WriteAllText(a[0], "started"); return 17; } }')
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
& $compiler /nologo /target:winexe ('/out:'+$stub) $source
if($LASTEXITCODE -ne 0){throw 'Benign child compilation failed'}
$startInfo=$factory.Invoke($null,[string[]]@($stub,$testDir))
if(-not $startInfo.UseShellExecute -or $startInfo.FileName -ne $stub -or $startInfo.WorkingDirectory -ne $testDir -or $startInfo.Verb){throw 'Wrong child launch policy'}
$startInfo.Arguments='"'+$marker+'"'
$child=[Diagnostics.Process]::Start($startInfo)
if(-not $child -or -not $child.WaitForExit(5000)){throw 'Benign child did not finish'}
if($child.ExitCode -ne 17 -or [IO.File]::ReadAllText($marker) -ne 'started'){throw 'Benign child launch verification failed'}
$cancel=$hostType.GetMethod('ElevationCancelled',$flags)
if(-not $cancel.Invoke($null,@([ComponentModel.Win32Exception]::new(1223)))){throw 'UAC cancellation not recognized'}
if($cancel.Invoke($null,@([ComponentModel.Win32Exception]::new(740)))){throw 'Error 740 must not be treated as cancellation'}
$report=[ordered]@{passed=$true;upstreamManifest='requireAdministrator';outerManifest='asInvoker';embeddedPayloadHashVerified=$true;childUsesShellExecute=$true;benignChildStartedAndExitCodeObserved=$true;cancel1223Recognized=$true;error740NotSilenced=$true;uacSettingsChanged=$false;elevatedPayloadLaunched=$false;uacConsentTested=$false}
$report|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $out 'launcher-verification.json') -Encoding utf8NoBOM
$report|ConvertTo-Json

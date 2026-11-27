param([Parameter(Mandatory=$true)][string]$DistributionDirectory,[Parameter(Mandatory=$true)][string]$PayloadPath,[string]$GlobalPayloadPath)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent $PSScriptRoot
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$version=(Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw|ConvertFrom-Json).releaseVersion
$exe=Join-Path $out "Wuwatappo_Helper-$version.exe"
$assembly=[Reflection.Assembly]::LoadFile($exe)
$flags=[Reflection.BindingFlags]'Static,NonPublic'
$hostType=$assembly.GetType('HelperHost',$true)
$extractPayload=$hostType.GetMethod('ExtractPayload',$flags)
if(-not $extractPayload){throw 'ExtractPayload method missing'}
$testDir=Join-Path $out 'extract-test'
New-Item -ItemType Directory -Path $testDir -Force|Out-Null

function Test-PayloadExtraction([bool]$global,[string]$expectedPath,[string]$subDir){
 $dir=Join-Path $testDir $subDir
 New-Item -ItemType Directory -Path $dir -Force|Out-Null
 $expected=(Get-FileHash -LiteralPath $expectedPath -Algorithm SHA256).Hash
 $before=[GC]::GetTotalMemory($true)
 $file=[string]$extractPayload.Invoke($null,[object[]]@($global,[string]$dir))
 $coldDelta=[Math]::Max(0,[GC]::GetTotalMemory($false)-$before)
 if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $expected){throw ("Cold extraction hash differs (global=$global)")}
 $stamp=(Get-Item -LiteralPath $file).LastWriteTimeUtc
 $before=[GC]::GetTotalMemory($true)
 $cached=[string]$extractPayload.Invoke($null,[object[]]@($global,[string]$dir))
 $warmDelta=[Math]::Max(0,[GC]::GetTotalMemory($false)-$before)
 if($cached -ne $file -or (Get-Item -LiteralPath $file).LastWriteTimeUtc -ne $stamp){throw ("Cached payload was rewritten (global=$global)")}
 if($coldDelta -gt 12MB -or $warmDelta -gt 12MB){throw ("Extraction allocated a whole-payload managed buffer (global=$global)")}
 # Corrupt a byte without changing file size: the streaming hash must detect it.
 $stream=[IO.File]::Open($file,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
 try{$first=$stream.ReadByte();$stream.Position=0;$stream.WriteByte($first -bxor 1)}finally{$stream.Dispose()}
 $null=$extractPayload.Invoke($null,[object[]]@($global,[string]$dir))
 if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $expected){throw ("Corrupt cached payload was not repaired (global=$global)")}
 Remove-Item -LiteralPath $file
 return [ordered]@{coldManagedDeltaBytes=$coldDelta;cachedManagedDeltaBytes=$warmDelta;cachedFileReused=$true;sameSizeCorruptionRepaired=$true;sha256=$expected.ToLowerInvariant()}
}

$cnResult=Test-PayloadExtraction $false $PayloadPath 'cn'
$globalResult=$null
if(-not $GlobalPayloadPath){
 $candidate=Join-Path $repoRoot ("dist/migration-"+$version+"-global/payload.exe")
 if(Test-Path -LiteralPath $candidate){$GlobalPayloadPath=$candidate}
}
if($assembly.GetManifestResourceInfo('global/WuwaTappo.delta') -ne $null){
 if(-not $GlobalPayloadPath -or -not (Test-Path -LiteralPath $GlobalPayloadPath)){throw 'Global payload reference required to verify global delta extraction'}
 $globalResult=Test-PayloadExtraction $true $GlobalPayloadPath 'global'
}

$report=[ordered]@{
 passed=$true
 coldManagedDeltaBytes=$cnResult.coldManagedDeltaBytes
 cachedManagedDeltaBytes=$cnResult.cachedManagedDeltaBytes
 cachedFileReused=$true
 sameSizeCorruptionRepaired=$true
 cn=$cnResult
 global=$globalResult
 applicationStarted=$false
}|ConvertTo-Json -Depth 4
[IO.File]::WriteAllText((Join-Path $out 'stream-extract-verification.json'),$report,[Text.UTF8Encoding]::new($false))
$report

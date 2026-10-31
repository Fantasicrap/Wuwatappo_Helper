param([Parameter(Mandatory=$true)][string]$DistributionDirectory,[string]$PayloadPath='dist/migration-1.0.3.2/payload.exe')
$ErrorActionPreference='Stop'
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$exe=Join-Path $out 'Wuwatappo_Helper-1.0.3.2.exe'
$assembly=[Reflection.Assembly]::LoadFile($exe)
$method=$assembly.GetType('HelperHost',$true).GetMethod('Extract',[Reflection.BindingFlags]'Static,NonPublic')
$testDir=Join-Path $out 'extract-test'
New-Item -ItemType Directory -Path $testDir -Force|Out-Null
$expected=(Get-FileHash -LiteralPath $PayloadPath -Algorithm SHA256).Hash
$before=[GC]::GetTotalMemory($true)
$file=[string]$method.Invoke($null,[object[]]@('WuwaTappo.exe',[string]$testDir))
$coldDelta=[Math]::Max(0,[GC]::GetTotalMemory($false)-$before)
if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $expected){throw 'Cold extraction hash differs'}
$stamp=(Get-Item -LiteralPath $file).LastWriteTimeUtc
$before=[GC]::GetTotalMemory($true)
$cached=[string]$method.Invoke($null,[object[]]@('WuwaTappo.exe',[string]$testDir))
$warmDelta=[Math]::Max(0,[GC]::GetTotalMemory($false)-$before)
if($cached -ne $file -or (Get-Item -LiteralPath $file).LastWriteTimeUtc -ne $stamp){throw 'Cached payload was rewritten'}
if($coldDelta -gt 12MB -or $warmDelta -gt 12MB){throw 'Extraction allocated a whole-payload managed buffer'}
# Corrupt a byte without changing file size: the streaming hash must detect it.
$stream=[IO.File]::Open($file,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
try{$first=$stream.ReadByte();$stream.Position=0;$stream.WriteByte($first -bxor 1)}finally{$stream.Dispose()}
$null=$method.Invoke($null,[object[]]@('WuwaTappo.exe',[string]$testDir))
if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $expected){throw 'Corrupt cached payload was not repaired'}
Remove-Item -LiteralPath $file
[ordered]@{passed=$true;coldManagedDeltaBytes=$coldDelta;cachedManagedDeltaBytes=$warmDelta;cachedFileReused=$true;sameSizeCorruptionRepaired=$true;applicationStarted=$false}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $out 'stream-extract-verification.json') -Encoding utf8NoBOM
Get-Content -LiteralPath (Join-Path $out 'stream-extract-verification.json')

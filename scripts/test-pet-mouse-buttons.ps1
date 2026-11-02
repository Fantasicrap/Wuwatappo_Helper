param([Parameter(Mandatory=$true)][string]$DistributionDirectory)
$ErrorActionPreference='Stop'
$exe=Join-Path ([IO.Path]::GetFullPath($DistributionDirectory)) 'Wuwatappo_Helper-1.0.3.3.exe'
$assembly=[Reflection.Assembly]::LoadFile($exe)
$capture=$assembly.GetType('MouseCapture')
$flags=[Reflection.BindingFlags]'NonPublic,Static'
$name=$capture.GetMethod('MouseName',$flags)
$record=$capture.GetMethod('Record',$flags)
$snapshot=$capture.GetMethod('Snapshot',[Reflection.BindingFlags]'Public,Static')
$watched=$capture.GetField('watchedKeys',$flags).GetValue($null)
$before=$snapshot.Invoke($null,@([long]0)).seq
foreach($entry in @(@(4,'middle'),@(5,'x1'),@(6,'x2'))){
 $key=[int]$entry[0];$label=[string]$entry[1]
 if($name.Invoke($null,@($key)) -ne $label -or $watched -notcontains $key){throw 'Missing mouse button mapping'}
 $null=$record.Invoke($null,@($key,$true,$label,0,0))
 $null=$record.Invoke($null,@($key,$true,$label,0,0))
 $null=$record.Invoke($null,@($key,$false,$label,0,0))
}
$events=$snapshot.Invoke($null,@([long]$before)).events
if($events.Count -ne 6){throw 'Mouse down/up pairs were duplicated or lost'}
foreach($label in @('middle','x1','x2')){if(@($events|Where-Object {$_.button -eq $label}).Count -ne 2){throw 'Mouse button pair missing'}}
Write-Output 'PASS: native middle/X1/X2 demand polling mappings and deduplicated down/up edges; no OS input injected.'

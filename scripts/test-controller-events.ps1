param([Parameter(Mandatory=$true)][string]$DistributionDirectory)
$ErrorActionPreference='Stop'
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$pkg=Get-Content -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'package.json') -Raw|ConvertFrom-Json
$assembly=[Reflection.Assembly]::LoadFile((Join-Path $out ("Wuwatappo_Helper-"+$pkg.releaseVersion+".exe")))
$hostType=$assembly.GetType('HelperHost')
$stateType=$assembly.GetType('HelperHost+State')
$flags=[Reflection.BindingFlags]'Static,NonPublic'
$apply=$hostType.GetMethod('ApplyInput',$flags)
$copy=$hostType.GetMethod('Copy',$flags)
$event=[Runtime.InteropServices.Marshal]::AllocHGlobal(256)
function New-State([string]$mapping){
 $s=[Activator]::CreateInstance($stateType)
 $s.id=77;$s.generation=1;$s.mapping=$mapping;$s.buttons=[bool[]]::new(26);$s.axes=[double[]]::new(6);$s.hats=[int[]]::new(1)
 return $s
}
function Send-Event($state,[int]$type,[int]$index,[int]$value=0){
 [Runtime.InteropServices.Marshal]::Copy([byte[]]::new(256),0,$event,256)
 [Runtime.InteropServices.Marshal]::WriteInt32($event,0,$type)
 [Runtime.InteropServices.Marshal]::WriteInt32($event,16,77)
 [Runtime.InteropServices.Marshal]::WriteByte($event,20,[byte]$index)
 [Runtime.InteropServices.Marshal]::WriteByte($event,21,[byte]($value -band 255))
 [Runtime.InteropServices.Marshal]::WriteInt16($event,24,[int16]$value)
 return $apply.Invoke($null,@($state,$event))
}
function Check([bool]$condition,[string]$message){if(-not $condition){throw $message}}
try {
 $s=New-State 'standard'
 Check (Send-Event $s 0x651 0 1) 'SDL down edge lost'
 $pressed=$copy.Invoke($null,@($s))
 Check (-not (Send-Event $s 0x651 0 1)) 'Duplicate down was not filtered'
 Check (Send-Event $s 0x652 0 0) 'SDL up in same drain lost'
 Check ($pressed.buttons[0] -and -not $s.buttons[0]) 'Queued snapshots share mutable arrays'
 Check (-not (Send-Event $s 0x603 1 1)) 'Standard device duplicated raw joystick event'
 [void](Send-Event $s 0x650 0 -32768);[void](Send-Event $s 0x650 5 32767)
 Check ($s.axes[0] -eq -1 -and $s.axes[5] -eq 1) 'Signed sticks / unsigned triggers incorrect'
 [void](Send-Event $s 0x650 5 -100)
 Check ($s.axes[5] -eq 0) 'Negative standard trigger was not clamped'
 Check (-not (Send-Event $s 0x651 255 1)) 'Invalid index accepted'
 $raw=New-State 'raw'
 Check (Send-Event $raw 0x603 2 1) 'Raw down lost'
 Check (Send-Event $raw 0x604 2 0) 'Raw up lost'
 Check (Send-Event $raw 0x602 0 1) 'Raw D-pad up lost'
 Check (Send-Event $raw 0x602 0 4) 'D-pad direct up-to-down transition lost'
 Check ($raw.hats[0] -eq 4) 'Previous D-pad direction stuck'
 Check (Send-Event $raw 0x602 0 0) 'D-pad centre lost'
 # Exercise the actual host snapshot queue, rather than only the decoder.
 $dictionary=$hostType.GetField('devices',$flags).GetValue($null)
 $device=[Activator]::CreateInstance($assembly.GetType('HelperHost+Device'),$true)
 $device.id=77;$device.state=$s
 $dictionary.Add([uint32]77,$device)
 $publish=$hostType.GetMethod('Publish',$flags)
 [void](Send-Event $s 0x651 0 1);[void]$publish.Invoke($null,@([long]100))
 [void](Send-Event $s 0x652 0 0);[void]$publish.Invoke($null,@([long]104))
 $frames=$hostType.GetField('history',$flags).GetValue($null).ToArray()
 Check ($frames.Length -eq 2 -and $frames[0].devices[0].buttons[0] -and -not $frames[1].devices[0].buttons[0]) 'Same-drain down/up not preserved in host queue'
 Check ($frames[1].ms-$frames[0].ms -eq 4 -and $frames[1].seq-$frames[0].seq -eq 1) 'Event order or duration changed'
 [void]$publish.Invoke($null,@([long]103))
 $frames=$hostType.GetField('history',$flags).GetValue($null).ToArray()
 Check ($frames[2].ms -eq 104) 'Host snapshot time moved backwards'
 $report=[ordered]@{passed=$true;syntheticSdlEventDecoding=$true;sameDrainDownUpRetained=$true;hostQueuePreservesOrderAndDuration=$true;duplicateEdgesFiltered=$true;rawAndStandardSeparated=$true;hatDirectTransitions=$true;immutableSnapshots=$true;realHardwareTested=$false;appLaunched=$false}
 $report|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $out 'controller-events-verification.json') -Encoding utf8NoBOM
 $report|ConvertTo-Json
}finally{[Runtime.InteropServices.Marshal]::FreeHGlobal($event)}

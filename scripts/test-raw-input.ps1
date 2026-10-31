param([Parameter(Mandatory=$true)][string]$DistributionDirectory)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent $PSScriptRoot
$pkg=Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw|ConvertFrom-Json
$assembly=[Reflection.Assembly]::LoadFile((Join-Path ([IO.Path]::GetFullPath($DistributionDirectory)) ("Wuwatappo_Helper-"+$pkg.releaseVersion+".exe")))
$policy=$assembly.GetType('HelperHost').GetMethod('KeepAliveAfterExit',[Reflection.BindingFlags]'NonPublic,Static')
$state=@($false,[long]1000,[long]-1)
if(-not $policy.Invoke($null,$state)){throw 'Service must survive the beginning of restart'}
$state[1]=[long]3999;if(-not $policy.Invoke($null,$state)){throw 'Restart grace period too short'}
$state[0]=$true;if(-not $policy.Invoke($null,$state) -or $state[2] -ne -1){throw 'Replacement child must reset shutdown timer'}
$state[0]=$false;$state[1]=[long]5000;$null=$policy.Invoke($null,$state);$state[1]=[long]8000
if($policy.Invoke($null,$state)){throw 'Service must close after a genuine exit'}
$type=$assembly.GetType('MouseCapture',$true)
$demand=$type.GetMethod('DemandActive',[Reflection.BindingFlags]'NonPublic,Static')
$padDemand=$assembly.GetType('HelperHost').GetMethod('ControllerDemandActive',[Reflection.BindingFlags]'NonPublic,Static')
foreach($check in @($demand,$padDemand)){
 if(-not $check.Invoke($null,@([long]1000,[long]1000))){throw 'Active consumer must enable sampling'}
 if(-not $check.Invoke($null,@([long]1749,[long]1000))){throw 'Sampling lease expires too early'}
 if($check.Invoke($null,@([long]1750,[long]1000))){throw 'Inactive consumer keeps sampling after lease'}
 if($check.Invoke($null,@([long]0,[long]-10000))){throw 'Sampling must be idle before first consumer'}
}
$record=$type.GetMethod('Record',[Reflection.BindingFlags]'NonPublic,Static')
$snapshot=$type.GetMethod('Snapshot',[Reflection.BindingFlags]'Public,Static')
foreach($vk in @(49,50,51,81,69,82,32,1,2)){
 $button=if($vk -eq 1){'left'}elseif($vk -eq 2){'right'}else{$null}
 $record.Invoke($null,@([int]$vk,$true,$button,[int]0,[int]0))|Out-Null
 $record.Invoke($null,@([int]$vk,$true,$button,[int]0,[int]0))|Out-Null
 $record.Invoke($null,@([int]$vk,$false,$button,[int]0,[int]0))|Out-Null
}
$data=$snapshot.Invoke($null,@([long]0))|ConvertTo-Json -Depth 5|ConvertFrom-Json
if($data.events.Count -ne 18){throw 'Repeated presses were not deduplicated'}
$expected=@('1','2','3','Q','E','R','Space','left','right')
for($i=0;$i -lt 9;$i++){$down=$data.events[$i*2];$up=$data.events[$i*2+1];$name=if($down.key){$down.key}else{$down.button};if($name -ne $expected[$i] -or $down.action -ne 'press' -or $up.action -ne 'release'){throw 'Raw edge mapping mismatch'}}
@{passed=$true;syntheticRecordTest=$true;allNineControls=$true;duplicatePressesIgnored=$true;realGameTested=$false}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $DistributionDirectory 'raw-input-verification.json') -Encoding utf8NoBOM
Write-Output 'PASS: native raw key and mouse mapping preserves 18 edges for all nine controls.'

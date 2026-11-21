param([Parameter(Mandatory=$true)][string]$OutputDirectory,[string]$SongsDirectory,[string]$DeniaBackground=$env:WUWA_DENIA_BACKGROUND,[string]$PhrolovaBackground=$env:WUWA_PHROLOVA_BACKGROUND,[switch]$WithoutFanBackgrounds)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$out=[IO.Path]::GetFullPath($OutputDirectory)
$images=Join-Path $root 'dist/theme-assets'
New-Item -ItemType Directory -Path $out -Force | Out-Null
if(!$SongsDirectory){$SongsDirectory=Join-Path (Split-Path -Parent $root) 'Songs'}

function Add-Asset($list,[string]$name,[string]$source){
 if($source -and (Test-Path -LiteralPath $source -PathType Leaf)){$list[$name]=(Get-Item -LiteralPath $source)}
}

function Add-Background($list,[string]$source){
 if(!$source){return}
 $extension=[IO.Path]::GetExtension($source).ToLowerInvariant()
 if($extension -eq '.jpeg'){$extension='.jpg'}
 if($extension -notin '.jpg','.png','.webp'){throw 'Theme background must be JPEG, PNG, or WebP.'}
 if(!(Test-Path -LiteralPath $source -PathType Leaf)){throw ('Requested theme background missing: '+$source)}
 Add-Asset $list ('background'+$extension) $source
}

function Export-Pack([string]$id,[string]$credit,[string[]]$effects,$assets,[object[]]$songs){
 $manifest=[ordered]@{schemaVersion=1;id=$id;version='1.0.0';credit=$credit;effects=$effects;songs=$songs;files=[ordered]@{}}
 $total=0
 foreach($asset in $assets.GetEnumerator()){
  $limit=if($asset.Key.EndsWith('.mp3')){20MB}else{4MB}
  $total+=$asset.Value.Length
  if($asset.Value.Length -le 0 -or $asset.Value.Length -gt $limit -or $total -gt 63MB){throw ('Theme asset exceeds size limit: '+$asset.Key)}
  $manifest.files[$asset.Key]=(Get-FileHash -Algorithm SHA256 -LiteralPath $asset.Value.FullName).Hash.ToLowerInvariant()
 }
 $target=Join-Path $out ($id+'.wttheme')
 $temp=$target+'.'+[Guid]::NewGuid().ToString('N')+'.tmp'
 try{
  $zip=[IO.Compression.ZipFile]::Open($temp,[IO.Compression.ZipArchiveMode]::Create)
  try{
   $stream=$zip.CreateEntry('manifest.json',[IO.Compression.CompressionLevel]::Optimal).Open()
   $writer=[IO.StreamWriter]::new($stream,[Text.UTF8Encoding]::new($false))
   try{$writer.Write((ConvertTo-Json -InputObject $manifest -Depth 6 -Compress))}finally{$writer.Dispose()}
   foreach($asset in $assets.GetEnumerator()){
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$asset.Value.FullName,$asset.Key,[IO.Compression.CompressionLevel]::NoCompression) | Out-Null
   }
  }finally{$zip.Dispose()}
  if(Test-Path -LiteralPath $target){[IO.File]::Replace($temp,$target,[NullString]::Value)}else{[IO.File]::Move($temp,$target)}
 }finally{if(Test-Path -LiteralPath $temp){Remove-Item -LiteralPath $temp}}
 Get-Item -LiteralPath $target
}

$aemeath=[ordered]@{}
Add-Asset $aemeath 'background.jpg' (Join-Path $images 'aemeath-background.jpg')
if($WithoutFanBackgrounds){$aemeath.Remove('background.jpg')}
Add-Asset $aemeath 'toolbar.png' (Join-Path $images 'aemeath-toolbar.png')
Add-Asset $aemeath 'tides.webp' (Join-Path $images 'aemeath-tides.webp')
Add-Asset $aemeath 'mech.webp' (Join-Path $images 'aemeath-mech.webp')
$songs=@()
if(Test-Path -LiteralPath $SongsDirectory -PathType Container){
 $tracks=@(Get-ChildItem -LiteralPath $SongsDirectory -Filter '*.mp3' -File | Sort-Object Name | Select-Object -First 9)
 for($i=0;$i -lt $tracks.Count;$i++){
  $track=$tracks[$i]
  $artist,$title=$track.BaseName -split ' - ',2
  if(!$title){$title=$artist;$artist=''}
  $name='song-'+$i+'.mp3'
  Add-Asset $aemeath $name $track.FullName
  $songs+=@{file=$name;name=$title;artist=$artist}
 }
}
$aemeathCredit=if($aemeath.Contains('background.jpg')){'背景插画 Sanyue-Qiushi。'}else{''}
if($songs.Count){$aemeathCredit+='内置歌曲的最终权利归歌曲作者和库洛游戏公司所有。'}
Export-Pack 'aemeath' $aemeathCredit @('mech','player','tides') $aemeath $songs

$denia=[ordered]@{}
if(!$WithoutFanBackgrounds){Add-Background $denia $DeniaBackground}
Add-Asset $denia 'toolbar.png' (Join-Path $images 'denia-toolbar.png')
Add-Asset $denia 'tides.webp' (Join-Path $images 'aemeath-tides.webp')
$deniaCredit=if($DeniaBackground -and !$WithoutFanBackgrounds){[string]$env:WUWA_DENIA_BACKGROUND_CREDIT}else{''}
Export-Pack 'denia' $deniaCredit @('denia','blocks','tides') $denia @()

$phrolova=[ordered]@{}
if(!$WithoutFanBackgrounds){Add-Background $phrolova $PhrolovaBackground}
Add-Asset $phrolova 'toolbar.png' (Join-Path $images 'phrolova-toolbar.png')
Add-Asset $phrolova 'tides.webp' (Join-Path $images 'aemeath-tides.webp')
$phrolovaCredit=if($PhrolovaBackground -and !$WithoutFanBackgrounds){[string]$env:WUWA_PHROLOVA_BACKGROUND_CREDIT}else{''}
Export-Pack 'phrolova' $phrolovaCredit @('phrolova','tides') $phrolova @()

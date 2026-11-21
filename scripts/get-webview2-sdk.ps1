$ErrorActionPreference='Stop'
$version='1.0.3595.46'
$root=Split-Path -Parent $PSScriptRoot
$sdk=Join-Path $root "dist/dependencies/webview2-$version"
$archive=Join-Path $sdk 'sdk.zip'
$files=@('LICENSE.txt','NOTICE.txt','lib/net462/Microsoft.Web.WebView2.Core.dll','lib/net462/Microsoft.Web.WebView2.WinForms.dll','runtimes/win-x64/native/WebView2Loader.dll')
if(!(@($files | Where-Object { !(Test-Path -LiteralPath (Join-Path $sdk $_) -PathType Leaf) }).Count)){
 $sdk
 return
}
New-Item -ItemType Directory -Force -Path $sdk | Out-Null
if(!(Test-Path -LiteralPath $archive)){
 Invoke-WebRequest -Uri "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/$version/microsoft.web.webview2.$version.nupkg" -OutFile $archive
}
if((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne 'F448C20859199ECD846A7D693710D143A8CD019AD1DCDC4CD6332D842D871054'){
 throw "WebView2 $version SDK archive SHA-256 mismatch."
}
$zip=[IO.Compression.ZipFile]::OpenRead($archive)
try{
 foreach($name in $files){
  $entry=$zip.GetEntry($name)
  if(!$entry){throw "WebView2 SDK is missing $name"}
  $target=Join-Path $sdk $name
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$target,$true)
 }
}finally{$zip.Dispose()}
$sdk

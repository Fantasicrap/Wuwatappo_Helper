param([Parameter(Mandatory=$true)][string]$DistributionDirectory)
$ErrorActionPreference='Stop'
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$pkg=Get-Content -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'package.json') -Raw|ConvertFrom-Json
$testDir=Join-Path $out 'http-smoke';New-Item -ItemType Directory -Path $testDir -Force|Out-Null
$code=@'
using System;using System.IO;using System.IO.Compression;using System.Net;using System.Net.Sockets;using System.Reflection;using System.Threading;
class Smoke {
 static HttpWebResponse Request(int port,string path,string method,string origin,bool token=false,int range=0,bool action=false){
  var req=(HttpWebRequest)WebRequest.Create("http://127.0.0.1:"+port+path);req.Method=method;req.Timeout=5000;
  if(origin!=null)req.Headers["Origin"]=origin;
  if(method=="POST")req.ContentLength=0;
  if(token)req.Headers["X-Wuwa-Update"]="1";
  if(action)req.Headers["X-Wuwa-Action"]="1";
  if(range>0)req.AddRange(0,range-1);
  try{return (HttpWebResponse)req.GetResponse();}catch(WebException e){if(e.Response!=null)return (HttpWebResponse)e.Response;throw;}
 }
 static string Body(HttpWebResponse response){using(var reader=new StreamReader(response.GetResponseStream()))return reader.ReadToEnd();}
 static void Check(bool result,string message){if(!result)throw new Exception(message);}
 static int Main(string[] args){try{
  const string origin="http://tauri.localhost";
  var asm=Assembly.LoadFile(args[0]);var reply=asm.GetType("HelperHost").GetMethod("Reply",BindingFlags.Static|BindingFlags.NonPublic);
  var theme=asm.GetType("ThemePackages");
  var flags=BindingFlags.Static|BindingFlags.NonPublic;
  var init=theme.GetMethod("Initialize",flags);var import=theme.GetMethod("Import",flags);
  string distribution=Path.GetDirectoryName(args[0]);
  string themeFolder=Path.Combine(distribution,"http-smoke","themes-"+Guid.NewGuid().ToString("N"));
  init.Invoke(null,new object[]{themeFolder});
  Check(!Array.Exists(asm.GetManifestResourceNames(),name=>name.StartsWith("music/",StringComparison.Ordinal)),"Songs still bundled into the core EXE");
  var listener=new TcpListener(IPAddress.Loopback,0);listener.Start();int port=((IPEndPoint)listener.LocalEndpoint).Port;
  var thread=new Thread(()=>{try{while(true)reply.Invoke(null,new object[]{listener.AcceptTcpClient()});}catch(SocketException){}catch(InvalidOperationException){}});
  thread.IsBackground=true;thread.Start();
  using(var res=Request(port,"/ui.js?retry=1","GET",origin)){
   string body=Body(res);Check(res.StatusCode==HttpStatusCode.OK&&res.Headers["Access-Control-Allow-Origin"]==origin&&body.Contains("openRoomHistory")&&body.Contains("installDefaultMonitor")&&body.Contains("mountHelperUpdate"),"Incomplete helper module or invalid CORS");
  }
  using(var res=Request(port,"/denia-blocks","GET",null))Check(res.StatusCode==HttpStatusCode.OK&&res.ContentType.StartsWith("text/html")&&res.Headers["X-Frame-Options"]=="DENY"&&Body(res).Contains("拉海洛方块"),"Denia game not served as a standalone local page");
  using(var res=Request(port,"/denia-blocks/falling","GET",null))Check(res.StatusCode==HttpStatusCode.OK&&res.ContentType.StartsWith("text/html")&&res.Headers["X-Frame-Options"]=="DENY"&&Body(res).Contains("经典下落"),"Falling blocks page was missing");
  using(var res=Request(port,"/theme-packs","GET",origin))Check(Body(res)=="{}","Unexpected themes on a fresh profile");
  using(var res=Request(port,"/theme-packs/import","POST",null,false,0,true))Check((int)res.StatusCode==403,"Origin-less import request accepted");
  using(var res=Request(port,"/theme-packs/import","POST",origin))Check((int)res.StatusCode==405,"Import POST did not require the action header");
  using(var res=Request(port,"/denia-blocks/open","GET",origin))Check((int)res.StatusCode==405,"GET could open a new window");
  using(var res=Request(port,"/denia-blocks/open","POST",origin,false,0,true))Check(res.StatusCode==HttpStatusCode.OK&&Body(res).Contains("false"),"Game opened without an installed theme or a configured host");
  using(var res=Request(port,"/update/install","OPTIONS",origin))Check(res.StatusCode==HttpStatusCode.OK&&res.Headers["Access-Control-Allow-Private-Network"]=="true"&&(res.Headers["Access-Control-Allow-Headers"]??"").Contains("X-Wuwa-Update"),"Update preflight failed");
  string selected;
  using(var res=Request(port,"/update/status","GET",origin)){
   string body=Body(res);Check(res.StatusCode==HttpStatusCode.OK&&body.Contains(asm.GetName().Version.ToString())&&body.Contains("\"downloadSource\":"),"Update status, source or version failed");
   selected=body.Contains("\"downloadSource\":\"gh-proxy\"")?"gh-proxy":"github";
  }
  using(var res=Request(port,"/update/install","GET",origin))Check((int)res.StatusCode==405,"GET performed an update action");
  using(var res=Request(port,"/update/install","POST",null,true))Check(res.StatusCode==HttpStatusCode.Forbidden,"Origin-less update command accepted");
  using(var res=Request(port,"/update/install","POST",origin))Check((int)res.StatusCode==405,"Update POST did not require custom header");
  using(var res=Request(port,"/update/install","POST",origin,true))Check(res.StatusCode==HttpStatusCode.OK&&Body(res).Contains("false"),"Unprepared installation accepted");
  using(var res=Request(port,"/update/source/"+selected,"GET",origin))Check((int)res.StatusCode==405,"GET could change the download source");
  using(var res=Request(port,"/update/source/"+selected,"POST",null,true))Check(res.StatusCode==HttpStatusCode.Forbidden,"Origin-less source command accepted");
  using(var res=Request(port,"/update/source/other","POST",origin,true))Check(res.StatusCode==HttpStatusCode.NotFound,"An arbitrary source was accepted");
  using(var res=Request(port,"/update/source/"+selected,"POST",origin,true))Check(res.StatusCode==HttpStatusCode.OK&&Body(res).Contains("true"),"Recognized source command rejected");
  foreach(string id in new[]{"aemeath","denia","phrolova"}){
   var pack=Path.Combine(distribution,id+".wttheme");
   if(!File.Exists(pack))continue;
   Check((string)import.Invoke(null,new object[]{pack})==id,"Theme import returned the wrong ID");
   Check((string)import.Invoke(null,new object[]{pack})==id,"Replacement import failed");
   init.Invoke(null,new object[]{themeFolder});
   using(var res=Request(port,"/theme-packs","GET",origin))Check(Body(res).Contains("\""+id+"\""),"Installed theme did not survive reload");
   using(var archive=new ZipArchive(File.OpenRead(pack),ZipArchiveMode.Read))
   foreach(var entry in archive.Entries){
    if(entry.FullName=="manifest.json")continue;
    var route="/theme-assets/"+id+"/"+entry.FullName+"?v=smoke";
    using(var response=Request(port,route,"GET",origin,false,32))
    using(var remote=new BinaryReader(response.GetResponseStream()))
    using(var original=new BinaryReader(entry.Open())){
     Check((int)response.StatusCode==206&&response.ContentLength==32&&response.Headers["Content-Range"]=="bytes 0-31/"+entry.Length,"Invalid theme asset range response");
     Check(Convert.ToBase64String(remote.ReadBytes(32))==Convert.ToBase64String(original.ReadBytes(32)),"Theme asset bytes differ from the package");
    }
    using(var response=Request(port,route,"GET","https://unrelated.test"))Check((int)response.StatusCode==403,"Unrelated site accessed a theme asset");
   }
  }
  Directory.CreateDirectory(themeFolder);
  var invalid=Path.Combine(themeFolder,"invalid.wttheme");File.WriteAllText(invalid,"not a theme package");
  try{import.Invoke(null,new object[]{invalid});throw new Exception("Invalid theme was accepted");}
  catch(TargetInvocationException failure){Check(failure.InnerException is InvalidDataException,"Unexpected invalid theme failure");}
  listener.Stop();thread.Join(1000);Console.WriteLine("PASS: loopback routes, theme import and ranged assets, native action gating");return 0;
 }catch(Exception e){Console.Error.WriteLine(e);return 1;}}
}
'@
$source=Join-Path $testDir 'Smoke.cs';[IO.File]::WriteAllText($source,$code)
$exe=Join-Path $testDir 'Smoke.exe'
& (Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe') /nologo /target:exe /reference:System.IO.Compression.dll ('/out:'+$exe) $source
if($LASTEXITCODE -ne 0){throw 'HTTP smoke compilation failed'}
$app=Join-Path $out ("Wuwatappo_Helper-"+$pkg.releaseVersion+".exe")
$proc=Start-Process -FilePath $exe -ArgumentList ('"'+$app+'"') -WindowStyle Hidden -PassThru -Wait -RedirectStandardOutput (Join-Path $testDir 'stdout.log') -RedirectStandardError (Join-Path $testDir 'stderr.log')
if($proc.ExitCode -ne 0){Get-Content (Join-Path $testDir 'stderr.log');throw 'HTTP smoke failed'}
Get-Content (Join-Path $testDir 'stdout.log')

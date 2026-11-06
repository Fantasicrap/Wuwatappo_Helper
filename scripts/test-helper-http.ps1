param([Parameter(Mandatory=$true)][string]$DistributionDirectory)
$ErrorActionPreference='Stop'
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$pkg=Get-Content -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'package.json') -Raw|ConvertFrom-Json
$testDir=Join-Path $out 'http-smoke';New-Item -ItemType Directory -Path $testDir -Force|Out-Null
$code=@'
using System;using System.IO;using System.Net;using System.Net.Sockets;using System.Reflection;using System.Threading;
class Smoke {
 static HttpWebResponse Request(int port,string path,string method,string origin,bool token=false){
  var req=(HttpWebRequest)WebRequest.Create("http://127.0.0.1:"+port+path);req.Method=method;req.Timeout=5000;
  if(origin!=null)req.Headers["Origin"]=origin;
  if(method=="POST")req.ContentLength=0;
  if(token)req.Headers["X-Wuwa-Update"]="1";
  try{return (HttpWebResponse)req.GetResponse();}catch(WebException e){if(e.Response!=null)return (HttpWebResponse)e.Response;throw;}
 }
 static string Body(HttpWebResponse response){using(var reader=new StreamReader(response.GetResponseStream()))return reader.ReadToEnd();}
 static void Check(bool result,string message){if(!result)throw new Exception(message);}
 static int Main(string[] args){try{
  const string origin="http://tauri.localhost";
  var asm=Assembly.LoadFile(args[0]);var reply=asm.GetType("HelperHost").GetMethod("Reply",BindingFlags.Static|BindingFlags.NonPublic);
  var listener=new TcpListener(IPAddress.Loopback,0);listener.Start();int port=((IPEndPoint)listener.LocalEndpoint).Port;
  var thread=new Thread(()=>{for(int i=0;i<11;i++)reply.Invoke(null,new object[]{listener.AcceptTcpClient()});});thread.IsBackground=true;thread.Start();
  using(var res=Request(port,"/ui.js?retry=1","GET",origin)){
   string body=Body(res);Check(res.StatusCode==HttpStatusCode.OK&&res.Headers["Access-Control-Allow-Origin"]==origin&&body.Contains("openRoomHistory")&&body.Contains("installDefaultMonitor")&&body.Contains("mountHelperUpdate"),"Incomplete helper module or invalid CORS");
  }
  using(var res=Request(port,"/update/install","OPTIONS",origin))Check(res.StatusCode==HttpStatusCode.OK&&res.Headers["Access-Control-Allow-Private-Network"]=="true"&&res.Headers["Access-Control-Allow-Headers"]=="X-Wuwa-Update","Update preflight failed");
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
  listener.Stop();thread.Join(1000);Console.WriteLine("PASS: loopback query route, update CORS and gated POST actions");return 0;
 }catch(Exception e){Console.Error.WriteLine(e);return 1;}}
}
'@
$source=Join-Path $testDir 'Smoke.cs';[IO.File]::WriteAllText($source,$code)
$exe=Join-Path $testDir 'Smoke.exe'
& (Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe') /nologo /target:exe ('/out:'+$exe) $source
if($LASTEXITCODE -ne 0){throw 'HTTP smoke compilation failed'}
$app=Join-Path $out ("Wuwatappo_Helper-"+$pkg.releaseVersion+".exe")
$proc=Start-Process -FilePath $exe -ArgumentList ('"'+$app+'"') -WindowStyle Hidden -PassThru -Wait -RedirectStandardOutput (Join-Path $testDir 'stdout.log') -RedirectStandardError (Join-Path $testDir 'stderr.log')
if($proc.ExitCode -ne 0){Get-Content (Join-Path $testDir 'stderr.log');throw 'HTTP smoke failed'}
Get-Content (Join-Path $testDir 'stdout.log')

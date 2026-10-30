param([Parameter(Mandatory=$true)][string]$DistributionDirectory)
$ErrorActionPreference='Stop'
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$pkg=Get-Content -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'package.json') -Raw|ConvertFrom-Json
$testDir=Join-Path $out 'http-smoke';New-Item -ItemType Directory -Path $testDir -Force|Out-Null
$code=@'
using System;using System.IO;using System.Net;using System.Net.Sockets;using System.Reflection;using System.Threading;
class Smoke {static int Main(string[] args){try{var asm=Assembly.LoadFile(args[0]);var reply=asm.GetType("HelperHost").GetMethod("Reply",BindingFlags.Static|BindingFlags.NonPublic);var listener=new TcpListener(IPAddress.Loopback,0);listener.Start();int port=((IPEndPoint)listener.LocalEndpoint).Port;var thread=new Thread(()=>{for(int i=0;i<2;i++)reply.Invoke(null,new object[]{listener.AcceptTcpClient()});});thread.IsBackground=true;thread.Start();foreach(string method in new[]{"GET","OPTIONS"}){var req=(HttpWebRequest)WebRequest.Create("http://127.0.0.1:"+port+"/ui.js?retry=1");req.Method=method;req.Timeout=5000;req.Headers["Origin"]="http://tauri.localhost";using(var res=(HttpWebResponse)req.GetResponse()){if(res.StatusCode!=HttpStatusCode.OK||res.Headers["Access-Control-Allow-Origin"]!="http://tauri.localhost")throw new Exception("CORS or query route failed");if(method=="GET"){using(var reader=new StreamReader(res.GetResponseStream())){string body=reader.ReadToEnd();if(!body.Contains("InventoryLuck")||!body.Contains("installDefaultMonitor"))throw new Exception("Incomplete helper module");}}else if(res.Headers["Access-Control-Allow-Private-Network"]!="true")throw new Exception("Missing private network preflight response");}}listener.Stop();thread.Join(1000);Console.WriteLine("PASS: actual helper HTTP handler serves query URLs and private-network CORS preflight on isolated port");return 0;}catch(Exception e){Console.Error.WriteLine(e);return 1;}}}
'@
$source=Join-Path $testDir 'Smoke.cs';[IO.File]::WriteAllText($source,$code)
$exe=Join-Path $testDir 'Smoke.exe'
& (Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe') /nologo /target:exe ('/out:'+$exe) $source
if($LASTEXITCODE -ne 0){throw 'HTTP smoke compilation failed'}
$app=Join-Path $out ("Wuwatappo_Helper-"+$pkg.releaseVersion+".exe")
$proc=Start-Process -FilePath $exe -ArgumentList ('"'+$app+'"') -WindowStyle Hidden -PassThru -Wait -RedirectStandardOutput (Join-Path $testDir 'stdout.log') -RedirectStandardError (Join-Path $testDir 'stderr.log')
if($proc.ExitCode -ne 0){Get-Content (Join-Path $testDir 'stderr.log');throw 'HTTP smoke failed'}
Get-Content (Join-Path $testDir 'stdout.log')

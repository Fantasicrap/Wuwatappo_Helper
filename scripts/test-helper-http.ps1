param([Parameter(Mandatory=$true)][string]$DistributionDirectory)
$ErrorActionPreference='Stop'
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$pkg=Get-Content -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'package.json') -Raw|ConvertFrom-Json
$testDir=Join-Path $out 'http-smoke';New-Item -ItemType Directory -Path $testDir -Force|Out-Null
$code=@'
using System;using System.IO;using System.IO.Compression;using System.Net;using System.Net.Sockets;using System.Reflection;using System.Threading;using System.Security.Principal;
public class Smoke {
 public sealed class StartupList<T> {public T Entry;public int Count=1;public T Item(int index){return Entry;}}
 public sealed class StartupPrincipal {public int LogonType=3,RunLevel=1;public string UserId;}
 public sealed class StartupTrigger {public int Type=9;public bool Enabled=true;public string UserId,Delay="PT30S";}
 public sealed class StartupAction {public int Type=0;public string Path,Arguments,WorkingDirectory;}
 public sealed class StartupDefinition {
  public StartupPrincipal Principal=new StartupPrincipal();
  public StartupList<StartupTrigger> Triggers=new StartupList<StartupTrigger>{Entry=new StartupTrigger()};
  public StartupList<StartupAction> Actions=new StartupList<StartupAction>{Entry=new StartupAction()};
 }
 public sealed class StartupTask {public bool Enabled=true;public StartupDefinition Definition=new StartupDefinition();}
 public sealed class StartupFolder {
  public StartupTask Task=new StartupTask();
  public bool DenyWrite;
  public int Writes,Flags;
  public StartupTask GetTask(string name){return Task;}
  public void RegisterTaskDefinition(string name,StartupDefinition definition,int flags,object user,object password,int logon,object permissions){
   if(DenyWrite)throw new UnauthorizedAccessException();
   Task.Definition=definition;Flags=flags;Writes++;
  }
 }
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
  var helper=asm.GetType("HelperHost");
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
  var autostart=asm.GetType("HelperAutostart");
  var decide=autostart.GetMethod("ShouldRetarget",flags);
  string runtime=Path.Combine(distribution,"http-smoke","runtime");
  var currentVersion=asm.GetName().Version;
  var newer=new Version(currentVersion.Major,currentVersion.Minor,currentVersion.Build,currentVersion.Revision+1);
  string legacy=Path.Combine(runtime,currentVersion+"-0123456789ab","WuwaTappo.exe");
  Func<string,string,bool> retarget=(target,arguments)=>(bool)decide.Invoke(null,new object[]{target,arguments,args[0],currentVersion,runtime});
  Check(retarget(legacy,""),"Older Helper runtime should migrate to the outer launcher");
  Check(!retarget(Path.Combine(distribution,"WuwaTappo.exe"),""),"Standalone official client can be replaced");
  Check(!retarget(legacy,"--unrelated"),"An action with unrelated arguments can be replaced");
  Check(!retarget(args[0],"--helper-autostart"),"Current launcher still requests migration");
  Check(!retarget(Path.Combine(distribution,"Wuwatappo_Helper-"+newer+".exe"),"--helper-autostart"),"Launching an older Helper downgrades autostart");
  Check(retarget(Path.Combine(runtime,currentVersion+"-0123456789ab-global","WuwaTappo.exe"),null),"Global profile runtime should migrate to the same outer launcher");
  var scheduler=new StartupFolder();
  using(var identity=WindowsIdentity.GetCurrent())scheduler.Task.Definition.Principal.UserId=identity.User.Value;
  var migration=autostart.GetMethod("UpdateTask",flags);
  var taskArgs=new object[]{scheduler,"ElevatedAutostart",args[0],currentVersion,runtime};
  scheduler.Task.Definition.Actions.Entry.Path=legacy;
  scheduler.Task.Enabled=false;
  Check(migration.Invoke(null,taskArgs).ToString()=="Unmanaged"&&scheduler.Writes==0,"A disabled task was enabled");
  scheduler.Task.Enabled=true;
  scheduler.DenyWrite=true;
  Check(migration.Invoke(null,taskArgs).ToString()=="NeedsElevation"&&scheduler.Writes==0,"A denied write did not request elevation");
  scheduler.Task.Definition.Actions.Entry.Path=legacy;
  scheduler.Task.Definition.Actions.Entry.Arguments=null;
  scheduler.DenyWrite=false;
  Check(migration.Invoke(null,taskArgs).ToString()=="Updated"&&scheduler.Writes==1&&scheduler.Flags==52,"Existing task was not updated safely");
  Check(scheduler.Task.Definition.Actions.Entry.Path==args[0]&&scheduler.Task.Definition.Actions.Entry.Arguments=="--helper-autostart","Task did not switch to the launcher");
  Check(scheduler.Task.Definition.Triggers.Entry.Delay=="PT30S"&&scheduler.Task.Definition.Principal.RunLevel==1,"Task trigger or permissions changed");
  Check(migration.Invoke(null,taskArgs).ToString()=="Current"&&scheduler.Writes==1,"Current task was registered twice");
  using(var res=Request(port,"/autostart/status","GET",origin))Check((int)res.StatusCode==403,"Autostart status did not require the action header");
  using(var res=Request(port,"/autostart/retarget","POST",null,false,0,true))Check((int)res.StatusCode==403,"Origin-less autostart migration request accepted");
  using(var res=Request(port,"/autostart/retarget","GET",origin,false,0,true))Check((int)res.StatusCode==405,"GET could change autostart");
  using(var res=Request(port,"/denia-blocks","GET",null))Check(res.StatusCode==HttpStatusCode.OK&&res.ContentType.StartsWith("text/html")&&res.Headers["X-Frame-Options"]=="DENY"&&Body(res).Contains("拉海洛方块"),"Denia game not served as a standalone local page");
  using(var res=Request(port,"/denia-blocks/falling","GET",null))Check(res.StatusCode==HttpStatusCode.OK&&res.ContentType.StartsWith("text/html")&&res.Headers["X-Frame-Options"]=="DENY"&&Body(res).Contains("经典下落"),"Falling blocks page was missing");
  using(var res=Request(port,"/theme-packs","GET",origin))Check(Body(res)=="{}","Unexpected themes on a fresh profile");
  using(var res=Request(port,"/theme-packs/import","POST",null,false,0,true))Check((int)res.StatusCode==403,"Origin-less import request accepted");
  using(var res=Request(port,"/theme-packs/import","POST",origin))Check((int)res.StatusCode==405,"Import POST did not require the action header");
  using(var res=Request(port,"/denia-blocks/open","GET",origin))Check((int)res.StatusCode==405,"GET could open a new window");
  using(var res=Request(port,"/denia-blocks/open","POST",origin,false,0,true))Check(res.StatusCode==HttpStatusCode.OK&&Body(res).Contains("false"),"Game opened without an installed theme or a configured host");
  if(asm.GetManifestResourceInfo("global/WuwaTappo.exe")!=null){
   const string state="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
   var loginWindow=asm.GetType("GlobalSignInWindow");
   var parser=loginWindow.GetMethod("ParseCallback",flags);
   var uri=new Uri("wuwa-buddy://auth/callback?state="+state+"&cuid=test&access_token=mock-only");
   Check(parser.Invoke(null,new object[]{uri,state})!=null,"Valid mock callback was rejected");
   Check(parser.Invoke(null,new object[]{uri,state.Replace('a','b')})==null,"Wrong sign-in state was accepted");
   Check(parser.Invoke(null,new object[]{new Uri("https://auth/callback?state="+state),state})==null,"Unexpected callback scheme accepted");
   Func<string,string,bool> loginUri=(method,address)=>(bool)loginWindow.GetMethod(method,flags).Invoke(null,new object[]{new Uri(address)});
   Check(loginUri("IsPopupSource","https://sdk-prod-cdn-aws.kurogame-service.com/pro/h5sdk/login/"),"Official SDK frame could not request a popup");
   Check(!loginUri("IsPopupSource","https://sdk-prod-cdn-aws.kurogame-service.com.example.net/"),"An unrelated site was trusted as the SDK frame");
   Check(loginUri("IsPopupDestination","about:blank")&&loginUri("IsPopupDestination","https://appleid.apple.com/"),"An expected login popup destination was blocked");
   Check(loginUri("IsPopupDestination","https://accounts.google.com/")&&!loginUri("IsPopupDestination","https://accounts.google.com.example.net/"),"The Google sign-in host was not matched exactly");
   Func<string,string,bool> opensLoginPopup=(from,to)=>(bool)loginWindow.GetMethod("IsPopupRequest",flags).Invoke(null,new object[]{new Uri(from),new Uri(to)});
   const string google="https://accounts.google.com/";
   const string sdk="https://sdk-prod-cdn-aws.kurogame-service.com/pro/h5sdk/login/";
   Check(opensLoginPopup(sdk,google)&&opensLoginPopup(google,google)&&opensLoginPopup(google,"about:blank"),"An expected Google sign-in popup was blocked");
   Check(!opensLoginPopup("https://example.net/",google)&&!opensLoginPopup(google,"https://appleid.apple.com/"),"An unrelated frame was allowed to open a sign-in popup");
   Check(!loginUri("IsPopupDestination","https://appleid.apple.com:8443/")&&!loginUri("IsPopupDestination","https://appleid.apple.com@example.net/"),"An unintended popup destination was allowed");
   using(var res=Request(port,"/region/switch/global","POST",null,false,0,true))Check((int)res.StatusCode==403,"Origin-less region action accepted");
   using(var res=Request(port,"/region/auth/result/"+state,"GET",origin))Check((int)res.StatusCode==403,"Sign-in result did not require the action header");
   helper.GetField("hasGlobal",flags).SetValue(null,true);
   helper.GetField("regionFile",flags).SetValue(null,Path.Combine(distribution,"http-smoke","region.txt"));
   var localeFile=Path.Combine(distribution,"http-smoke","language-"+Guid.NewGuid().ToString("N")+".txt");
   helper.GetField("languageFile",flags).SetValue(null,localeFile);
   using(var res=Request(port,"/region/language","GET",origin))Check((int)res.StatusCode==403,"Locale preference did not require the action header");
   using(var res=Request(port,"/region/language","GET",origin,false,0,true))Check(Body(res).Contains("null"),"A fresh profile already has a language");
   using(var res=Request(port,"/region/language/en","POST",origin,false,0,true))Check(Body(res).Contains("true"),"Could not save English");
   using(var res=Request(port,"/region/language/fr","POST",origin,false,0,true))Check(Body(res).Contains("false"),"Unsupported language was saved");
   helper.GetField("isGlobal",flags).SetValue(null,true);
   using(var res=Request(port,"/region/language","GET",origin,false,0,true))Check(Body(res).Contains("\"en\""),"Language was not shared across regions");
   helper.GetField("isGlobal",flags).SetValue(null,false);
   using(var res=Request(port,"/region/switch/global","POST",origin,false,0,true))Check(Body(res).Contains("true"),"Valid region switch was rejected");
   using(var res=Request(port,"/region/switch/cancel","POST",origin,false,0,true))Check(Body(res).Contains("true"),"Cannot cancel a proposed switch");
   using(var res=Request(port,"/region/auth/result/"+state,"GET",origin,false,0,true))Check(Body(res).Contains("false"),"China mode accessed Global sign-in");
   File.Delete(localeFile);
  }
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

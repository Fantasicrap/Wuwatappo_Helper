param([Parameter(Mandatory=$true)][string]$DistributionDirectory)
$ErrorActionPreference='Stop'
$out=[IO.Path]::GetFullPath($DistributionDirectory)
$repo=Split-Path -Parent $PSScriptRoot
$pkg=Get-Content (Join-Path $repo 'package.json') -Raw | ConvertFrom-Json
$app=Join-Path $out ('Wuwatappo_Helper-'+$pkg.releaseVersion+'.exe')
$scratch=Join-Path $out ('update-test-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $scratch | Out-Null
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$fixture=Join-Path $scratch 'Old.cs'
[IO.File]::WriteAllText($fixture,'[assembly: System.Reflection.AssemblyFileVersion("1.0.4.2")] class Old { static void Main() {} }')
$old=Join-Path $scratch 'Old.exe'
& $compiler /nologo /target:exe ('/out:'+$old) $fixture
if($LASTEXITCODE){throw 'Update fixture compilation failed'}
$next=Join-Path $scratch 'Next.exe'
[IO.File]::WriteAllText($fixture,('[assembly: System.Reflection.AssemblyFileVersion("{0}")] class Next {{ static void Main() {{}} }}' -f $pkg.releaseVersion))
& $compiler /nologo /target:exe ('/out:'+$next) $fixture
if($LASTEXITCODE){throw 'Update fixture compilation failed'}
$source=Join-Path $scratch 'UpdateSmoke.cs'
[IO.File]::WriteAllText($source,@'
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
class UpdateSmoke {
 static Type type;
 static object Call(string name,params object[] args){return type.GetMethod(name,BindingFlags.Static|BindingFlags.NonPublic).Invoke(null,args);}
 static void Check(bool ok,string message){if(!ok)throw new Exception(message);}
 static object Row(string version,bool prerelease=false,bool draft=false,string digest=null,long size=10){
  string name="Wuwatappo_Helper-"+version+".exe", tag="v"+version;
  var asset=new Dictionary<string,object>{{"name",name},{"digest",digest??"sha256:"+new string('a',64)},{"size",size},
   {"browser_download_url","https://github.com/Fantasicrap/Wuwatappo_Helper/releases/download/"+tag+"/"+name}};
  return new Dictionary<string,object>{{"tag_name",tag},{"draft",draft},{"prerelease",prerelease},{"assets",new object[]{asset}}};
 }
 static string Hash(string file){using(var input=File.OpenRead(file))using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(input)).Replace("-","").ToLowerInvariant();}
 static Version Selected(object result){return result==null?null:(Version)result.GetType().GetField("Version").GetValue(result);}
 static int Main(string[] args){try{
  string app=args[0], old=args[1], next=args[2], folder=Path.GetDirectoryName(old);
  var asm=Assembly.LoadFile(app);type=asm.GetType("HelperUpdate",true);
  var current=asm.GetName().Version;var upstream=new Version(1,0,5);var same=new Version(1,0,4);
  Check(!(bool)Call("ShouldCheckOnStartup",current,same,null),"same-series startup checked GitHub");
  Check((bool)Call("ShouldCheckOnStartup",current,upstream,null),"startup skipped an unchecked official update");
  Check(!(bool)Call("ShouldCheckOnStartup",current,upstream,upstream),"previous checked official update retriggered");
  Check((bool)Call("ShouldCheckOnStartup",current,new Version(1,0,6),upstream),"new official target should recheck");
  var sameNext=new Version(current.Major,current.Minor,current.Build,current.Revision+1);
  object[] releases={Row(sameNext.ToString()),Row("1.0.5.9",true),Row("1.0.5.8",false,true),Row("1.0.5.1"),Row("1.0.5.2"),Row("1.0.6.1")};
  Check(Selected(Call("SelectRelease",releases,current,same))==sameNext,"manual same-series check selected incompatible release");
  Check(Selected(Call("SelectRelease",releases,current,upstream))==new Version(1,0,5,2),"did not select latest matching stable release");
  Check(Call("SelectRelease",new object[]{Row("1.0.4.4"),Row("1.0.6.1")},current,upstream)==null,"cross-series update used incompatible asset");
  try{Call("SelectRelease",new object[]{Row("1.0.5.1",digest:"missing")},current,upstream);throw new Exception("Unverified asset accepted");}
  catch(TargetInvocationException ex){Check(ex.InnerException is InvalidDataException,"wrong invalid-metadata failure");}

  string digest=Hash(app);long size=new FileInfo(app).Length;
  Check((bool)Call("Verified",app,digest,current,size),"real package failed verification");
  Check(!(bool)Call("Verified",app,new string('0',64),current,size),"wrong digest accepted");
  Check(!(bool)Call("Verified",app,digest,current,size-1),"wrong length accepted");
  Check(!(bool)Call("Verified",app,digest,new Version(1,0,5,1),size),"wrong embedded version accepted");

  digest=Hash(next);size=new FileInfo(next).Length;
  var candidate=Call("SelectRelease",new object[]{Row(current.ToString(),digest:"sha256:"+digest,size:size)},new Version(1,0,4,0),same);
  var attempts=new List<string>();
  var good=new Action<Uri,string,long>((url,temp,expected)=>{
   Check(!File.Exists(temp)&&expected==size,"stale partial download or invalid size");
   string direct="https://github.com/Fantasicrap/Wuwatappo_Helper/releases/download/v"+current+"/Wuwatappo_Helper-"+current+".exe";
   Check(url.AbsoluteUri==(url.Host=="gh-proxy.com"?"https://gh-proxy.com/"+direct:direct),"incorrect download URL");
   attempts.Add(url.Host);File.Copy(next,temp);
  });
  Check((bool)Call("AllowedAssetHost",new Uri("https://gh-proxy.com/asset"),true),"mirror host refused");
  Check(!(bool)Call("AllowedAssetHost",new Uri("https://gh-proxy.com/asset"),false),"default GitHub route allowed mirror redirects");
  Check(!(bool)Call("AllowedAssetHost",new Uri("https://gh-proxy.com.evil.example/asset"),true),"unexpected mirror redirect allowed");
  Check(!(bool)Call("SetDownloadSource","https://example.com"),"arbitrary user download source accepted");
  string directFile=(string)Call("StageRelease",candidate,Path.Combine(folder,"direct"),false,good);
  Check(Hash(directFile)==digest&&String.Join(",",attempts)=="github.com","default download did not use GitHub");
  attempts.Clear();
  string mirrorFile=(string)Call("StageRelease",candidate,Path.Combine(folder,"mirror"),true,good);
  Check(Hash(mirrorFile)==digest&&String.Join(",",attempts)=="gh-proxy.com","mirror preference did not use mirror");
  foreach(bool tamper in new[]{false,true}){
   attempts.Clear();
   var flaky=new Action<Uri,string,long>((url,temp,expected)=>{
    good(url,temp,expected);
    if(url.Host!="gh-proxy.com")return;
    if(!tamper)throw new WebException("simulated timeout",WebExceptionStatus.Timeout);
    using(var f=File.OpenWrite(temp)){f.Seek(-1,SeekOrigin.End);f.WriteByte(42);}
   });
   string fallback=(string)Call("StageRelease",candidate,Path.Combine(folder,"fallback-"+tamper),true,flaky);
   Check(Hash(fallback)==digest&&String.Join(",",attempts)=="gh-proxy.com,github.com","mirror error did not safely fall back");
  }

  string installed=Path.Combine(folder,"Wuwatappo_Helper.exe");string oldHash=Hash(old);File.Copy(old,installed);
  try{Call("InstallAndLaunch",next,current,installed,digest,size,true,new Action<string>(_=>{throw new IOException("simulated launch failure");}));
      throw new Exception("Launch failure was ignored");}
  catch(TargetInvocationException ex){Check(ex.InnerException is IOException && Hash(installed)==oldHash,"old installer executable was not restored");}
  Call("InstallAndLaunch",next,current,installed,digest,size,true,new Action<string>(file=>Check(Hash(file)==digest,"launch ran before installed replacement")));
  Check(Directory.GetFiles(Path.Combine(folder,"Helper-backup"),"*.exe",SearchOption.AllDirectories).Length==1,"old version backup missing");
  string portable=Path.Combine(folder,"Wuwatappo_Helper-"+current+".exe");
  Call("InstallAndLaunch",next,current,portable,digest,size,false,new Action<string>(file=>Check(Hash(file)==digest,"portable file did not match")));
  Check(Hash(old)==oldHash,"portable update modified old EXE");
  Console.WriteLine("PASS: release policy, direct/mirror downloads, timeout and tampering fallback, SHA-256/version/size, rollback and portable install");return 0;
 }catch(Exception error){Console.Error.WriteLine(error);return 1;}}
}
'@)
$test=Join-Path $scratch 'UpdateSmoke.exe'
& $compiler /nologo /target:exe ('/out:'+$test) $source
if($LASTEXITCODE){throw 'Update smoke compilation failed'}
& $test $app $old $next
if($LASTEXITCODE){throw 'Update smoke failed'}

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
$source=Join-Path $scratch 'UpdateSmoke.cs'
[IO.File]::WriteAllText($source,@'
using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Security.Cryptography;
class UpdateSmoke {
 static Type type;
 static object Call(string name,params object[] args){return type.GetMethod(name,BindingFlags.Static|BindingFlags.NonPublic).Invoke(null,args);}
 static void Check(bool ok,string message){if(!ok)throw new Exception(message);}
 static object Row(string version,bool prerelease=false,bool draft=false,string digest=null){
  string name="Wuwatappo_Helper-"+version+".exe", tag="v"+version;
  var asset=new Dictionary<string,object>{{"name",name},{"digest",digest??"sha256:"+new string('a',64)},{"size",10},
   {"browser_download_url","https://github.com/Fantasicrap/Wuwatappo_Helper/releases/download/"+tag+"/"+name}};
  return new Dictionary<string,object>{{"tag_name",tag},{"draft",draft},{"prerelease",prerelease},{"assets",new object[]{asset}}};
 }
 static string Hash(string file){using(var input=File.OpenRead(file))using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(input)).Replace("-","").ToLowerInvariant();}
 static Version Selected(object result){return result==null?null:(Version)result.GetType().GetField("Version").GetValue(result);}
 static int Main(string[] args){try{
  string app=args[0], old=args[1], folder=Path.GetDirectoryName(old);
  var asm=Assembly.LoadFile(app);type=asm.GetType("HelperUpdate",true);
  var current=asm.GetName().Version;var upstream=new Version(1,0,5);var same=new Version(1,0,4);
  Check(!(bool)Call("ShouldCheckOnStartup",current,same,null),"same-series startup checked GitHub");
  Check((bool)Call("ShouldCheckOnStartup",current,upstream,null),"startup skipped an unchecked official update");
  Check(!(bool)Call("ShouldCheckOnStartup",current,upstream,upstream),"previous checked official update retriggered");
  Check((bool)Call("ShouldCheckOnStartup",current,new Version(1,0,6),upstream),"new official target should recheck");
  object[] releases={Row("1.0.4.4"),Row("1.0.5.9",true),Row("1.0.5.8",false,true),Row("1.0.5.1"),Row("1.0.5.2"),Row("1.0.6.1")};
  Check(Selected(Call("SelectRelease",releases,current,same))==new Version(1,0,4,4),"manual same-series check selected incompatible release");
  Check(Selected(Call("SelectRelease",releases,current,upstream))==new Version(1,0,5,2),"did not select latest matching stable release");
  Check(Call("SelectRelease",new object[]{Row("1.0.4.4"),Row("1.0.6.1")},current,upstream)==null,"cross-series update used incompatible asset");
  try{Call("SelectRelease",new object[]{Row("1.0.5.1",digest:"missing")},current,upstream);throw new Exception("Unverified asset accepted");}
  catch(TargetInvocationException ex){Check(ex.InnerException is InvalidDataException,"wrong invalid-metadata failure");}

  string digest=Hash(app);long size=new FileInfo(app).Length;
  Check((bool)Call("Verified",app,digest,current,size),"real package failed verification");
  Check(!(bool)Call("Verified",app,new string('0',64),current,size),"wrong digest accepted");
  Check(!(bool)Call("Verified",app,digest,current,size-1),"wrong length accepted");
  Check(!(bool)Call("Verified",app,digest,new Version(1,0,5,1),size),"wrong embedded version accepted");

  string installed=Path.Combine(folder,"Wuwatappo_Helper.exe");string oldHash=Hash(old);File.Copy(old,installed);
  try{Call("InstallAndLaunch",app,current,installed,digest,size,true,new Action<string>(_=>{throw new IOException("simulated launch failure");}));
      throw new Exception("Launch failure was ignored");}
  catch(TargetInvocationException ex){Check(ex.InnerException is IOException && Hash(installed)==oldHash,"old installer executable was not restored");}
  Call("InstallAndLaunch",app,current,installed,digest,size,true,new Action<string>(file=>Check(Hash(file)==digest,"launch ran before installed replacement")));
  Check(Directory.GetFiles(Path.Combine(folder,"Helper-backup"),"*.exe",SearchOption.AllDirectories).Length==1,"old version backup missing");
  string portable=Path.Combine(folder,"Wuwatappo_Helper-"+current+".exe");
  Call("InstallAndLaunch",app,current,portable,digest,size,false,new Action<string>(file=>Check(Hash(file)==digest,"portable file did not match")));
  Check(Hash(old)==oldHash,"portable update modified old EXE");
  Console.WriteLine("PASS: startup and manual policy, stable releases, SHA-256/version/size, installed backup and rollback, portable install");return 0;
 }catch(Exception error){Console.Error.WriteLine(error);return 1;}}
}
'@)
$test=Join-Path $scratch 'UpdateSmoke.exe'
& $compiler /nologo /target:exe ('/out:'+$test) $source
if($LASTEXITCODE){throw 'Update smoke compilation failed'}
& $test $app $old
if($LASTEXITCODE){throw 'Update smoke failed'}

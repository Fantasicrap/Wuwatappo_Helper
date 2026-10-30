#ifndef SourceDir
  #define SourceDir "..\dist"
#endif
#ifndef OutputDir
  #define OutputDir "..\dist"
#endif
#ifndef AppVersion
  #define AppVersion "1.0.3.1"
#endif

[Setup]
AppId={{72710F2E-C20B-4D14-B98A-12E592DD3315}
AppName=Wuwatappo_Helper
AppVersion={#AppVersion}
AppPublisher=Fantasicrap
AppPublisherURL=https://github.com/Fantasicrap/Wuwatappo_Helper
AppSupportURL=https://github.com/Fantasicrap/Wuwatappo_Helper/issues
DefaultDirName={localappdata}\Programs\Wuwatappo_Helper
DefaultGroupName=Wuwatappo_Helper
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
DisableProgramGroupPage=yes
DisableDirPage=no
WizardStyle=modern
Compression=lzma2
SolidCompression=yes
OutputDir={#OutputDir}
OutputBaseFilename=Wuwatappo_Helper-{#AppVersion}-Setup
SetupIconFile={#SourceDir}\host-build\application.ico
UninstallDisplayIcon={app}\Wuwatappo_Helper.exe
LicenseFile=..\DISCLAIMER.txt
InfoAfterFile=..\docs\使用说明.md
SetupLogging=yes
CloseApplications=yes
RestartApplications=no
Uninstallable=not IsPackageTest
CreateUninstallRegKey=not IsPackageTest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; Flags: unchecked; Check: not IsPackageTest

[Files]
Source: "{#SourceDir}\Wuwatappo_Helper.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\DISCLAIMER.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\THIRD_PARTY_NOTICES.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\docs\使用说明.md"; DestDir: "{app}"; Flags: ignoreversion

Source: "..\docs\库存欧非判定.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\docs\手柄使用说明.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\licenses\SDL3-LICENSE.txt"; DestDir: "{app}\licenses"; Flags: ignoreversion

[Icons]
Name: "{group}\Wuwatappo_Helper"; Filename: "{app}\Wuwatappo_Helper.exe"; Check: not IsPackageTest
Name: "{group}\使用说明"; Filename: "{app}\使用说明.md"; Check: not IsPackageTest
Name: "{autodesktop}\Wuwatappo_Helper"; Filename: "{app}\Wuwatappo_Helper.exe"; Tasks: desktopicon; Check: not IsPackageTest

[Run]
Filename: "{app}\Wuwatappo_Helper.exe"; Description: "运行 Wuwatappo_Helper"; Flags: nowait postinstall skipifsilent unchecked

[Code]
function IsPackageTest: Boolean;
begin
  Result := ExpandConstant('{param:PACKAGE_TEST|0}') = '1';
end;

function PetIsRunning: Boolean;
var Locator, Service, Processes: Variant;
begin
  Locator := CreateOleObject('WbemScripting.SWbemLocator');
  Service := Locator.ConnectServer('.', 'root\cimv2');
  Processes := Service.ExecQuery('SELECT ProcessId FROM Win32_Process WHERE Name="Wuwatappo_Helper.exe" OR Name="WuwaTappo.exe"');
  Result := Processes.Count > 0;
end;

function InitializeSetup: Boolean;
var ResultCode, Attempts: Integer;
begin
  Result := True;
  if IsPackageTest then exit;
  try
    if not PetIsRunning then exit;
    if MsgBox('检测到 Wuwatappo Helper 或 WuwaTappo 正在运行。安装前需要关闭程序，是否现在尝试关闭？', mbConfirmation, MB_YESNO) <> IDYES then begin Result := False; exit; end;
    Exec(ExpandConstant('{sys}\taskkill.exe'), '/IM Wuwatappo_Helper.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec(ExpandConstant('{sys}\taskkill.exe'), '/IM WuwaTappo.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    for Attempts := 1 to 5 do begin
      if not PetIsRunning then exit;
      Sleep(1000);
    end;
    MsgBox('无法自动关闭正在运行的程序。请从托盘退出，必要时以管理员身份关闭，然后重新运行安装包。', mbError, MB_OK);
    Result := False;
  except
    MsgBox('无法检查程序是否正在运行。请退出 Wuwatappo 后重新运行安装包。', mbError, MB_OK);
    Result := False;
  end;
end;

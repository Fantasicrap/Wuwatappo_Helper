using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Text.RegularExpressions;

static class HelperAutostart
{
    const string Folder = @"\WuwaTappo";
    const string Task = "ElevatedAutostart";
    internal const string Worker = "--update-helper-autostart";
    internal const string LaunchArgument = "--helper-autostart";
    const int InteractiveToken = 3, LogonTrigger = 9, ExecAction = 0;
    const int UpdateExisting = 4, KeepPrincipalPermissions = 16, SkipRegistrationTriggers = 32;
    const int AccessDenied = unchecked((int)0x80070005);
    static readonly Regex RuntimeName = new Regex(@"^(\d+\.\d+\.\d+\.\d+)-[0-9a-f]{12}(?:-global)?$", RegexOptions.IgnoreCase);
    static readonly Regex HelperName = new Regex(@"^Wuwatappo_Helper(?:-(\d+\.\d+\.\d+\.\d+))?\.exe$", RegexOptions.IgnoreCase);
    static readonly Assembly Launcher = Assembly.GetExecutingAssembly();
    static readonly object Gate = new object();

    enum Status { Unmanaged, Current, Updated, NeedsElevation, Failed }

    internal static bool Refresh(bool allowElevation)
    {
        lock (Gate)
        {
            Status result = Update();
            if (result == Status.Current || result == Status.Updated) return true;
            if (result != Status.NeedsElevation || !allowElevation) return false;
            try
            {
                using (var worker = Process.Start(new ProcessStartInfo(Launcher.Location, Worker) {
                    Verb = "runas", UseShellExecute = true, WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory
                }))
                {
                    return worker != null && worker.WaitForExit(45000) && worker.ExitCode == 0;
                }
            }
            catch (System.ComponentModel.Win32Exception) { return false; }
        }
    }

    internal static bool IsManaged()
    {
        try
        {
            dynamic folder = ConnectFolder();
            dynamic task = folder.GetTask(Task);
            return OwnedTask(task) &&
                (string)task.Definition.Actions.Item(1).Arguments == LaunchArgument &&
                TargetVersion((string)task.Definition.Actions.Item(1).Path, LaunchArgument, RuntimeRoot()) != null;
        }
        catch (Exception) { return false; }
    }

    static dynamic ConnectFolder()
    {
        dynamic connection = Activator.CreateInstance(Type.GetTypeFromProgID("Schedule.Service", true));
        connection.Connect();
        return connection.GetFolder(Folder);
    }

    static bool OwnedTask(dynamic task)
    {
        if (!(bool)task.Enabled) return false;
        dynamic definition = task.Definition;
        if ((int)definition.Principal.LogonType != InteractiveToken ||
            (int)definition.Triggers.Count != 1 || (int)definition.Triggers.Item(1).Type != LogonTrigger ||
            !(bool)definition.Triggers.Item(1).Enabled ||
            (int)definition.Actions.Count != 1 || (int)definition.Actions.Item(1).Type != ExecAction) return false;
        using (var user = WindowsIdentity.GetCurrent())
        {
            string trigger = (string)definition.Triggers.Item(1).UserId;
            return IsCurrentUser((string)definition.Principal.UserId, user.User) &&
                (String.IsNullOrWhiteSpace(trigger) || IsCurrentUser(trigger, user.User));
        }
    }

    static bool IsCurrentUser(string name, SecurityIdentifier sid)
    {
        if (String.IsNullOrWhiteSpace(name) || sid == null) return false;
        if (String.Equals(name, sid.Value, StringComparison.OrdinalIgnoreCase)) return true;
        try { return new NTAccount(name).Translate(typeof(SecurityIdentifier)).Equals(sid); }
        catch (IdentityNotMappedException) { return false; }
    }

    static string RuntimeRoot()
    {
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Wuwatappo_Helper", "runtime");
    }

    static Version TargetVersion(string path, string arguments, string runtimeRoot)
    {
        if (String.IsNullOrWhiteSpace(path) || !Path.IsPathRooted(path)) return null;
        string file = Path.GetFileName(path);
        var match = HelperName.Match(file);
        Version version;
        if (arguments == LaunchArgument)
        {
            if (File.Exists(path))
            {
                var info = FileVersionInfo.GetVersionInfo(path);
                if (info.FileDescription == "Wuwatappo Helper" && Version.TryParse(info.FileVersion, out version)) return version;
                return null;
            }
            return match.Groups[1].Success && Version.TryParse(match.Groups[1].Value, out version) ? version : null;
        }
        if (!String.IsNullOrWhiteSpace(arguments) || !file.Equals("WuwaTappo.exe", StringComparison.OrdinalIgnoreCase)) return null;
        string folder = Path.GetDirectoryName(Path.GetFullPath(path));
        if (!String.Equals(Path.GetDirectoryName(folder), Path.GetFullPath(runtimeRoot), StringComparison.OrdinalIgnoreCase)) return null;
        match = RuntimeName.Match(Path.GetFileName(folder));
        return match.Success && Version.TryParse(match.Groups[1].Value, out version) ? version : null;
    }

    internal static bool ShouldRetarget(string target, string arguments, string current, Version version, string runtimeRoot)
    {
        Version existing = TargetVersion(target, arguments, runtimeRoot);
        if (existing == null || existing > version) return false;
        if (arguments != LaunchArgument) return true;
        if (String.Equals(Path.GetFullPath(target), Path.GetFullPath(current), StringComparison.OrdinalIgnoreCase)) return false;
        return existing < version || !File.Exists(target) || File.GetLastWriteTimeUtc(current) > File.GetLastWriteTimeUtc(target);
    }

    static Status Update()
    {
        try { return UpdateTask(ConnectFolder(), Task, Launcher.Location, Launcher.GetName().Version, RuntimeRoot()); }
        catch (Exception) { return Status.Failed; }
    }

    static Status UpdateTask(dynamic folder, string name, string launcher, Version version, string runtimeRoot)
    {
        bool matched = false;
        try
        {
            dynamic task = folder.GetTask(name);
            if (!OwnedTask(task)) return Status.Unmanaged;
            dynamic definition = task.Definition;
            dynamic action = definition.Actions.Item(1);
            string oldPath = (string)action.Path, arguments = (string)action.Arguments;
            if (!ShouldRetarget(oldPath, arguments, launcher, version, runtimeRoot))
                return arguments == LaunchArgument && TargetVersion(oldPath, arguments, runtimeRoot) != null ? Status.Current : Status.Unmanaged;
            matched = true;
            action.Path = launcher;
            action.Arguments = LaunchArgument;
            action.WorkingDirectory = Path.GetDirectoryName(launcher);
            folder.RegisterTaskDefinition(name, definition, UpdateExisting | KeepPrincipalPermissions | SkipRegistrationTriggers,
                null, null, InteractiveToken, null);
            return Status.Updated;
        }
        catch (COMException error) { return matched && error.ErrorCode == AccessDenied ? Status.NeedsElevation : Status.Failed; }
        catch (UnauthorizedAccessException) { return matched ? Status.NeedsElevation : Status.Failed; }
        catch (Exception) { return Status.Failed; }
    }
}

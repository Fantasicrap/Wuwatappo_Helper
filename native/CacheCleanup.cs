using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;

static class CacheCleanup
{
    static readonly Regex RuntimeFolder = new Regex(@"^(\d+\.\d+\.\d+\.\d+-[0-9a-f]{12})(?:-global)?$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    static readonly Regex UpdateFolder = new Regex(@"^v(\d+\.\d+\.\d+\.\d+)$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    internal static void StartAsync(string helperData, string activeRuntimeId, Version currentVersion)
    {
        ThreadPool.QueueUserWorkItem(_ =>
        {
            try
            {
                CleanRuntime(Path.Combine(helperData, "runtime"), activeRuntimeId, 1);
                CleanUpdates(Path.Combine(helperData, "update"), currentVersion);
            }
            catch { }
        });
    }

    static bool TryDeleteDirectory(string path)
    {
        try
        {
            if (!Directory.Exists(path)) return false;
            Directory.Delete(path, true);
            return true;
        }
        catch (IOException) { return false; }
        catch (UnauthorizedAccessException) { return false; }
    }

    internal static int CleanRuntime(string runtimeRoot, string activeRuntimeId, int keepFallbackGroups = 1)
    {
        if (String.IsNullOrWhiteSpace(runtimeRoot) || !Directory.Exists(runtimeRoot)) return 0;
        string activeKey = (activeRuntimeId ?? "").Trim();
        var groups = new Dictionary<string, List<DirectoryInfo>>(StringComparer.OrdinalIgnoreCase);
        foreach (string dir in Directory.GetDirectories(runtimeRoot))
        {
            var info = new DirectoryInfo(dir);
            var match = RuntimeFolder.Match(info.Name);
            if (!match.Success) continue;
            string groupKey = match.Groups[1].Value;
            List<DirectoryInfo> list;
            if (!groups.TryGetValue(groupKey, out list))
            {
                list = new List<DirectoryInfo>();
                groups.Add(groupKey, list);
            }
            list.Add(info);
        }

        var staleGroups = groups
            .Where(kv => !String.Equals(kv.Key, activeKey, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(kv => kv.Value.Max(d => d.LastWriteTimeUtc))
            .Skip(Math.Max(0, keepFallbackGroups));

        int removed = 0;
        foreach (var group in staleGroups)
            foreach (var dir in group.Value)
                if (TryDeleteDirectory(dir.FullName)) removed++;
        return removed;
    }

    internal static int CleanUpdates(string updateRoot, Version currentVersion)
    {
        if (String.IsNullOrWhiteSpace(updateRoot) || currentVersion == null || !Directory.Exists(updateRoot)) return 0;
        int removed = 0;
        foreach (string dir in Directory.GetDirectories(updateRoot))
        {
            var info = new DirectoryInfo(dir);
            var match = UpdateFolder.Match(info.Name);
            Version parsed;
            if (!match.Success || !Version.TryParse(match.Groups[1].Value, out parsed)) continue;
            if (parsed <= currentVersion && TryDeleteDirectory(info.FullName)) removed++;
        }
        return removed;
    }
}

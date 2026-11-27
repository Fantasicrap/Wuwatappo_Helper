using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Windows.Forms;

static class MusicLibrary
{
    const int MaxTracks = 200;
    static readonly HashSet<string> AllowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".mp3", ".m4a", ".flac", ".wav", ".ogg", ".opus", ".aac", ".webm"
    };
    static readonly object Gate = new object();
    static string configFile, folderPath = "";
    static List<TrackEntry> tracks = new List<TrackEntry>();
    static long revision;
    static int picking;

    sealed class TrackEntry
    {
        public string FullPath;
        public string Name;
        public string ContentType;
    }

    internal sealed class TrackStream : IDisposable
    {
        public Stream Data;
        public long Length;
        public string ContentType;
        public void Dispose() { if (Data != null) Data.Dispose(); }
    }

    static string MimeType(string extension)
    {
        switch (extension.ToLowerInvariant())
        {
            case ".mp3": return "audio/mpeg";
            case ".m4a": return "audio/mp4";
            case ".flac": return "audio/flac";
            case ".wav": return "audio/wav";
            case ".ogg": return "audio/ogg";
            case ".opus": return "audio/opus";
            case ".aac": return "audio/aac";
            case ".webm": return "audio/webm";
            default: return "application/octet-stream";
        }
    }

    internal static void Initialize(string helperData)
    {
        lock (Gate)
        {
            configFile = Path.Combine(helperData, "music-folder.txt");
            folderPath = "";
            tracks.Clear();
            try
            {
                if (File.Exists(configFile))
                {
                    string saved = File.ReadAllText(configFile, Encoding.UTF8).Trim();
                    if (!String.IsNullOrEmpty(saved) && Directory.Exists(saved))
                        ScanLocked(saved);
                }
            }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
        }
    }

    static void ScanLocked(string directory)
    {
        var found = new List<TrackEntry>();
        try
        {
            var files = Directory.GetFiles(directory)
                .Where(file => AllowedExtensions.Contains(Path.GetExtension(file)))
                .OrderBy(file => Path.GetFileName(file), StringComparer.OrdinalIgnoreCase)
                .Take(MaxTracks);
            foreach (string file in files)
            {
                found.Add(new TrackEntry
                {
                    FullPath = file,
                    Name = Path.GetFileNameWithoutExtension(file),
                    ContentType = MimeType(Path.GetExtension(file))
                });
            }
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
        folderPath = directory;
        tracks = found;
        revision++;
    }

    static void SaveConfig(string directory)
    {
        if (String.IsNullOrEmpty(configFile)) return;
        Directory.CreateDirectory(Path.GetDirectoryName(configFile));
        if (String.IsNullOrEmpty(directory))
        {
            if (File.Exists(configFile)) File.Delete(configFile);
            return;
        }
        string temp = configFile + ".tmp";
        try
        {
            File.WriteAllText(temp, directory, new UTF8Encoding(false));
            if (File.Exists(configFile)) File.Replace(temp, configFile, null);
            else File.Move(temp, configFile);
        }
        finally { if (File.Exists(temp)) File.Delete(temp); }
    }

    static object SnapshotLocked()
    {
        bool hasFolder = !String.IsNullOrEmpty(folderPath) && Directory.Exists(folderPath);
        string folderName = hasFolder ? Path.GetFileName(folderPath.TrimEnd('\\', '/')) : "";
        if (hasFolder && String.IsNullOrEmpty(folderName)) folderName = folderPath;
        long rev = revision;
        return new
        {
            hasFolder,
            folder = folderName,
            tracks = tracks.Select((t, i) => new
            {
                id = i,
                name = t.Name,
                url = "/music/track/" + i + "?v=" + rev
            }).ToArray()
        };
    }

    internal static object Catalog()
    {
        lock (Gate)
        {
            if (!String.IsNullOrEmpty(folderPath))
            {
                if (Directory.Exists(folderPath)) ScanLocked(folderPath);
                else { folderPath = ""; tracks.Clear(); revision++; }
            }
            return SnapshotLocked();
        }
    }

    internal static object SetFolder(string directory)
    {
        if (String.IsNullOrWhiteSpace(directory) || !Directory.Exists(directory))
            return new { error = "音乐文件夹不存在。" };
        string full = Path.GetFullPath(directory);
        lock (Gate)
        {
            try { SaveConfig(full); }
            catch (IOException) { return new { error = "无法保存音乐文件夹配置。" }; }
            catch (UnauthorizedAccessException) { return new { error = "无法保存音乐文件夹配置。" }; }
            ScanLocked(full);
            return SnapshotLocked();
        }
    }

    internal static object Clear()
    {
        lock (Gate)
        {
            try { SaveConfig(""); }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
            folderPath = "";
            tracks.Clear();
            revision++;
            return SnapshotLocked();
        }
    }

    internal static object Pick()
    {
        if (Interlocked.Exchange(ref picking, 1) != 0)
            return new { error = "请先完成当前的音乐文件夹选择。" };
        object result = null;
        string initial;
        lock (Gate) initial = folderPath;
        try
        {
            var thread = new Thread(() =>
            {
                try
                {
                    using (var dialog = new FolderBrowserDialog
                    {
                        Description = "选择本地音乐文件夹（重启后自动记忆）",
                        ShowNewFolderButton = false,
                        SelectedPath = Directory.Exists(initial) ? initial : ""
                    })
                    {
                        if (dialog.ShowDialog() != DialogResult.OK || String.IsNullOrWhiteSpace(dialog.SelectedPath))
                            result = new { cancelled = true };
                        else
                            result = SetFolder(dialog.SelectedPath);
                    }
                }
                catch (Exception) { result = new { error = "无法打开文件夹选择窗口。" }; }
            });
            thread.IsBackground = true;
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            thread.Join();
            return result;
        }
        finally { Interlocked.Exchange(ref picking, 0); }
    }

    internal static TrackStream OpenTrack(int index)
    {
        TrackEntry entry;
        lock (Gate)
        {
            if (index < 0 || index >= tracks.Count) return null;
            entry = tracks[index];
        }
        if (!File.Exists(entry.FullPath)) return null;
        var stream = new FileStream(entry.FullPath, FileMode.Open, FileAccess.Read, FileShare.Read | FileShare.Delete);
        return new TrackStream { Data = stream, Length = stream.Length, ContentType = entry.ContentType };
    }
}

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

static class ThemePackages
{
    const long Megabyte = 1024 * 1024;
    const long PackLimit = 64 * Megabyte;
    static readonly object Gate = new object();
    static readonly Dictionary<string, Pack> Installed = new Dictionary<string, Pack>(StringComparer.Ordinal);
    static readonly Dictionary<string, string[]> Profiles = new Dictionary<string, string[]>(StringComparer.Ordinal)
    {
        { "aemeath", new[] { "mech", "player", "tides" } },
        { "denia", new[] { "denia", "blocks", "tides" } },
        { "phrolova", new[] { "phrolova", "tides" } }
    };
    static readonly Regex AssetName = new Regex(@"\A(?:background\.(?:jpg|png|webp)|toolbar\.png|tides\.webp|mech\.webp|song-[0-8]\.mp3)\z", RegexOptions.CultureInvariant);
    static readonly Regex Digest = new Regex(@"\A[0-9a-f]{64}\z", RegexOptions.CultureInvariant);
    static string folder;
    static int picking;
    static readonly object DownloadGate = new object();
    static string dlState = "idle", dlId = "", dlMessage = "", dlError = "";
    static long dlDone, dlTotal;
    static bool dlBusy;

    internal sealed class Manifest
    {
        public int schemaVersion { get; set; }
        public string id { get; set; }
        public string version { get; set; }
        public string credit { get; set; }
        public string[] effects { get; set; }
        public Track[] songs { get; set; }
        public Dictionary<string, string> files { get; set; }
    }
    internal sealed class Track
    {
        public string file { get; set; }
        public string name { get; set; }
        public string artist { get; set; }
    }
    sealed class Pack
    {
        internal Manifest Manifest;
        internal string Path;
        internal string Revision;
    }
    internal sealed class Asset : IDisposable
    {
        public ZipArchive Archive;
        public Stream Data;
        public long Length;
        public string ContentType;
        public void Dispose()
        {
            if (Data != null) Data.Dispose();
            if (Archive != null) Archive.Dispose();
        }
    }

    static InvalidDataException Invalid(string text) { return new InvalidDataException(text); }
    static JavaScriptSerializer Json() { return new JavaScriptSerializer { MaxJsonLength = 32768, RecursionLimit = 10 }; }
    static ZipArchive Open(string file)
    {
        var stream = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.Read | FileShare.Delete);
        try
        {
            if (stream.Length > PackLimit) throw Invalid("主题包大小超过 64 MB。");
            // Read the ZIP directory count before ZipArchive builds an entry table.
            int tailLength = (int)Math.Min(stream.Length, 65557);
            var tail = new byte[tailLength];
            stream.Seek(-tailLength, SeekOrigin.End);
            int offset = 0, count;
            while (offset < tailLength && (count = stream.Read(tail, offset, tailLength - offset)) != 0) offset += count;
            int footer = tailLength - 22;
            while (footer >= 0 && (BitConverter.ToUInt32(tail, footer) != 0x06054b50 ||
                footer + 22 + BitConverter.ToUInt16(tail, footer + 20) != tailLength)) footer--;
            if (footer < 0 || BitConverter.ToUInt16(tail, footer + 4) != 0 ||
                BitConverter.ToUInt16(tail, footer + 6) != 0 ||
                BitConverter.ToUInt16(tail, footer + 10) > 16 ||
                BitConverter.ToUInt32(tail, footer + 12) > 16384)
                throw Invalid("主题包 ZIP 目录无效。");
            stream.Position = 0;
            return new ZipArchive(stream, ZipArchiveMode.Read);
        }
        catch { stream.Dispose(); throw; }
    }

    static bool IsText(string text, int limit)
    {
        return text != null && text.Length <= limit && !text.Any(Char.IsControl);
    }

    static bool MatchesFormat(string name, byte[] header)
    {
        if (name.EndsWith(".jpg", StringComparison.Ordinal)) return header[0] == 255 && header[1] == 216 && header[2] == 255;
        if (name.EndsWith(".png", StringComparison.Ordinal))
            return header.Take(8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 });
        if (name.EndsWith(".webp", StringComparison.Ordinal))
            return Encoding.ASCII.GetString(header, 0, 4) == "RIFF" && Encoding.ASCII.GetString(header, 8, 4) == "WEBP";
        return Encoding.ASCII.GetString(header, 0, 3) == "ID3" || header[0] == 255 && (header[1] & 224) == 224;
    }

    static Pack Check(string file)
    {
        using (var archive = Open(file))
        {
            if (archive.Entries.Count < 1 || archive.Entries.Count > 16) throw Invalid("主题包文件数量无效。");
            var entries = new Dictionary<string, ZipArchiveEntry>(StringComparer.Ordinal);
            long total = 0;
            foreach (var entry in archive.Entries)
            {
                string name = entry.FullName;
                long limit = name == "manifest.json" ? 32768 : name.EndsWith(".mp3", StringComparison.Ordinal) ? 20 * Megabyte : 4 * Megabyte;
                if ((name != "manifest.json" && !AssetName.IsMatch(name)) || entries.ContainsKey(name) ||
                    entry.Length <= 0 || entry.Length > limit || (total += entry.Length) > PackLimit)
                    throw Invalid("主题包含有无效或过大的文件。");
                entries.Add(name, entry);
            }
            ZipArchiveEntry config;
            if (!entries.TryGetValue("manifest.json", out config)) throw Invalid("主题包缺少 manifest.json。");
            string text;
            using (var reader = new StreamReader(config.Open(), new UTF8Encoding(false, true), true))
            {
                var chars = new char[32769];
                int count = reader.ReadBlock(chars, 0, chars.Length);
                if (count > 32768) throw Invalid("主题清单过大。");
                text = new string(chars, 0, count);
            }
            var manifest = Json().Deserialize<Manifest>(text);
            string[] effects;
            Version version;
            if (manifest == null || manifest.schemaVersion != 1 || manifest.id == null ||
                !Profiles.TryGetValue(manifest.id, out effects) || !IsText(manifest.version, 20) ||
                !Version.TryParse(manifest.version, out version) || !IsText(manifest.credit ?? "", 240) ||
                manifest.effects == null || manifest.effects.Length > effects.Length ||
                manifest.effects.Distinct(StringComparer.Ordinal).Count() != manifest.effects.Length ||
                manifest.effects.Any(effect => !effects.Contains(effect, StringComparer.Ordinal)) ||
                manifest.files == null || manifest.files.Count != entries.Count - 1 ||
                manifest.files.Keys.Count(name => name.StartsWith("background.", StringComparison.Ordinal)) > 1)
                throw Invalid("主题清单的版本、素材或动效配置有误。");
            var songs = manifest.songs ?? new Track[0];
            if ((manifest.id != "aemeath" && manifest.files.Keys.Any(name => name == "mech.webp" || name.StartsWith("song-", StringComparison.Ordinal))) ||
                songs.Length != manifest.files.Keys.Count(name => name.StartsWith("song-", StringComparison.Ordinal)) ||
                songs.Any(track => track == null || !IsText(track.file, 20) || !track.file.StartsWith("song-", StringComparison.Ordinal) ||
                    !manifest.files.ContainsKey(track.file) || !IsText(track.name, 80) || track.name.Length == 0 || !IsText(track.artist ?? "", 80)) ||
                songs.Select(track => track.file).Distinct(StringComparer.Ordinal).Count() != songs.Length)
                throw Invalid("主题歌单与素材不符。");

            using (var sha = SHA256.Create())
            foreach (var pair in manifest.files)
            {
                ZipArchiveEntry entry;
                if (!AssetName.IsMatch(pair.Key) || pair.Value == null || !Digest.IsMatch(pair.Value) ||
                    !entries.TryGetValue(pair.Key, out entry))
                    throw Invalid("主题素材清单不完整。");
                using (var stream = entry.Open())
                {
                    var buffer = new byte[65536];
                    int initial = 0, count;
                    while (initial < 12 && (count = stream.Read(buffer, initial, 12 - initial)) != 0) initial += count;
                    if (initial < 12 || !MatchesFormat(pair.Key, buffer)) throw Invalid("主题素材格式无效。");
                    sha.TransformBlock(buffer, 0, initial, buffer, 0);
                    long size = initial;
                    while ((count = stream.Read(buffer, 0, buffer.Length)) != 0)
                    {
                        if ((size += count) > entry.Length) throw Invalid("主题素材大小与清单不符。");
                        sha.TransformBlock(buffer, 0, count, buffer, 0);
                    }
                    sha.TransformFinalBlock(new byte[0], 0, 0);
                    string hash = Hex(sha.Hash);
                    sha.Initialize();
                    if (size != entry.Length || hash != pair.Value) throw Invalid("主题素材校验失败。");
                }
            }
            using (var sha = SHA256.Create())
                return new Pack { Manifest = manifest, Path = file, Revision = Hex(sha.ComputeHash(Encoding.UTF8.GetBytes(text))).Substring(0, 16) };
        }
    }

    static string Hex(byte[] digest) { return BitConverter.ToString(digest).Replace("-", "").ToLowerInvariant(); }

    internal static void Initialize(string themesFolder)
    {
        lock (Gate)
        {
            folder = themesFolder;
            Installed.Clear();
            foreach (string id in Profiles.Keys)
            {
                string path = Path.Combine(folder, id + ".wttheme");
                if (!File.Exists(path)) continue;
                try { var pack = Check(path); if (pack.Manifest.id == id) Installed.Add(id, pack); }
                catch (Exception error)
                {
                    if (!(error is IOException || error is ArgumentException || error is UnauthorizedAccessException ||
                        error is InvalidOperationException || error is InvalidDataException)) throw;
                }
            }
        }
    }

    internal static string Import(string source)
    {
        if (!String.Equals(Path.GetExtension(source), ".wttheme", StringComparison.OrdinalIgnoreCase))
            throw Invalid("请选择 .wttheme 文件。");
        if (folder == null) throw Invalid("主题存储尚未初始化。");
        Directory.CreateDirectory(folder);
        string temp = Path.Combine(folder, Guid.NewGuid().ToString("N") + ".incoming");
        try
        {
            using (var input = new FileStream(source, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                if (input.Length > PackLimit) throw Invalid("主题包大小超过 64 MB。");
                using (var output = new FileStream(temp, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                    input.CopyTo(output);
            }
            var pack = Check(temp);
            lock (Gate)
            {
                var id = pack.Manifest.id;
                string dest = Path.Combine(folder, id + ".wttheme");
                if (File.Exists(dest)) File.Replace(temp, dest, null);
                else File.Move(temp, dest);
                pack.Path = dest;
                Installed[id] = pack;
                return id;
            }
        }
        finally { if (File.Exists(temp)) File.Delete(temp); }
    }

    internal static bool Remove(string id)
    {
        if (String.IsNullOrEmpty(id) || !Profiles.ContainsKey(id)) return false;
        lock (Gate)
        {
            if (folder == null) return false;
            string dest = Path.Combine(folder, id + ".wttheme");
            try
            {
                if (File.Exists(dest)) File.Delete(dest);
            }
            catch (IOException) { return false; }
            catch (UnauthorizedAccessException) { return false; }
            Installed.Remove(id);
            return true;
        }
    }

    internal static object DownloadStatus()
    {
        lock (DownloadGate)
        {
            long done = Interlocked.Read(ref dlDone);
            long total = Interlocked.Read(ref dlTotal);
            int progress = dlState == "downloading" && total > 0 ? (int)Math.Min(100, done * 100L / total) : -1;
            return new { state = dlState, id = dlId, progress, downloadedBytes = done, totalBytes = total, message = dlMessage, error = dlError };
        }
    }

    internal static object StartDownload(string id)
    {
        if (String.IsNullOrEmpty(id) || !Profiles.ContainsKey(id))
            return new { accepted = false, error = "未知的主题包标识。" };
        if (folder == null)
            return new { accepted = false, error = "主题存储尚未初始化。" };
        bool preferMirror = HelperUpdate.PreferMirror;
        lock (DownloadGate)
        {
            if (dlBusy) return new { accepted = false, error = "已有主题包正在下载，请稍候。" };
            dlBusy = true;
            dlState = "checking";
            dlId = id;
            dlMessage = "正在查询主题包…";
            dlError = "";
            Interlocked.Exchange(ref dlDone, 0);
            Interlocked.Exchange(ref dlTotal, 0);
        }
        ThreadPool.QueueUserWorkItem(_ => RunDownload(id, preferMirror));
        return new { accepted = true };
    }

    static void SetDownload(string state, string message, string error = "")
    {
        lock (DownloadGate) { dlState = state; dlMessage = message; dlError = error; }
    }

    static Dictionary<string, object> SelectThemeAsset(object payload, string id)
    {
        var rows = payload as object[];
        if (rows == null) throw Invalid("GitHub 发布清单格式异常。");
        string fileName = id + ".wttheme";
        string preferredTag = "v" + HelperUpdate.Current;
        Dictionary<string, object> fallback = null;
        foreach (var row in rows)
        {
            var release = row as Dictionary<string, object>;
            if (release == null || !Equals(release["draft"], false) || !Equals(release["prerelease"], false)) continue;
            string tag = release["tag_name"] as string;
            var assets = release["assets"] as object[];
            if (String.IsNullOrEmpty(tag) || assets == null) continue;
            foreach (var item in assets)
            {
                var asset = item as Dictionary<string, object>;
                if (asset == null || !Equals(asset["name"], fileName)) continue;
                string digest = asset["digest"] as string;
                string url = asset["browser_download_url"] as string;
                long size;
                string expectedUrl = "https://github.com/" + HelperUpdate.RepositoryName + "/releases/download/" + tag + "/" + fileName;
                if (url != expectedUrl || !long.TryParse(Convert.ToString(asset["size"]), out size) ||
                    size <= 0 || size > PackLimit || digest == null || !Regex.IsMatch(digest, @"\Asha256:[0-9a-f]{64}\z"))
                    continue;
                var picked = new Dictionary<string, object> { { "url", url }, { "size", size }, { "digest", digest.Substring(7) } };
                if (tag == preferredTag) return picked;
                if (fallback == null) fallback = picked;
                break;
            }
        }
        return fallback;
    }

    static string FileSha256(string path)
    {
        using (var sha = SHA256.Create())
        using (var stream = File.OpenRead(path))
            return Hex(sha.ComputeHash(stream));
    }

    static void FetchThemeFile(Uri uri, string temp, long size, string expectedDigest)
    {
        bool mirror = String.Equals(uri.Host, "gh-proxy.com", StringComparison.OrdinalIgnoreCase);
        var deadline = mirror ? Stopwatch.StartNew() : null;
        Interlocked.Exchange(ref dlDone, 0);
        Interlocked.Exchange(ref dlTotal, size);
        using (var response = HelperUpdate.OpenAllowed(uri, true, mirror))
        {
            if (response.ContentLength >= 0 && response.ContentLength != size)
                throw Invalid("主题包文件大小不符。");
            using (var input = response.GetResponseStream())
            using (var output = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None))
                HelperUpdate.CopyStreamLimited(input, output, size, deadline, n => Interlocked.Exchange(ref dlDone, n));
        }
        if (FileSha256(temp) != expectedDigest) throw Invalid("主题包 SHA-256 校验失败。");
    }

    static void RunDownload(string id, bool preferMirror)
    {
        string temp = null;
        try
        {
            ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
            var releases = HelperUpdate.ReadAllowedJson(new Uri("https://api.github.com/repos/" + HelperUpdate.RepositoryName + "/releases?per_page=15"));
            var asset = SelectThemeAsset(releases, id);
            if (asset == null) throw Invalid("GitHub 发布中未找到该主题包。");
            string directUrl = (string)asset["url"];
            long size = (long)asset["size"];
            string digest = (string)asset["digest"];
            Directory.CreateDirectory(folder);
            temp = Path.Combine(folder, Guid.NewGuid().ToString("N") + ".wttheme");
            bool fetched = false;
            if (preferMirror)
            {
                SetDownload("downloading", "正在通过 GH-Proxy 下载主题包…");
                try { FetchThemeFile(new Uri("https://gh-proxy.com/" + directUrl), temp, size, digest); fetched = true; }
                catch (Exception ex)
                {
                    if (!(ex is WebException || ex is IOException || ex is InvalidDataException)) throw;
                    if (File.Exists(temp)) File.Delete(temp);
                }
            }
            if (!fetched)
            {
                SetDownload("downloading", preferMirror ? "加速下载未完成，正在从 GitHub 下载…" : "正在从 GitHub 下载主题包…");
                FetchThemeFile(new Uri(directUrl), temp, size, digest);
            }
            SetDownload("verifying", "正在校验并导入主题包…");
            string imported = Import(temp);
            if (imported != id) throw Invalid("下载的主题包标识不匹配。");
            SetDownload("done", "主题包下载并导入完成。");
        }
        catch (Exception ex)
        {
            string reason = ex is InvalidDataException ? ex.Message : "下载失败，可重试或手动导入 .wttheme 文件。";
            SetDownload("error", reason, reason);
        }
        finally
        {
            if (temp != null && File.Exists(temp)) try { File.Delete(temp); } catch { }
            lock (DownloadGate) dlBusy = false;
        }
    }

    internal static object Pick()
    {
        if (Interlocked.Exchange(ref picking, 1) != 0) return new { error = "请先完成当前的主题包导入。" };
        object result = null;
        try
        {
            var thread = new Thread(() =>
            {
                try
                {
                    using (var dialog = new OpenFileDialog
                    {
                        Title = "导入 Wuwatappo 主题包",
                        Filter = "Helper 主题包 (*.wttheme)|*.wttheme",
                        CheckFileExists = true, Multiselect = false, RestoreDirectory = true
                    })
                    {
                        if (dialog.ShowDialog() != DialogResult.OK) result = new { cancelled = true };
                        else result = new { id = Import(dialog.FileName) };
                    }
                }
                catch (InvalidDataException error) { result = new { error = error.Message }; }
                catch (Exception) { result = new { error = "无法读取主题包。请确认文件完整并重试。" }; }
            });
            thread.IsBackground = true;
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            thread.Join();
            return result;
        }
        finally { Interlocked.Exchange(ref picking, 0); }
    }

    static string AssetUrl(Pack pack, string name)
    {
        return name != null && pack.Manifest.files.ContainsKey(name)
            ? "/theme-assets/" + pack.Manifest.id + "/" + name + "?v=" + pack.Revision : "";
    }

    internal static bool HasEffect(string id, string effect)
    {
        lock (Gate)
        {
            Pack pack;
            return Installed.TryGetValue(id, out pack) && pack.Manifest.effects.Contains(effect, StringComparer.Ordinal);
        }
    }

    internal static object Catalog()
    {
        lock (Gate)
            return Installed.ToDictionary(pair => pair.Key, pair =>
            {
                var pack = pair.Value;
                return new
                {
                    revision = pack.Revision, version = pack.Manifest.version, credit = pack.Manifest.credit ?? "",
                    effects = pack.Manifest.effects,
                    background = AssetUrl(pack, pack.Manifest.files.Keys.FirstOrDefault(name => name.StartsWith("background.", StringComparison.Ordinal))),
                    toolbar = AssetUrl(pack, "toolbar.png"), mech = AssetUrl(pack, "mech.webp"), tides = AssetUrl(pack, "tides.webp"),
                    songs = (pack.Manifest.songs ?? new Track[0]).Select(track => new
                    {
                        name = track.name, artist = track.artist ?? "", url = AssetUrl(pack, track.file)
                    }).ToArray()
                };
            });
    }

    internal static Asset OpenAsset(string id, string name)
    {
        lock (Gate)
        {
            Pack pack;
            if (!Installed.TryGetValue(id, out pack) || !pack.Manifest.files.ContainsKey(name)) return null;
            var archive = Open(pack.Path);
            try
            {
                var entry = archive.GetEntry(name);
                if (entry == null) throw Invalid("找不到已验证的主题素材。");
                var ext = Path.GetExtension(name);
                return new Asset
                {
                    Archive = archive, Data = entry.Open(), Length = entry.Length,
                    ContentType = ext == ".mp3" ? "audio/mpeg" : ext == ".jpg" ? "image/jpeg" : ext == ".png" ? "image/png" : "image/webp"
                };
            }
            catch { archive.Dispose(); throw; }
        }
    }
}

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

static class HelperUpdate
{
    const string Repo = "Fantasicrap/Wuwatappo_Helper";
    const string Releases = "https://github.com/" + Repo + "/releases";
    const string OfficialHost = "mc-wuwatappo.kurogames-global.com";
    const string OfficialIndex = "https://" + OfficialHost + "/app/json-host/latest_host.json";
    const string InstalledName = "Wuwatappo_Helper.exe";
    const string Worker = "--apply-helper-update";
    const long MaxDownload = 256L * 1024 * 1024;
    static readonly object Gate = new object();
    static readonly string Folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Wuwatappo_Helper", "update");
    static readonly string Exe = Assembly.GetExecutingAssembly().Location;
    static readonly string CheckedPath = Path.Combine(Folder, "checked-" + Current + ".txt");
    static readonly string OfficialPath = Path.Combine(Folder, "official.txt");
    static string state = "idle", message = "", releaseUrl = Releases;
    static Version official;
    static Release candidate;
    static string downloaded;
    static bool busy, automatic, requested;

    internal static Version Current { get { return Assembly.GetExecutingAssembly().GetName().Version; } }

    sealed class Release
    {
        public Version Version;
        public string Name, Digest, Url;
        public long Size;
    }

    static string FileName(Version v) { return "Wuwatappo_Helper-" + v + ".exe"; }
    static Version Base(Version v) { return new Version(v.Major, v.Minor, v.Build); }

    static Version ParseVersion(string value, int parts)
    {
        Version parsed;
        return value != null && Version.TryParse(value, out parsed) && parsed.ToString() == value &&
            (parts == 4 ? parsed.Revision >= 0 : parsed.Build >= 0 && parsed.Revision < 0) ? parsed : null;
    }

    static bool ShouldCheckOnStartup(Version current, Version upstream, Version previous)
    {
        return upstream != null && upstream > Base(current) && upstream != previous;
    }

    static Dictionary<string, object> Object(object value) { return value as Dictionary<string, object>; }
    static object Value(Dictionary<string, object> data, string key)
    {
        object value;
        return data != null && data.TryGetValue(key, out value) ? value : null;
    }

    static Release SelectRelease(object payload, Version current, Version upstream)
    {
        var rows = payload as object[];
        if (rows == null) throw new InvalidDataException("GitHub 发布清单格式异常。");
        var target = upstream != null && upstream > Base(current) ? upstream : Base(current);
        Release best = null;
        foreach (var row in rows)
        {
            var data = Object(row);
            if (!Equals(Value(data, "draft"), false) || !Equals(Value(data, "prerelease"), false)) continue;
            string tag = Value(data, "tag_name") as string;
            var version = tag != null && tag.StartsWith("v", StringComparison.Ordinal) ? ParseVersion(tag.Substring(1), 4) : null;
            if (version == null || Base(version) != target || version <= current || (best != null && version <= best.Version)) continue;
            var assets = Value(data, "assets") as object[];
            if (assets == null) continue;
            string name = FileName(version), url = Releases + "/download/" + tag + "/" + name;
            foreach (var asset in assets)
            {
                var file = Object(asset);
                if (!Equals(Value(file, "name"), name)) continue;
                string digest = Value(file, "digest") as string;
                long size;
                if (!Equals(Value(file, "browser_download_url"), url) || !long.TryParse(Convert.ToString(Value(file, "size")), out size) ||
                    size < 1 || size > MaxDownload || digest == null || !Regex.IsMatch(digest, @"\Asha256:[0-9a-f]{64}\z"))
                    throw new InvalidDataException("GitHub 更新附件缺少有效的大小、下载地址或 SHA-256。");
                best = new Release { Version = version, Name = name, Url = url, Size = size, Digest = digest.Substring(7) };
                break;
            }
        }
        return best;
    }

    static bool SecureHost(Uri uri, string host)
    {
        return uri != null && uri.IsAbsoluteUri && uri.Scheme == Uri.UriSchemeHttps && uri.IsDefaultPort &&
            uri.UserInfo.Length == 0 && String.Equals(uri.Host, host, StringComparison.OrdinalIgnoreCase);
    }

    static HttpWebResponse Open(Uri uri, bool asset)
    {
        for (int hop = 0; hop < 5; hop++)
        {
            bool valid = asset ? SecureHost(uri, "github.com") || SecureHost(uri, "release-assets.githubusercontent.com") ||
                SecureHost(uri, "objects.githubusercontent.com") : SecureHost(uri, "api.github.com") || SecureHost(uri, OfficialHost);
            if (!valid) throw new InvalidDataException("更新地址不在允许的服务器范围内。");
            var req = (HttpWebRequest)WebRequest.Create(uri);
            req.UserAgent = "Wuwatappo_Helper/" + Current;
            req.Accept = asset ? "application/octet-stream" : "application/json";
            req.AllowAutoRedirect = false;
            req.Timeout = 12000;
            req.ReadWriteTimeout = 20000;
            var response = (HttpWebResponse)req.GetResponse();
            int code = (int)response.StatusCode;
            if (code == 200) return response;
            string location = response.Headers[HttpResponseHeader.Location];
            response.Dispose();
            if (code < 300 || code >= 400 || !asset || String.IsNullOrEmpty(location))
                throw new IOException("更新服务器返回 HTTP " + code + "。");
            uri = new Uri(uri, location);
        }
        throw new IOException("更新下载重定向次数过多。");
    }

    static void CopyLimited(Stream input, Stream output, long limit)
    {
        var buffer = new byte[81920];
        long count = 0;
        int read;
        while ((read = input.Read(buffer, 0, buffer.Length)) > 0)
        {
            count += read;
            if (count > limit) throw new InvalidDataException("更新文件超过预期大小。");
            output.Write(buffer, 0, read);
        }
    }

    static object ReadJson(Uri uri)
    {
        using (var response = Open(uri, false))
        using (var input = response.GetResponseStream())
        using (var data = new MemoryStream())
        {
            CopyLimited(input, data, 4 * 1024 * 1024);
            return new JavaScriptSerializer { MaxJsonLength = 4 * 1024 * 1024 }.DeserializeObject(System.Text.Encoding.UTF8.GetString(data.ToArray()));
        }
    }

    static Version ReadOfficial()
    {
        var data = Object(ReadJson(new Uri(OfficialIndex + "?v=" + DateTime.UtcNow.Ticks)));
        Uri uri;
        if (!Uri.TryCreate(Value(data, "url") as string, UriKind.Absolute, out uri) || !SecureHost(uri, OfficialHost))
            throw new InvalidDataException("官方版本清单地址无效。");
        var version = ParseVersion(Value(Object(ReadJson(uri)), "version") as string, 3);
        if (version == null) throw new InvalidDataException("官方版本号无效。");
        return version;
    }

    static string ReadText(string path) { try { return File.ReadAllText(path).Trim(); } catch (IOException) { return ""; } catch (UnauthorizedAccessException) { return ""; } }

    static void Remember(string path, string value)
    {
        Directory.CreateDirectory(Folder);
        string temporary = path + ".tmp";
        try
        {
            File.WriteAllText(temporary, value);
            if (File.Exists(path)) File.Replace(temporary, path, null);
            else File.Move(temporary, path);
        }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }

    static void SetState(string next, string text)
    {
        lock (Gate) { state = next; message = text; }
    }

    internal static bool Start(bool startup)
    {
        lock (Gate)
        {
            if (busy || requested || state == "ready") return false;
            busy = true;
            automatic = startup;
            state = "checking";
            message = "正在检查更新…";
        }
        ThreadPool.QueueUserWorkItem(_ => Check(startup));
        return true;
    }

    static void Check(bool startup)
    {
        bool autoCheck = false;
        try
        {
            ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
            var previous = ParseVersion(ReadText(CheckedPath), 3);
            if (startup) Remember(CheckedPath, "");
            Version upstream;
            try { upstream = ReadOfficial(); Remember(OfficialPath, upstream.ToString()); }
            catch (WebException) { upstream = ParseVersion(ReadText(OfficialPath), 3); }
            catch (InvalidDataException) { upstream = ParseVersion(ReadText(OfficialPath), 3); }
            lock (Gate) official = upstream;
            bool ahead = upstream != null && upstream > Base(Current);
            if (startup && !ShouldCheckOnStartup(Current, upstream, previous))
            {
                SetState(ahead ? "waiting" : "idle", ahead ? "官方已升版，可手动检查 Helper 适配版。" : "");
                return;
            }
            autoCheck = startup;
            var release = SelectRelease(ReadJson(new Uri("https://api.github.com/repos/" + Repo + "/releases?per_page=30")), Current, upstream);
            if (release == null)
            {
                if (ahead) Remember(CheckedPath, upstream.ToString());
                SetState(ahead ? "waiting" : "current", ahead ? "GitHub 暂无适配官方 " + upstream + " 的 Helper，可继续使用当前版本。" : "当前已是此版本系列的最新版。");
                return;
            }
            lock (Gate) releaseUrl = Releases + "/tag/v" + release.Version;
            SetState("downloading", "正在下载 Helper v" + release.Version + "…");
            var file = Download(release);
            if (ahead) Remember(CheckedPath, upstream.ToString());
            lock (Gate)
            {
                candidate = release;
                downloaded = file;
                state = "ready";
                message = "Helper v" + release.Version + " 已下载并校验。";
            }
        }
        catch (Exception ex)
        {
            SetState("error", "检查或下载失败。可以重试，或前往 GitHub 下载。");
            Trace.WriteLine("[Helper update] " + ex.GetType().Name + ": " + ex.Message);
            if (autoCheck) ThreadPool.QueueUserWorkItem(_ => OfferGitHub("自动更新未完成。是否前往 GitHub 下载？"));
        }
        finally { lock (Gate) busy = false; }
    }

    static string Hash(string file)
    {
        using (var sha = SHA256.Create())
        using (var input = File.OpenRead(file))
            return BitConverter.ToString(sha.ComputeHash(input)).Replace("-", "").ToLowerInvariant();
    }

    static Version FileVersion(string file)
    {
        var info = FileVersionInfo.GetVersionInfo(file);
        return new Version(info.FileMajorPart, info.FileMinorPart, info.FileBuildPart, info.FilePrivatePart);
    }

    static bool Verified(string file, string digest, Version version, long size)
    {
        return File.Exists(file) && new FileInfo(file).Length == size && Hash(file) == digest && FileVersion(file) == version;
    }

    static string Download(Release release)
    {
        string stage = Path.Combine(Folder, "v" + release.Version);
        Directory.CreateDirectory(stage);
        string final = Path.Combine(stage, release.Name), temp = final + ".part";
        if (Verified(final, release.Digest, release.Version, release.Size)) return final;
        try
        {
            using (var response = Open(new Uri(release.Url), true))
            using (var input = response.GetResponseStream())
            using (var output = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None))
                CopyLimited(input, output, release.Size);
            if (!Verified(temp, release.Digest, release.Version, release.Size)) throw new InvalidDataException("Helper 更新文件校验失败。");
            if (File.Exists(final)) File.Replace(temp, final, null);
            else File.Move(temp, final);
            return final;
        }
        finally { if (File.Exists(temp)) File.Delete(temp); }
    }

    internal static object Status()
    {
        lock (Gate) return new { state, message, automatic, current = Current.ToString(), official = official == null ? "" : official.ToString(), releaseUrl };
    }

    internal static bool RequestInstall()
    {
        lock (Gate)
        {
            if (state != "ready") return false;
            requested = true;
            state = "applying";
            message = "正在退出并安装 Helper 更新…";
            return true;
        }
    }

    internal static bool CancelInstall()
    {
        lock (Gate)
        {
            if (!requested) return false;
            requested = false;
            state = "ready";
            message = "更新已下载，请手动选择重启并更新。";
            automatic = false;
            return true;
        }
    }

    internal static bool OpenRelease()
    {
        string url;
        lock (Gate) url = releaseUrl;
        try { using (Process.Start(new ProcessStartInfo(url) { UseShellExecute = true })) { } return true; }
        catch { return false; }
    }

    static string Quote(string path) { return "\"" + path + "\""; }

    internal static void Handoff()
    {
        if (!requested) return;
        try
        {
            if (!Verified(downloaded, candidate.Digest, candidate.Version, candidate.Size)) throw new InvalidDataException();
            using (var process = Process.Start(new ProcessStartInfo(downloaded,
                Worker + " " + Process.GetCurrentProcess().Id + " " + Quote(Exe) + " " + candidate.Digest + " " + candidate.Size)
                { UseShellExecute = false, CreateNoWindow = true }))
                if (process == null) throw new IOException();
        }
        catch { OfferGitHub("更新校验或启动失败，旧版仍可打开。是否前往 GitHub 下载？"); }
    }

    internal static bool IsWorker(string[] args) { return args.Length > 0 && args[0] == Worker; }

    internal static int Apply(string[] args)
    {
        try
        {
            int parent;
            long size;
            if (args.Length != 5 || !Int32.TryParse(args[1], out parent) || !Int64.TryParse(args[4], out size) ||
                !Regex.IsMatch(args[3], @"\A[0-9a-f]{64}\z") || size <= 0 || size > MaxDownload ||
                !String.Equals(Exe, Path.Combine(Folder, "v" + Current, FileName(Current)), StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException();
            try { using (var old = Process.GetProcessById(parent)) if (!old.WaitForExit(15000)) throw new IOException(); }
            catch (ArgumentException) { /* Parent has already exited. */ }
            string original = Path.GetFullPath(args[2]);
            if (!Verified(Exe, args[3], Current, size)) throw new InvalidDataException();
            bool installed = String.Equals(Path.GetFileName(original), InstalledName, StringComparison.OrdinalIgnoreCase);
            var before = FileVersion(original);
            if (before >= Current || (!installed && !String.Equals(Path.GetFileName(original), FileName(before), StringComparison.OrdinalIgnoreCase)))
                throw new InvalidDataException();
            string target = installed ? original : Path.Combine(Path.GetDirectoryName(original), FileName(Current));
            InstallAndLaunch(Exe, Current, target, args[3], size, installed, Launch);
            return 0;
        }
        catch { OfferGitHub("无法安装 Helper 更新。可重新打开旧版，或前往 GitHub 下载。现在打开下载页吗？"); return 1; }
    }

    static void InstallAndLaunch(string source, Version version, string target, string digest, long size, bool installed, Action<string> launch)
    {
        string backup = null;
        if (!installed && File.Exists(target))
        {
            if (!Verified(target, digest, version, size)) throw new IOException();
        }
        else
        {
            string temporary = target + ".update-" + Guid.NewGuid().ToString("N");
            try
            {
                File.Copy(source, temporary);
                if (!Verified(temporary, digest, version, size)) throw new InvalidDataException();
                if (installed)
                {
                    string backups = Path.Combine(Path.GetDirectoryName(target), "Helper-backup", Guid.NewGuid().ToString("N"));
                    Directory.CreateDirectory(backups);
                    backup = Path.Combine(backups, FileName(FileVersion(target)));
                    File.Replace(temporary, target, backup);
                }
                else File.Move(temporary, target);
            }
            finally { if (File.Exists(temporary)) File.Delete(temporary); }
        }
        try { launch(target); }
        catch
        {
            if (backup != null && File.Exists(backup)) File.Replace(backup, target, null);
            throw;
        }
    }

    static void Launch(string target)
    {
        using (var process = Process.Start(new ProcessStartInfo(target) { UseShellExecute = true, WorkingDirectory = Path.GetDirectoryName(target) }))
            if (process == null) throw new IOException();
    }

    static void OfferGitHub(string text)
    {
        if (MessageBox.Show(text, "Wuwatappo Helper 更新", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) != DialogResult.Yes) return;
        OpenRelease();
    }
}

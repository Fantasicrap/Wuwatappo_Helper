using System;
using System.IO;
using System.Threading;
using System.Web;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

static class GlobalSignInWindow
{
    const string LoginHost = "login-wutheringwaves-wuwatappo.kurogames-global.com";
    static readonly object Gate = new object();
    static string state;
    static DateTime expires;
    static object result;
    static string status;

    internal static bool ValidState(string value)
    {
        if (value == null || value.Length != 32) return false;
        foreach (var digit in value) if (!Uri.IsHexDigit(digit)) return false;
        return true;
    }

    internal static bool Open(string id, string locale, string profile, Action prepare)
    {
        if (!ValidState(id)) return false;
        lock (Gate)
        {
            if (status == "pending" && DateTime.UtcNow < expires) return false;
            expires = DateTime.UtcNow.AddMinutes(10);
            state = id;
            result = null;
            status = "pending";
        }
        var thread = new Thread(() =>
        {
            try { prepare(); Show(id, locale, profile); }
            catch (Exception) { Finish(id, null); }
        });
        thread.IsBackground = true;
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        return true;
    }

    internal static object Poll(string id)
    {
        lock (Gate)
        {
            if (DateTime.UtcNow >= expires) { state = status = null; result = null; }
            if (!ValidState(id) || id != state)
                return new { status = "closed" };
            if (status != "complete") return new { status };
            var login = result;
            state = status = null;
            result = null;
            return new { status = "complete", login };
        }
    }

    static void Finish(string id, object login)
    {
        lock (Gate)
        {
            if (id != state || status != "pending" || DateTime.UtcNow >= expires) return;
            result = login;
            status = login == null ? "closed" : "complete";
        }
    }

    static bool IsOfficialHost(string host)
    {
        return host == "kurogames-global.com" || host.EndsWith(".kurogames-global.com", StringComparison.Ordinal) ||
            host == "kurogames.com" || host.EndsWith(".kurogames.com", StringComparison.Ordinal) ||
            host == "kurogame.com" || host.EndsWith(".kurogame.com", StringComparison.Ordinal);
    }

    internal static object ParseCallback(Uri uri, string expected)
    {
        if (!ValidState(expected) || uri == null || uri.Scheme != "wuwa-buddy" ||
            uri.Host != "auth" || uri.AbsolutePath.TrimEnd('/') != "/callback" || uri.UserInfo.Length != 0) return null;
        var query = HttpUtility.ParseQueryString(uri.Query);
        if (query["state"] != expected) return null;
        var accessToken = query["access_token"] ?? query["token"];
        var cuid = query["cuid"];
        if (String.IsNullOrWhiteSpace(accessToken) || String.IsNullOrWhiteSpace(cuid)) return null;
        return new {
            accessToken, cuid, puid = query["puid"], userId = query["userId"] ?? query["user_id"],
            userName = query["userName"] ?? query["user_name"]
        };
    }

    [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
    static void Show(string id, string locale, string profile)
    {
        using (var form = new Form { Text = "KURO GAMES · Wuwa Tappo", Width = 510, Height = 700,
            AutoScaleMode = AutoScaleMode.Dpi, StartPosition = FormStartPosition.CenterScreen })
        using (var timeout = new System.Windows.Forms.Timer { Interval = 600000 })
        {
            var view = new WebView2 { Dock = DockStyle.Fill };
            form.Controls.Add(view);
            form.FormClosed += (sender, args) => Finish(id, null);
            timeout.Tick += (sender, args) => form.Close();
            form.Shown += async (sender, shown) =>
            {
                timeout.Start();
                try
                {
                    Directory.CreateDirectory(profile);
                    var environment = await CoreWebView2Environment.CreateAsync(null, profile);
                    if (form.IsDisposed) return;
                    await view.EnsureCoreWebView2Async(environment);
                    if (form.IsDisposed) return;
                    var core = view.CoreWebView2;
                    core.Settings.AreHostObjectsAllowed = false;
                    core.Settings.IsWebMessageEnabled = false;
                    core.Settings.AreDevToolsEnabled = false;
                    core.Settings.AreDefaultContextMenusEnabled = false;
                    Action<string> accept = address =>
                    {
                        Uri target, source;
                        if (!Uri.TryCreate(core.Source, UriKind.Absolute, out source) ||
                            source.Scheme != "https" || source.Host != LoginHost ||
                            !Uri.TryCreate(address, UriKind.Absolute, out target)) return;
                        var login = ParseCallback(target, id);
                        if (login == null) return;
                        Finish(id, login);
                        form.BeginInvoke((Action)form.Close);
                    };
                    core.LaunchingExternalUriScheme += (source, args) =>
                    {
                        args.Cancel = true;
                        accept(args.Uri);
                    };
                    core.NavigationStarting += (source, args) =>
                    {
                        Uri target;
                        if (Uri.TryCreate(args.Uri, UriKind.Absolute, out target) &&
                            target.Scheme == "https" && IsOfficialHost(target.Host)) return;
                        args.Cancel = true;
                        accept(args.Uri);
                    };
                    core.NewWindowRequested += (source, args) => { args.Handled = true; accept(args.Uri); };
                    string lang = locale == "en" ? "en" : "zh-Hans";
                    core.Navigate("https://" + LoginHost + "/login/?scheme=wuwa-buddy&lang=" + lang + "&state=" + id);
                }
                catch (Exception) { if (!form.IsDisposed) form.Close(); }
            };
            Application.Run(form);
        }
    }
}

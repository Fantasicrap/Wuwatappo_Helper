using System;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Web;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

static class GlobalSignInWindow
{
    const string LoginHost = "login-wutheringwaves-wuwatappo.kurogames-global.com";
    const string SdkHost = "sdk-prod-cdn-aws.kurogame-service.com";
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

    static bool SafeHttps(Uri uri)
    {
        return uri != null && uri.IsAbsoluteUri && uri.Scheme == Uri.UriSchemeHttps &&
            uri.IsDefaultPort && uri.UserInfo.Length == 0;
    }

    internal static bool IsPopupSource(Uri uri)
    {
        return SafeHttps(uri) && (uri.Host == LoginHost || uri.Host == SdkHost);
    }

    internal static bool IsGoogleSignIn(Uri uri)
    {
        return SafeHttps(uri) && uri.Host == "accounts.google.com";
    }

    internal static bool IsPopupDestination(Uri uri)
    {
        if (uri == null || !uri.IsAbsoluteUri) return false;
        if (uri.AbsoluteUri == "about:blank") return true;
        if (!SafeHttps(uri)) return false;
        if (IsOfficialHost(uri.Host) || uri.Host == SdkHost) return true;
        switch (uri.Host)
        {
            case "appleid.apple.com":
            case "www.facebook.com":
            case "m.facebook.com":
            case "x.com":
            case "api.x.com":
            case "twitter.com":
            case "api.twitter.com":
            case "access.line.me":
            case "nid.naver.com":
                return true;
            default:
                return false;
        }
    }

    static void Configure(CoreWebView2 core)
    {
        core.Settings.AreHostObjectsAllowed = false;
        core.Settings.IsWebMessageEnabled = false;
        core.Settings.AreDevToolsEnabled = false;
        core.Settings.AreDefaultContextMenusEnabled = false;
    }

    static void FitWindow(Form form, Rectangle workArea, Rectangle anchor)
    {
        const int margin = 12;
        int width = Math.Min(form.Width, Math.Max(1, workArea.Width - 2 * margin));
        int height = Math.Min(form.Height, Math.Max(1, workArea.Height - 2 * margin));
        int left = Math.Max(workArea.Left, Math.Min(anchor.Left + (anchor.Width - width) / 2, workArea.Right - width));
        int top = Math.Max(workArea.Top, Math.Min(anchor.Top + (anchor.Height - height) / 2, workArea.Bottom - height));
        form.Bounds = new Rectangle(left, top, width, height);
    }

    internal static async void OpenPopup(Form owner, CoreWebView2Environment environment,
        CoreWebView2NewWindowRequestedEventArgs args, Action showGoogleNotice)
    {
        args.Handled = true;
        var sourceFrame = args.OriginalSourceFrameInfo;
        Uri source, target;
        if (sourceFrame == null || !Uri.TryCreate(sourceFrame.Source, UriKind.Absolute, out source) ||
            !Uri.TryCreate(args.Uri, UriKind.Absolute, out target)) return;
        if (IsGoogleSignIn(target) && (IsPopupSource(source) || IsGoogleSignIn(source)))
        {
            showGoogleNotice();
            return;
        }
        if (!IsPopupSource(source) || !IsPopupDestination(target) || owner.OwnedForms.Length != 0) return;

        var deferral = args.GetDeferral();
        var popup = new Form { Text = owner.Text, ClientSize = new Size(525, 650),
            AutoScaleMode = AutoScaleMode.Dpi, StartPosition = FormStartPosition.Manual,
            Location = owner.Location, ShowInTaskbar = false, Icon = owner.Icon };
        try
        {
            owner.AddOwnedForm(popup);
            var view = new WebView2 { Dock = DockStyle.Fill };
            popup.Controls.Add(view);
            popup.Load += (sender, loaded) => FitWindow(popup, Screen.FromControl(owner).WorkingArea, owner.Bounds);
            // WinForms needs a visible window to initialize the WebView controller without a source.
            popup.Show(owner);
            await view.EnsureCoreWebView2Async(environment);
            if (owner.IsDisposed || popup.IsDisposed) { popup.Dispose(); return; }
            var core = view.CoreWebView2;
            Configure(core);
            core.NavigationStarting += (sender, navigation) =>
            {
                Uri address;
                bool parsed = Uri.TryCreate(navigation.Uri, UriKind.Absolute, out address);
                navigation.Cancel = !parsed || !IsPopupDestination(address);
                if (parsed && IsGoogleSignIn(address))
                {
                    owner.BeginInvoke((Action)(() =>
                    {
                        if (!popup.IsDisposed) popup.Close();
                        showGoogleNotice();
                    }));
                }
                else if (!navigation.Cancel && SafeHttps(address)) popup.Text = address.Host;
            };
            core.NewWindowRequested += (sender, request) => request.Handled = true;
            core.LaunchingExternalUriScheme += (sender, request) => request.Cancel = true;
            core.WindowCloseRequested += (sender, request) => popup.BeginInvoke((Action)popup.Close);
            args.NewWindow = core;
        }
        catch (Exception)
        {
            popup.Dispose();
        }
        finally { deferral.Complete(); }
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
        bool english = locale == "en";
        var workArea = Screen.FromPoint(Cursor.Position).WorkingArea;
        using (var form = new Form { Text = english ? "Wuwatappo Helper · Global sign-in" : "Wuwatappo Helper · 国际服登录",
            Width = 660, Height = 735, Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath),
            AutoScaleMode = AutoScaleMode.Dpi, StartPosition = FormStartPosition.Manual, Location = workArea.Location })
        using (var timeout = new System.Windows.Forms.Timer { Interval = 600000 })
        {
            var view = new WebView2 { Dock = DockStyle.Fill };
            var footer = new FlowLayoutPanel { Dock = DockStyle.Bottom, AutoSize = true,
                FlowDirection = FlowDirection.RightToLeft, Padding = new Padding(10, 3, 10, 3),
                BackColor = Color.FromArgb(247, 241, 231) };
            var help = new Button { Text = english ? "Sign-in help" : "登录帮助", AutoSize = true };
            var retry = new Button { Text = english ? "Reload page" : "重新加载", AutoSize = true, Visible = false };
            foreach (var button in new[] { help, retry })
            {
                button.Font = SystemFonts.MessageBoxFont;
                button.Padding = new Padding(7, 1, 7, 1);
                button.ForeColor = Color.FromArgb(99, 63, 43);
                button.BackColor = Color.FromArgb(255, 250, 242);
                button.FlatStyle = FlatStyle.Flat;
                button.FlatAppearance.BorderColor = Color.FromArgb(217, 194, 172);
            }
            footer.Controls.Add(help);
            footer.Controls.Add(retry);
            form.Controls.Add(view);
            form.Controls.Add(footer);
            form.Load += (sender, args) => FitWindow(form, workArea, workArea);
            string googleNotice = english
                ? "For Google sign-in, use the official Global Wuwa Tappo client with your default browser. You can also sign in to Helper with an email linked to your KURO account."
                : "使用 Google 登录时，请从官方国际服 Wuwa Tappo 客户端打开默认浏览器。也可以使用已绑定到库洛账号的邮箱登录 Helper。";
            Action showGoogleNotice = () => MessageBox.Show(form, googleNotice, form.Text,
                MessageBoxButtons.OK, MessageBoxIcon.Information);
            help.Click += (sender, args) => MessageBox.Show(form,
                (english
                    ? "If KURO shows 20003, make sure your network can reach KURO's login service, then click Sign in again.\n\n"
                    : "库洛页面提示 20003 时，请确认当前网络可以访问库洛登录服务，再点「重新登录」。\n\n") + googleNotice,
                form.Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
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
                    Configure(core);
                    Action<string> accept = address =>
                    {
                        Uri target, source;
                        if (!Uri.TryCreate(core.Source, UriKind.Absolute, out source) ||
                            !SafeHttps(source) || source.Host != LoginHost ||
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
                            SafeHttps(target) && IsOfficialHost(target.Host)) return;
                        args.Cancel = true;
                        if (IsGoogleSignIn(target)) { form.BeginInvoke(showGoogleNotice); return; }
                        accept(args.Uri);
                    };
                    core.NewWindowRequested += (source, args) =>
                    {
                        if (args.Uri != null && args.Uri.StartsWith("wuwa-buddy:", StringComparison.OrdinalIgnoreCase))
                        {
                            args.Handled = true;
                            var sourceFrame = args.OriginalSourceFrameInfo;
                            Uri origin;
                            if (sourceFrame != null && Uri.TryCreate(sourceFrame.Source, UriKind.Absolute, out origin) &&
                                SafeHttps(origin) && origin.Host == LoginHost) accept(args.Uri);
                        }
                        else OpenPopup(form, environment, args, () => form.BeginInvoke(showGoogleNotice));
                    };
                    core.NavigationCompleted += (source, args) =>
                        retry.Visible = !args.IsSuccess && args.WebErrorStatus != CoreWebView2WebErrorStatus.OperationCanceled;
                    string lang = english ? "en" : "zh-Hans";
                    string loginUrl = "https://" + LoginHost + "/login/?state=" + id + "&scheme=wuwa-buddy&lang=" + lang;
                    retry.Click += (source, args) => core.Navigate(loginUrl);
                    core.Navigate(loginUrl);
                }
                catch (Exception) { if (!form.IsDisposed) form.Close(); }
            };
            Application.Run(form);
        }
    }
}

using System;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

static class DeniaGameWindow
{
    const string Title = "拉海洛方块";
    static readonly object Gate = new object();
    static Form window;
    static bool starting;

    internal static bool Show(string address, string profile, Action prepare)
    {
        lock (Gate)
        {
            if (starting) return true;
            if (window != null && !window.IsDisposed)
            {
                var existing = window;
                try
                {
                    existing.BeginInvoke((Action)(() => Activate(existing)));
                    return true;
                }
                catch (InvalidOperationException) { window = null; }
            }
            starting = true;
            var thread = new Thread(() => Run(address, profile, prepare));
            thread.IsBackground = true;
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            return true;
        }
    }

    static void Activate(Form form)
    {
        if (form.WindowState == FormWindowState.Minimized) form.WindowState = FormWindowState.Normal;
        form.Activate();
        var web = form.ActiveControl;
        if (web != null) web.Focus();
    }

    // Keep preparation outside the method which JIT-compiles WebView2 references.
    static void Run(string address, string profile, Action prepare)
    {
        try
        {
            prepare();
            RunWebView(address, profile);
        }
        catch (Exception error)
        {
            MessageBox.Show("无法打开小游戏窗口。请检查 Microsoft Edge WebView2 Runtime。\n" + error.Message,
                Title, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        finally
        {
            lock (Gate) { window = null; starting = false; }
        }
    }

    [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
    static void RunWebView(string address, string profile)
    {
        var bounds = Screen.FromPoint(Cursor.Position).WorkingArea;
        using (var form = new Form
        {
            Text = Title, AutoScaleMode = AutoScaleMode.Dpi, MinimumSize = new Size(370, 465),
            ClientSize = new Size(Math.Min(585, bounds.Width - 36), Math.Min(750, bounds.Height - 70)),
            StartPosition = FormStartPosition.Manual, BackColor = Color.FromArgb(242, 235, 247)
        })
        {
            form.Location = new Point(bounds.Left + (bounds.Width - form.Width) / 2,
                bounds.Top + Math.Max(0, (bounds.Height - form.Height) / 2));
            var web = new WebView2 { Dock = DockStyle.Fill };
            form.Controls.Add(web);
            form.HandleCreated += (sender, args) =>
            {
                lock (Gate) { window = form; starting = false; }
            };
            form.Shown += async (sender, args) =>
            {
                try
                {
                    Directory.CreateDirectory(profile);
                    var environment = await CoreWebView2Environment.CreateAsync(null, profile);
                    if (form.IsDisposed) return;
                    await web.EnsureCoreWebView2Async(environment);
                    if (form.IsDisposed) return;
                    var core = web.CoreWebView2;
                    core.Settings.AreDefaultContextMenusEnabled = false;
                    core.Settings.AreDevToolsEnabled = false;
                    core.Settings.AreHostObjectsAllowed = false;
                    core.Settings.AreBrowserAcceleratorKeysEnabled = false;
                    var fallingAddress = address + "/falling";
                    core.NavigationStarting += (source, e) => e.Cancel =
                        !String.Equals(e.Uri, address, StringComparison.Ordinal) &&
                        !String.Equals(e.Uri, fallingAddress, StringComparison.Ordinal);
                    core.NewWindowRequested += (source, e) => e.Handled = true;
                    core.NavigationCompleted += (source, e) =>
                    {
                        if (e.IsSuccess && form.ContainsFocus) web.Focus();
                    };
                    core.Navigate(address);
                }
                catch (Exception error)
                {
                    if (form.IsDisposed) return;
                    MessageBox.Show(form, "无法加载本地小游戏。\n" + error.Message, Title,
                        MessageBoxButtons.OK, MessageBoxIcon.Information);
                    form.Close();
                }
            };
            Application.Run(form);
        }
    }
}

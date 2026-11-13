using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
static class MouseCapture {
 public class Edge { public long seq,ms; public string button,key,action; public int x,y; }
 static IntPtr keyboardHook;static volatile bool active,captureEnabled;static long requestedAt=-10000;static Control dispatcher;static HookProc keyCallback=OnKey;static readonly bool[] held=new bool[256];
 [DllImport("user32")] static extern short GetAsyncKeyState(int key);
 [DllImport("user32")] static extern bool GetPhysicalCursorPos(out Point point);
 static readonly string[] keyNames=BuildKeyNames();
 static string[] BuildKeyNames(){
  var names=new string[256];
  var standard=new Dictionary<int,string>{
   {8,"Backspace"},{9,"Tab"},{13,"Enter"},{19,"Pause"},{20,"CapsLock"},{21,"KanaMode"},
   {27,"Escape"},{28,"Convert"},{29,"NonConvert"},{32,"Space"},{33,"PageUp"},{34,"PageDown"},
   {35,"End"},{36,"Home"},{37,"ArrowLeft"},{38,"ArrowUp"},{39,"ArrowRight"},{40,"ArrowDown"},
   {44,"PrintScreen"},{45,"Insert"},{46,"Delete"},{91,"Meta"},{92,"Meta"},{93,"ContextMenu"},
   {106,"NumpadMultiply"},{107,"NumpadAdd"},{108,"NumpadSeparator"},{109,"NumpadSubtract"},
   {110,"NumpadDecimal"},{111,"NumpadDivide"},{144,"NumLock"},{145,"ScrollLock"},
   {160,"Shift"},{161,"Shift"},{162,"Ctrl"},{163,"Ctrl"},{164,"Alt"},{165,"Alt"},
   {166,"BrowserBack"},{167,"BrowserForward"},{168,"BrowserRefresh"},{169,"BrowserStop"},
   {170,"BrowserSearch"},{171,"BrowserFavorites"},{172,"BrowserHome"},{173,"AudioVolumeMute"},
   {174,"AudioVolumeDown"},{175,"AudioVolumeUp"},{176,"MediaTrackNext"},{177,"MediaTrackPrevious"},
   {178,"MediaStop"},{179,"MediaPlayPause"},{180,"LaunchMail"},{181,"MediaSelect"},
   {186,"Semicolon"},{187,"Equal"},{188,"Comma"},{189,"Minus"},{190,"Period"},{191,"Slash"},
   {192,"Backquote"},{219,"BracketLeft"},{220,"Backslash"},{221,"BracketRight"},{222,"Quote"},{226,"IntlBackslash"}
  };
  foreach(var entry in standard)names[entry.Key]=entry.Value;
  for(int key=48;key<=57;key++)names[key]=((char)key).ToString();
  for(int key=65;key<=90;key++)names[key]=((char)key).ToString();
  for(int key=96;key<=105;key++)names[key]="Numpad"+(key-96);
  for(int key=112;key<=135;key++)names[key]="F"+(key-111);
  return names;
 }
 static string KeyName(int key){return keyNames[key];}
 static readonly int[] watchedKeys=BuildKeys();static readonly Edge[] emptyEdges=new Edge[0];
 static int[] BuildKeys(){var result=new List<int>{1,2,4,5,6};for(int k=8;k<keyNames.Length;k++)if(KeyName(k)!=null)result.Add(k);return result.ToArray();}
 static string MouseName(int key){return key==1?"left":key==2?"right":key==4?"middle":key==5?"x1":key==6?"x2":null;}
 static void Record(int key,bool down,string button,int x,int y){lock(gate){if(held[key]==down)return;string name=button==null?KeyName(key):null;if(button==null&&name==null)return;held[key]=down;edges.Enqueue(new Edge{seq=++sequence,ms=clock.ElapsedMilliseconds,key=name,button=button,action=down?"press":"release",x=x,y=y});while(edges.Count>1024)edges.Dequeue();}}
 static IntPtr OnKey(int code,IntPtr w,IntPtr l){if(captureEnabled&&code>=0){int message=w.ToInt32();if(message==0x100||message==0x101||message==0x104||message==0x105){int key=Marshal.ReadInt32(l);if(key>=0&&key<256)Record(key,message==0x100||message==0x104,null,0,0);}}return CallNextHookEx(keyboardHook,code,w,l);}
 static void Poll(){if(!captureEnabled)return;Point point;GetPhysicalCursorPos(out point);foreach(int key in watchedKeys)Record(key,(GetAsyncKeyState(key)&0x8000)!=0,MouseName(key),point.x,point.y);}
 static bool DemandActive(long now,long last){return now-last<750;}
 static void UpdateDemand(){bool wanted=DemandActive(clock.ElapsedMilliseconds,Interlocked.Read(ref requestedAt));if(wanted==captureEnabled)return;
 if(wanted){hook=SetWindowsHookEx(14,callback,GetModuleHandle(null),0);keyboardHook=SetWindowsHookEx(13,keyCallback,GetModuleHandle(null),0);captureEnabled=true;Poll();}
 else{captureEnabled=false;if(hook!=IntPtr.Zero)UnhookWindowsHookEx(hook);if(keyboardHook!=IntPtr.Zero)UnhookWindowsHookEx(keyboardHook);hook=keyboardHook=IntPtr.Zero;lock(gate){edges.Clear();Array.Clear(held,0,held.Length);}}}
 static readonly object gate=new object();static readonly Queue<Edge> edges=new Queue<Edge>();static readonly Stopwatch clock=Stopwatch.StartNew();static long sequence;static IntPtr hook;static uint threadId;static Thread thread;static HookProc callback=OnMouse;
 delegate IntPtr HookProc(int code,IntPtr w,IntPtr l);
 [StructLayout(LayoutKind.Sequential)] struct Point { public int x,y; }
 [StructLayout(LayoutKind.Sequential)] struct MouseData { public Point point;public uint data,flags,time;public UIntPtr extra; }
 [DllImport("user32",SetLastError=true)] static extern IntPtr SetWindowsHookEx(int id,HookProc fn,IntPtr module,uint thread);
 [DllImport("user32")] static extern IntPtr CallNextHookEx(IntPtr h,int code,IntPtr w,IntPtr l);
 [DllImport("user32")] static extern bool UnhookWindowsHookEx(IntPtr h);
 [DllImport("user32")] static extern bool PostThreadMessage(uint id,uint msg,IntPtr w,IntPtr l);
 [DllImport("kernel32")] static extern uint GetCurrentThreadId();
 [DllImport("kernel32",CharSet=CharSet.Unicode)] static extern IntPtr GetModuleHandle(string name);
 static IntPtr OnMouse(int code,IntPtr w,IntPtr l){if(captureEnabled&&code>=0){int message=w.ToInt32();if(message==0x201||message==0x202||message==0x204||message==0x205||message==0x207||message==0x208||message==0x20B||message==0x20C){var data=(MouseData)Marshal.PtrToStructure(l,typeof(MouseData));int key=message==0x201||message==0x202?1:message==0x204||message==0x205?2:message==0x207||message==0x208?4:((data.data>>16)&0xffff)==1?5:6;Record(key,message==0x201||message==0x204||message==0x207||message==0x20B,MouseName(key),data.point.x,data.point.y);}}return CallNextHookEx(hook,code,w,l);}
 public static void Start(){thread=new Thread(()=>{threadId=GetCurrentThreadId();using(var control=new Control())using(var timer=new System.Windows.Forms.Timer()){var handle=control.Handle;dispatcher=control;timer.Interval=250;timer.Tick+=(s,e)=>{UpdateDemand();Poll();timer.Interval=captureEnabled?16:250;};active=true;timer.Start();try{Application.Run();}finally{active=false;dispatcher=null;timer.Stop();captureEnabled=false;if(hook!=IntPtr.Zero)UnhookWindowsHookEx(hook);if(keyboardHook!=IntPtr.Zero)UnhookWindowsHookEx(keyboardHook);hook=keyboardHook=IntPtr.Zero;}}});thread.IsBackground=true;thread.SetApartmentState(ApartmentState.STA);thread.Start();}
 public static void Stop(){if(threadId!=0)PostThreadMessage(threadId,0x12,IntPtr.Zero,IntPtr.Zero);if(thread!=null)thread.Join(1500);}
 public static object Snapshot(long after){Interlocked.Exchange(ref requestedAt,clock.ElapsedMilliseconds);if(active&&!captureEnabled){try{var target=dispatcher;if(target!=null)target.BeginInvoke((Action)UpdateDemand);}catch(InvalidOperationException){}}lock(gate){return new {seq=sequence,available=active,keyboardAvailable=active,gap=edges.Count>0&&after>0&&after<edges.Peek().seq-1,events=after>=sequence?emptyEdges:Array.FindAll(edges.ToArray(),e=>e.seq>after)};}}
}

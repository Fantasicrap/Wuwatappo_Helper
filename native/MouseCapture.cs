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
 static string KeyName(int key){if(key>=65&&key<=90)return ((char)key).ToString();if(key>=48&&key<=57)return ((char)key).ToString();if(key>=96&&key<=105)return (key-96).ToString();return key==32?"Space":null;}
 static readonly int[] watchedKeys=BuildKeys();static readonly Edge[] emptyEdges=new Edge[0];
 static int[] BuildKeys(){var result=new List<int>{1,2,32};for(int k=48;k<=90;k++)if(k<=57||k>=65)result.Add(k);for(int k=96;k<=105;k++)result.Add(k);return result.ToArray();}
 static void Record(int key,bool down,string button,int x,int y){lock(gate){if(held[key]==down)return;string name=button==null?KeyName(key):null;if(button==null&&name==null)return;held[key]=down;edges.Enqueue(new Edge{seq=++sequence,ms=clock.ElapsedMilliseconds,key=name,button=button,action=down?"press":"release",x=x,y=y});while(edges.Count>1024)edges.Dequeue();}}
 static IntPtr OnKey(int code,IntPtr w,IntPtr l){if(captureEnabled&&code>=0){int message=w.ToInt32();if(message==0x100||message==0x101||message==0x104||message==0x105){int key=Marshal.ReadInt32(l);if(key>=0&&key<256)Record(key,message==0x100||message==0x104,null,0,0);}}return CallNextHookEx(keyboardHook,code,w,l);}
 static void Poll(){if(!captureEnabled)return;Point point;GetPhysicalCursorPos(out point);foreach(int key in watchedKeys)Record(key,(GetAsyncKeyState(key)&0x8000)!=0,key==1?"left":key==2?"right":null,point.x,point.y);}
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
 static IntPtr OnMouse(int code,IntPtr w,IntPtr l){if(captureEnabled&&code>=0){int message=w.ToInt32();string button=message==0x201||message==0x202?"left":message==0x204||message==0x205?"right":null;if(button!=null){var data=(MouseData)Marshal.PtrToStructure(l,typeof(MouseData));Record(button=="left"?1:2,message==0x201||message==0x204,button,data.point.x,data.point.y);}}return CallNextHookEx(hook,code,w,l);}
 public static void Start(){thread=new Thread(()=>{threadId=GetCurrentThreadId();using(var control=new Control())using(var timer=new System.Windows.Forms.Timer()){var handle=control.Handle;dispatcher=control;timer.Interval=250;timer.Tick+=(s,e)=>{UpdateDemand();Poll();timer.Interval=captureEnabled?16:250;};active=true;timer.Start();try{Application.Run();}finally{active=false;dispatcher=null;timer.Stop();captureEnabled=false;if(hook!=IntPtr.Zero)UnhookWindowsHookEx(hook);if(keyboardHook!=IntPtr.Zero)UnhookWindowsHookEx(keyboardHook);hook=keyboardHook=IntPtr.Zero;}}});thread.IsBackground=true;thread.SetApartmentState(ApartmentState.STA);thread.Start();}
 public static void Stop(){if(threadId!=0)PostThreadMessage(threadId,0x12,IntPtr.Zero,IntPtr.Zero);if(thread!=null)thread.Join(1500);}
 public static object Snapshot(long after){Interlocked.Exchange(ref requestedAt,clock.ElapsedMilliseconds);if(active&&!captureEnabled){try{var target=dispatcher;if(target!=null)target.BeginInvoke((Action)UpdateDemand);}catch(InvalidOperationException){}}lock(gate){return new {seq=sequence,available=active,keyboardAvailable=active,gap=edges.Count>0&&after>0&&after<edges.Peek().seq-1,events=after>=sequence?emptyEdges:Array.FindAll(edges.ToArray(),e=>e.seq>after)};}}
}

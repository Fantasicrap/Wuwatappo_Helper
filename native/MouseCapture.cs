using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
static class MouseCapture {
 public class Edge { public long seq,ms; public string button,key,action; public int x,y; }
 static IntPtr keyboardHook;static volatile bool active;static HookProc keyCallback=OnKey;static readonly bool[] held=new bool[256];
 [DllImport("user32")] static extern short GetAsyncKeyState(int key);
 [DllImport("user32")] static extern bool GetPhysicalCursorPos(out Point point);
 static string KeyName(int key){if(key>=65&&key<=90)return ((char)key).ToString();if(key>=48&&key<=57)return ((char)key).ToString();if(key>=96&&key<=105)return (key-96).ToString();return key==32?"Space":null;}
 static void Record(int key,bool down,string button,int x,int y){string name=button==null?KeyName(key):null;if(button==null&&name==null)return;lock(gate){if(held[key]==down)return;held[key]=down;edges.Enqueue(new Edge{seq=++sequence,ms=clock.ElapsedMilliseconds,key=name,button=button,action=down?"press":"release",x=x,y=y});while(edges.Count>1024)edges.Dequeue();}}
 static IntPtr OnKey(int code,IntPtr w,IntPtr l){if(code>=0){int message=w.ToInt32();if(message==0x100||message==0x101||message==0x104||message==0x105){int key=Marshal.ReadInt32(l);if(key>=0&&key<256)Record(key,message==0x100||message==0x104,null,0,0);}}return CallNextHookEx(keyboardHook,code,w,l);}
 static void Poll(){Point point;GetPhysicalCursorPos(out point);for(int key=0;key<256;key++)if(KeyName(key)!=null||key==1||key==2)Record(key,(GetAsyncKeyState(key)&0x8000)!=0,key==1?"left":key==2?"right":null,point.x,point.y);}
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
 static IntPtr OnMouse(int code,IntPtr w,IntPtr l){if(code>=0){int message=w.ToInt32();string button=message==0x201||message==0x202?"left":message==0x204||message==0x205?"right":null;if(button!=null){var data=(MouseData)Marshal.PtrToStructure(l,typeof(MouseData));Record(button=="left"?1:2,message==0x201||message==0x204,button,data.point.x,data.point.y);}}return CallNextHookEx(hook,code,w,l);}
 public static void Start(){thread=new Thread(()=>{threadId=GetCurrentThreadId();hook=SetWindowsHookEx(14,callback,GetModuleHandle(null),0);keyboardHook=SetWindowsHookEx(13,keyCallback,GetModuleHandle(null),0);using(var timer=new System.Windows.Forms.Timer()){timer.Interval=16;timer.Tick+=(s,e)=>Poll();active=true;timer.Start();try{Application.Run();}finally{active=false;timer.Stop();if(hook!=IntPtr.Zero)UnhookWindowsHookEx(hook);if(keyboardHook!=IntPtr.Zero)UnhookWindowsHookEx(keyboardHook);hook=keyboardHook=IntPtr.Zero;}}});thread.IsBackground=true;thread.SetApartmentState(ApartmentState.STA);thread.Start();}
 public static void Stop(){if(threadId!=0)PostThreadMessage(threadId,0x12,IntPtr.Zero,IntPtr.Zero);if(thread!=null)thread.Join(1500);}
 public static object Snapshot(long after){lock(gate){return new {seq=sequence,available=active,keyboardAvailable=active,gap=edges.Count>0&&after>0&&after<edges.Peek().seq-1,events=Array.FindAll(edges.ToArray(),e=>e.seq>after)};}}
}

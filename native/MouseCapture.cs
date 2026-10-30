using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
static class MouseCapture {
 public class Edge { public long seq,ms; public string button,action; public int x,y; }
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
 static IntPtr OnMouse(int code,IntPtr w,IntPtr l){if(code>=0){int message=w.ToInt32();string button=message==0x201||message==0x202?"left":message==0x204||message==0x205?"right":null;if(button!=null){var data=(MouseData)Marshal.PtrToStructure(l,typeof(MouseData));lock(gate){edges.Enqueue(new Edge {seq=++sequence,ms=clock.ElapsedMilliseconds,button=button,action=message==0x201||message==0x204?"press":"release",x=data.point.x,y=data.point.y});while(edges.Count>1024)edges.Dequeue();}}}return CallNextHookEx(hook,code,w,l);}
 public static void Start(){thread=new Thread(()=>{threadId=GetCurrentThreadId();hook=SetWindowsHookEx(14,callback,GetModuleHandle(null),0);if(hook==IntPtr.Zero)return;try{Application.Run();}finally{UnhookWindowsHookEx(hook);hook=IntPtr.Zero;}});thread.IsBackground=true;thread.SetApartmentState(ApartmentState.STA);thread.Start();}
 public static void Stop(){if(threadId!=0)PostThreadMessage(threadId,0x12,IntPtr.Zero,IntPtr.Zero);if(thread!=null)thread.Join(1500);}
 public static object Snapshot(long after){lock(gate){return new {seq=sequence,available=hook!=IntPtr.Zero,gap=edges.Count>0&&after>0&&after<edges.Peek().seq-1,events=Array.FindAll(edges.ToArray(),e=>e.seq>after)};}}
}

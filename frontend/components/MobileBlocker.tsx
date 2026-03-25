"use client";

import { Monitor, Sparkles, MoveRight, Smartphone } from "lucide-react";

export function MobileBlocker() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0c] p-6 text-center text-white selection:bg-indigo-500/30">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 mb-10 flex items-center justify-center gap-6">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <Smartphone className="h-8 w-8 text-red-400" />
          <div className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold shadow-lg">
            ✕
          </div>
        </div>

        <MoveRight className="h-6 w-6 animate-pulse text-gray-500" />

        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-indigo-500/50 bg-[#121216] shadow-[0_0_30px_rgba(99,102,241,0.4)]">
          <Monitor className="h-10 w-10 text-indigo-400" />
          <Sparkles className="absolute -top-3 -right-3 h-6 w-6 animate-bounce text-fuchsia-400" />
        </div>
      </div>

      <div className="relative z-10 max-w-sm">
        <h1 className="mb-4 text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
          Canvas Too Big
        </h1>
        <p className="text-sm leading-relaxed text-gray-400">
          Building complex AI workflows requires serious screen real estate. Please switch to a desktop or tablet to access the node editor.
        </p>
      </div>
    </div>
  );
}
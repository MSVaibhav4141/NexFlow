"use client";

import { useState } from "react";
import { Sparkles, ArrowUp } from "lucide-react";

export function AiCommander() {
  const [prompt, setPrompt] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div 
        className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
          isFocused ? "border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] bg-[#121216]" : "border-white/10 bg-[#121216]/50"
        }`}
      >
        <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 transition-opacity duration-500" style={{ opacity: isFocused ? 1 : 0 }} />
        
        <div className="p-4 flex items-center gap-2 border-b border-white/5">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-medium text-indigo-300 tracking-wide uppercase">AI Builder</span>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Describe what you want to automate... e.g., 'When a new Stripe customer is created, send a Slack message and add them to Mailchimp.'"
          className="min-h-[140px] w-full resize-none bg-transparent px-5 py-4 text-base text-white placeholder:text-gray-600 focus:outline-none"
        />
        
        <div className="flex items-center justify-between px-4 pb-4">
          <span className="text-xs text-gray-500">
            Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans">Enter ↵</kbd> to build
          </span>
          <button
            disabled={!prompt.trim()}
            className="group flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white transition-all hover:bg-indigo-400 disabled:opacity-30 disabled:hover:bg-indigo-500"
          >
            <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
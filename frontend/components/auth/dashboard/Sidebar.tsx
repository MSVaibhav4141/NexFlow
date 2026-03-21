"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  FolderKanban, 
  Bot, 
  Blocks, 
  BarChart3, 
  Settings,
  Plus,
  Search,
  PanelLeftClose,
  Zap
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Workflows", href: "/workflows", icon: FolderKanban },
    { name: "AI Agents", href: "/ai-agents", icon: Bot, isNew: true },
  ];

  const bottomNavItems = [
    { name: "Templates", href: "/templates", icon: Blocks },
    { name: "Usage & Insights", href: "/insights", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-white/5 bg-[#0a0a0c]/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 text-white">
        <Link href="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-wide text-sm">AutomateX</span>
        </Link>
        <div className="flex items-center gap-1">
          <button className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
            <Search className="h-4 w-4" />
          </button>
          <button className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2">
        <button className="flex w-full items-center gap-2 rounded-lg bg-white/5 border border-white/5 px-3 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/10">
          <Plus className="h-4 w-4" />
          New Workflow
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm font-medium text-gray-400">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.name}
              </div>
              {item.isNew && (
                <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-indigo-300">
                  New
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <nav className="flex flex-col gap-1 border-t border-white/5 px-3 py-4 text-sm font-medium text-gray-400">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
            V
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Vaibhav</span>
            <span className="text-xs text-gray-500">Free Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
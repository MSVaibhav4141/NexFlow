import { Plus, LayoutTemplate, FileJson } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Start from scratch",
      description: "Build a custom workflow on a blank canvas.",
      icon: Plus,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      title: "Browse templates",
      description: "Use pre-built workflows for common tasks.",
      icon: LayoutTemplate,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
    {
      title: "Import workflow",
      description: "Upload a JSON file from another workspace.",
      icon: FileJson,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="mt-12 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-white">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {actions.map((action, i) => (
          <button
            key={i}
            className="group flex flex-col items-start rounded-xl border border-white/5 bg-[#121216]/50 p-5 text-left transition-all hover:border-white/10 hover:bg-[#121216]"
          >
            <div className={`mb-4 rounded-lg ${action.bg} p-2.5 transition-transform group-hover:scale-110`}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <h3 className="mb-1 text-sm font-medium text-white">{action.title}</h3>
            <p className="text-xs leading-relaxed text-gray-500">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
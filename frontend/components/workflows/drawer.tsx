import { Dispatch, SetStateAction, useState } from "react";
import { 
  Search, X, MousePointerClick, AppWindow, Clock, 
  Webhook, FileText, BotMessageSquare, Mail, Send, GitBranch
} from "lucide-react";

type DrawerProps = {
  isOpen: boolean;
  toggle: Dispatch<SetStateAction<boolean>>;
  onSelectNode: (nodeType: string, label: string) => void;
};

export function NodeSelectorDrawer({ isOpen, toggle, onSelectNode }: DrawerProps) {
  // Group the nodes so they look organized in the UI
  const NODE_GROUPS = [
    {
      label: "Triggers",
      nodes: [
        { id: "manual", type: "manualTrigger", title: "Trigger manually", description: "Runs the flow on clicking a button in n8n.", icon: MousePointerClick },
        { id: "webhook", type: "webhookTrigger", title: "On webhook call", description: "Runs the flow on receiving an HTTP request", icon: Webhook },
        { id: "form", type: "formTrigger", title: "On form submission", description: "Generate webforms in n8n", icon: FileText },
      ]
    },
    {
      label: "AI & Agents",
      nodes: [
        { 
          id: "ai-agent", 
          type: "agentAi", 
          title: "AI Agent", 
          description: "Autonomous agent that can use tools and memory to solve tasks.", 
          icon: BotMessageSquare 
        },
      ]
    },
    {
      label: "Actions",
      nodes: [
        { id: "email", type: "sendEmail", title: "Send Email", description: "Send an email via SMTP", icon: Mail },
        { id: "telegram", type: "sendTelegram", title: "Send TG Message", description: "Send message to a Telegram bot", icon: Send },
      ]
    },
    {
      label: "Logic",
      nodes: [
        { id: "ifelse", type: "ifElse", title: "If / Else", description: "Branch the flow based on a condition", icon: GitBranch },
      ]
    }
  ];

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={() => toggle(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full sm:w-[400px] flex-col border-l border-white/10 bg-[#0a0a0c] shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-white">Add Node</h2>
            <p className="text-sm text-gray-400">Select a step for your workflow</p>
          </div>
          <button 
            onClick={() => toggle(false)}
            className="rounded-md p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-[#121216] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {NODE_GROUPS.map((group) => {
            // Filter nodes in this group by search query
            const filtered = group.nodes.filter((node) => 
              node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              node.description.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filtered.length === 0) return null;

            return (
              <div key={group.label} className="mb-4">
                <h3 className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {group.label}
                </h3>
                {filtered.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      onSelectNode(node.type, node.title);
                      toggle(false);
                      setSearchQuery("");
                    }}
                    className="group relative flex w-full items-start gap-4 px-6 py-3 text-left transition-colors hover:bg-[#121216]"
                  >
                    <div className="absolute left-0 top-0 h-full w-[3px] bg-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    <node.icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-white" />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-white transition-colors group-hover:text-indigo-400">
                        {node.title}
                      </span>
                      <span className="text-xs leading-relaxed text-gray-400">
                        {node.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
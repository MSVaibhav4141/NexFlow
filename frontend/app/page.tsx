"use client";

import { useState, useCallback } from "react";
import { 
  ReactFlow, 
  Background, 
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  OnNodesChange,
  applyNodeChanges,
  OnEdgesChange,
  applyEdgeChanges
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  Zap, 
  BotMessageSquare, 
  Webhook, 
  Send, 
  Mail, 
  ArrowRight, 
  Github, 
  Play, 
  Layers, 
  ShieldCheck, 
  Cpu
} from "lucide-react";
import Link from "next/link";

const DemoNode = ({ data }: any) => {
  const Icon = data.icon;
  const status = data.status || 'idle'; 
  
  let dynamicClasses = "border-white/10";

  if (status === 'processing') {
    if (data.colorClass.includes('fuchsia')) {
      dynamicClasses = "border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.5)] animate-pulse-glow";
    } else {
      dynamicClasses = "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse";
    }
  } 
  else if (status === 'completed') {
    if (data.colorClass.includes('purple')) dynamicClasses = "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]";
    if (data.colorClass.includes('green')) dynamicClasses = "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
    if (data.colorClass.includes('blue')) dynamicClasses = "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]";
    if (data.colorClass.includes('sky')) dynamicClasses = "border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]";
    if (data.colorClass.includes('fuchsia')) dynamicClasses = "border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]";
    if (data.colorClass.includes('indigo')) dynamicClasses = "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]";
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-[#121216]/90 p-3 shadow-xl backdrop-blur-md transition-all duration-300 ${dynamicClasses}`}>
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${data.bgClass} ${data.colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col pr-2">
        <span className="text-xs font-bold text-white">{data.label}</span>
        <span className="text-[10px] text-gray-400">{data.sub}</span>
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
};

const nodeTypes = { demoNode: DemoNode };

const initialNodes: Node[] = [
  {
    id: "trigger",
    type: "demoNode",
    position: { x: 50, y: 150 },
    data: { label: "Webhook", sub: "Incoming Event", icon: Webhook, colorClass: "text-green-400", bgClass: "bg-green-500/10", glowClass: "" }
  },
  {
    id: "ai",
    type: "demoNode",
    position: { x: 300, y: 150 },
    data: { label: "AI Agent", sub: "Analyze Payload", icon: BotMessageSquare, colorClass: "text-fuchsia-400", bgClass: "bg-fuchsia-500/10", glowClass: "" }
  },
  {
    id: "tg",
    type: "demoNode",
    position: { x: 550, y: 80 },
    data: { label: "Telegram", sub: "Send Alert", icon: Send, colorClass: "text-sky-400", bgClass: "bg-sky-500/10", glowClass: "" }
  },
  {
    id: "email",
    type: "demoNode",
    position: { x: 550, y: 220 },
    data: { label: "Email", sub: "Wait for Approval", icon: Mail, colorClass: "text-indigo-400", bgClass: "bg-indigo-500/10", glowClass: "" }
  }
];

const defaultEdgeStyle = { stroke: '#3f3f46', strokeWidth: 2 };
const activeEdgeStyle = { 
  stroke: '#22c55e', 
  strokeWidth: 3,
  filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))'
};
const completedEdgeStyle = { 
  stroke: '#22c55e', 
  strokeWidth: 3,
  filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))'
};

const initialEdges: Edge[] = [
  { id: "e1", source: "trigger", target: "ai", style: defaultEdgeStyle, animated: false },
  { id: "e2", source: "ai", target: "tg", style: defaultEdgeStyle, animated: false },
  { id: "e3", source: "ai", target: "email", style: defaultEdgeStyle, animated: false },
];

export default function LandingPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isRunning, setIsRunning] = useState(false);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const runDemo = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    
    setEdges(initialEdges);
    setNodes(initialNodes.map(n => ({ ...n, data: { ...n.data, status: 'idle' } })));

    setTimeout(() => {
      setNodes(nds => nds.map(n => n.id === "trigger" ? { ...n, data: { ...n.data, status: 'completed' } } : n));
      setEdges(eds => eds.map(e => e.id === "e1" ? { ...e, animated: true, style: activeEdgeStyle } : e));
    }, 500);

    setTimeout(() => {
      setNodes(nds => nds.map(n => n.id === "ai" ? { ...n, data: { ...n.data, status: 'processing' } } : n));
    }, 1000);

    setTimeout(() => {
      setNodes(nds => nds.map(n => n.id === "ai" ? { ...n, data: { ...n.data, status: 'completed' } } : n));
      setEdges(eds => eds.map(e => {
        if (e.id === "e1") return { ...e, animated: false, style: completedEdgeStyle };
        if (["e2", "e3"].includes(e.id)) return { ...e, animated: true, style: activeEdgeStyle };
        return e;
      }));
    }, 2500);

    setTimeout(() => {
      setNodes(nds => nds.map(n => ["tg", "email"].includes(n.id) ? { ...n, data: { ...n.data, status: 'processing' } } : n));
    }, 3000);

    setTimeout(() => {
      setNodes(nds => nds.map(n => ["tg", "email"].includes(n.id) ? { ...n, data: { ...n.data, status: 'completed' } } : n));
      setEdges(eds => eds.map(e => ["e2", "e3"].includes(e.id) ? { ...e, animated: false, style: completedEdgeStyle } : e));
    }, 4500);

    setTimeout(() => {
      setIsRunning(false);
    }, 5000);
  }, [isRunning]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <Zap className="h-4 w-4 text-white" fill="currentColor" />
            </div>
            <span className="text-lg font-bold text-white tracking-wide">Nexus<span className="text-indigo-400">Flow</span></span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="rounded-md bg-white px-3 sm:px-4 py-2 text-sm font-bold text-black hover:bg-gray-200 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-16 sm:pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[300px] sm:h-[500px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 blur-[80px] sm:blur-[100px] rounded-full mix-blend-screen" />
        </div>

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-indigo-300">
              <SparklesIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Next-Gen AI Orchestration
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
              Automate the impossible with <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">AI Agents.</span>
            </h1>
            
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Drag, drop, and deploy stateful workflows. Connect Human-in-the-Loop approvals, logic branching, and autonomous AI agents in seconds.
            </p>

            <div className="flex items-center justify-center gap-4 pt-2 sm:pt-4">
              <Link href="/login" className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-bold text-white hover:bg-indigo-700 transition-all hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                Start Building Free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <section className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="relative rounded-2xl border border-white/10 bg-[#121216] shadow-2xl overflow-hidden group">
          
          <div className="flex items-center justify-between border-b border-white/5 bg-[#0a0a0c] px-3 sm:px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <button 
              onClick={runDemo}
              disabled={isRunning}
              className="flex items-center gap-2 rounded bg-green-500/20 px-3 py-1.5 text-xs font-bold text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 border border-green-500/30"
            >
              {isRunning ? <Play className="h-3 w-3 animate-pulse" /> : <Play className="h-3 w-3" />}
              {isRunning ? "Executing..." : "Run Workflow"}
            </button>
          </div>

          <div className="h-[350px] sm:h-[400px] w-full bg-[#0a0a0c] cursor-grab active:cursor-grabbing">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange} 
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              zoomOnScroll={false}
              panOnDrag={false}
              colorMode="dark"
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#ffffff10" />
            </ReactFlow>
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#121216]/80 border border-white/10 backdrop-blur-md px-4 py-2 text-[10px] sm:text-xs text-gray-400 pointer-events-none whitespace-nowrap">
            Interact with the nodes or click <span className="text-green-400 font-bold">Run Workflow</span>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-[#121216]/50 py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-[#0a0a0c] p-6 sm:p-8">
              <div className="mb-4 inline-flex rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Visual DFS Engine</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Powered by a robust backend execution engine that handles complex branching, infinite loops, and strict state management natively.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#0a0a0c] p-6 sm:p-8">
              <div className="mb-4 inline-flex rounded-lg bg-fuchsia-500/10 p-3 text-fuchsia-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Human-in-the-Loop</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Pause entire workflows instantly. Send dynamic Telegram or Email approvals, and resume execution synchronously via secure Webhooks.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#0a0a0c] p-6 sm:p-8">
              <div className="mb-4 inline-flex rounded-lg bg-green-500/10 p-3 text-green-400">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Universal Triggers</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Trigger workflows via external REST APIs, dynamic frontend forms, or manual execution with real-time WebSocket feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex min-h-[20vh] flex-col items-center justify-center border-t border-white/10 bg-[#0a0a0c] py-10 px-4 sm:px-6 text-center">
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-white uppercase opacity-80">
            Build The Future.
          </h2>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs sm:text-sm font-medium text-gray-500">
              Made by <span className="text-gray-300">Vaibhavms</span>
            </p>
            <a 
              href="https://github.com/msvaibhav4141" 
              target="_blank" 
              rel="noreferrer"
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-[#121216] px-4 py-1.5 text-xs text-gray-400 transition-colors hover:border-indigo-500/50 hover:text-indigo-400"
            >
              <Github className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:scale-110" />
              github.com/msvaibhav4141
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
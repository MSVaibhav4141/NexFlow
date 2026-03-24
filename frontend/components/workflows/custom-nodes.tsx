import { Handle, Position, useHandleConnections, type NodeProps, useReactFlow } from "@xyflow/react";
import { MousePointerClick, Webhook, FileText, Plus, Play, Trash2, GitBranch, Mail, Send,BotMessageSquare } from "lucide-react";
import { Dispatch, SetStateAction, useContext } from "react";
import { WorkflowContext } from "../../app/(main)/workflows/[id]/workflowContext";
import { useWorkflowStore } from "@/store/useWorkflowStore";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
// Adjust this import path to match your actual WorkflowContext location
// --- THE TRIGGER NODE BASE ---
function BaseTriggerNode({ data, selected, icon: Icon, colorClass, bgClass, borderColorClass }: any) {
  const { openDrawer, openSettings } = useContext(WorkflowContext);
  const { deleteElements } = useReactFlow();
  const sourceConnections = useHandleConnections({ type: "source" });
  const isConnected = sourceConnections.length > 0;

  // 1. Grab the execution status from Zustand
  const status = useWorkflowStore((state) => state.nodeStatuses[data.id]);

  // 2. Determine glowing border classes
  let statusClasses = selected ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "border-white/10";
  if (status === 'running') {
    statusClasses = "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]";
  } else if (status === 'success') {
    statusClasses = "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
  } else if (status === 'failed') {
    statusClasses = "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id: data.id }] });
  };

  const handleExecute = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Executing specific node:", data.id);
  };

  
  return (
    <div 
      onClick={() => openSettings(data.id)}
      className={`group relative flex min-w-[260px] cursor-pointer items-center gap-4 rounded-xl border bg-[#121216] p-4 transition-all duration-300 hover:bg-[#1a1a20] ${statusClasses} border-l-4 ${borderColorClass}`} 
    >
      {/* --- FLOATING STATUS ICON --- */}
      <div className="absolute -top-3 -right-3 z-10 transition-all duration-300">
        {status === 'running' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
        )}
        {status === 'failed' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
        )}
      </div>

      {/* --- HOVER ACTION BAR --- */}
      <div className="absolute -top-12 right-0 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button onClick={handleExecute} className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[#121216] text-gray-400 shadow-lg transition-colors hover:border-green-500 hover:text-green-400">
          <Play className="h-4 w-4" />
        </button>
        <button onClick={handleDelete} className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[#121216] text-gray-400 shadow-lg transition-colors hover:border-red-500 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Dynamic Icon */}
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgClass} ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white">{data.label as string}</span>
        <span className="text-xs text-gray-400 truncate max-w-[150px]">{data.description as string}</span>
      </div>

      <Handle type="source" position={Position.Right} className="z-1 h-4 w-4 border-4 border-[#121216] bg-indigo-400" />

      {/* Quick Add Button */}
        <div className="absolute z-0 -right-10 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="h-0.5 w-4 bg-indigo-500/50" />
          <button 
            onClick={(e) => { e.stopPropagation(); openDrawer(data.id); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-transform hover:scale-110"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
    
    </div>
  );
}

// Export the specific Triggers with their unique colors
export function ManualTriggerNode(props: NodeProps) {
  return <BaseTriggerNode {...props} icon={MousePointerClick} colorClass="text-purple-400" bgClass="bg-purple-500/10" borderColorClass="border-l-purple-500" />;
}

export function WebhookTriggerNode(props: NodeProps) {
  return <BaseTriggerNode {...props} icon={Webhook} colorClass="text-green-400" bgClass="bg-green-500/10" borderColorClass="border-l-green-500" />;
}

export function FormTriggerNode(props: NodeProps) {
  return <BaseTriggerNode {...props} icon={FileText} colorClass="text-blue-400" bgClass="bg-blue-500/10" borderColorClass="border-l-blue-500" />;
}
              
function BaseActionNode({ data, selected, icon: Icon, colorClass, bgClass }: any) {
  const { openDrawer, openSettings } = useContext(WorkflowContext);
  const { deleteElements } = useReactFlow();
  const sourceConnections = useHandleConnections({ type: "source" });

  // 1. Grab the execution status from Zustand
  const status = useWorkflowStore((state) => state.nodeStatuses[data.id]);

  // 2. Determine glowing border classes
  console.log(status)
  let statusClasses = selected ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "border-white/10";
  if (status === 'running') {
    statusClasses = "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]";
  } else if (status === 'ai-running') {
    statusClasses = "border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.6)] bg-fuchsia-500/5";
  }else if (status === 'paused') {
    statusClasses = "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-pulse";
  }else if (status === 'success') {
    statusClasses = "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
  } else if (status === 'failed') {
    statusClasses = "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id: data.id }] });
  };

  const handleExecute = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Executing specific node:", data.id);
  };

  return (
    <div 
      onClick={() => openSettings(data.id)}
      className={`group relative flex min-w-[260px] cursor-pointer items-center gap-4 rounded-xl border bg-[#121216] p-4 transition-all duration-300 hover:bg-[#1a1a20] ${statusClasses}`} 
    >
      {/* --- FLOATING STATUS ICON --- */}
      <div className="absolute -top-3 -right-3 z-10 transition-all duration-300">
        {status === 'running' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
        )}
        {status === 'failed' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
        )}
      </div>

      {/* Target Handle (Input) */}
      <Handle type="target" position={Position.Left} className="h-4 w-4 border-4 border-[#121216] bg-gray-400" />

      {/* Hover Action Bar */}
      <div className="absolute -top-12 right-0 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button onClick={handleExecute} className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[#121216] text-gray-400 shadow-lg transition-colors hover:border-green-500 hover:text-green-400">
          <Play className="h-4 w-4" />
        </button>
        <button onClick={handleDelete} className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[#121216] text-gray-400 shadow-lg transition-colors hover:border-red-500 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Dynamic Icon */}
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgClass} ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white">{data.label as string}</span>
        <span className="text-xs text-gray-400 truncate max-w-[150px]">{data.description as string || "Action Step"}</span>
      </div>

      {/* Source Handle (Output) */}
      <Handle type="source" position={Position.Right} className="h-4 w-4 border-4 border-[#121216] bg-indigo-400" />

      {/* Quick Add Button */}
        <div className="absolute -right-10 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="h-0.5 w-4 bg-indigo-500/50" />
          <button 
            onClick={(e) => { e.stopPropagation(); openDrawer(data.id); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-transform hover:scale-110"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
    
    </div>
  );
}

// --- THE LOGIC NODE (If / Else) ---
export function IfElseNode({ id, data, selected }: NodeProps) {
  const { openSettings, openDrawer } = useContext(WorkflowContext);
  const { deleteElements } = useReactFlow();

  const connectionsTrue = useHandleConnections({ type:"source", id:"true" });
  const connectionsFalse = useHandleConnections({ type:"source", id:"false" });
 

  // 1. Grab the execution status from Zustand
  const status = useWorkflowStore((state) => state.nodeStatuses[id]);

  // 2. Determine glowing border classes
  let statusClasses = selected ? "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]" : "border-white/10";
  if (status === 'running') {
    statusClasses = "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]";
  } else if (status === 'success') {
    statusClasses = "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
  } else if (status === 'failed') {
    statusClasses = "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div 
      onClick={() => openSettings(id)}
      className={`group relative flex min-w-[220px] cursor-pointer flex-col rounded-xl border bg-[#121216] p-0 transition-all duration-300 hover:bg-[#1a1a20] ${statusClasses}`}
    >
      {/* --- FLOATING STATUS ICON --- */}
      <div className="absolute -top-3 -right-3 z-10 transition-all duration-300">
        {status === 'running' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
        )}
        {status === 'failed' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
        )}
      </div>

      {/* Target Handle (Input) */}
      <Handle type="target" position={Position.Left} className="h-3 w-3 border-2 border-[#121216] bg-gray-400" />

      {/* Hover Action Bar */}
      <div className="absolute -top-10 right-0 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button onClick={handleDelete} className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#121216] text-gray-400 shadow-lg hover:border-red-500 hover:text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Header Section */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
          <GitBranch className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold text-white">If / Else</span>
      </div>

      {/* Branches Section */}
      <div className="flex flex-col py-2">
        {/* TRUE BRANCH */}
        <div className="relative flex items-center justify-between px-4 py-3">
              <div className="absolute -right-10 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="h-0.5 w-4 bg-orange-500/30" />
          <button 
            onClick={(e) => { e.stopPropagation(); openDrawer(id,"true"); }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-transform hover:scale-110"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>  
          <span className="text-[11px] font-bold tracking-widest text-green-500 uppercase">True</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            id="true" 
            className="h-3 w-3 border-2 border-[#121216] bg-green-500 !right-[-6px]" 
          />
        </div>

        {/* FALSE BRANCH */}
        <div className="relative flex items-center justify-between px-4 py-3 border-t border-white/5">
            <div className="absolute -right-10 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="h-0.5 w-4 bg-orange-500/30" />
          <button 
            onClick={(e) => { e.stopPropagation(); openDrawer(id, "false"); }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-transform hover:scale-110"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
    
          <span className="text-[11px] font-bold tracking-widest text-red-500 uppercase">False</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            id="false" 
            className="h-3 w-3 border-2 border-[#121216] bg-red-500 !right-[-6px]" 
          />
        </div>
      </div>
    </div>
  );
}
              
export function StartNode({data, selected}: NodeProps) {
  const toggleDrawer = data.setIsDrawerOpen as Dispatch<SetStateAction<boolean>>
  return (
      <button onClick={() => toggleDrawer(prev => !prev)}>
      <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-[#121216]/50 transition-all group-hover:border-indigo-400 group-hover:bg-indigo-500/10 shadow-lg">
              <Plus className="text-gray-200/40 w-10 h-10 "></Plus>
          </div>
          <div className="text-white mt-2">Add first step..</div>
      </button>
  )
}

export function SendEmailNode(props: NodeProps) {
  return <BaseActionNode {...props} icon={Mail} colorClass="text-indigo-400" bgClass="bg-indigo-500/10" />;
}

export function SendTelegramNode(props: NodeProps) {
  return <BaseActionNode {...props} icon={Send} colorClass="text-sky-400" bgClass="bg-sky-500/10" />;
}


export function AIAgentNode({ id, data, selected }: NodeProps) {
  const { openDrawer, openSettings } = useContext(WorkflowContext);
  
  // 1. Trace Connections to decide whether to show the "+" buttons

  const connectionsModel = useHandleConnections({ type:"source", id:"chatModel" });
  const isConnectedModel = connectionsModel.length > 0;
  
  const connectionsMemory = useHandleConnections({ type:"source", id:"memory" });
  const isConnectedMemory = connectionsMemory.length > 0;
  

  // 2. Grab the execution status from Zustand
  const status = useWorkflowStore((state) => state.nodeStatuses[id]);

  // Determine border glow classes based on status (Idle, Running, Success, Failed)
  let statusClasses = selected ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "border-white/10";
  
  if (status === 'running') {
    statusClasses = "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]";
  } else if (status === 'ai-running') {
    statusClasses = "border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.6)] bg-fuchsia-500/5";
  }else if (status === 'success') {
    statusClasses = "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
  } else if (status === 'failed') {
    statusClasses = "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
  }

  return (
    <div 
      onClick={() => openSettings(id)}
      className={`group relative flex min-w-[220px] cursor-pointer flex-col rounded-xl border bg-[#121216] p-0 transition-all duration-300 hover:bg-[#1a1a20] ${statusClasses}`}
    >
      
      {/* THE FLOATING STATUS ICON (Top Right) */}
      <div className="absolute -top-3 -right-3 z-10 transition-all duration-300">
        {status === 'running' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
        )}
        {status === 'failed' && (
          <div className="bg-[#121216] rounded-full p-0.5 shadow-lg">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
        )}
      </div>

      {/* Main Content Handle (Input) */}
      <Handle type="target" position={Position.Left} className="h-3 w-3 border-2 border-[#121216] bg-gray-400 !left-[-6px]" />

      {/* Main Body (Bot Icon + Text + LIVE STATUS) */}
      <div className="flex flex-col p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <BotMessageSquare className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-white">AI Agent</span>
        </div>

        {status === 'running' && data.liveStatus as string && (
          <div className="mt-3 text-[11px] font-mono text-blue-400 bg-blue-500/10 p-2 rounded-md border border-blue-500/20">
             <span className="animate-pulse mr-1">▶</span> {data.liveStatus as string}
          </div>
        )}
      </div>

      {/* Main Content Handle (Output) */}
      <div className="relative p-0 border-t border-white/5">
        <Handle 
          type="source" 
          position={Position.Right} 
          className="h-3 w-3 border-2 border-[#121216] bg-indigo-400 !right-[-6px]" 
        />
        
        {/* Quick Add Button */}
          <div className="absolute -right-10 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="h-0.5 w-4 bg-indigo-500/30" />
            <button 
              onClick={(e) => { e.stopPropagation(); openDrawer(id); }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg transition-transform hover:scale-110"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
      
      </div>

      {/* THE BOTTOM HANDLES SECTION */}
      <div className="flex flex-row py-2 border-t border-white/5 bg-[#121216]/20 rounded-b-xl">
        
        {/* CHAT MODEL* BRANCH */}
        <div className="relative flex items-center justify-between px-4 py-2">
          {!isConnectedModel && (
            <div className="absolute -bottom-13 left-1/2 flex flex-col -translate-x-1/2 justify-center items-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="h-7 w-0.5 bg-orange-500/30" />
              <button 
                onClick={(e) => { e.stopPropagation(); openDrawer(id, "chatModel"); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-transform hover:scale-110"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>  
          )}
          <span className="text-[10px] font-bold uppercase text-gray-400">Chat Model<span className="text-red-500">*</span></span>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="chatModel" 
            className="h-3 w-3 border-2 border-[#121216] bg-orange-400 !right-[-6px]" 
          />
        </div>

        {/* MEMORY BRANCH */}
        <div className="relative flex col-flex items-center justify-between px-4 py-2 border-t border-white/5">
          {!isConnectedMemory && (
            <div className="absolute -bottom-13 left-1/2 flex flex-col -translate-x-1/2 justify-center items-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="h-7 w-0.5 bg-purple-500/30" />
              <button 
                onClick={(e) => { e.stopPropagation(); openDrawer(id, "memory"); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg transition-transform hover:scale-110"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
          <span className="text-[10px] font-bold uppercase text-gray-400">Memory</span>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="memory" 
            className="h-3 w-3 border-2 border-[#121216] bg-purple-400 !right-[-6px]" 
          />
        </div>

        {/* TOOL BRANCH */}
        <div className="relative flex items-center justify-between px-4 py-2 border-t border-white/5">
            <div className="absolute -bottom-13 left-1/2 flex flex-col -translate-x-1/2 justify-center items-center opacity-0 transition-opacity group-hover:opacity-100">
               <div className="h-7 w-0.5 bg-green-500/30" />
              <button 
                onClick={(e) => { e.stopPropagation(); openDrawer(id, "tool"); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          
          <span className="text-[10px] font-bold uppercase text-gray-400">Tool</span>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="tool" 
            className="h-3 w-3 border-2 border-[#121216] bg-green-400 !right-[-6px]" 
          />
        </div>

      </div>

    </div>
  );
}
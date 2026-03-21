import { X, Play, Database, Settings2, Zap, GitBranch, Loader2, Info } from "lucide-react";
import { type Node } from "@xyflow/react";
import { useExecution } from "@/hooks/useExecution"; // Adjust your import path
import { useWorkflowStore } from "@/store/useWorkflowStore";
type EditorProps = {
  isOpen: boolean;
  onClose: () => void;
  activeNode: Node | null;
  updateNodeData: (nodeId: string, newData: any) => void;
  nodeOutputs: Record<string, any>; 
  isRunning: boolean;
  startExecution: (workflowId: string, nodeId: string) => void;
};
export function NodeEditorModal({ isOpen, onClose, activeNode, updateNodeData,nodeOutputs,isRunning,startExecution }: EditorProps) {
   const allNodes = useWorkflowStore((state) => state.nodes);
  const allEdges = useWorkflowStore((state) => state.edges);
  const wokrflowId = useWorkflowStore((state) => state.workflowId)
  if (!activeNode || !isOpen) return null;
const getUpstreamNodes = () => {
    const upstreamNodes: Node[] = [];
    const queue = [activeNode.id];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift();
      
      // Find all wires that point TO the current node
      const incomingEdges = allEdges.filter((edge) => edge.target === currentId);
      
      for (const edge of incomingEdges) {
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push(edge.source); // Queue it up to find its parents too!
          
          const sourceNode = allNodes.find((n) => n.id === edge.source);
          if (sourceNode) {
            upstreamNodes.push(sourceNode);
          }
        }
      }}
    
    return upstreamNodes;
  };

  const upstreamNodes = getUpstreamNodes();
  const handleConfigChange = (key: string, value: any) => {
    const currentData = activeNode.data || {};
    const currentConfig = (currentData.config as any) || {};
    updateNodeData(activeNode.id, {
      ...currentData,
      config: { ...currentConfig, [key]: value }
    });
  };

  // 1. Allows the browser to accept the dropped item
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 2. Extracts the dragged variable and inserts it where the cursor is!
  const handleDropOnInput = (e: React.DragEvent<HTMLInputElement | HTMLTextAreaElement>, key: string) => {
    e.preventDefault();
    const draggedVariable = e.dataTransfer.getData("text/plain");
    if (!draggedVariable) return;

    const currentVal = (config[key] as string) || "";
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    
    // Find where the user dropped it based on cursor selection
    const start = target.selectionStart ?? currentVal.length;
    const end = target.selectionEnd ?? currentVal.length;
    
    // Insert the variable into the existing text
    const newVal = currentVal.slice(0, start) + draggedVariable + currentVal.slice(end);
    handleConfigChange(key, newVal);
  };
  const config = (activeNode.data?.config as any) || {};
  const currentNodeOutput = nodeOutputs[activeNode.id];
  const isSubAgent = activeNode.type === "agentAi" && allEdges.some(
    (edge) => edge.target === activeNode.id && edge.sourceHandle === 'tool'
  );
  // Helper to render JSON as a list of draggable variables
  const renderDraggableData = (data: any, nodeId: string, path = ""): React.ReactNode => {
    if (typeof data !== "object" || data === null) return null;

    return (
      <div className="flex flex-col gap-1 mt-1 font-mono text-[10px]">
        {Object.entries(data).map(([key, val]) => {
          const currentPath = path ? `${path}.${key}` : key;
          const templateStr = `{{${nodeId}.${currentPath}}}`; // e.g. {{node_1.email}}

          return (
            <div key={currentPath} className="flex flex-col ml-3 border-l border-white/5 pl-2">
              <div 
                draggable 
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", templateStr);
                }}
                className="flex items-start cursor-grab active:cursor-grabbing hover:bg-white/10 p-1.5 rounded transition-colors group"
                title={`Drag to input field`}
              >
                {/* The drag handle icon */}
                <span className="text-gray-600 mr-2 group-hover:text-white transition-colors">⠿</span>
                <span className="text-orange-400 font-bold mr-2">{key}:</span>
                
                {typeof val !== "object" || val === null ? (
                  <span className="text-green-400 truncate">{String(val)}</span>
                ) : (
                  <span className="text-gray-500">{Array.isArray(val) ? '[ Array ]' : '{ Object }'}</span>
                )}
              </div>
              
              {/* Recursively render nested objects */}
              {(typeof val === "object" && val !== null) && renderDraggableData(val, nodeId, currentPath)}
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-8">
      <div className="flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] shadow-2xl">
        
        {/* TOP HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#121216]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-500/20 text-indigo-400">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {activeNode.data.label as string}
              </h2>
              <p className="text-xs text-gray-500">Node ID: {activeNode.id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={() => {
                    if(!wokrflowId){
                        alert("No workflow Id set")
                        return
                    }
                    startExecution(wokrflowId, activeNode.id)
                }}
                disabled={isRunning}
                className="flex items-center gap-2 rounded-md bg-orange-600 px-4 py-1.5 text-xs font-bold text-white transition-hover hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} 
                {isRunning ? "Running..." : "Execute Step"}
             </button>
             <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-white/10 hover:text-white">
               <X className="h-5 w-5" />
             </button>
          </div>
        </div>

        {/* THREE-COLUMN LAYOUT */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT: Input Data / Mapping */}
          <div className="hidden w-72 flex-col border-r border-white/5 bg-[#0d0d0f] lg:flex">
           <div className="flex flex-col border-b border-white/5 bg-[#121216]/30 p-4">
  {/* SECTION TITLE */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Database className="h-3 w-3 text-gray-500" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Input Data
      </span>
    </div>
    {/* Optional: A tiny status indicator or info icon */}
    <Info className="h-3 w-3 text-gray-700" />
  </div>

  {/* THE "ENGRAVED" HINT BOX */}
  <div className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-2 group hover:border-indigo-500/40 transition-colors">
    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
      <Zap className="h-2.5 w-2.5 text-indigo-400 animate-pulse" />
    </div>
    <p className="text-[9px] font-medium leading-tight text-indigo-300/80">
      Drag & drop properties into any input field to map data dynamically.
    </p>
  </div>
</div>
            
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
              {upstreamNodes.length === 0 ? (
                <div className="text-center text-xs text-gray-500 mt-10">
                  No previous steps connected.
                </div>
              ) : (
                upstreamNodes.map((upNode) => {
                  // Check if this specific previous node has data from our WebSocket!
                  const outData = nodeOutputs[upNode.id];

                  return (
                    <div key={upNode.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Database className="h-3 w-3 text-indigo-400" /> 
                        {upNode.data?.label as string || upNode.type}
                      </div>
                      
                     {outData ? (
                        <div className="ml-5 rounded-md bg-[#121216] border border-white/5 py-2 overflow-x-auto">
                          {/* Use our new draggable renderer instead of JSON.stringify */}
                          {renderDraggableData(outData, upNode.id)}
                        </div>
                      ) :(
                        // If it HAS NOT run yet, tell the user to execute it
                        <div className="ml-5 rounded-md border border-dashed border-white/10 p-3 text-center">
                          <p className="text-[10px] text-gray-500">
                            Run this step to see its output data.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CENTER: Parameters (The Form) */}
          <div className="flex flex-1 flex-col bg-[#0a0a0c]">
            <div className="p-4 border-b border-white/5 flex gap-6">
               <span className="text-xs font-bold text-orange-500 border-b-2 border-orange-500 pb-4 -mb-4">Parameters</span>
               <span className="text-xs font-bold text-gray-500 pb-4 -mb-4">Settings</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* --- SEND EMAIL NODE --- */}
{activeNode.type === "sendEmail" && (
  <div className="max-w-xl space-y-6">
    
    {/* 1. Operation Selection */}
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400 uppercase">Operation</label>
      <select 
        value={config.operation || "sendOnly"}
        onChange={(e) => handleConfigChange("operation", e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500"
      >
        <option value="sendOnly">Just Send Email</option>
        <option value="sendAndWait">Send and Wait for Response</option>
      </select>
    </div>

    {/* 2. Standard Email Fields */}
    <div className="space-y-4 border-t border-white/5 pt-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          To Email <span className="text-red-500">*</span>
        </label>
        <input 
          className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white placeholder:text-gray-600"
          placeholder="info@example.com or {{node_1.email}}"
          value={config.toEmail || ""}
          onChange={(e) => handleConfigChange("toEmail", e.target.value)}
          onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          Subject <span className="text-red-500">*</span>
        </label>
        <input 
          className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white placeholder:text-gray-600"
          placeholder="e.g. Action Required"
          value={config.subject || ""}
          onChange={(e) => handleConfigChange("subject", e.target.value)}
          onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
        />
      </div>
    </div>

    {/* 3. Conditional Fields based on "Operation" */}
    
    {/* If 'Send and Wait' -> Show Response Type */}
    {config.operation === "sendAndWait" && (
      <div className="space-y-2 border-t border-white/5 pt-6">
        <label className="text-xs font-bold text-orange-400 uppercase">Wait Condition</label>
        <select 
          value={config.responseType || "approval"}
          onChange={(e) => handleConfigChange("responseType", e.target.value)}
          className="w-full rounded-lg border border-orange-500/30 bg-[#121216] px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-orange-500"
        >
          <option value="approval">Approval (Yes / No Links)</option>
          <option value="form">Form (User submits custom text)</option>
        </select>
        <p className="text-[10px] text-gray-500 mt-1">
          Workflow will pause until the recipient interacts with the email.
        </p>
      </div>
    )}

    {/* If 'Just Send' -> Show Format Toggle */}
    {(!config.operation || config.operation === "sendOnly") && (
      <div className="space-y-2 border-t border-white/5 pt-6">
        <label className="text-xs font-bold text-gray-400 uppercase">Email Format</label>
        <select 
          value={config.emailFormat || "text"}
          onChange={(e) => handleConfigChange("emailFormat", e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500"
        >
          <option value="text">Plain Text</option>
          <option value="html">HTML</option>
        </select>
      </div>
    )}

    {/* 4. The Message Body */}
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400 uppercase">
        {config.emailFormat === "html" ? "HTML Body" : "Message"}
      </label>
      <textarea 
        rows={6}
        className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white resize-y font-mono placeholder:text-gray-600"
        placeholder={config.emailFormat === "html" ? "<h1>Hello {{node_1.name}}</h1>" : "Hello {{node_1.name}},\n\nHere is your update..."}
        value={config.message || ""}
        onChange={(e) => handleConfigChange("message", e.target.value)}
      />
    </div>

  </div>
)}
{/* --- SEND TELEGRAM NODE --- */}
          {activeNode.type === "sendTelegram" && (
            <div className="max-w-xl space-y-6">
              
              {/* 1. Operation Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Operation</label>
                <select 
                  value={config.operation || "sendOnly"}
                  onChange={(e) => handleConfigChange("operation", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="sendOnly">Send Message</option>
                  <option value="sendAndWait">Send and Wait for Response (Buttons)</option>
                </select>
              </div>

              {/* 2. Core Fields */}
              <div className="space-y-4 border-t border-white/5 pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                      Chat ID <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input 
                    className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:ring-1 focus:ring-sky-500"
                    placeholder="e.g. 123456789 or {{node_1.chatId}}"
                    value={config.chatId || ""}
                    onChange={(e) => handleConfigChange("chatId", e.target.value)}
                    onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
                  />
                  <p className="text-[10px] text-gray-500">
                    The unique identifier for the target chat. Usually mapped from a previous trigger.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                    Message Text <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    rows={5}
                    className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white resize-y font-mono placeholder:text-gray-600 focus:ring-1 focus:ring-sky-500"
                    placeholder="Hello! Your workflow has reached this step."
                    value={config.message || ""}
                    onChange={(e) => handleConfigChange("message", e.target.value)}
                  />
                </div>
              </div>

              {/* 3. Send and Wait Options */}
              {config.operation === "sendAndWait" && (
                <div className="space-y-4 border-t border-white/5 pt-6">
                  <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
                    <p className="text-[11px] text-sky-400">
                      This will attach "Approve" and "Reject" inline buttons to your Telegram message. The workflow will pause until the user taps one.
                    </p>
                  </div>
                  
                  {/* We can add custom button labels here to keep it premium */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-green-500 uppercase">Approve Button Text</label>
                      <input 
                        className="w-full rounded-md border border-white/10 bg-[#121216] px-3 py-2 text-sm text-white"
                        placeholder="Approve"
                        value={config.approveText || "Approve"}
                        onChange={(e) => handleConfigChange("approveText", e.target.value)}
                        onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-red-500 uppercase">Reject Button Text</label>
                      <input 
                        className="w-full rounded-md border border-white/10 bg-[#121216] px-3 py-2 text-sm text-white"
                        placeholder="Reject"
                        value={config.rejectText || "Reject"}
                        onChange={(e) => handleConfigChange("rejectText", e.target.value)}
                        onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
          {activeNode.type === "ifElse" && (
            <div className="max-w-xl space-y-6">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                <GitBranch className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-orange-400">Branching Logic</h4>
                  <p className="text-[11px] text-orange-300/70">
                    If the condition evaluates to True, the workflow will follow the top wire. Otherwise, it follows the bottom wire.
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-6">
                <label className="text-xs font-bold text-gray-400 uppercase">Condition Builder</label>
                
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-white/10 bg-[#121216]/50">
                  
                  {/* Value 1 (Usually a variable) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Value 1</label>
                    <input 
                      className="w-full rounded-md border border-white/10 bg-[#0a0a0c] px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 font-mono"
                      placeholder="e.g. {{node_1.age}}"
                      value={config.value1 || ""}
                      onChange={(e) => handleConfigChange("value1", e.target.value)}
                      onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
                    />
                  </div>

                  {/* Operator */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Operator</label>
                    <select 
                      value={config.operator || "equals"}
                      onChange={(e) => handleConfigChange("operator", e.target.value)}
                      className="w-full rounded-md border border-white/10 bg-[#0a0a0c] px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="equals">Equals (==)</option>
                      <option value="not_equals">Does Not Equal (!=)</option>
                      <option value="greater_than">Greater Than (&gt;)</option>
                      <option value="less_than">Less Than (&lt;)</option>
                      <option value="contains">Contains (Text)</option>
                    </select>
                  </div>

                  {/* Value 2 (Usually a static number or string) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Value 2</label>
                    <input 
                      className="w-full rounded-md border border-white/10 bg-[#0a0a0c] px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 font-mono"
                      placeholder="e.g. 18 or admin"
                      value={config.value2 || ""}
                      onChange={(e) => handleConfigChange("value2", e.target.value)}
                      onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
                    />
                  </div>
                  
                </div>
              </div>
            </div>
          )}
               {/* Webhook Form */}
               {activeNode.type === "webhookTrigger" && (
                 <div className="max-w-xl space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">HTTP Method</label>
                      <select 
                        value={config.method || "POST"}
                        onChange={(e) => handleConfigChange("method", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                      >
                        <option>GET</option>
                        <option>POST</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Webhook Path</label>
                      <input 
                        className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white placeholder:text-gray-600"
                        placeholder="/api/v1/trigger"
                        value={config.path || ""}
                        onChange={(e) => handleConfigChange("path", e.target.value)}
                        onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
                      />
                    </div>
                 </div>
               )}

               {/* Form Trigger (Based on your image) */}
               {activeNode.type === "formTrigger" && (
  <div className="max-w-xl space-y-6">
    <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-[11px] text-indigo-300">
      Test URL: https://n8n.clone/form-test/{activeNode.id}
    </div>

    {/* Basic Info */}
    <div className="space-y-4 border-b border-white/5 pb-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase">Form Title</label>
        <input 
          className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white"
          placeholder="e.g. Contact Us"
          value={config.formTitle || ""}
          onChange={(e) => handleConfigChange("formTitle", e.target.value)}
          onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase">Form Description</label>
        <textarea 
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white resize-none"
          placeholder="e.g. We'll get back to you soon"
          value={config.formDescription || ""}
          onChange={(e) => handleConfigChange("formDescription", e.target.value)}
        />
      </div>
    </div>

    {/* Dynamic Form Elements Section */}
    <div className="space-y-4">
      <label className="text-xs font-bold text-gray-400 uppercase">Form Elements</label>
      
      <div className="space-y-4">
        {config.formElements?.map((element: any, index: number) => (
          <div key={index} className="relative p-4 rounded-xl border border-white/10 bg-[#121216]/50 space-y-4">
            {/* Field Label */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Label</label>
              <input 
                className="w-full rounded-md border border-white/10 bg-[#0a0a0c] px-3 py-2 text-sm text-white"
                placeholder="e.g. What is your name?"
                value={element.label || ""}
                onChange={(e) => {
                  const newElements = [...config.formElements];
                  newElements[index].label = e.target.value;
                  handleConfigChange("formElements", newElements);
                }}
                onDrop={(e) => handleDropOnInput(e, "toEmail")}
          onDragOver={handleDragOver}
              />
            </div>

            {/* Element Type Select */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Element Type</label>
              <select 
                className="w-full rounded-md border border-white/10 bg-[#0a0a0c] px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                value={element.type || "text"}
                onChange={(e) => {
                  const newElements = [...config.formElements];
                  newElements[index].type = e.target.value;
                  handleConfigChange("formElements", newElements);
                }}
              >
                <option value="text">Text Input</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="textarea">Multi-line Text</option>
              </select>
            </div>

            {/* Delete Element Button */}
            <button 
              onClick={() => {
                const newElements = config.formElements.filter((_: any, i: number) => i !== index);
                handleConfigChange("formElements", newElements);
              }}
              className="absolute top-2 right-2 text-gray-600 hover:text-red-400 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={() => {
          const currentElements = config.formElements || [];
          handleConfigChange("formElements", [...currentElements, { label: "", type: "text" }]);
        }}
        className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
      >
        Add Form Element
      </button>
    </div>
  </div>
)}  
{/* --- AI AGENT NODE --- */}
                {activeNode.type === "agentAi" && (
                  <div className="max-w-xl space-y-6">
                    
                    <div className="flex items-start gap-3 rounded-md border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-300">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Configure your AI Agent here. It will use the Chat Model you connect, 
                        and can access any Tools wired into its bottom handle.
                      </p>
                    </div>

                    {/* 1. System Prompt (Always visible) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                        System Prompt <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={6}
                        className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white resize-y font-mono placeholder:text-gray-600 focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g., You are a helpful HR assistant. Answer questions using the provided tools."
                        value={config.user_prompt || ""}
                        onChange={(e) => handleConfigChange("user_prompt", e.target.value)}
                      />
                      <p className="text-[10px] text-gray-500">
                        Define the agent's persona, rules, and specific goals.
                      </p>
                    </div>

                    {/* 2. Tool Description (DYNAMIC: Only visible if it's a Sub-Agent) */}
                    {isSubAgent && (
                      <div className="space-y-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-green-400 uppercase flex items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500/20 text-[10px]">🛠️</span>
                          Sub-Agent Tool Description
                        </label>
                        <textarea
                          rows={3}
                          className="w-full rounded-lg border border-white/10 bg-[#121216] px-4 py-2.5 text-sm text-white resize-y font-mono placeholder:text-gray-600 focus:ring-1 focus:ring-green-500"
                          placeholder="e.g., Use this tool when you need to answer HR or payroll related questions."
                          value={config.tool_spec || ""}
                          onChange={(e) => handleConfigChange("tool_spec", e.target.value)}
                        />
                        <p className="text-[10px] text-gray-500">
                          Because this agent is connected as a Tool to another AI, you can explicitly instruct the Supervisor on when to use it. If left blank, the system will use the System Prompt above as the description.
                        </p>
                      </div>
                    )}

                  </div>
                )}


            </div>
          </div>

          {/* RIGHT: Output Preview */}
          {/* RIGHT: Output Preview */}
          <div className="hidden w-80 flex-col border-l border-white/5 bg-[#0d0d0f] lg:flex">
             <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-gray-500">Output</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">JSON</span>
             </div>
             
             <div className="flex-1 overflow-y-auto">
                {currentNodeOutput ? (
                  <div className="p-4">
                    <div className="rounded-md bg-[#121216] border border-white/5 p-4 overflow-x-auto">
                      <pre className="text-xs text-green-400 font-mono">
                        {JSON.stringify(currentNodeOutput, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                       <Zap className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-400">No output yet</p>
                    <p className="text-[10px] text-gray-600 px-4">Execute the step to see the data it generates.</p>
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
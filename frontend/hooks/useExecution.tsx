import { api } from "@/lib/api";
import { useWorkflowStore } from "@/store/useWorkflowStore";
import { useState, useEffect, useCallback } from "react";

export function useExecution() {
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // This stores the memory: { "node_1": { "status": "success", ... } }
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, any>>({});
  
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const setNodeStatus = useWorkflowStore((state) => state.setNodeStatus);
        const setAiHighlight = useWorkflowStore((state) => state.setAiHighlight);

const clearStatuses = useWorkflowStore((state) => state.clearStatuses);
  // 1. Function to start the execution via REST API
  const startExecution = async (workflowId: string, triggerNodeId: string) => {
    setIsRunning(true);
    setNodeOutputs({}); 
    clearStatuses();
    
    try {
      // Hit your FastAPI /start endpoint
      const {data, error} = await api.POST("/api/v0/execution/start", {
        body: {
          workflow_id: workflowId,
          trigger_node_id: triggerNodeId,
          trigger_data: { test: "data" } 
        }
      });
      
      if(error){
        throw new Error("cant make exec")
      }
      setExecutionId(data.execution_id); // Save the ID so the WebSocket can connect!
      
    } catch (error) {
      console.error("Failed to start execution:", error);
    }
    finally{
        setIsRunning(false);

    }
  };

// 2. The WebSocket Connection
 // Pull your actions from Zustand

  useEffect(() => {
    if (!executionId) return;

    const ws = new WebSocket(`ws://localhost:8084/api/v0/execution/ws/${executionId}`);

    ws.onopen = () => console.log("Connected to execution stream!");

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === "AI_TOOL_START") {
        // Turn the wire and the tool MAGENTA
        setAiHighlight(payload.source_id, payload.target_id, true);
      } 
      else if (payload.type === "AI_TOOL_END") {
        // Turn off the magenta glow for all tools connected to this agent
        setAiHighlight(payload.source_id, null, false);
      }
      if (payload.type === "NODE_LOG") {
        // ✅ Much cleaner! Just pass the ID and the new data property.
        updateNodeData(payload.node_id, { liveStatus: payload.message });
      } 
      
      else if (payload.type === "NODE_STARTED") {
        setNodeStatus(payload.node_id, 'running');
        // Reset the live status text for a fresh run
        updateNodeData(payload.node_id, { liveStatus: "Initializing AI..." });
        
        // (Don't forget to clear out the old outputs if you have that state!)
      } 
      
      else if (payload.type === "NODE_COMPLETED") {
        setNodeStatus(payload.node_id, payload.status === 'failed' ? 'failed' : (payload.status === 'paused' ? 'paused' : 'success' ));
        // Clear the liveStatus so it doesn't linger after finishing
        updateNodeData(payload.node_id, { liveStatus: null });
        
        if (payload.output) {
          setNodeOutputs((prevOutputs) => ({
            ...prevOutputs,
            [payload.node_id]: payload.output // Maps the Node ID to its JSON output
          }));
        }
      }
    };

    ws.onclose = () => {
      console.log("Execution stream closed.");
      setIsRunning(false);
    };

    return () => ws.close(); 
  }, [executionId, updateNodeData, setNodeStatus]);
  return { startExecution, isRunning, nodeOutputs };
}
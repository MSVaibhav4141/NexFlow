import { api } from "@/lib/api";
import { useWorkflowStore } from "@/store/useWorkflowStore";
import { useState, useEffect, useRef, useCallback } from "react";

export function useExecution(workflowId: string) {
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, any>>({});
  const wsRef = useRef<WebSocket | null>(null); // ← track WS instance

  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const setNodeStatus = useWorkflowStore((state) => state.setNodeStatus);
  const setAiHighlight = useWorkflowStore((state) => state.setAiHighlight);
  const clearStatuses = useWorkflowStore((state) => state.clearStatuses);

  const actionsRef = useRef({ updateNodeData, setNodeStatus, setAiHighlight, clearStatuses });
useEffect(() => {
  actionsRef.current = { updateNodeData, setNodeStatus, setAiHighlight, clearStatuses };
});

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8084";
  const wsUrl = baseUrl.replace(/^http/, "ws");

const handleWsMessage = useCallback((event: MessageEvent) => {
  const payload = JSON.parse(event.data);
  const { updateNodeData, setNodeStatus, setAiHighlight } = actionsRef.current;

  if (payload.type === "AI_TOOL_START") {
    setAiHighlight(payload.source_id, payload.target_id, true);
  } else if (payload.type === "AI_TOOL_END") {
    setAiHighlight(payload.source_id, null, false);
  } else if (payload.type === "NODE_LOG") {
    updateNodeData(payload.node_id, { liveStatus: payload.message });
  } else if (payload.type === "NODE_STARTED") {
    setNodeStatus(payload.node_id, "running");
    updateNodeData(payload.node_id, { liveStatus: "Initializing..." });
  } else if (payload.type === "NODE_COMPLETED") {
    const status =
      payload.status === "failed" ? "failed"
      : payload.status === "paused" ? "paused"
      : "success";
    setNodeStatus(payload.node_id, status);
    updateNodeData(payload.node_id, { liveStatus: null });
    if (payload.output) {
      setNodeOutputs((prev) => ({ ...prev, [payload.node_id]: payload.output }));
    }
  }
}, []); 

  const connectToExecution = useCallback((execId: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${wsUrl}/api/v0/execution/ws/${execId}`);
    wsRef.current = ws;

    ws.onopen = () => console.log(`[Execution WS] Connected: ${execId}`);
    ws.onmessage = handleWsMessage;
    ws.onclose = () => {
      console.log("[Execution WS] Closed.");
      setIsRunning(false);
    };
  }, [wsUrl, handleWsMessage]);

  const startExecution = async (triggerNodeId: string) => {
    setIsRunning(true);
    setNodeOutputs({});
    clearStatuses();

    try {
      const { data, error } = await api.POST("/api/v0/execution/start", {
        body: {
          workflow_id: workflowId,
          trigger_node_id: triggerNodeId,
          trigger_data: { test: "data" },
        },
      });

      if (error) throw new Error("Can't start execution");

      connectToExecution(data.execution_id);
      setExecutionId(data.execution_id);

    } catch (error) {
      console.error("Failed to start execution:", error);
      setIsRunning(false);
    }
    setIsRunning(false); 
  };

  useEffect(() => {
    if (!workflowId) return;

    const ws = new WebSocket(`${wsUrl}/api/v0/execution/ws/workflow/${workflowId}`);

    ws.onopen = () => console.log(`[Workflow WS] Listening: ${workflowId}`);
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "EXECUTION_STARTED") {
        clearStatuses();
        setNodeOutputs({});
        setIsRunning(true);
        connectToExecution(payload.execution_id);
        setExecutionId(payload.execution_id);
      }
    };
    ws.onclose = () => console.log("[Workflow WS] Closed.");

    return () => ws.close();
  }, [workflowId]);

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  return { startExecution, isRunning, nodeOutputs };
}
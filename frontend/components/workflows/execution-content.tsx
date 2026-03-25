"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { getExecutionsAction } from "@/actions/actions";

export function ExecutionContent() {
  const [executions, setExecutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExecutions() {
      const res = await getExecutionsAction();
      if (res.success) {
        setExecutions(res.data as any);
      }
      setIsLoading(false);
    }
    fetchExecutions();
  }, []);

  if (isLoading) {
    return (
      <div className="mt-24 flex w-full justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="mt-24 flex w-full flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#121216] border border-white/5 mb-4">
          <Clock className="h-8 w-8 text-gray-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">No Executions Yet</h2>
        <p className="text-sm text-gray-500">Run a workflow to see its history here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      {executions.map((execution) => (
        <ExecutionCard key={execution.id} execution={execution} />
      ))}
    </div>
  );
}

function ExecutionCard({ execution }: { execution: any }) {
  // Extract error from state if it failed
  let errorMessage = "";
  if (execution.status === "failed" && execution.state) {
    // Loop through the state dictionary to find the node that failed
    for (const [nodeId, nodeData] of Object.entries<any>(execution.state)) {
      if (nodeData?.status === "failed" && nodeData?.output?.error) {
        errorMessage = `Node [${nodeId}]: ${nodeData.output.error}`;
        break;
      }
    }
  }

  const isSuccess = execution.status === "completed" || execution.status === "success";
  const isFailed = execution.status === "failed";
  const isRunning = execution.status === "running";

  return (
    <div className="group relative flex items-center justify-between rounded-xl border border-white/5 bg-[#121216]/50 p-5 transition-all hover:bg-[#121216]">
      
      <div className="flex items-center gap-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/50 border border-white/5">
          {isSuccess && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {isFailed && <XCircle className="h-5 w-5 text-red-500" />}
          {isRunning && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">
              {execution.id}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
              ${isSuccess ? "bg-green-500/10 text-green-400" : ""}
              ${isFailed ? "bg-red-500/10 text-red-400" : ""}
              ${isRunning ? "bg-blue-500/10 text-blue-400" : ""}
            `}>
              {execution.status}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Workflow: {execution.workflow_id}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 relative">
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-400">
            {new Date(execution.createdAt).toLocaleString()}
          </span>
          {execution.completedAt && (
            <span className="text-[10px] text-gray-600">
              Completed {new Date(execution.completedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* --- HOVER ERROR TOOLTIP --- */}
        {isFailed && errorMessage && (
          <div className="relative flex cursor-help items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-500/70 group-hover:text-red-500 transition-colors" />
            
            <div className="absolute right-8 top-1/2 w-72 -translate-y-1/2 rounded-lg border border-red-500/30 bg-[#0a0a0c] p-3 shadow-xl opacity-0 pointer-events-none transition-all group-hover:opacity-100 group-hover:pointer-events-auto z-10">
              <span className="block text-[10px] font-bold text-red-500 uppercase mb-1">Crash Report</span>
              <p className="text-xs text-red-200 leading-relaxed font-mono break-words">
                {errorMessage}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
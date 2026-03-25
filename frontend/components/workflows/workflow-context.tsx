"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Clock, Activity, Loader2, GitBranch } from "lucide-react";
import { EmptyState } from "./empty-state";
import { getWorkflowsAction } from "@/actions/actions";

export type Workflow = {
  id: string;
  user_id: string;
  nodes: any[];
  edges: any[];
  createdAt?: string;
  updatedAt?: string;
};

export function WorkflowContent() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkflows() {
      try {

        const res = await getWorkflowsAction();
        if (res.data) {
          setWorkflows(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkflows();
  }, []);

  if (isLoading) {
    return (
      <div className="mt-24 flex w-full justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (workflows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      {workflows.map((workflow, index) => (
        <WorkflowCard 
          key={workflow.id} 
          workflow={workflow} 
          index={index} 
        />
      ))}
    </div>
  );
}

function WorkflowCard({ workflow, index }: { workflow: Workflow; index: number }) {
  const triggerNode = workflow.nodes?.find(n => n.type?.includes("Trigger"));
  const stepCount = workflow.nodes?.length || 0;
  
  const delayStyle = { animationDelay: `${index * 100}ms` };

  return (
    <Link href={`/workflows/${workflow.id}`}>
      <div 
        className="group relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-[#121216]/80 p-6 transition-all hover:border-indigo-500/50 hover:bg-[#1a1a20] hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        style={delayStyle}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:from-indigo-500/5 group-hover:opacity-100 pointer-events-none" />

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Zap className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Active
            </span>
          </div>

          <h3 className="mb-2 text-lg font-bold text-white truncate">
            Workflow {workflow.id.substring(0, 8)}...
          </h3>
          
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5 text-gray-500" />
              {stepCount} {stepCount === 1 ? 'Step' : 'Steps'}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-gray-500" />
              {triggerNode ? 'Trigger Configured' : 'No Trigger'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            Updated {new Date(workflow.updatedAt || Date.now()).toLocaleDateString()}
          </span>
          <span className="text-sm font-bold text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
            Open Editor →
          </span>
        </div>
      </div>
    </Link>
  );
}
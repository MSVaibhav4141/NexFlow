import { ChevronDown, Plus } from "lucide-react";

export function PageHeader() {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Workflows</h1>
        <p className="text-sm text-gray-400">
          Workflows, executions, and data tables owned by you
        </p>
      </div>

      <div className="flex items-center">
        <button className="flex h-10 items-center gap-2 rounded-l-lg bg-indigo-500 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0f0f11]">
          <Plus className="h-4 w-4" />
          Create workflow
        </button>
        <div className="h-10 w-[1px] bg-indigo-600/50" />
        <button className="flex h-10 w-10 items-center justify-center rounded-r-lg bg-indigo-500 text-white transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0f0f11]">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
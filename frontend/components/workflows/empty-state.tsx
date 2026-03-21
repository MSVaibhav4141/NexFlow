import { FilePlus2 } from "lucide-react";
import Link from "next/link";
import { createId } from "@paralleldrive/cuid2";


export function EmptyState() {

  const workflowId = createId()
  return (
    <div className="mt-24 flex w-full flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex flex-col items-center text-center">
        <h2 className="mb-2 text-2xl font-semibold text-white flex items-center gap-2">
          <span className="animate-wave text-2xl">👋</span> Welcome, Vaibhav!
        </h2>
        <p className="text-gray-400">Create your first workflow to start automating.</p>
      </div>

      <button className="group relative flex h-48 w-48 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-[#121216]/50 transition-all hover:border-indigo-500/50 hover:bg-[#121216] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 opacity-0 transition-opacity duration-500 group-hover:from-indigo-500/5 group-hover:via-transparent group-hover:to-transparent group-hover:opacity-100" />
        <Link href={`/workflows/${workflowId}`}>
        <div className="rounded-xl bg-white/5 p-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:bg-indigo-500/10">
          <FilePlus2 className="h-8 w-8 text-gray-400 transition-colors group-hover:text-indigo-400" />
        </div>
        </Link>
        
        <span className="text-sm font-medium text-gray-300 transition-colors group-hover:text-white">
          Start from scratch
        </span>
      </button>
    </div>
  );
}
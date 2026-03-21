'use client'

import { saveWorkflow } from "@/actions/actions"
import { useWorkflowStore } from "@/store/useWorkflowStore"
import { useState } from "react"

export function Header({id}:{id:string}){

    const nodes = useWorkflowStore((state) => state.nodes)
    const edges = useWorkflowStore((state) => state.edges)
    const {setWorkflowId} = useWorkflowStore()
    const [loding, setLoading] = useState(false)

    const save  = async() => {
        setLoading(true)
        await saveWorkflow({
            nodes,
            edges,
            id  
        })
        setWorkflowId(id)
        setLoading(false)
    }
return (
          <header className="flex h-14 items-center justify-between border-b border-white/5 bg-[#121216] px-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white">My First Workflow</span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-gray-400">Draft</span>
        </div>
        <button disabled={loding} onClick={() => save()} className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400">
          {loding ? "Saving..." : "Save Workflow"}
        </button>
      </header>
    )
}
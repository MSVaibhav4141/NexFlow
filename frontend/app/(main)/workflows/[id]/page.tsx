import { Header } from "@/components/workflows/header";
import WorkflowCanvas from "./canvas";
import  { redirect } from "next/navigation";
import { Edge, Node } from "@xyflow/react";
import { api } from "@/lib/api";
export const metadata = {
  title: "Editing Workflow | AutomateX",
};

export default async function SingleWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // TODO: In the future, you would fetch your initial nodes/edges from the DB here
  // const workflowData = await getWorkflowById(params.workflowId);

  const workflow = await params

  if(!workflow.id){
    redirect("/workflows")
  }
  
  const {error, data} = await api.GET("/api/v0/workflows/wokflow/{id}", {
    params:{
      path:{id:workflow.id}
    }
  }) 

  
 
  const edges = data?.edges as unknown as Edge[]
  const nodes = data?.nodes as unknown as Node[]

  return (
    <div className="flex h-screen w-full flex-col bg-[#0a0a0c]">

      <main className="flex-1 relative">
        <Header id={workflow.id}/>
        <WorkflowCanvas allEdges={edges} allNodes={nodes} /> 
      </main>
    </div>
  );
}
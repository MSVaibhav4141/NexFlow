import { Header } from "@/components/workflows/header";
import WorkflowCanvas from "./canvas";
import  { redirect } from "next/navigation";
import { Edge, Node } from "@xyflow/react";
import { api } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOption } from "@/lib/authOption";
export const metadata = {
  title: "Editing Workflow | Nexflow",
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
  const token = (await getServerSession(authOption))?.user.encoded

  console.log(token,"YES THIS IS THE ONE")
  if(!token){
    return
  }
  const {error, data} = await api.GET("/api/v0/workflows/wokflow/{id}", {
    headers:{
            authorization:`Bearer ${token}`
      },
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
import { PageHeader } from "../../../components/workflows/page-hader";
import { Tabs } from "../../../components/workflows/tabs";
import { WorkflowContent } from "@/components/workflows/workflow-context";
import { ExecutionContent } from "@/components/workflows/execution-content"; 

export const metadata = {
  title: "Workflows | Nexflow",
};

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {

  const tab = (await searchParams).tab
  const activeTab = tab || "workflows";

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0a0a0c] px-6 py-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
        <PageHeader />
        
        <Tabs activeTab={activeTab} />
        
        {activeTab === "workflows" ? <WorkflowContent /> : <ExecutionContent />}
      </div>
    </div>
  );
}
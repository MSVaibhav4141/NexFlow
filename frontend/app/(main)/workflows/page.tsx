import { PageHeader } from "../../../components/workflows/page-hader";
import { Tabs } from "../../../components/workflows/tabs";
import { EmptyState } from "../../../components/workflows/empty-state";

export const metadata = {
  title: "Workflows | AutomateX",
};

export default function WorkflowsPage() {
  return (
    <div className="flex h-full w-full flex-col px-6 py-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
        <PageHeader />
        <Tabs />
        <EmptyState />
      </div>
    </div>
  );
}
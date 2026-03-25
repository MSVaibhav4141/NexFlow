import { MobileBlocker } from "@/components/MobileBlocker";
import { AiCommander } from "../../../components/auth/dashboard/AiCommad";
import { QuickActions } from "../../../components/auth/dashboard/QuickAction";

export default function DashboardPage() {
  return (
    <>
    <div className="block lg:hidden">
        <MobileBlocker />
      </div>
    <div className="flex min-h-full w-full flex-col px-8 py-12 lg:px-16 lg:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center pt-10">
        
        <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="mb-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Hi Vaibhav, what do you want to automate?
          </h1>
          <p className="text-base text-gray-400">
            Describe your workflow in plain English, and our AI will build it instantly.
          </p>
        </div>

        <AiCommander />
        <QuickActions />

      </div>
    </div>
    </>
  );
}
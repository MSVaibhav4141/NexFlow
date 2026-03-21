import { Sidebar } from "../../components/auth/dashboard/Sidebar";

export const metadata = {
  title: "Dashboard | AutomateX",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#0a0a0c] font-sans overflow-hidden selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-900/10 opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-purple-900/10 opacity-30 blur-[100px]" />

      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
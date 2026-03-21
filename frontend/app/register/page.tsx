import Link from "next/link";
import RegisterFlow from "@/components/EmailForm";

export const metadata = {
  title: "Register | Your App",
};

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0c] overflow-hidden flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-red-900/10 opacity-50 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/4 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-900/10 opacity-40 blur-[100px]" />

      {/* Header */}
      <header className="flex w-full items-center justify-between p-6 sm:px-12">
        <Link href="/" className="flex items-center gap-2 text-white">
          <div className="h-6 w-6 rounded-md bg-indigo-500 flex items-center justify-center">
             <span className="text-xs font-bold text-white">Logo</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">YourApp</span>
        </Link>
        <div className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline transition-colors">
            Log in
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-[420px]">
          
          <h1 className="mb-8 text-center text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Start automating today
          </h1>

          {/* Glassmorphic Card */}
          <div className="rounded-xl border border-white/[0.08] bg-[#121216]/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <RegisterFlow />
          </div>

        </div>
      </main>
    </div>
  );
}
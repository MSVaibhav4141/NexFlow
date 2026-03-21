"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OtpVerificationSchema } from "../../types/index";
// import { verifyOtpAction } from "@/app/actions/auth-actions"; // We'll need this later

export default function OtpForm({ email }: { email: string }) {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are filled
    if (newOtp.every((val) => val !== "") && newOtp.length === 6) {
      submitOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace auto-revert
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.some((char) => isNaN(Number(char)))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus last filled input or submit
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
      submitOtp(newOtp.join(""));
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const submitOtp = async (otpCode: string) => {
    setError("");
    const validation = OtpVerificationSchema.safeParse({ email, otp: otpCode });
    
    if (!validation.success) {
      setError(validation.error.message);
      return;
    }

    setIsLoading(true);

    // TODO: Call Server Action to verify OTP
    // const result = await verifyOtpAction(email, otpCode);
    
    // Simulating network request
    setTimeout(() => {
      setIsLoading(false);
      // Route to final step: Password & Workspace Name
      router.push(`/signup/complete?email=${encodeURIComponent(email)}`);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between gap-2 sm:gap-4">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            ref={(el) => { inputRefs.current[index] = el; }}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={isLoading}
            className="h-12 w-10 sm:h-14 sm:w-12 rounded-md border border-white/10 bg-black/40 text-center text-xl font-semibold text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
        ))}
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <button
        onClick={() => submitOtp(otp.join(""))}
        disabled={isLoading || otp.some((val) => val === "")}
        className="group relative mt-2 w-full overflow-hidden rounded-md bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0f0f13] disabled:opacity-50 disabled:hover:bg-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
        {isLoading ? "Verifying..." : "Verify email"}
      </button>

      <p className="text-center text-sm text-gray-400">
        Didn't receive a code?{" "}
        <button className="text-indigo-400 transition-colors hover:text-indigo-300 hover:underline">
          Resend
        </button>
      </p>
    </div>
  );
}
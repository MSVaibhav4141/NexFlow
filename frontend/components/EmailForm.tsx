"use client";

import { useState, useRef, useEffect } from "react";
import { EmailSignupSchema, OtpVerificationSchema, RegisterUser } from "@/types";
import { sendOtpOverEmail } from "@/lib/EmailService";
import { registerUser, verifyOtpRequest } from "../actions/actions";
// import { sendOtpAction, verifyOtpAction } from "@/app/actions/auth-actions";
import {api} from "@/lib/api"
import { signIn } from "next-auth/react";

type Step = "EMAIL" | "OTP" | "DETAILS";

export default function RegisterFlow() {
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accName, setAccName] = useState("");
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- STEP 1: Email Logic ---
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const validation = EmailSignupSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.message);
      return;
    }


    // Call your server action here

    const payload = 
    {accountName:accName,
      name,
      password,
      email
    }

    setIsLoading(true)

    await registerUser(payload)
    await signIn('credentials',
      payload
    )
    setIsLoading(false);
  };


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const validation = EmailSignupSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.message);
      return;
    }

    setIsLoading(true);

    // Call your server action here
    const result = await sendOtpOverEmail({toEmail:email})
    // const result = await sendOtpAction(validation.data.email);

    if(!result.success){
      setIsLoading(false)
      setError(result.mssg)
    }else{
      
          setTimeout(() => {
            setIsLoading(false);
            setStep("OTP"); 
          }, 800);
    }
  };

  // --- STEP 2: OTP Logic ---
  useEffect(() => {
    if (step === "OTP" && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [step]);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-advance
    if (element.value !== "" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit
    if (newOtp.every((val) => val !== "") && newOtp.length === 6) {
      submitOtp(newOtp.join(""));
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
    
    // Call server action to verify
    const result = await verifyOtpRequest({email, otp:otpCode});
    
    if(!result.success){
      setError(result.mssg)
      setIsLoading(false);
    }else{
      setIsLoading(false);
      setStep("DETAILS");
    }
 
  };

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500">
      {/* ----------------- STEP 1: EMAIL ----------------- */}
      {step === "EMAIL" && (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Work email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="you@company.com"
              className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            />
            {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative mt-2 w-full overflow-hidden rounded-md bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0f0f13] disabled:opacity-50"
          >
            {isLoading ? "Sending code..." : "Continue"}
          </button>
        </form>
      )}

      {/* ----------------- STEP 2: OTP ----------------- */}
      {step === "OTP" && (
        <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
          
          {/* Display Locked Email */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Email sent to</label>
              <button 
                onClick={() => setStep("EMAIL")}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Edit
              </button>
            </div>
            <input
              type="text"
              value={email}
              disabled
              className="w-full rounded-md border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-gray-400 focus:outline-none"
            />
          </div>

          {/* OTP Inputs */}
          <div className="flex flex-col gap-2">
             <label className="text-sm font-medium text-gray-300">Verification code</label>
             <div className="flex justify-between gap-2 sm:gap-4">
               {otp.map((data, index) => (
                 <input
                   key={index}
                   type="text"
                   inputMode="numeric"
                   maxLength={1}
                   ref={(el) => { otpInputRefs.current[index] = el; }}
                   value={data}
                   onChange={(e) => handleOtpChange(e.target, index)}
                   disabled={isLoading}
                   className="h-12 w-10 sm:h-14 sm:w-12 rounded-md border border-white/10 bg-black/40 text-center text-xl font-semibold text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                 />
               ))}
             </div>
             {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
          </div>

          <button
            onClick={() => submitOtp(otp.join(""))}
            disabled={isLoading || otp.some((val) => val === "")}
            className="group relative mt-2 w-full overflow-hidden rounded-md bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0f0f13] disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify email"}
          </button>
        </div>
      )}

      {/* ----------------- STEP 3: DETAILS ----------------- */}
      {step === "DETAILS" && (
        <div className="animate-in slide-in-from-right-4 duration-300">
            <form onSubmit={handleFinalSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              placeholder="*******"
              className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="*******"
              className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Account Name
            </label>
            <span>
            <input
              id="acc_name"
              type="text"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              disabled={isLoading}
              placeholder="Account Name"
              className="w-50 rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              />
            <span className="text-white">.my-workflow.xyz</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative mt-2 w-full overflow-hidden rounded-md bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0f0f13] disabled:opacity-50"
            >
            {isLoading ? "Sending code..." : "Continue"}
          </button>
            {error && <p className="w-full text-center text-sm text-red-400 mt-1">{error}</p>}
        </form>
        </div>
      )}
    </div>
  );
}
import { z } from 'zod'

export const EmailSignupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export const OtpVerificationSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits." }).regex(/^\d+$/, "OTP must contain only numbers."),
});

export type OtpVerificationInput = z.infer<typeof OtpVerificationSchema>;
export type EmailSignupInput = z.infer<typeof EmailSignupSchema>;

//Interface
export interface RegisterUser{
    email:string, 
    password:string, 
    name:string,
    accountName:string
}
'use server'

import { randomInt } from "crypto";
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { errorHandeler } from "./functionWrapper";
import { redis } from "./redis";

// Your templates
import { htmlMessage, textMessage } from "../template/EmailTemplate"; 
import { OtpEmailTemplate } from "@/components/emai-form"; 

const isProd = process.env.NODE_ENV === 'production';

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, 
  auth: {
        user: 'dustin.bednar44@ethereal.email',
        pass: 'pv7grJnqwA8nXBeCEh'
    }
});

export const sendOtpOverEmail = errorHandeler(
  async ({ toEmail }: { toEmail: string }) => {

    const otp = generateOTP();

    await redis.hset("otp-set", {
        [toEmail]: otp
    });

    if (isProd) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data: resendData, error } = await resend.emails.send({
        from: 'Nexflow <noreply@nexflow.vaibhavr.com>', // 🚨 Update to your verified domain later!
        to: [toEmail],
        subject: `${otp} is your verification code`,
        react: OtpEmailTemplate({ otp }),
      });

      if (error) {
        throw new Error(`Resend failed: ${error.message}`);
      }

      console.log("OTP sent via Resend:", resendData?.id);
      return { success: true, messageId: resendData?.id };
    } 
    
    else {
      const info = await transporter.sendMail({
        from: '"YourApp Security" <security@yourapp.com>', 
        to: toEmail,
        subject: `${otp} is your verification code`,
        text: textMessage(otp),
        html: htmlMessage(otp),
      });

      console.log("OTP sent via Ethereal:", info.messageId);
      return { success: true, messageId: info.messageId };
    }
  }
)

function generateOTP(length: number = 6): string {
  const chars = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = randomInt(0, chars.length);
    otp += chars[randomIndex];
  }
  return otp;
}
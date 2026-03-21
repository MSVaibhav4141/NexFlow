import * as React from 'react';

interface OtpEmailTemplateProps {
  otp: string;
}

export function OtpEmailTemplate({ otp }: OtpEmailTemplateProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', color: '#333' }}>
      <h2>Your Verification Code</h2>
      <p>Please use the following OTP to complete your registration:</p>
      <div style={{ 
        padding: '12px 24px', 
        backgroundColor: '#f3f4f6', 
        fontSize: '24px', 
        fontWeight: 'bold', 
        letterSpacing: '4px',
        display: 'inline-block',
        borderRadius: '6px'
      }}>
        {otp}
      </div>
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  );
}
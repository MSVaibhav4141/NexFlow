export const textMessage = (otpCode:string) =>`
    Verify your email address.
    Your verification code is: ${otpCode}
    
    This code will expire in 10 minutes. 
    If you didn't request this, you can safely ignore this email.
  `;

export const htmlMessage = (otpCode:string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1a1a1a;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f5f7; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
              
              <tr>
                <td align="center" style="padding: 32px 32px 0 32px;">
                  <div style="width: 40px; height: 40px; background-color: #6366f1; border-radius: 8px; display: inline-block; margin-bottom: 16px;">
                    <p style="color: #ffffff; font-size: 20px; font-weight: bold; margin: 0; line-height: 40px;">Y</p>
                  </div>
                  <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">Verify your email</h1>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 24px 32px 32px 32px;">
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4b5563;">
                    Enter the following verification code to continue setting up your account.
                  </p>
                  
                  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827; text-align: center;">
                      ${otpCode}
                    </p>
                  </div>

                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    This code will expire in <strong>10 minutes</strong>.
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 13px; line-height: 20px; color: #9ca3af;">
                    If you didn't request this email, there's nothing to worry about — you can safely ignore it.
                  </p>
                  <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                    © ${new Date().getFullYear()} YourApp Inc. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
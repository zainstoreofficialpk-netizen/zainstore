type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload) {
  if (process.env.NODE_ENV !== "production") {
    console.log("\n📧 [Dev Email]");
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    // Extract the URL from html for easy copy-paste in dev
    const match = html.match(/href="([^"]+)"/);
    if (match) console.log(`   Link: ${match[1]}`);
    console.log("");
    return;
  }
  // Wire up Resend / Nodemailer / SES here for production
  throw new Error("Email provider not configured for production.");
}

export function verificationEmailHtml(url: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f766e">Verify your ZainStore.pk account</h2>
      <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
      <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0f766e;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        Verify Email
      </a>
      <p style="color:#71717a;font-size:13px">Or copy this link: ${url}</p>
    </div>
  `;
}

export function resetPasswordEmailHtml(url: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f766e">Reset your ZainStore.pk password</h2>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0f766e;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        Reset Password
      </a>
      <p style="color:#71717a;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

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
    const match = html.match(/href="([^"]+)"/);
    if (match) console.log(`   Link: ${match[1]}`);
    console.log("");
    return;
  }
  // Wire up Resend / Nodemailer / SES here for production
  throw new Error("Email provider not configured for production.");
}

// Brand colours: primary #faa42d (amber), button text #fff
const BRAND = "#faa42d";
const BRAND_DARK = "#e8920a";

function emailBase(title: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#faf9f7">
      <div style="background:#fff;border-radius:12px;border:1px solid #e7e5e4;overflow:hidden">
        <div style="background:linear-gradient(135deg,${BRAND},${BRAND_DARK});padding:24px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">ZainStore.pk</h1>
        </div>
        <div style="padding:28px 32px">
          <h2 style="margin:0 0 12px;font-size:18px;color:#18181b">${title}</h2>
          ${body}
        </div>
        <div style="padding:16px 32px;background:#f4f4f5;border-top:1px solid #e4e4e7;text-align:center">
          <p style="margin:0;font-size:12px;color:#71717a">ZainStore.pk &mdash; Pakistan&rsquo;s Multi-Vendor Marketplace</p>
        </div>
      </div>
    </div>
  `;
}

function ctaButton(url: string, label: string) {
  return `
    <a href="${url}" style="display:inline-block;margin:20px 0;padding:13px 28px;background:${BRAND};color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
      ${label}
    </a>
    <p style="color:#71717a;font-size:12px;margin-top:4px">Or copy this link:<br><a href="${url}" style="color:${BRAND_DARK};word-break:break-all">${url}</a></p>
  `;
}

export function verificationEmailHtml(url: string) {
  return emailBase(
    "Verify your email address",
    `<p style="color:#52525b;font-size:14px;line-height:1.6">
      Click the button below to verify your email and activate your ZainStore.pk account.
      This link expires in <strong>24 hours</strong>.
     </p>
     ${ctaButton(url, "Verify Email Address")}`,
  );
}

export function resetPasswordEmailHtml(url: string) {
  return emailBase(
    "Reset your password",
    `<p style="color:#52525b;font-size:14px;line-height:1.6">
      We received a request to reset your ZainStore.pk password.
      Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
     </p>
     ${ctaButton(url, "Reset Password")}
     <p style="color:#a1a1aa;font-size:12px;margin-top:16px">If you didn't request this, you can safely ignore this email.</p>`,
  );
}

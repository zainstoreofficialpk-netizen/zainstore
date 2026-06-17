import { Resend } from "resend";
import { readFileSync } from "fs";

// Load .env manually
const env = readFileSync("/Users/apple/Documents/ZainStore/.env", "utf8");
for (const line of env.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
}

const apiKey = process.env.RESEND_API_KEY;
console.log("=== ZainStore Email Test (Resend) ===");
console.log("API Key:", apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "NOT SET");
console.log("");

if (!apiKey) {
  console.error("❌ RESEND_API_KEY is not set in .env");
  process.exit(1);
}

const resend = new Resend(apiKey);

console.log("Sending test email to fazalsamad555@gmail.com...");
const { data, error } = await resend.emails.send({
  from: "ZainStore.pk <onboarding@resend.dev>",
  to: "zainstoreofficial.pk@gmail.com",
  subject: "ZainStore.pk — Email Test ✅",
  html: `<div style="font-family:Arial;padding:24px;background:#faf9f7">
    <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e7e5e4;overflow:hidden">
      <div style="background:linear-gradient(135deg,#faa42d,#e8920a);padding:24px;text-align:center">
        <p style="margin:0;color:#fff;font-size:20px;font-weight:900">ZainStore.pk</p>
        <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:12px">Pakistan's Multi-Vendor Marketplace</p>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 12px;color:#18181b">✅ Email System Working!</h2>
        <p style="color:#52525b;font-size:14px;line-height:1.6">
          Your ZainStore.pk email system is now live and sending correctly via <strong>Resend</strong>.
        </p>
        <div style="margin-top:16px;padding:14px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px">
          <p style="margin:0;font-size:13px;color:#065f46;font-weight:600">All email triggers are active:</p>
          <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#065f46">
            <li>Order placed → Customer confirmation + Vendor notification</li>
            <li>Order shipped / delivered / cancelled → Customer update</li>
            <li>Vendor signup → Admin alert</li>
            <li>Vendor approved / rejected → Vendor email</li>
            <li>Withdrawal paid → Vendor email with reference</li>
          </ul>
        </div>
      </div>
      <div style="padding:16px 32px;background:#f4f4f5;border-top:1px solid #e4e4e7;text-align:center">
        <p style="margin:0;font-size:12px;color:#71717a">ZainStore.pk · 📞 0347-891-3290 · support@zainstore.pk</p>
      </div>
    </div>
  </div>`,
});

if (error) {
  console.error("❌ Failed:", error.message ?? JSON.stringify(error));
} else {
  console.log("✅ Email sent successfully!");
  console.log("Email ID:", data?.id);
  console.log("\nCheck fazalsamad555@gmail.com inbox (also check Spam)");
}

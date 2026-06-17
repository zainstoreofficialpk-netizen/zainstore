import { Resend } from "resend";

// ── Client ────────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Core send function ────────────────────────────────────────────────────────

type EmailPayload = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: EmailPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.log("\n📧 [Email — RESEND_API_KEY not set]");
    console.log(`   To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const from = process.env.EMAIL_FROM ?? "ZainStore.pk <onboarding@resend.dev>";
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) console.error("❌ Email send failed:", error);
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const BRAND  = "#faa42d";
const DARK   = "#e8920a";
const BG     = "#faf9f7";
const CARD   = "#ffffff";
const MUTED  = "#71717a";
const BODY   = "#52525b";
const TITLE  = "#18181b";

// ── Layout helpers ────────────────────────────────────────────────────────────

function base(title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:${BG};font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:${CARD};border-radius:14px;border:1px solid #e7e5e4;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,${BRAND},${DARK});padding:28px 32px;text-align:center">
        <p style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px">ZainStore<span style="opacity:.75">.pk</span></p>
        <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:12px">Shop Smart. Save More. Delivered to Your Door.</p>
      </div>

      <!-- Body -->
      <div style="padding:32px">
        <h2 style="margin:0 0 16px;font-size:20px;color:${TITLE};font-weight:800">${title}</h2>
        ${body}
      </div>

      <!-- Footer -->
      <div style="padding:16px 32px;background:#f4f4f5;border-top:1px solid #e4e4e7;text-align:center">
        <p style="margin:0;font-size:12px;color:${MUTED}">ZainStore.pk · Your Favourite Online Shopping Destination in Pakistan</p>
        <p style="margin:4px 0 0;font-size:11px;color:#a1a1aa">📞 0347-891-3290 · support@zainstore.pk</p>
      </div>

    </div>
  </div>
  </body></html>`;
}

function btn(url: string, label: string) {
  return `<a href="${url}" style="display:inline-block;margin:20px 0 8px;padding:13px 30px;background:${BRAND};color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">${label}</a>
  <p style="margin:0;font-size:11px;color:${MUTED}">Or copy: <a href="${url}" style="color:${DARK};word-break:break-all">${url}</a></p>`;
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;color:${MUTED};border-bottom:1px solid #f4f4f5;width:40%">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:${TITLE};font-weight:600;border-bottom:1px solid #f4f4f5">${value}</td>
  </tr>`;
}

function infoTable(rows: string) {
  return `<table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;border:1px solid #e4e4e7;margin:16px 0">${rows}</table>`;
}

function p(text: string) {
  return `<p style="margin:0 0 12px;font-size:14px;color:${BODY};line-height:1.65">${text}</p>`;
}

function badge(text: string, color = BRAND) {
  return `<span style="display:inline-block;background:${color};color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">${text}</span>`;
}

// ── Auth emails ───────────────────────────────────────────────────────────────

export function verificationEmailHtml(url: string) {
  return base("Verify your email address",
    `${p("Welcome to <strong>ZainStore.pk</strong>! Click the button below to verify your email and activate your account. This link expires in <strong>24 hours</strong>.")}
    ${btn(url, "Verify Email Address")}
    ${p("<small style='color:#a1a1aa'>If you didn't create an account, ignore this email.</small>")}`
  );
}

export function resetPasswordEmailHtml(url: string) {
  return base("Reset your password",
    `${p("We received a request to reset your ZainStore.pk password. Click below to set a new password. This link expires in <strong>1 hour</strong>.")}
    ${btn(url, "Reset Password")}
    ${p("<small style='color:#a1a1aa'>If you didn't request this, ignore this email.</small>")}`
  );
}

// ── Order emails ──────────────────────────────────────────────────────────────

export function orderConfirmationEmailHtml({
  customerName,
  orderNumber,
  items,
  subtotal,
  shippingTotal,
  discountTotal,
  grandTotal,
  paymentMethod,
  shippingAddress,
}: {
  customerName: string;
  orderNumber: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: string;
  shippingAddress: string;
}) {
  const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;
  const payLabel: Record<string, string> = {
    cod: "Cash on Delivery",
    easypaisa: "EasyPaisa",
    jazzcash: "JazzCash",
    bank_transfer: "Bank Transfer",
  };

  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:10px 12px;font-size:13px;color:${TITLE};border-bottom:1px solid #f0f0f0">${i.name}</td>
      <td style="padding:10px 12px;font-size:13px;color:${MUTED};border-bottom:1px solid #f0f0f0;text-align:center">×${i.quantity}</td>
      <td style="padding:10px 12px;font-size:13px;color:${TITLE};font-weight:600;border-bottom:1px solid #f0f0f0;text-align:right">${fmt(i.unitPrice * i.quantity)}</td>
    </tr>`
  ).join("");

  return base(`Order Confirmed! 🎉`,
    `${p(`Hi <strong>${customerName}</strong>, your order has been placed successfully!`)}

    ${infoTable(
      infoRow("Order Number", orderNumber) +
      infoRow("Payment", payLabel[paymentMethod] ?? paymentMethod) +
      infoRow("Deliver To", shippingAddress)
    )}

    <p style="margin:16px 0 8px;font-size:13px;font-weight:700;color:${TITLE}">Order Items</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#f9f9f9">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:${MUTED};font-weight:600">ITEM</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:${MUTED};font-weight:600">QTY</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:${MUTED};font-weight:600">TOTAL</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-top:8px">
      <tr><td style="padding:5px 12px;font-size:13px;color:${MUTED}">Subtotal</td><td style="padding:5px 12px;font-size:13px;text-align:right;color:${TITLE}">${fmt(subtotal)}</td></tr>
      <tr><td style="padding:5px 12px;font-size:13px;color:${MUTED}">Shipping</td><td style="padding:5px 12px;font-size:13px;text-align:right;color:${TITLE}">${shippingTotal === 0 ? "FREE" : fmt(shippingTotal)}</td></tr>
      ${discountTotal > 0 ? `<tr><td style="padding:5px 12px;font-size:13px;color:#16a34a">Discount</td><td style="padding:5px 12px;font-size:13px;text-align:right;color:#16a34a">-${fmt(discountTotal)}</td></tr>` : ""}
      <tr style="border-top:2px solid #e4e4e7">
        <td style="padding:10px 12px;font-size:15px;font-weight:900;color:${TITLE}">Total</td>
        <td style="padding:10px 12px;font-size:15px;font-weight:900;text-align:right;color:${BRAND}">${fmt(grandTotal)}</td>
      </tr>
    </table>

    <div style="margin-top:20px;padding:14px;background:#fef9ec;border:1px solid #fde68a;border-radius:8px">
      <p style="margin:0;font-size:13px;color:#92400e">📦 Expected delivery in <strong>3–5 business days</strong>. We'll notify you when your order ships.</p>
    </div>`
  );
}

export function vendorNewOrderEmailHtml({
  vendorName,
  storeName,
  orderNumber,
  customerName,
  items,
  vendorTotal,
}: {
  vendorName: string;
  storeName: string;
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  vendorTotal: number;
}) {
  const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:9px 12px;font-size:13px;color:${TITLE};border-bottom:1px solid #f0f0f0">${i.name}</td>
      <td style="padding:9px 12px;font-size:13px;color:${MUTED};text-align:center;border-bottom:1px solid #f0f0f0">×${i.quantity}</td>
      <td style="padding:9px 12px;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;color:${TITLE}">${fmt(i.unitPrice * i.quantity)}</td>
    </tr>`
  ).join("");

  return base(`New Order Received! 🛒`,
    `${p(`Hi <strong>${vendorName}</strong>, you have a new order for <strong>${storeName}</strong>!`)}

    ${infoTable(
      infoRow("Order Number", orderNumber) +
      infoRow("Customer", customerName) +
      infoRow("Your Earnings", fmt(vendorTotal))
    )}

    <p style="margin:16px 0 8px;font-size:13px;font-weight:700;color:${TITLE}">Items Ordered from Your Store</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#f9f9f9">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:${MUTED};font-weight:600">ITEM</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:${MUTED};font-weight:600">QTY</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:${MUTED};font-weight:600">TOTAL</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="margin-top:20px;padding:14px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px">
      <p style="margin:0;font-size:13px;color:#065f46">✅ <strong>Action required:</strong> Please prepare and pack the order. Log in to your dashboard to update the order status.</p>
    </div>

    <div style="text-align:center;margin-top:20px">
      <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/vendor/orders" style="display:inline-block;padding:12px 28px;background:${BRAND};color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View Order in Dashboard →</a>
    </div>`
  );
}

export function orderStatusEmailHtml({
  customerName,
  orderNumber,
  status,
  trackingNumber,
  estimatedDelivery,
}: {
  customerName: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
}) {
  const STATUS_INFO: Record<string, { title: string; icon: string; color: string; msg: string }> = {
    SHIPPED: {
      title: "Your order has shipped! 🚚",
      icon: "🚚",
      color: "#3b82f6",
      msg: "Great news! Your order is on its way. Estimated delivery in 2–3 business days.",
    },
    OUT_FOR_DELIVERY: {
      title: "Out for delivery today! 📦",
      icon: "📦",
      color: "#f59e0b",
      msg: "Your order is out for delivery — expect it today! Please be available to receive it.",
    },
    DELIVERED: {
      title: "Order delivered! ✅",
      icon: "✅",
      color: "#16a34a",
      msg: "Your order has been delivered. We hope you love your purchase! If you have any issues, contact us within 4 days to initiate a return.",
    },
    CANCELLED: {
      title: "Order cancelled",
      icon: "❌",
      color: "#ef4444",
      msg: "Your order has been cancelled. If you paid online, your refund will be processed within 5–7 business days.",
    },
  };

  const info = STATUS_INFO[status] ?? {
    title: `Order update: ${status}`,
    icon: "📋",
    color: BRAND,
    msg: "Your order status has been updated.",
  };

  return base(info.title,
    `${p(`Hi <strong>${customerName}</strong>, here's an update on your order.`)}

    <div style="text-align:center;padding:24px;background:#f9fafb;border-radius:12px;margin:16px 0">
      <p style="font-size:40px;margin:0">${info.icon}</p>
      <p style="margin:8px 0 0;font-size:16px;font-weight:800;color:${info.color}">${status.replace(/_/g, " ")}</p>
    </div>

    ${infoTable(
      infoRow("Order Number", orderNumber) +
      (trackingNumber ? infoRow("Tracking Number", trackingNumber) : "") +
      (estimatedDelivery ? infoRow("Estimated Delivery", estimatedDelivery) : "")
    )}

    ${p(info.msg)}

    ${status === "DELIVERED" ? `<div style="margin-top:16px;padding:14px;background:#fef9ec;border:1px solid #fde68a;border-radius:8px">
      <p style="margin:0;font-size:13px;color:#92400e">⭐ Enjoying your purchase? Leave a review on ZainStore.pk to help other shoppers!</p>
    </div>` : ""}`
  );
}

// ── Vendor emails ─────────────────────────────────────────────────────────────

export function vendorSignupAdminEmailHtml({
  vendorName,
  storeName,
  email,
  phone,
}: {
  vendorName: string;
  storeName: string;
  email: string;
  phone?: string | null;
}) {
  return base("New Vendor Application 🏪",
    `${p("A new vendor has registered and is awaiting approval.")}

    ${infoTable(
      infoRow("Vendor Name", vendorName) +
      infoRow("Store Name", storeName) +
      infoRow("Email", email) +
      (phone ? infoRow("Phone", phone) : "")
    )}

    <div style="text-align:center;margin-top:20px">
      <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/admin/vendors" style="display:inline-block;padding:12px 28px;background:${BRAND};color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Review Application →</a>
    </div>`
  );
}

export function vendorApprovedEmailHtml({ vendorName, storeName }: { vendorName: string; storeName: string }) {
  return base("Your store is approved! 🎉",
    `${p(`Hi <strong>${vendorName}</strong>, congratulations! Your store <strong>${storeName}</strong> has been approved on ZainStore.pk.`)}
    ${p("You can now start adding products and accepting orders.")}

    <div style="margin-top:20px;padding:16px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px">
      <p style="margin:0;font-size:13px;color:#065f46;font-weight:600">✅ Your store is now live on ZainStore.pk!</p>
    </div>

    <div style="text-align:center;margin-top:20px">
      <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/vendor" style="display:inline-block;padding:12px 28px;background:${BRAND};color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Go to Vendor Dashboard →</a>
    </div>`
  );
}

export function vendorRejectedEmailHtml({
  vendorName,
  storeName,
  reason,
}: {
  vendorName: string;
  storeName: string;
  reason?: string;
}) {
  return base("Store Application Update",
    `${p(`Hi <strong>${vendorName}</strong>, unfortunately your application for <strong>${storeName}</strong> was not approved at this time.`)}
    ${reason ? `${infoTable(infoRow("Reason", reason))}` : ""}
    ${p("If you have questions or would like to reapply, please contact us at support@zainstore.pk or call 0347-891-3290.")}`
  );
}

export function withdrawalPaidEmailHtml({
  vendorName,
  amount,
  method,
  reference,
}: {
  vendorName: string;
  amount: number;
  method: string;
  reference?: string | null;
}) {
  const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;
  const methodLabel: Record<string, string> = {
    BANK_TRANSFER: "Bank Transfer (MCB)",
    EASYPAISA: "EasyPaisa",
    JAZZCASH: "JazzCash",
  };

  return base("Payment Sent! 💸",
    `${p(`Hi <strong>${vendorName}</strong>, your withdrawal has been processed and the payment has been sent.`)}

    ${infoTable(
      infoRow("Amount", fmt(amount)) +
      infoRow("Method", methodLabel[method] ?? method) +
      (reference ? infoRow("Reference / TXN ID", reference) : "")
    )}

    ${p("The amount should reflect in your account within 1–2 business days. If you have any issues, contact us at support@zainstore.pk.")}

    <div style="text-align:center;margin-top:20px">
      <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/vendor/earnings" style="display:inline-block;padding:12px 28px;background:${BRAND};color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View Earnings →</a>
    </div>`
  );
}

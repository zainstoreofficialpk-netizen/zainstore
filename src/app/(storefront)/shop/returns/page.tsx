import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight, RotateCcw, CheckCircle2, XCircle,
  Clock, Phone, Package, AlertTriangle, ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Return Policy — ZainStore.pk",
  description: "ZainStore.pk 4-day return policy. Learn how to return products and get a refund.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-7">
      <h2 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2">
        <span className="h-1 w-5 bg-brand-500 rounded-full inline-block" />
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-4">
            <Link href="/shop" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-semibold">Return Policy</span>
          </nav>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <RotateCcw className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black">Return Policy</h1>
              <p className="text-white/70 text-sm mt-1">Last updated: June 2025</p>
            </div>
          </div>

          {/* 4-day highlight */}
          <div className="inline-flex items-center gap-3 bg-white text-blue-700 rounded-2xl px-5 py-3 mt-2 shadow-lg">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-black text-lg leading-none">4-Day Return Window</p>
              <p className="text-xs text-blue-500 mt-0.5">From the date of delivery</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-10 space-y-6">

        {/* Overview */}
        <Section title="Overview">
          <p className="text-sm text-zinc-600 leading-relaxed mb-4">
            At ZainStore.pk, we want you to be completely satisfied with your purchase. If you are not happy with an item for any reason, you may return it within <strong className="text-zinc-900">4 days of the delivery date</strong>, subject to the conditions listed below.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 font-medium">
              Returns must be initiated within <strong>4 days</strong> of receiving your order. Requests made after this window will not be accepted.
            </p>
          </div>
        </Section>

        {/* How to Return */}
        <Section title="How to Return an Item">
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Contact Us Within 4 Days",
                desc: "Call or WhatsApp us at 0347-891-3290 or email support@zainstore.pk within 4 days of delivery. Provide your order number and reason for return.",
                color: "bg-brand-500",
              },
              {
                step: "2",
                title: "Get Return Approval",
                desc: "Our team will review your request and send you a Return Approval confirmation within 24 hours. Returns without approval will not be accepted.",
                color: "bg-blue-500",
              },
              {
                step: "3",
                title: "Package the Item",
                desc: "Pack the item securely in its original packaging with all accessories, tags, and documentation included. Do not write on or damage the original packaging.",
                color: "bg-violet-500",
              },
              {
                step: "4",
                title: "Pickup Arranged",
                desc: "We will arrange a free pickup from your address. Our courier will collect the item within 1–2 business days of return approval.",
                color: "bg-green-500",
              },
              {
                step: "5",
                title: "Refund Processed",
                desc: "Once the returned item is received and inspected (3–5 business days), your refund will be processed via bank transfer within 5–7 business days.",
                color: "bg-amber-500",
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex gap-4">
                <div className={`h-8 w-8 ${color} rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 mt-0.5`}>
                  {step}
                </div>
                <div>
                  <p className="font-bold text-zinc-900 text-sm">{title}</p>
                  <p className="text-sm text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Eligible vs Not Eligible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Section title="Eligible for Return">
            <div className="space-y-2.5">
              {[
                "Item is unused and in original condition",
                "Original packaging, tags, and labels intact",
                "All accessories and parts included",
                "Return initiated within 4 days of delivery",
                "Item does not match description on website",
                "Item received damaged or defective",
                "Wrong item delivered",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-600">{item}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Not Eligible for Return">
            <div className="space-y-2.5">
              {[
                "Return requested after 4 days of delivery",
                "Item has been used, washed, or altered",
                "Original packaging or tags missing",
                "Perishable goods (food, fresh produce)",
                "Personal hygiene products (opened)",
                "Digital products or software",
                "Customised or personalised items",
                "Products marked 'Non-Returnable' on listing",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-600">{item}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Refund Details */}
        <Section title="Refund Details">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: "COD Orders",    method: "Bank Transfer",       time: "5–7 business days after inspection" },
              { label: "Card Payment",  method: "Original Card",       time: "5–10 business days after inspection" },
              { label: "Wallet",        method: "JazzCash / EasyPaisa", time: "3–5 business days after inspection" },
            ].map(({ label, method, time }) => (
              <div key={label} className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-bold text-zinc-800">{method}</p>
                <p className="text-[11px] text-zinc-500 mt-1">{time}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Original shipping charges are non-refundable. Return shipping is free when pickup is arranged by ZainStore.pk.
            </p>
          </div>
        </Section>

        {/* Damaged / Wrong Items */}
        <Section title="Damaged or Wrong Items">
          <p className="text-sm text-zinc-600 leading-relaxed mb-3">
            If you received a <strong>damaged, defective, or wrong item</strong>, please contact us <strong>immediately</strong> (within 24 hours of delivery) with:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { icon: Package,  label: "Clear photos of the item" },
              { icon: Package,  label: "Photo of the outer packaging" },
              { icon: Package,  label: "Your order number" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3">
                <Icon className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-xs font-semibold text-red-700">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-500">
            We will arrange immediate replacement or full refund at no cost to you.
          </p>
        </Section>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-base">Need help with a return?</p>
              <p className="text-white/75 text-sm">Call us at <strong className="text-white">0347-891-3290</strong> — Mon–Fri 9am–7pm</p>
            </div>
          </div>
          <Link
            href="/shop/contact"
            className="inline-flex items-center gap-2 bg-white text-brand-600 hover:bg-brand-50 font-black text-sm px-5 py-3 rounded-xl transition-colors shrink-0"
          >
            Contact Support <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

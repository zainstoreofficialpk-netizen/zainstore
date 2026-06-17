import type { Metadata } from "next";
import Link from "next/link";
import {
  Phone, Mail, MapPin, Clock, ChevronRight,
  MessageCircle, Headphones, Send,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — ZainStore.pk",
  description: "Get in touch with ZainStore.pk support team. Call, WhatsApp, or email us for any queries.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white">
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-4">
            <Link href="/shop" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-semibold">Contact Us</span>
          </nav>
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Headphones className="h-3.5 w-3.5" />
              We&apos;re Here to Help
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-3">Contact Us</h1>
            <p className="text-white/80 text-sm sm:text-base">
              Have a question or need support? Reach out to us anytime — our team is ready to assist you.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Contact Cards ── */}
          <div className="space-y-4">

            {/* Phone / WhatsApp */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-black text-zinc-900 mb-1">Call / WhatsApp</h3>
              <p className="text-xs text-zinc-500 mb-3">Available during business hours</p>
              <a
                href="tel:03478913290"
                className="block text-lg font-black text-zinc-900 hover:text-brand-600 transition-colors mb-2"
              >
                0347-891-3290
              </a>
              <a
                href="https://wa.me/923478913290"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Chat on WhatsApp
              </a>
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-brand-500" />
              </div>
              <h3 className="font-black text-zinc-900 mb-1">Email Support</h3>
              <p className="text-xs text-zinc-500 mb-3">We reply within 24 hours</p>
              <a
                href="mailto:support@zainstore.pk"
                className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                support@zainstore.pk
              </a>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-black text-zinc-900 mb-1">Location</h3>
              <p className="text-xs text-zinc-500 mb-2">Pakistan</p>
              <p className="text-sm text-zinc-700 font-medium leading-relaxed">
                ZainStore.pk<br />
                Pakistan
              </p>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-6">
              <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-black text-zinc-900 mb-3">Business Hours</h3>
              <div className="space-y-2 text-sm">
                {[
                  { day: "Monday – Friday", hours: "9:00 AM – 7:00 PM" },
                  { day: "Saturday",        hours: "10:00 AM – 5:00 PM" },
                  { day: "Sunday",          hours: "Closed" },
                ].map(({ day, hours }) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="text-zinc-500 text-xs">{day}</span>
                    <span className={`font-semibold text-xs ${hours === "Closed" ? "text-red-500" : "text-zinc-800"}`}>{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Contact Form ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8">
              <h2 className="text-xl font-black text-zinc-900 mb-1">Send us a Message</h2>
              <p className="text-sm text-zinc-500 mb-6">Fill in the form and we&apos;ll get back to you as soon as possible.</p>

              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Full Name <span className="text-accent-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="03XX-XXXXXXX"
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Email Address <span className="text-accent-500">*</span></label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Subject <span className="text-accent-500">*</span></label>
                  <select className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all bg-white text-zinc-700">
                    <option value="">Select a topic</option>
                    <option value="order">Order Issue</option>
                    <option value="return">Return / Refund</option>
                    <option value="payment">Payment Problem</option>
                    <option value="product">Product Inquiry</option>
                    <option value="vendor">Become a Vendor</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Order Number (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-2024-XXXXX"
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Message <span className="text-accent-500">*</span></label>
                  <textarea
                    rows={5}
                    placeholder="Describe your issue or question in detail…"
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black py-3.5 rounded-xl transition-colors text-sm"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Quick Help Links ── */}
        <div className="mt-10 bg-white rounded-2xl border border-zinc-100 p-6">
          <h3 className="font-black text-zinc-900 mb-4">Quick Help</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "FAQs",           href: "/shop/faq",     desc: "Common questions"   },
              { label: "Return Policy",  href: "/shop/returns", desc: "4-day return window" },
              { label: "Privacy Policy", href: "/shop/privacy", desc: "Your data & rights"  },
              { label: "Track Order",    href: "/customer/orders", desc: "Check order status" },
            ].map(({ label, href, desc }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col gap-1 p-4 bg-zinc-50 hover:bg-brand-50 border border-zinc-100 hover:border-brand-200 rounded-xl transition-all group"
              >
                <span className="text-sm font-bold text-zinc-800 group-hover:text-brand-600">{label}</span>
                <span className="text-[11px] text-zinc-400">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

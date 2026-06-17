import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageCircle,
  HelpCircle,
  RotateCcw,
  Shield,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Package,
  CreditCard,
  Truck,
  UserCircle,
  Star,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Help Center — ZainStore.pk",
  description: "Get help with your orders, returns, account, and more. Contact ZainStore.pk support.",
};

const MAIN_LINKS = [
  {
    href: "/shop/faq",
    icon: HelpCircle,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    title: "FAQs",
    desc: "Quick answers to the most common questions about orders, delivery, and your account.",
    cta: "Browse FAQs",
  },
  {
    href: "/shop/returns",
    icon: RotateCcw,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    title: "Returns & Refunds",
    desc: "4-day return window. Learn how to return an item and get your money back.",
    cta: "Return Policy",
  },
  {
    href: "/shop/contact",
    icon: MessageCircle,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    title: "Contact Us",
    desc: "Reach our support team by phone, WhatsApp, or email. We're here to help.",
    cta: "Get in Touch",
  },
  {
    href: "/shop/privacy",
    icon: Shield,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    title: "Privacy Policy",
    desc: "Understand how we collect, use, and protect your personal information.",
    cta: "Read Policy",
  },
];

const TOPIC_LINKS = [
  {
    icon: Package,
    label: "Track My Order",
    href: "/customer/orders",
    color: "text-brand-500",
    bg: "bg-brand-50",
  },
  {
    icon: CreditCard,
    label: "Payment Issues",
    href: "/shop/faq#payments",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Truck,
    label: "Delivery Info",
    href: "/shop/faq#delivery",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: UserCircle,
    label: "Account & Login",
    href: "/shop/faq#account",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: RotateCcw,
    label: "Return an Item",
    href: "/shop/returns",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: Star,
    label: "Seller Support",
    href: "/register/vendor",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    icon: AlertCircle,
    label: "Report a Problem",
    href: "/shop/contact",
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    icon: MessageCircle,
    label: "Live Chat / WhatsApp",
    href: "https://wa.me/923478913290",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-zinc-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-500 to-accent-500 text-white">
        <div className="container mx-auto px-4 max-w-7xl py-14 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 mb-5">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Help Center</h1>
          <p className="text-white/80 text-base max-w-lg mx-auto">
            How can we help you today? Browse our resources or get in touch with our support team.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:03478913290"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-full"
            >
              <Phone className="h-4 w-4" />
              0347-891-3290
            </a>
            <a
              href="https://wa.me/923478913290"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-full"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href="mailto:support@zainstore.pk"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-full"
            >
              <Mail className="h-4 w-4" />
              Email Us
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-12 space-y-12">

        {/* Quick Topic Chips */}
        <section>
          <h2 className="text-lg font-black text-zinc-900 mb-5">Browse by Topic</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TOPIC_LINKS.map(({ icon: Icon, label, href, color, bg }) => (
              <Link
                key={label}
                href={href}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-zinc-100 hover:border-brand-200 hover:shadow-sm transition-all group"
              >
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>
                <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 leading-snug">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Main Support Cards */}
        <section>
          <h2 className="text-lg font-black text-zinc-900 mb-5">Support Resources</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MAIN_LINKS.map(({ href, icon: Icon, iconBg, iconColor, title, desc, cta }) => (
              <Link
                key={href}
                href={href}
                className="group bg-white rounded-2xl border border-zinc-100 p-6 hover:border-brand-200 hover:shadow-md transition-all flex flex-col gap-4"
              >
                <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 text-base mb-1">{title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 group-hover:text-brand-600 transition-colors">
                  {cta}
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Contact Info Band */}
        <section className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8">
          <h2 className="text-lg font-black text-zinc-900 mb-6">Contact Information</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 mb-0.5">Phone & WhatsApp</p>
                <a href="tel:03478913290" className="text-sm text-brand-500 hover:text-brand-600 font-medium block transition-colors">
                  0347-891-3290
                </a>
                <p className="text-xs text-zinc-400 mt-0.5">Mon–Sat, 9 AM – 9 PM PKT</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 mb-0.5">Email Support</p>
                <a href="mailto:support@zainstore.pk" className="text-sm text-blue-500 hover:text-blue-600 font-medium block transition-colors">
                  support@zainstore.pk
                </a>
                <p className="text-xs text-zinc-400 mt-0.5">Reply within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 mb-0.5">Coverage</p>
                <p className="text-sm text-zinc-700 font-medium">Pakistan Nationwide</p>
                <p className="text-xs text-zinc-400 mt-0.5">Delivery in 2–5 business days</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

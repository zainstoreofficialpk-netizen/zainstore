"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, HelpCircle, Search } from "lucide-react";

const FAQS = [
  {
    category: "Orders",
    color: "bg-blue-50 text-blue-700 border-blue-100",
    items: [
      {
        q: "How do I place an order?",
        a: "Browse products, add them to your cart, then proceed to checkout. Enter your delivery address and choose Cash on Delivery (COD) as your payment method. You'll receive an order confirmation SMS/call shortly after.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "You can cancel your order within 2 hours of placing it by contacting us at 0347-891-3290. Once the order has been dispatched, cancellations are no longer possible.",
      },
      {
        q: "How do I track my order?",
        a: "Log in to your account and go to My Orders. You'll see the current status of each order. You can also call us at 0347-891-3290 with your order number for a real-time update.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We currently accept Cash on Delivery (COD) across Pakistan. Online payment via bank transfer and JazzCash/EasyPaisa options are coming soon.",
      },
    ],
  },
  {
    category: "Delivery",
    color: "bg-green-50 text-green-700 border-green-100",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 2–5 business days depending on your city. Major cities like Karachi, Lahore, and Islamabad typically receive orders within 2–3 days. Remote areas may take up to 7 days.",
      },
      {
        q: "Do you deliver across Pakistan?",
        a: "Yes, we deliver to all major cities and most towns across Pakistan. Delivery availability and timelines depend on the vendor and courier service in your area.",
      },
      {
        q: "Is there a delivery charge?",
        a: "Delivery charges vary by vendor and location. The exact delivery fee is shown at checkout before you confirm your order. Some vendors offer free delivery on their products — check individual product pages for details.",
      },
      {
        q: "What if I miss my delivery?",
        a: "Our courier will attempt delivery up to 2 times. If you miss both attempts, the order will be returned. Please call 0347-891-3290 to reschedule if you know you'll be unavailable.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    color: "bg-orange-50 text-orange-700 border-orange-100",
    items: [
      {
        q: "What is your return policy?",
        a: "We offer a 4-day return window from the date of delivery. Items must be unused, in original packaging, with all tags and accessories intact. Please see our full Return Policy for complete details.",
      },
      {
        q: "How do I initiate a return?",
        a: "Contact us within 4 days of receiving your order at 0347-891-3290 or support@zainstore.pk. Provide your order number and reason for return. We'll arrange pickup from your address.",
      },
      {
        q: "When will I get my refund?",
        a: "Once we receive and inspect the returned item (3–5 business days), your refund will be processed. For COD orders, refunds are made via bank transfer within 5–7 business days.",
      },
      {
        q: "What items cannot be returned?",
        a: "The following cannot be returned: perishable goods, personal care/hygiene products (opened), digital downloads, customised/personalised items, and items marked as 'Non-Returnable' on the product page.",
      },
    ],
  },
  {
    category: "Account & Security",
    color: "bg-purple-50 text-purple-700 border-purple-100",
    items: [
      {
        q: "How do I create an account?",
        a: "Click 'Account' in the top navigation and select 'Create Account'. Fill in your name, email, and password. You'll receive a verification email — click the link to activate your account.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "Click 'Account' → 'Sign In' → 'Forgot Password'. Enter your registered email address and we'll send you a password reset link valid for 1 hour.",
      },
      {
        q: "Is my personal information safe?",
        a: "Yes. We use SSL encryption for all transactions and never share your personal data with third parties for marketing purposes. Read our full Privacy Policy for complete details.",
      },
    ],
  },
  {
    category: "Sellers & Products",
    color: "bg-brand-50 text-brand-700 border-brand-100",
    items: [
      {
        q: "How do I become a seller on ZainStore.pk?",
        a: "Register as a vendor at /register/vendor. Fill in your store details and submit for approval. Our team reviews applications within 1–2 business days. Once approved, you can start listing products.",
      },
      {
        q: "Are products on ZainStore.pk authentic?",
        a: "We verify all vendors before approving them. However, if you receive a product that does not match its description, contact us immediately and we will resolve the issue with the vendor.",
      },
      {
        q: "How do I report a fake or misleading product?",
        a: "Click 'Report' on the product page or email us at support@zainstore.pk with the product link and details. We take all reports seriously and investigate within 24 hours.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-zinc-100 rounded-xl overflow-hidden transition-all ${open ? "shadow-sm" : ""}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className={`text-sm font-semibold leading-snug ${open ? "text-brand-600" : "text-zinc-800"}`}>{q}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-brand-500" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <div className="border-t border-zinc-50 pt-3">
            <p className="text-sm text-zinc-600 leading-relaxed">{a}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        (activeCategory === "All" || cat.category === activeCategory) &&
        (search === "" ||
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((cat) => cat.items.length > 0);

  const categories = ["All", ...FAQS.map((c) => c.category)];

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-4">
            <Link href="/shop" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80 font-semibold">FAQs</span>
          </nav>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-brand-500 rounded-2xl flex items-center justify-center shrink-0">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black">Frequently Asked Questions</h1>
              <p className="text-white/60 text-sm mt-1">Find quick answers to common questions</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-lg mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white text-zinc-800 placeholder-zinc-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 sticky top-4">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Categories</p>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      activeCategory === cat
                        ? "bg-brand-50 text-brand-700"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100">
                <p className="text-xs font-bold text-zinc-700 mb-2">Still need help?</p>
                <Link
                  href="/shop/contact"
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
                >
                  Contact Support →
                </Link>
              </div>
            </div>
          </aside>

          {/* FAQs */}
          <div className="flex-1 min-w-0 space-y-8">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
                <HelpCircle className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
                <p className="font-bold text-zinc-600">No results found</p>
                <p className="text-sm text-zinc-400 mt-1">Try different keywords or <Link href="/shop/contact" className="text-brand-500">contact us</Link></p>
              </div>
            ) : filtered.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-black px-3 py-1 rounded-full border ${cat.color}`}>{cat.category}</span>
                  <span className="text-xs text-zinc-400">{cat.items.length} questions</span>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

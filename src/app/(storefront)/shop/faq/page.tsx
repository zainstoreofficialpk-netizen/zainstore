import type { Metadata } from "next";
import { FaqPageClient, type FaqCategory } from "@/components/storefront/faq-client";

export const metadata: Metadata = {
  title: "FAQs — Orders, Delivery, Returns & Refunds",
  description:
    "Answers to common questions about placing orders, delivery times across Pakistan, returns & refunds, account security, and selling on ZainStore.pk.",
  alternates: { canonical: "https://zainstore.pk/shop/faq" },
  openGraph: {
    type: "website",
    title: "Frequently Asked Questions | ZainStore.pk",
    description: "Quick answers about orders, delivery, returns, refunds, and selling on ZainStore.pk.",
    url: "https://zainstore.pk/shop/faq",
    siteName: "ZainStore.pk",
  },
};

const FAQS: FaqCategory[] = [
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

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.flatMap((cat) =>
      cat.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <FaqPageClient faqs={FAQS} />
    </>
  );
}

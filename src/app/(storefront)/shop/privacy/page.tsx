import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Shield, Lock, Eye, Database, Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — ZainStore.pk",
  description: "Learn how ZainStore.pk collects, uses, and protects your personal information.",
};

function Section({ id, icon: Icon, iconBg, title, children }: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-7 scroll-mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-black text-zinc-900">{title}</h2>
      </div>
      <div className="text-sm text-zinc-600 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

const TOC = [
  { id: "collection",   label: "Information We Collect"       },
  { id: "use",          label: "How We Use Your Information"  },
  { id: "sharing",      label: "Information Sharing"          },
  { id: "security",     label: "Data Security"                },
  { id: "cookies",      label: "Cookies & Tracking"           },
  { id: "rights",       label: "Your Rights"                  },
  { id: "third-party",  label: "Third-Party Links"            },
  { id: "children",     label: "Children's Privacy"           },
  { id: "changes",      label: "Changes to This Policy"       },
  { id: "contact",      label: "Contact Us"                   },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 text-white">
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-4">
            <Link href="/shop" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80 font-semibold">Privacy Policy</span>
          </nav>
          <div className="flex items-center gap-4 mb-3">
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black">Privacy Policy</h1>
              <p className="text-white/50 text-sm mt-1">Effective Date: June 2025 · Last Updated: June 2025</p>
            </div>
          </div>
          <p className="text-white/70 text-sm max-w-2xl">
            ZainStore.pk is committed to protecting your privacy. This policy explains what information we collect,
            how we use it, and the choices you have about your data.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Table of Contents */}
          <aside className="lg:w-60 shrink-0">
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 sticky top-4">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Contents</p>
              <nav className="space-y-0.5">
                {TOC.map(({ id, label }, i) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-zinc-600 hover:text-brand-600 hover:bg-brand-50 transition-colors font-medium"
                  >
                    <span className="text-[10px] text-zinc-300 font-bold w-4 shrink-0">{i + 1}.</span>
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-5">

            <Section id="collection" icon={Database} iconBg="bg-blue-50 text-blue-600" title="1. Information We Collect">
              <p>We collect information you provide directly to us and information generated through your use of our platform:</p>
              <div className="space-y-2">
                <div className="bg-zinc-50 rounded-xl p-4">
                  <p className="font-bold text-zinc-800 mb-1.5">Information You Provide</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-600">
                    <li>Name, email address, phone number when you register</li>
                    <li>Delivery address and billing information</li>
                    <li>Order history and transaction details</li>
                    <li>Reviews and feedback you submit</li>
                    <li>Communications with our support team</li>
                  </ul>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4">
                  <p className="font-bold text-zinc-800 mb-1.5">Automatically Collected Information</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-600">
                    <li>Device type, browser, and operating system</li>
                    <li>IP address and approximate location</li>
                    <li>Pages visited and search queries on our platform</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section id="use" icon={Eye} iconBg="bg-green-50 text-green-600" title="2. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Process and fulfil your orders</li>
                <li>Create and manage your account</li>
                <li>Send order confirmations, updates, and delivery notifications via SMS/email</li>
                <li>Respond to your support requests and enquiries</li>
                <li>Improve our platform, products, and services</li>
                <li>Detect and prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
                <li>Send promotional communications (only with your consent — you may opt out anytime)</li>
              </ul>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mt-2">
                <p className="font-semibold text-green-800">
                  We will never sell your personal information to third parties for their marketing purposes.
                </p>
              </div>
            </Section>

            <Section id="sharing" icon={Shield} iconBg="bg-purple-50 text-purple-600" title="3. Information Sharing">
              <p>We do not sell your personal data. We may share information only in these limited circumstances:</p>
              <div className="space-y-3">
                {[
                  { title: "Vendors", desc: "Your delivery address, name, and phone number are shared with the relevant vendor only to fulfil your order." },
                  { title: "Delivery Partners", desc: "Courier services receive your name, phone number, and delivery address to complete delivery." },
                  { title: "Payment Processors", desc: "If you pay online, your payment details are processed securely by our payment partner. We do not store your full card details." },
                  { title: "Legal Requirements", desc: "We may disclose information if required by law, court order, or government authority." },
                  { title: "Business Transfers", desc: "If ZainStore.pk is acquired or merges, your data may be transferred as part of that transaction." },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3 bg-zinc-50 rounded-xl p-3.5">
                    <div className="h-2 w-2 bg-purple-400 rounded-full shrink-0 mt-1.5" />
                    <div>
                      <span className="font-bold text-zinc-800">{title}: </span>
                      <span className="text-zinc-600">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="security" icon={Lock} iconBg="bg-amber-50 text-amber-600" title="4. Data Security">
              <p>We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>SSL/TLS encryption for all data transmitted between your browser and our servers</li>
                <li>Encrypted storage of sensitive account information</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Restricted internal access to personal data on a need-to-know basis</li>
              </ul>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-2">
                <p className="text-amber-800">
                  While we take security seriously, no system is 100% secure. Please use a strong, unique password and never share your account credentials with anyone.
                </p>
              </div>
            </Section>

            <Section id="cookies" icon={Database} iconBg="bg-cyan-50 text-cyan-600" title="5. Cookies & Tracking">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Keep you logged in and remember your preferences</li>
                <li>Maintain your shopping cart</li>
                <li>Analyse how users interact with our platform</li>
                <li>Show you relevant products and promotions</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Disabling cookies may limit some functionality of the platform such as staying signed in or maintaining your cart.
              </p>
            </Section>

            <Section id="rights" icon={Shield} iconBg="bg-rose-50 text-rose-600" title="6. Your Rights">
              <p>You have the following rights regarding your personal information:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Access",      desc: "Request a copy of the data we hold about you" },
                  { title: "Correction",  desc: "Update inaccurate or incomplete information" },
                  { title: "Deletion",    desc: "Request deletion of your account and data" },
                  { title: "Opt-Out",     desc: "Unsubscribe from marketing emails at any time" },
                  { title: "Portability", desc: "Receive your data in a machine-readable format" },
                  { title: "Objection",   desc: "Object to certain uses of your data" },
                ].map(({ title, desc }) => (
                  <div key={title} className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100">
                    <p className="font-bold text-zinc-800 text-xs mb-0.5">{title}</p>
                    <p className="text-[11px] text-zinc-500">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2">
                To exercise any of these rights, contact us at <a href="mailto:support@zainstore.pk" className="text-brand-500 font-semibold hover:underline">support@zainstore.pk</a>.
              </p>
            </Section>

            <Section id="third-party" icon={Eye} iconBg="bg-orange-50 text-orange-600" title="7. Third-Party Links">
              <p>
                Our platform may contain links to third-party websites (vendor social pages, external resources). We are not responsible for the privacy practices of those websites. We encourage you to read their privacy policies before providing any information.
              </p>
            </Section>

            <Section id="children" icon={Shield} iconBg="bg-pink-50 text-pink-600" title="8. Children's Privacy">
              <p>
                ZainStore.pk is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately and we will delete it.
              </p>
            </Section>

            <Section id="changes" icon={Database} iconBg="bg-indigo-50 text-indigo-600" title="9. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. When we make significant changes, we will notify you via email or a prominent notice on our website. The date at the top of this page shows when the policy was last updated.
              </p>
              <p>
                Your continued use of ZainStore.pk after any changes constitutes your acceptance of the updated policy.
              </p>
            </Section>

            {/* Contact */}
            <div id="contact" className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-black text-white mb-1">10. Contact Us About Privacy</h2>
              <p className="text-zinc-400 text-sm mb-5">
                If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please reach out:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a href="tel:03478913290" className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl p-4 transition-colors group">
                  <div className="h-9 w-9 bg-brand-500 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold">Phone / WhatsApp</p>
                    <p className="text-white font-black text-sm">0347-891-3290</p>
                  </div>
                </a>
                <a href="mailto:support@zainstore.pk" className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl p-4 transition-colors group">
                  <div className="h-9 w-9 bg-brand-500 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold">Email</p>
                    <p className="text-white font-black text-sm">support@zainstore.pk</p>
                  </div>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

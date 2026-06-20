"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  ChevronDown,
  Check,
  AlertCircle,
  Loader2,
  Package,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  User,
  ArrowLeft,
  Lock,
  Zap,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useCartStore, cartSubtotal } from "@/lib/store/cart-store";
import type { CartItem } from "@/lib/store/cart-store";
import {
  PROVINCES,
  CITIES_BY_PROVINCE,
  ALL_CITIES,
  getProvinceForCity,
} from "@/lib/checkout/pakistan-data";
import { validateCoupon, placeOrder } from "@/lib/checkout/actions";
import { readStoredUtm } from "@/components/shared/utm-tracker";
import { calculateShipping, type ShippingSettings } from "@/lib/shipping";

// ─── Types ────────────────────────────────────────────────────

type User = { id: string; name: string | null; email: string | null; role: string } | null;

type FormState = {
  email: string;
  phone: string;
  fullName: string;
  province: string;
  city: string;
  area: string;
  streetAddress: string;
  postalCode: string;
  orderNotes: string;
  shippingMethod: string;
  paymentMethod: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const SAVE_KEY = "zainstore-checkout-form";
const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order" },
  { id: "easypaisa", label: "EasyPaisa", desc: "Pay via EasyPaisa mobile wallet" },
  { id: "jazzcash", label: "JazzCash", desc: "Pay via JazzCash mobile wallet" },
  { id: "bank_transfer", label: "Bank Transfer", desc: "Transfer to our bank account" },
];

// ─── Payment method logos ────────────────────────────────────

function PaymentLogo({ id }: { id: string }) {
  if (id === "cod") {
    return (
      <div className="h-9 w-14 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
        <svg viewBox="0 0 40 24" fill="none" className="h-5 w-8">
          <rect x="2" y="4" width="36" height="16" rx="2" fill="white" fillOpacity="0.25"/>
          <rect x="2" y="4" width="36" height="16" rx="2" stroke="white" strokeWidth="1.5"/>
          <circle cx="16" cy="12" r="5" fill="white" fillOpacity="0.9"/>
          <circle cx="24" cy="12" r="5" fill="white" fillOpacity="0.5"/>
          <path d="M18 12a5 5 0 0 1 2-4 5 5 0 0 0 0 8 5 5 0 0 1-2-4z" fill="white" fillOpacity="0.3"/>
        </svg>
      </div>
    );
  }

  if (id === "easypaisa") {
    return (
      <div className="h-9 w-14 rounded-lg overflow-hidden shrink-0 shadow-sm" style={{ background: "#00a651" }}>
        <svg viewBox="0 0 56 36" fill="none" className="w-full h-full">
          {/* Green background */}
          <rect width="56" height="36" fill="#00a651"/>
          {/* White stylised "ep" mark */}
          <circle cx="18" cy="18" r="8" fill="white"/>
          <rect x="22" y="12" width="14" height="3.5" rx="1.75" fill="white"/>
          <rect x="22" y="17" width="10" height="3.5" rx="1.75" fill="white"/>
          <rect x="22" y="22" width="12" height="3.5" rx="1.75" fill="white"/>
          {/* Inner circle cutout to form "e" */}
          <circle cx="18" cy="18" r="4.5" fill="#00a651"/>
          <rect x="13" y="16.5" width="9" height="3" rx="1.5" fill="white"/>
        </svg>
      </div>
    );
  }

  if (id === "jazzcash") {
    return (
      <div className="h-9 w-14 rounded-lg overflow-hidden shrink-0 shadow-sm" style={{ background: "#c8102e" }}>
        <svg viewBox="0 0 56 36" fill="none" className="w-full h-full">
          {/* Red background */}
          <rect width="56" height="36" fill="#c8102e"/>
          {/* "J" letterform */}
          <rect x="10" y="8" width="6" height="18" rx="3" fill="white"/>
          <path d="M16 22 Q16 28 10 28 Q7 28 7 25" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
          {/* "C" letterform */}
          <path d="M28 10 Q20 10 20 18 Q20 26 28 26" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
          {/* Cash coin */}
          <circle cx="42" cy="18" r="8" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5"/>
          <text x="42" y="22" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">₨</text>
        </svg>
      </div>
    );
  }

  if (id === "bank_transfer") {
    return (
      <div className="h-9 w-14 rounded-lg bg-blue-700 flex items-center justify-center shrink-0 shadow-sm">
        <svg viewBox="0 0 40 28" fill="none" className="h-6 w-10">
          {/* Bank building */}
          <polygon points="20,3 4,11 36,11" fill="white" fillOpacity="0.9"/>
          <rect x="6" y="12" width="4" height="9" rx="1" fill="white" fillOpacity="0.9"/>
          <rect x="12" y="12" width="4" height="9" rx="1" fill="white" fillOpacity="0.9"/>
          <rect x="18" y="12" width="4" height="9" rx="1" fill="white" fillOpacity="0.9"/>
          <rect x="24" y="12" width="4" height="9" rx="1" fill="white" fillOpacity="0.9"/>
          <rect x="30" y="12" width="4" height="9" rx="1" fill="white" fillOpacity="0.9"/>
          <rect x="4" y="22" width="32" height="3" rx="1" fill="white" fillOpacity="0.9"/>
        </svg>
      </div>
    );
  }

  return null;
}

// ─── Main component ───────────────────────────────────────────

export function CheckoutClient({ user, shippingSettings }: { user: User; shippingSettings: ShippingSettings }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [mounted, setMounted] = useState(false);

  // Form state
  const [form, setForm] = useState<FormState>({
    email: user?.email ?? "",
    phone: "",
    fullName: user?.name ?? "",
    province: "",
    city: "",
    area: "",
    streetAddress: "",
    postalCode: "",
    orderNotes: "",
    shippingMethod: "standard",
    paymentMethod: "cod",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormState>>(new Set());

  // City search
  const [citySearch, setCitySearch] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<{
    valid: boolean;
    type?: string;
    value?: number;
    code?: string;
    description?: string;
    error?: string;
    scope?: "platform" | "vendor";
    vendorId?: string | null;
    storeName?: string | null;
    eligibleSubtotal?: number;
    discountAmount?: number;
  } | null>(null);

  // Shipping (weight-based — no city selection needed)

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState<{ orderNumber: string; orderId: string } | null>(null);

  // ── Hydration guard ──────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    // Restore saved form
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormState>;
        setForm((prev) => ({
          ...prev,
          ...parsed,
          email: user?.email ?? parsed.email ?? "",
          fullName: user?.name ?? parsed.fullName ?? "",
        }));
        if (parsed.city) setCitySearch(parsed.city);
      }
    } catch {}
  }, [user]);

  // ── Auto-save ────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;
    try {
      const { paymentMethod: _, ...toSave } = form;
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    } catch {}
  }, [form, mounted]);

  // ── Click outside to close city dropdown ────────────────────

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ── Derived values ────────────────────────────────────────────

  const subtotal = mounted ? cartSubtotal(items) : 0;

  // Weight-based shipping: sum all item weights × qty
  const totalWeightGrams = mounted
    ? items.reduce((sum, item) => sum + (item.weightGrams ?? 500) * item.quantity, 0)
    : 0;

  const { price: baseShipping, tier: shippingTier } = calculateShipping(totalWeightGrams, shippingSettings);
  const shippingCost =
    couponResult?.valid && couponResult.type === "FREE_SHIPPING"
      ? 0
      : baseShipping;

  // Use server-computed discountAmount (already scoped to eligible vendor items)
  const discountAmount = couponResult?.valid ? (couponResult.discountAmount ?? 0) : 0;

  const grandTotal = subtotal + shippingCost - discountAmount;

  // ── City list filtered ────────────────────────────────────────

  const citiesForProvince = form.province
    ? (CITIES_BY_PROVINCE[form.province as keyof typeof CITIES_BY_PROVINCE] ?? ALL_CITIES)
    : ALL_CITIES;

  const filteredCities = citySearch
    ? citiesForProvince.filter((c) =>
        c.toLowerCase().includes(citySearch.toLowerCase())
      )
    : citiesForProvince;

  // ── Field change handler ─────────────────────────────────────

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setTouched((t) => new Set(t).add(key));
    // Clear error on change
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  // ── Validation ───────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!form.phone.trim() || !/^(\+92|0)?[0-9]{10,11}$/.test(form.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Enter a valid Pakistani mobile number";
    }
    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      newErrors.fullName = "Enter your full name";
    }
    if (!form.province) newErrors.province = "Select your province";
    if (!form.city) newErrors.city = "Select your city";
    if (!form.streetAddress.trim() || form.streetAddress.trim().length < 5) {
      newErrors.streetAddress = "Enter a complete street address";
    }
    setErrors(newErrors);
    // Mark all fields as touched
    setTouched(new Set(Object.keys(form) as (keyof FormState)[]));
    return Object.keys(newErrors).length === 0;
  }

  // ── Inline field validation on blur ─────────────────────────

  function validateField(key: keyof FormState) {
    setTouched((t) => new Set(t).add(key));
    const newErrors = { ...errors };
    switch (key) {
      case "email":
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          newErrors.email = "Enter a valid email address";
        } else delete newErrors.email;
        break;
      case "phone":
        if (!form.phone.trim() || !/^(\+92|0)?[0-9]{10,11}$/.test(form.phone.replace(/\s/g, ""))) {
          newErrors.phone = "Enter a valid Pakistani mobile number";
        } else delete newErrors.phone;
        break;
      case "fullName":
        if (!form.fullName.trim() || form.fullName.trim().length < 3) {
          newErrors.fullName = "Enter your full name";
        } else delete newErrors.fullName;
        break;
      case "streetAddress":
        if (!form.streetAddress.trim() || form.streetAddress.trim().length < 5) {
          newErrors.streetAddress = "Enter a complete street address";
        } else delete newErrors.streetAddress;
        break;
    }
    setErrors(newErrors);
  }

  // ── Coupon ───────────────────────────────────────────────────

  async function handleCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    const cartLines = items.map((i) => ({
      vendorId: i.vendorId ?? null,
      price: i.price,
      salePrice: i.salePrice,
      quantity: i.quantity,
    }));
    const result = await validateCoupon(couponInput, subtotal, cartLines);
    setCouponResult(result.valid ? result : { valid: false, error: result.error });
    setCouponLoading(false);
  }

  // ── Place order ──────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      document.getElementById("checkout-form")?.querySelectorAll("[data-error]")[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    const utm = readStoredUtm();

    const result = await placeOrder({
      email: form.email.trim(),
      phone: form.phone.trim(),
      fullName: form.fullName.trim(),
      province: form.province,
      city: form.city,
      area: form.area.trim(),
      streetAddress: form.streetAddress.trim(),
      postalCode: form.postalCode.trim(),
      orderNotes: form.orderNotes.trim(),
      subtotal,
      shippingTotal: shippingCost,
      discountTotal: discountAmount,
      grandTotal,
      couponCode: couponResult?.valid ? (couponResult.code ?? "") : "",
      shippingMethod: form.shippingMethod,
      paymentMethod: form.paymentMethod,
      items: items.map((item) => ({
        productId: item.id,
        name: item.name,
        sku: null,
        quantity: item.quantity,
        unitPrice: item.salePrice ?? item.price,
        imageUrl: item.imageUrl,
      })),
      orderSource: utm?.source ?? "DIRECT",
      sourceReference: utm?.reference ?? null,
    });

    setSubmitting(false);

    if (result.success) {
      clearCart();
      localStorage.removeItem(SAVE_KEY);
      setOrderPlaced({ orderNumber: result.orderNumber, orderId: result.orderId });
    } else {
      setSubmitError(result.error);
    }
  }

  // ── Order success screen ─────────────────────────────────────

  if (orderPlaced) {
    return <OrderSuccess orderNumber={orderPlaced.orderNumber} orderId={orderPlaced.orderId} paymentMethod={form.paymentMethod} city={form.city} />;
  }

  // ── Empty cart ───────────────────────────────────────────────

  if (mounted && items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <Package className="h-14 w-14 text-zinc-300" />
        <h2 className="text-xl font-black text-zinc-800">Your cart is empty</h2>
        <p className="text-sm text-zinc-500">Add products before checking out.</p>
        <Link
          href="/shop"
          className="h-11 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black text-sm transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-6xl h-14 flex items-center justify-between gap-4">
          <Link href="/shop" className="font-black text-lg text-zinc-900">
            Zain<span className="text-brand-500">Store</span>.pk
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Lock className="h-3.5 w-3.5 text-green-500" />
            Secure Checkout
          </div>
          <Link href="/shop" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Shop</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-6xl py-6 md:py-10">
        <form id="checkout-form" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 items-start">

            {/* ── LEFT: Checkout form ─────────────────────── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* ── Section: Contact ──────────────────────── */}
              <CheckoutSection icon={Mail} title="Contact Information" step={1}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Full Name"
                    icon={User}
                    required
                    error={touched.has("fullName") ? errors.fullName : undefined}
                    data-error={errors.fullName ? "true" : undefined}
                  >
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      onBlur={() => validateField("fullName")}
                      placeholder="Muhammad Ali"
                      autoComplete="name"
                      className={inputCls(touched.has("fullName") && !!errors.fullName)}
                    />
                  </FormField>

                  <FormField
                    label="Mobile Number"
                    icon={Phone}
                    required
                    error={touched.has("phone") ? errors.phone : undefined}
                  >
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      onBlur={() => validateField("phone")}
                      placeholder="03XX-XXXXXXX"
                      autoComplete="tel"
                      className={inputCls(touched.has("phone") && !!errors.phone)}
                    />
                  </FormField>

                  <FormField
                    label="Email Address"
                    icon={Mail}
                    required
                    error={touched.has("email") ? errors.email : undefined}
                    className="sm:col-span-2"
                  >
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      onBlur={() => validateField("email")}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={inputCls(touched.has("email") && !!errors.email)}
                    />
                  </FormField>
                </div>
              </CheckoutSection>

              {/* ── Section: Delivery Address ────────────── */}
              <CheckoutSection icon={MapPin} title="Delivery Address" step={2}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Country — locked */}
                  <FormField label="Country" className="sm:col-span-2">
                    <div className="flex items-center gap-2 h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-500">
                      <span className="text-base">🇵🇰</span>
                      <span className="font-medium text-zinc-700">Pakistan</span>
                      <Lock className="h-3 w-3 ml-auto text-zinc-400" />
                    </div>
                  </FormField>

                  {/* Province */}
                  <FormField
                    label="Province"
                    required
                    error={touched.has("province") ? errors.province : undefined}
                  >
                    <div className="relative">
                      <select
                        value={form.province}
                        onChange={(e) => {
                          setField("province", e.target.value);
                          setField("city", "");
                          setCitySearch("");
                        }}
                        className={selectCls(touched.has("province") && !!errors.province)}
                      >
                        <option value="">Select province</option>
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </FormField>

                  {/* City — searchable dropdown */}
                  <FormField
                    label="City"
                    required
                    error={touched.has("city") ? errors.city : undefined}
                  >
                    <div ref={cityRef} className="relative">
                      <input
                        type="text"
                        value={citySearch}
                        onChange={(e) => {
                          setCitySearch(e.target.value);
                          setCityOpen(true);
                          if (!e.target.value) {
                            setField("city", "");
                          }
                        }}
                        onFocus={() => setCityOpen(true)}
                        placeholder="Search city..."
                        className={inputCls(touched.has("city") && !!errors.city)}
                        autoComplete="off"
                      />
                      {form.city && (
                        <button
                          type="button"
                          onClick={() => { setField("city", ""); setCitySearch(""); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {cityOpen && filteredCities.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                          {filteredCities.slice(0, 40).map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => {
                                setField("city", city);
                                setCitySearch(city);
                                setCityOpen(false);
                                // Auto-set province if not already set
                                if (!form.province) {
                                  const prov = getProvinceForCity(city);
                                  if (prov) setField("province", prov);
                                }
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-brand-50 transition-colors ${
                                city === form.city ? "bg-brand-50 text-brand-700 font-semibold" : "text-zinc-700"
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormField>

                  {/* Area */}
                  <FormField label="Area / Town">
                    <input
                      type="text"
                      value={form.area}
                      onChange={(e) => setField("area", e.target.value)}
                      placeholder="DHA, Gulberg, F-7..."
                      autoComplete="address-level3"
                      className={inputCls(false)}
                    />
                  </FormField>

                  {/* Postal code */}
                  <FormField label="Postal Code" hint="Optional">
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => setField("postalCode", e.target.value)}
                      placeholder="54000"
                      autoComplete="postal-code"
                      className={inputCls(false)}
                    />
                  </FormField>

                  {/* Street address */}
                  <FormField
                    label="Street Address"
                    required
                    error={touched.has("streetAddress") ? errors.streetAddress : undefined}
                    className="sm:col-span-2"
                  >
                    <input
                      type="text"
                      value={form.streetAddress}
                      onChange={(e) => setField("streetAddress", e.target.value)}
                      onBlur={() => validateField("streetAddress")}
                      placeholder="House #, Street #, Block..."
                      autoComplete="street-address"
                      className={inputCls(touched.has("streetAddress") && !!errors.streetAddress)}
                    />
                  </FormField>

                  {/* Order notes */}
                  <FormField label="Order Notes" hint="Optional" className="sm:col-span-2">
                    <textarea
                      value={form.orderNotes}
                      onChange={(e) => setField("orderNotes", e.target.value)}
                      placeholder="Any special instructions for delivery..."
                      rows={2}
                      className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all resize-none"
                    />
                  </FormField>
                </div>
              </CheckoutSection>

              {/* ── Section: Shipping ─────────────── */}
              <CheckoutSection icon={Truck} title="Delivery" step={3}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-brand-500 bg-brand-50/50">
                      <div className="h-5 w-5 rounded-full border-2 border-brand-500 flex items-center justify-center shrink-0">
                        <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-800">PostEx Cash on Delivery</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {shippingTier ? shippingTier.label : "Standard delivery"} · Estimated 2–5 business days
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Order weight: ~{totalWeightGrams >= 1000 ? `${(totalWeightGrams / 1000).toFixed(1)}kg` : `${totalWeightGrams}g`}
                        </p>
                      </div>
                      <div className="text-sm font-black text-zinc-900 shrink-0">
                        {shippingCost === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          formatCurrency(shippingCost)
                        )}
                      </div>
                    </div>
                  </div>
              </CheckoutSection>

              {/* ── Section: Payment Method ──────────────── */}
              <CheckoutSection icon={CreditCard} title="Payment Method" step={4}>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((pm) => {
                    const selected = form.paymentMethod === pm.id;
                    return (
                      <label
                        key={pm.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                          selected
                            ? "border-brand-500 bg-brand-50/50"
                            : "border-zinc-200 hover:border-zinc-300 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm.id}
                          checked={selected}
                          onChange={() => setField("paymentMethod", pm.id)}
                          className="sr-only"
                        />
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? "border-brand-500" : "border-zinc-300"
                        }`}>
                          {selected && <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-800">{pm.label}</p>
                          <p className="text-xs text-zinc-500">{pm.desc}</p>
                        </div>
                        {pm.id === "cod" && (
                          <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                            Popular
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Bank details — conditional */}
                {form.paymentMethod === "bank_transfer" && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
                    <p className="font-semibold text-blue-800 mb-2">Bank Transfer Details</p>
                    <div className="space-y-1 text-blue-700 font-mono text-xs">
                      <p>Bank: <span className="font-semibold">MCB Bank</span></p>
                      <p>IBAN: <span className="font-semibold">PK40MUCB1099341411003217</span></p>
                      <p>Title: <span className="font-semibold">ZainStore.pk</span></p>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Send screenshot to WhatsApp: <strong>0347-891-3290</strong></p>
                  </div>
                )}

                {(form.paymentMethod === "easypaisa" || form.paymentMethod === "jazzcash") && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm">
                    <p className="font-semibold text-green-800 mb-1">
                      {form.paymentMethod === "easypaisa" ? "EasyPaisa" : "JazzCash"} Account
                    </p>
                    <p className="text-green-700 font-mono text-xs font-semibold">
                      {form.paymentMethod === "easypaisa" ? "03478913290" : "0347-891-3290"}
                    </p>
                    <p className="text-xs text-green-600 mt-1.5">
                      Send payment to the above number and share the transaction ID via WhatsApp.
                    </p>
                  </div>
                )}
              </CheckoutSection>

              {/* ── Error banner ─────────────────────────── */}
              {submitError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* ── Mobile CTA (shows below form on small screens) */}
              <div className="xl:hidden">
                <PlaceOrderButton submitting={submitting} grandTotal={grandTotal} mounted={mounted} />
              </div>
            </div>

            {/* ── RIGHT: Order summary ─────────────────────── */}
            <div className="w-full xl:w-[400px] shrink-0">
              <div className="sticky top-20">
                <OrderSummaryPanel
                  items={mounted ? items : []}
                  subtotal={subtotal}
                  shippingCost={shippingCost}
                  discountAmount={discountAmount}
                  grandTotal={grandTotal}
                  couponInput={couponInput}
                  setCouponInput={setCouponInput}
                  couponResult={couponResult}
                  couponLoading={couponLoading}
                  onApplyCoupon={handleCoupon}
                  onRemoveCoupon={() => { setCouponResult(null); setCouponInput(""); }}
                  shippingTierLabel={shippingTier?.label ?? "Standard delivery"}
                  city={form.city}
                  submitting={submitting}
                  grandTotalFormatted={mounted ? formatCurrency(grandTotal) : "—"}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────

function CheckoutSection({
  icon: Icon,
  title,
  step,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
        <div className="h-7 w-7 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-brand-600" />
        </div>
        <h2 className="font-black text-zinc-900 text-sm">{title}</h2>
        <span className="ml-auto text-xs text-zinc-400 font-semibold">{step} of 4</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Form field wrapper ───────────────────────────────────────

function FormField({
  label,
  children,
  error,
  hint,
  required,
  icon: Icon,
  className = "",
  ...rest
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`} {...rest}>
      <label className="text-xs font-semibold text-zinc-600 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-zinc-400 font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5" data-error="true">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input class helpers ──────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full h-11 px-3 border rounded-xl text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all ${
    hasError
      ? "border-red-300 bg-red-50/30 focus:ring-red-300"
      : "border-zinc-200 focus:ring-brand-400 focus:border-transparent"
  }`;
}

function selectCls(hasError: boolean) {
  return `w-full h-11 pl-3 pr-8 border rounded-xl text-sm text-zinc-800 focus:outline-none focus:ring-2 transition-all appearance-none bg-white ${
    hasError
      ? "border-red-300 bg-red-50/30 focus:ring-red-300"
      : "border-zinc-200 focus:ring-brand-400 focus:border-transparent"
  }`;
}

// ─── Order summary panel ──────────────────────────────────────

function OrderSummaryPanel({
  items,
  subtotal,
  shippingCost,
  discountAmount,
  grandTotal,
  couponInput,
  setCouponInput,
  couponResult,
  couponLoading,
  onApplyCoupon,
  onRemoveCoupon,
  shippingTierLabel,
  city,
  submitting,
  grandTotalFormatted,
}: {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  grandTotal: number;
  couponInput: string;
  setCouponInput: (v: string) => void;
  couponResult: { valid: boolean; type?: string; value?: number; code?: string; description?: string; error?: string; scope?: "platform" | "vendor"; vendorId?: string | null; storeName?: string | null; eligibleSubtotal?: number; discountAmount?: number } | null;
  couponLoading: boolean;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  shippingTierLabel: string;
  city: string;
  submitting: boolean;
  grandTotalFormatted: string;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-black text-zinc-900 text-sm">Order Summary</h2>
          <span className="text-xs text-zinc-500">{items.reduce((s, i) => s + i.quantity, 0)} items</span>
        </div>

        {/* Items */}
        <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
          {items.map((item) => {
            const price = (item.salePrice ?? item.price) * item.quantity;
            return (
              <div key={item.id} className="flex items-center gap-3">
                {/* Image */}
                <div className="relative shrink-0">
                  <div className="h-14 w-14 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-lg font-black text-zinc-300">{item.name[0]}</span>
                      </div>
                    )}
                  </div>
                  {/* Qty badge */}
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-zinc-800 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 line-clamp-2 leading-snug">{item.name}</p>
                  {item.storeName && (
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{item.storeName}</p>
                  )}
                </div>
                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-zinc-900">{formatCurrency(price)}</p>
                  {item.salePrice && item.salePrice < item.price && (
                    <p className="text-[10px] text-zinc-400 line-through">{formatCurrency(item.price * item.quantity)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coupon */}
        <div className="px-4 pb-4">
          {couponResult?.valid ? (
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-green-600 shrink-0" />
                <span className="font-semibold text-green-700 flex-1">{couponResult.code} — {couponResult.description}</span>
                <button type="button" onClick={onRemoveCoupon} className="text-green-600 hover:text-green-800">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {couponResult.scope === "vendor" && couponResult.storeName && (
                <p className="text-[10px] text-green-600 pl-5">
                  Applies to <strong>{couponResult.storeName}</strong> products only
                </p>
              )}
              {couponResult.scope === "platform" && (
                <p className="text-[10px] text-green-600 pl-5">Platform-wide coupon — applies to all items</p>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onApplyCoupon())}
                placeholder="Coupon code"
                className="flex-1 h-9 px-3 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all font-mono uppercase"
              />
              <button
                type="button"
                onClick={onApplyCoupon}
                disabled={couponLoading || !couponInput.trim()}
                className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Tag className="h-3 w-3" />}
                Apply
              </button>
            </div>
          )}
          {couponResult && !couponResult.valid && couponResult.error && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {couponResult.error}
            </p>
          )}
        </div>

        {/* Price breakdown */}
        <div className="px-5 py-4 border-t border-zinc-100 space-y-2.5">
          <LineItem label="Subtotal" value={formatCurrency(subtotal)} />
          <LineItem
            label={`Shipping${city ? ` to ${city}` : ""}`}
            value={shippingCost === 0 ? "FREE" : formatCurrency(shippingCost)}
            valueClass={shippingCost === 0 ? "text-green-600" : undefined}
          />
          {discountAmount > 0 && (
            <LineItem
              label="Discount"
              value={`-${formatCurrency(discountAmount)}`}
              valueClass="text-green-600"
            />
          )}

          <div className="border-t border-zinc-200 pt-2.5 flex items-center justify-between">
            <span className="font-black text-zinc-900 text-sm">Total</span>
            <div className="text-right">
              <span className="font-black text-xl text-zinc-900">{grandTotalFormatted}</span>
              <p className="text-[10px] text-zinc-400">PKR (incl. all charges)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: ShieldCheck, label: "Secure Checkout", color: "text-green-600 bg-green-50" },
            { icon: Truck, label: "Fast Delivery", color: "text-brand-600 bg-brand-50" },
            { icon: RotateCcw, label: "Easy Returns", color: "text-blue-600 bg-blue-50" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1.5">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-[9px] font-semibold text-zinc-600 leading-tight">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-zinc-400 mt-3 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Your order is protected and secured.
        </p>
      </div>

      {/* Desktop CTA */}
      <div className="hidden xl:block">
        <PlaceOrderButton submitting={submitting} grandTotal={grandTotal} mounted={true} />
      </div>
    </div>
  );
}

// ─── Line item ────────────────────────────────────────────────

function LineItem({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-semibold ${valueClass ?? "text-zinc-800"}`}>{value}</span>
    </div>
  );
}

// ─── Place order button ───────────────────────────────────────

function PlaceOrderButton({
  submitting,
  grandTotal,
  mounted,
}: {
  submitting: boolean;
  grandTotal: number;
  mounted: boolean;
}) {
  return (
    <button
      type="submit"
      form="checkout-form"
      disabled={submitting}
      className="w-full h-14 bg-accent-500 hover:bg-accent-600 disabled:bg-zinc-300 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-accent-200 hover:shadow-xl hover:shadow-accent-300 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none"
    >
      {submitting ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Placing Order...
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" />
          Place Order · {mounted ? formatCurrency(grandTotal) : "..."}
          <Zap className="h-4 w-4 opacity-80" />
        </>
      )}
    </button>
  );
}

// ─── Confetti particle ────────────────────────────────────────

const CONFETTI_COLORS = [
  "#faa42d", "#f1672e", "#6366f1", "#ec4899",
  "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ef4444", "#14b8a6",
];

function ConfettiBurst() {
  const pieces = Array.from({ length: 30 }, (_, i) => {
    const angle   = (i / 30) * 360;
    const dist    = 60 + Math.random() * 80;
    const delay   = Math.random() * 0.3;
    const size    = 5 + Math.random() * 6;
    const color   = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const isRect  = i % 3 !== 0;
    const tx      = Math.cos((angle * Math.PI) / 180) * dist;
    const ty      = Math.sin((angle * Math.PI) / 180) * dist;
    const rot     = Math.random() * 720 - 360;

    return (
      <span
        key={i}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width:  isRect ? size : size * 0.8,
          height: isRect ? size * 0.5 : size * 0.8,
          borderRadius: isRect ? "2px" : "50%",
          background: color,
          transform: "translate(-50%,-50%)",
          animation: `confettiFly 0.9s ease-out ${delay}s both`,
          // pass tx/ty/rot via CSS custom properties
          ["--tx" as string]: `${tx}px`,
          ["--ty" as string]: `${ty}px`,
          ["--rot" as string]: `${rot}deg`,
          opacity: 0,
        }}
      />
    );
  });

  return (
    <>
      <style>{`
        @keyframes confettiFly {
          0%   { transform: translate(-50%,-50%) scale(0) rotate(0deg); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes popIn {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.25) rotate(6deg); }
          80%  { transform: scale(0.92) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ringPulse {
          0%   { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
        {pieces}
      </div>
    </>
  );
}

// ─── Order success screen ─────────────────────────────────────

function OrderSuccess({
  orderNumber,
  orderId,
  paymentMethod,
  city,
}: {
  orderNumber: string;
  orderId: string;
  paymentMethod: string;
  city: string;
}) {
  void orderId;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl max-w-md w-full p-8 text-center space-y-5">

        {/* Animated checkmark + confetti */}
        <div className="relative flex items-center justify-center mx-auto" style={{ width: 96, height: 96 }}>
          {/* Pulse rings */}
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "3px solid #22c55e",
            animation: "ringPulse 1s ease-out 0.1s both",
          }} />
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "3px solid #86efac",
            animation: "ringPulse 1s ease-out 0.35s both",
          }} />

          {/* Green circle + check */}
          <div style={{
            position: "relative", zIndex: 1,
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg,#bbf7d0,#86efac)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 6px #dcfce7",
            animation: "popIn 0.6s cubic-bezier(.34,1.56,.64,1) 0.05s both",
          }}>
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          {/* Confetti burst */}
          <ConfettiBurst />
        </div>

        <div>
          <h1 className="text-2xl font-black text-zinc-900 mb-1">Order Placed! 🎉</h1>
          <p className="text-sm text-zinc-500">
            Thank you for shopping at <strong>ZainStore.pk</strong>
          </p>
        </div>

        <div className="bg-zinc-50 rounded-2xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Order Number</span>
            <span className="font-black text-zinc-900 font-mono">{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Delivery to</span>
            <span className="font-semibold text-zinc-800">{city}, Pakistan</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Payment</span>
            <span className="font-semibold text-zinc-800 capitalize">
              {paymentMethod === "cod" ? "Cash On Delivery" : paymentMethod}
            </span>
          </div>
        </div>

        {paymentMethod === "cod" && (
          <div className="flex items-start gap-2 p-3 bg-brand-50 rounded-xl text-xs text-brand-800 text-left">
            <Package className="h-4 w-4 mt-0.5 shrink-0 text-brand-600" />
            <p>Your order will be delivered in 3–5 business days. Have the exact amount ready for the delivery rider.</p>
          </div>
        )}

        <p className="text-xs text-zinc-400">
          We will confirm your order via phone call. Save our number: <strong>0347-891-3290</strong>
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/shop"
            className="flex-1 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-semibold text-sm flex items-center justify-center transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/customer/orders"
            className="flex-1 h-11 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-black text-sm flex items-center justify-center transition-colors"
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}

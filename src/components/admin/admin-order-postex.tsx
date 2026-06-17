"use client";

import { useState, useTransition } from "react";
import { Truck, Package, ExternalLink, Printer, Loader2 } from "lucide-react";
import { PostExBookingModal } from "@/components/vendor/postex-booking-modal";
import { fetchAirwaybillAction } from "@/lib/postex/actions";
import { printShippingLabel } from "@/lib/postex/print-label";
import { toast } from "sonner";

interface Props {
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  existingAwb: string | null;
  existingTrackingUrl: string | null;
  vendorPickupCode?: string;
  vendorReturnCode?: string;
}

export function AdminOrderPostEx({
  orderId,
  orderNumber,
  grandTotal,
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryCity,
  items,
  existingAwb: initialAwb,
  existingTrackingUrl,
  vendorPickupCode = "",
  vendorReturnCode = "",
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [awb, setAwb] = useState(initialAwb);
  const [isPrinting, startPrint] = useTransition();

  function handlePrint() {
    if (!awb) return;
    startPrint(async () => {
      const result = await fetchAirwaybillAction(awb);
      if (result.success) {
        try {
          const bytes = Uint8Array.from(atob(result.base64), c => c.charCodeAt(0));
          const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
          const win = window.open(url, "_blank");
          if (!win) toast.error("Popup blocked — please allow popups to print.");
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        } catch {
          // fall through to HTML fallback
        }
      }
      // Fallback: print HTML label
      toast.info("Using offline label (PostEx PDF unavailable)");
      printShippingLabel({
        trackingNumber: awb,
        orderNumber,
        orderDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryCity,
        codAmount: grandTotal,
        storeName: "ZainStore.pk",
        items: items.map(i => `${i.name} × ${i.quantity}`).join(", "),
        weight: 0.5,
      });
    });
  }

  if (awb) {
    return (
      <div className="flex items-center gap-1.5">
        <Package className="w-3.5 h-3.5 text-green-600 shrink-0" />
        <span className="font-mono text-xs font-semibold text-green-700">{awb}</span>
        {existingTrackingUrl && (
          <a href={existingTrackingUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-500" title="Track on PostEx">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
          title="Print Airway Bill"
        >
          {isPrinting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
          Print
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1 px-2 py-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-md hover:bg-brand-100 transition-colors font-medium"
      >
        <Truck className="w-3 h-3" />
        Book
      </button>

      <PostExBookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onBooked={(tn) => { setAwb(tn); setModalOpen(false); }}
        orderId={orderId}
        orderNumber={orderNumber}
        grandTotal={grandTotal}
        customerName={customerName}
        customerPhone={customerPhone}
        deliveryAddress={deliveryAddress}
        deliveryCity={deliveryCity}
        items={items}
        vendorPickupCode={vendorPickupCode}
        vendorReturnCode={vendorReturnCode}
        vendorReturnCity=""
      />
    </>
  );
}

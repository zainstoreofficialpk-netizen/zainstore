"use client";

import { useState, useTransition } from "react";
import { Truck, ExternalLink, Package, CheckCircle2, Printer, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PostExBookingModal } from "./postex-booking-modal";
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
  vendorPickupCode: string;
  vendorReturnCode: string;
  vendorReturnCity: string;
  existingAwb: string | null;
  existingTrackingUrl: string | null;
  storeName: string;
  orderDate: string;
  orderWeight?: number;
  pickupAddress?: string;
}

export function VendorOrderPostEx({
  orderId,
  orderNumber,
  grandTotal,
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryCity,
  items,
  vendorPickupCode,
  vendorReturnCode,
  vendorReturnCity,
  existingAwb: initialAwb,
  existingTrackingUrl,
  storeName,
  orderDate,
  orderWeight = 0.5,
  pickupAddress,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [awb, setAwb] = useState(initialAwb);
  const [bookedWeight, setBookedWeight] = useState(orderWeight);
  const [isPrinting, startPrintTransition] = useTransition();

  function handleBooked(trackingNumber: string, weight?: number) {
    setAwb(trackingNumber);
    if (weight) setBookedWeight(weight);
    setModalOpen(false);
  }

  function handlePrintAirwaybill() {
    if (!awb) return;
    startPrintTransition(async () => {
      const result = await fetchAirwaybillAction(awb);

      if (result.success) {
        // Convert base64 PDF to blob and open in new window for printing
        try {
          const byteChars = atob(result.base64);
          const bytes = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            bytes[i] = byteChars.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const win = window.open(url, "_blank");
          if (!win) {
            toast.error("Popup blocked — please allow popups to print.");
          }
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        } catch {
          // fall through to HTML fallback
        }
      }

      // Fallback: print our HTML label
      toast.info("Using offline label (PostEx PDF unavailable)");
      printShippingLabel({
        trackingNumber: awb,
        orderNumber,
        orderDate,
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryCity,
        codAmount: grandTotal,
        storeName,
        items: items.map((i) => `${i.name} × ${i.quantity}`).join(", "),
        weight: bookedWeight,
        originCity: vendorReturnCity,
        pickupAddress,
      });
    });
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-zinc-800">PostEx Shipment</span>
          </div>

          {awb ? (
            <div className="space-y-4">
              {/* Booked banner */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-700">Shipment booked with PostEx</span>
              </div>

              {/* Tracking number */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <Package className="w-4 h-4 text-zinc-500 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Tracking / AWB Number</p>
                  <p className="font-mono font-bold text-zinc-900 text-lg tracking-wider">{awb}</p>
                </div>
                {existingTrackingUrl && (
                  <a
                    href={existingTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-zinc-400 hover:text-brand-500"
                    title="Track on PostEx"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Print button */}
              <button
                onClick={handlePrintAirwaybill}
                disabled={isPrinting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-bold disabled:opacity-60"
              >
                {isPrinting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                {isPrinting ? "Loading Airway Bill…" : "Print Airway Bill"}
              </button>

              <p className="text-xs text-zinc-400 text-center">
                Opens the official PostEx slip — attach it to the package before handover.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">
                Book a PostEx courier pickup. Details will be pre-filled from this order.
              </p>
              {(!vendorPickupCode || !vendorReturnCode) && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  PostEx address codes not configured. Ask your admin to add them to your vendor profile.
                </div>
              )}
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
              >
                <Truck className="w-4 h-4" />
                Book with PostEx
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <PostExBookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onBooked={handleBooked}
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
        vendorReturnCity={vendorReturnCity}
        storeName={storeName}
        orderDate={orderDate}
      />
    </>
  );
}

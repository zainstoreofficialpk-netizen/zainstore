"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Package, Truck, MapPin, Phone, User, Weight, FileText, Loader2, CheckCircle, ExternalLink, Printer, Download } from "lucide-react";
import { bookPostExShipment } from "@/lib/postex/actions";
import { fetchAirwaybillAction } from "@/lib/postex/actions";
import { toast } from "sonner";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  onBooked?: (trackingNumber: string, weight: number) => void;
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  items: OrderItem[];
  vendorPickupCode: string;
  vendorReturnCode: string;
  vendorReturnCity: string;
  storeName?: string;
  orderDate?: string;
}

const PAKISTAN_CITIES = [
  "Abbottabad", "Attock", "Bahawalpur", "Chiniot", "Dera Ghazi Khan",
  "Dera Ismail Khan", "Faisalabad", "Gujranwala", "Gujrat", "Hafizabad",
  "Haripur", "Hyderabad", "Islamabad", "Jacobabad", "Jhang",
  "Jhelum", "Kamoke", "Karachi", "Kasur", "Khanewal",
  "Khanpur", "Khushab", "Lahore", "Larkana", "Lodhran",
  "Mardan", "Mianwali", "Mingora", "Mirpur", "Mirpur Khas",
  "Multan", "Muzaffarabad", "Narowal", "Nawabshah", "Nowshera",
  "Okara", "Peshawar", "Quetta", "Rahim Yar Khan", "Rawalpindi",
  "Sadiqabad", "Sahiwal", "Sargodha", "Sheikhupura", "Sialkot",
  "Sukkur", "Swat", "Toba Tek Singh", "Wah Cantonment",
].sort();

export function PostExBookingModal({
  open,
  onClose,
  onBooked,
  orderId,
  orderNumber,
  grandTotal,
  customerName: defaultCustomerName,
  customerPhone: defaultCustomerPhone,
  deliveryAddress: defaultDeliveryAddress,
  deliveryCity: defaultDeliveryCity,
  items,
  vendorPickupCode,
  vendorReturnCode,
  vendorReturnCity,
}: BookingModalProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoadingAwb, startAwbTransition] = useTransition();
  const [booked, setBooked] = useState(false);
  const [bookedTracking, setBookedTracking] = useState("");
  const [bookedDetails, setBookedDetails] = useState<{
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    districtName: string;
    invoicePayment: number;
    orderWeight: number;
    orderDate: string;
  } | null>(null);

  const today = new Date();
  const todayStr = today
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-");

  const [form, setForm] = useState({
    customerName: defaultCustomerName,
    customerPhone: defaultCustomerPhone,
    orderDate: todayStr,
    invoicePayment: grandTotal,
    deliveryAddress: defaultDeliveryAddress,
    districtName: defaultDeliveryCity,
    pickupAddressCode: vendorPickupCode,
    returnAddressCode: vendorReturnCode,
    orderWeight: 0.5,
    orderDetail: items.map((i) => `${i.name} x${i.quantity}`).join(", "),
  });

  useEffect(() => {
    if (open) {
      setBooked(false);
      setBookedTracking("");
      setBookedDetails(null);
      setForm({
        customerName: defaultCustomerName,
        customerPhone: defaultCustomerPhone,
        orderDate: todayStr,
        invoicePayment: grandTotal,
        deliveryAddress: defaultDeliveryAddress,
        districtName: defaultDeliveryCity,
        pickupAddressCode: vendorPickupCode,
        returnAddressCode: vendorReturnCode,
        orderWeight: 0.5,
        orderDetail: items.map((i) => `${i.name} x${i.quantity}`).join(", "),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function set(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.districtName) { toast.error("Please select a delivery city"); return; }
    if (!form.customerPhone) { toast.error("Customer phone number is required"); return; }
    if (!form.pickupAddressCode) { toast.error("Pickup address code is required"); return; }
    if (!form.returnAddressCode) { toast.error("Return address code is required"); return; }
    startTransition(async () => {
      const result = await bookPostExShipment({ orderId, ...form });
      if (result.success) {
        const tn = (result as { trackingNumber?: string }).trackingNumber ?? "";
        setBookedTracking(tn);
        setBookedDetails({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          deliveryAddress: form.deliveryAddress,
          districtName: form.districtName,
          invoicePayment: form.invoicePayment,
          orderWeight: form.orderWeight,
          orderDate: form.orderDate,
        });
        setBooked(true);
        toast.success(`Shipment booked! AWB: ${tn}`);
        onBooked?.(tn, form.orderWeight);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handlePrintAwb() {
    startAwbTransition(async () => {
      const result = await fetchAirwaybillAction(bookedTracking);
      if (result.success) {
        // Open base64 PDF in new tab for printing
        const pdfWindow = window.open("");
        if (pdfWindow) {
          pdfWindow.document.write(
            `<html><body style="margin:0"><iframe width="100%" height="100%" style="border:none" src="data:application/pdf;base64,${result.base64}"></iframe></body></html>`
          );
        }
      } else {
        // Fallback: open PostEx tracking page
        toast.error("Could not load airway bill: " + result.error);
        window.open(`https://postex.pk/tracking?trackingNumber=${bookedTracking}`, "_blank");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Book PostEx Shipment</h2>
              <p className="text-sm text-neutral-500">Order #{orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {booked && bookedDetails ? (
          <div className="p-6 space-y-5">
            {/* Success banner */}
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
              <div>
                <p className="font-bold text-green-800">Shipment Booked Successfully!</p>
                <p className="text-sm text-green-700">PostEx has confirmed your booking. Print the airway bill and attach it to the package.</p>
              </div>
            </div>

            {/* Tracking Number */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wide">AWB / Tracking Number</p>
              <p className="font-mono text-2xl font-black text-neutral-900 tracking-wider">{bookedTracking}</p>
            </div>

            {/* Shipment Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <p className="text-xs text-neutral-500 font-medium">Customer</p>
                </div>
                <p className="text-sm font-semibold text-neutral-800">{bookedDetails.customerName}</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />{bookedDetails.customerPhone || "—"}
                </p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <p className="text-xs text-neutral-500 font-medium">Delivery</p>
                </div>
                <p className="text-sm font-semibold text-neutral-800">{bookedDetails.districtName}</p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{bookedDetails.deliveryAddress}</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Package className="w-3.5 h-3.5 text-neutral-400" />
                  <p className="text-xs text-neutral-500 font-medium">COD Amount</p>
                </div>
                <p className="text-sm font-bold text-neutral-800">PKR {bookedDetails.invoicePayment.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Weight className="w-3.5 h-3.5 text-neutral-400" />
                  <p className="text-xs text-neutral-500 font-medium">Weight</p>
                </div>
                <p className="text-sm font-bold text-neutral-800">{bookedDetails.orderWeight} kg</p>
              </div>
            </div>

            {/* Items */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <p className="text-xs text-neutral-500 font-medium mb-2">Items</p>
              <p className="text-sm text-neutral-700">{items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePrintAwb}
                disabled={isLoadingAwb}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-60"
              >
                {isLoadingAwb ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                ) : (
                  <><Printer className="w-4 h-4" /> Print Airway Bill (PDF)</>
                )}
              </button>
              <a
                href={`https://postex.pk/tracking?trackingNumber=${bookedTracking}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Track
              </a>
              <button
                onClick={onClose}
                className="px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                Customer Contact
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => set("customerName", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                    <input
                      type="text"
                      value={form.customerPhone}
                      onChange={(e) => set("customerPhone", e.target.value)}
                      required
                      className="w-full pl-8 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                Order Details
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Order Date</label>
                  <input
                    type="text"
                    value={form.orderDate}
                    onChange={(e) => set("orderDate", e.target.value)}
                    placeholder="10-Jun-2024"
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">COD Amount (PKR)</label>
                  <input
                    type="number"
                    value={form.invoicePayment}
                    onChange={(e) => set("invoicePayment", Number(e.target.value))}
                    min={0}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1 flex items-center gap-1">
                    <Weight className="w-3 h-3" /> Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={form.orderWeight}
                    onChange={(e) => set("orderWeight", Number(e.target.value))}
                    step={0.1}
                    min={0.1}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Delivery Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={form.deliveryAddress}
                    onChange={(e) => set("deliveryAddress", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Delivery City</label>
                  <select
                    value={form.districtName}
                    onChange={(e) => set("districtName", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white"
                  >
                    <option value="">Select city</option>
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pickup / Return */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-600" />
                Pickup &amp; Return
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Pickup Address Code</label>
                  <input
                    type="text"
                    value={form.pickupAddressCode}
                    onChange={(e) => set("pickupAddressCode", e.target.value)}
                    required
                    placeholder="e.g. 001"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Return Address Code</label>
                  <input
                    type="text"
                    value={form.returnAddressCode}
                    onChange={(e) => set("returnAddressCode", e.target.value)}
                    required
                    placeholder="e.g. 002"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 font-mono"
                  />
                </div>
              </div>
              {vendorReturnCity && (
                <p className="mt-2 text-xs text-neutral-500">
                  Return city: <span className="font-medium text-neutral-700">{vendorReturnCity}</span>
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Order Notes
              </h3>
              <textarea
                value={form.orderDetail}
                onChange={(e) => set("orderDetail", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 resize-none"
                placeholder="Item details / special instructions"
              />
            </div>

            {(!vendorPickupCode || !vendorReturnCode) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>Note:</strong> Vendor PostEx address codes are not set. Contact your admin to configure them in your vendor profile.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
                ) : (
                  <><Truck className="w-4 h-4" /> Book with PostEx</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

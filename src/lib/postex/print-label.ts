export interface ShippingLabelData {
  trackingNumber: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  codAmount: number;
  storeName: string;
  items: string;
  weight: number;
  originCity?: string;
  pickupAddress?: string;
}

export function printShippingLabel(data: ShippingLabelData) {
  const orderRefBarcode = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(data.orderNumber)}&scale=2&height=10&includetext&guardwhitespace`;
  const trackingBarcode = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(data.trackingNumber)}&scale=2&height=10&includetext&guardwhitespace`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data.trackingNumber)}&color=000000&bgcolor=ffffff&qzone=1`;

  const origin = data.originCity ?? "N/A";
  const pickupAddr = data.pickupAddress ?? origin;
  const codFormatted = Number(data.codAmount).toLocaleString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Airway Bill — ${data.trackingNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; background: #e5e7eb; color: #000; font-size: 9pt; }

    @media print {
      body { background: #fff; margin: 0; }
      .no-print { display: none !important; }
      .page { background: #fff; padding: 0; }
      .label { box-shadow: none !important; }
    }

    .actions {
      display: flex; gap: 12px; padding: 12px 20px;
      background: #1e1e1e; align-items: center;
    }
    .btn {
      padding: 7px 18px; border-radius: 5px; font-size: 12px;
      font-weight: 700; cursor: pointer; border: none;
    }
    .btn-print { background: #16a34a; color: #fff; }
    .btn-close  { background: #52525b; color: #fff; }

    .page { display: flex; justify-content: center; padding: 20px; min-height: calc(100vh - 46px); }

    .label {
      width: 210mm;
      background: #fff;
      border: 1px solid #000;
      box-shadow: 0 4px 24px rgba(0,0,0,.2);
    }

    /* ── Barcodes row ── */
    .barcodes-row {
      display: flex; align-items: center; gap: 0;
      border-bottom: 1px solid #000;
      padding: 6px 10px;
    }
    .bc-item { text-align: center; flex: 1; }
    .bc-item img { height: 14mm; max-width: 100%; display: block; margin: 0 auto; }
    .bc-item p { font-size: 7pt; font-family: 'Courier New', monospace; margin-top: 2px; letter-spacing: .5px; }
    .bc-divider { width: 1px; background: #ccc; align-self: stretch; margin: 0 8px; }
    .postex-logo {
      font-size: 22pt; font-weight: 900; letter-spacing: -1px;
      color: #000; white-space: nowrap; padding: 0 12px;
      border-left: 1px solid #ccc; margin-left: 8px;
    }

    /* ── 3-column grid ── */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 0.8fr;
      border-bottom: 1px solid #000;
      min-height: 60mm;
    }
    .col {
      padding: 6px 10px;
      border-right: 1px solid #000;
    }
    .col:last-child { border-right: none; }

    .col-heading {
      font-size: 8pt; font-weight: 700;
      background: #f0f0f0;
      margin: -6px -10px 6px;
      padding: 3px 10px;
      border-bottom: 1px solid #ddd;
      letter-spacing: .3px;
    }
    .sub-heading {
      font-size: 8pt; font-weight: 700;
      background: #f0f0f0;
      margin: 8px -10px 6px;
      padding: 3px 10px;
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      letter-spacing: .3px;
    }

    .field { margin-bottom: 4px; display: flex; gap: 4px; }
    .fl { font-size: 8pt; color: #555; white-space: nowrap; min-width: 72px; }
    .fv { font-size: 8.5pt; font-weight: 600; line-height: 1.3; word-break: break-word; }

    .qr-wrap { display: flex; justify-content: center; margin: 8px 0; }
    .qr-wrap img { width: 28mm; height: 28mm; display: block; border: 1px solid #ddd; }

    .amount-box {
      background: #000; color: #fff;
      text-align: center; padding: 4px;
      font-size: 12pt; font-weight: 900; letter-spacing: .5px;
      margin: 8px -10px 0;
    }

    /* ── Order details footer ── */
    .order-details-row {
      padding: 5px 10px;
      font-size: 8.5pt;
      border-bottom: 1px solid #000;
    }
    .order-details-row strong { font-weight: 700; }

    /* ── Watermark / tagline ── */
    .footer-row {
      padding: 4px 10px;
      font-size: 7pt;
      color: #888;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="actions no-print">
    <button class="btn btn-print" onclick="window.print()">🖨️ Print Airway Bill</button>
    <button class="btn btn-close" onclick="window.close()">Close</button>
  </div>

  <div class="page">
    <div class="label">

      <!-- Barcodes row -->
      <div class="barcodes-row">
        <div class="bc-item">
          <img src="${orderRefBarcode}" alt="Order Ref Barcode" onerror="this.style.display='none'" />
          <p>${data.orderNumber}</p>
        </div>
        <div class="bc-divider"></div>
        <div class="bc-item">
          <img src="${trackingBarcode}" alt="Tracking Barcode" onerror="this.style.display='none'" />
          <p>${data.trackingNumber}</p>
        </div>
        <div class="postex-logo">PostEx.</div>
      </div>

      <!-- 3-column main grid -->
      <div class="main-grid">

        <!-- Col 1: Consignee + Shipper -->
        <div class="col">
          <div class="col-heading">Consignee Information</div>
          <div class="field"><span class="fl">Name:</span><span class="fv">${data.customerName}</span></div>
          <div class="field"><span class="fl">Contact:</span><span class="fv">${data.customerPhone || "—"}</span></div>
          <div class="field">
            <span class="fl">Delivery<br>Address:</span>
            <span class="fv">${data.deliveryAddress}, ${data.deliveryCity} Pakistan</span>
          </div>

          <div class="sub-heading">Shipper Information</div>
          <div class="field"><span class="fl">Name:</span><span class="fv">${data.storeName}</span></div>
          <div class="field"><span class="fl">Contact:</span><span class="fv">ZainStore.pk</span></div>
          <div class="field"><span class="fl">Pickup<br>Address:</span><span class="fv">${pickupAddr}</span></div>
          <div class="field"><span class="fl">Return<br>Address:</span><span class="fv">${pickupAddr}</span></div>
          <div class="field"><span class="fl">Order Details:</span><span class="fv">${data.items}</span></div>
        </div>

        <!-- Col 2: Shipment Info -->
        <div class="col">
          <div class="col-heading">Shipment Information</div>
          <div class="field"><span class="fl">Pieces:</span><span class="fv">1</span></div>
          <div class="field"><span class="fl">Order Ref:</span><span class="fv">${data.orderNumber}</span></div>
          <div class="field"><span class="fl">Tracking No:</span><span class="fv" style="font-family:'Courier New',monospace;font-weight:700;">${data.trackingNumber}</span></div>
          <div class="field"><span class="fl">Origin:</span><span class="fv">${origin.toUpperCase()}</span></div>
          <div class="field"><span class="fl">Destination:</span><span class="fv">${data.deliveryCity}</span></div>
          <div class="field"><span class="fl">Remarks:</span><span class="fv"></span></div>
          <div class="field" style="margin-top:6px;"><span class="fl">Return City:</span><span class="fv">${origin.toUpperCase()}</span></div>
        </div>

        <!-- Col 3: Order Info -->
        <div class="col">
          <div class="col-heading">Order Information</div>

          <div class="qr-wrap">
            <img src="${qrUrl}" alt="QR Code" />
          </div>

          <div class="field"><span class="fl">Amount:</span><span class="fv">PKR ${codFormatted}/-</span></div>
          <div class="field"><span class="fl">Date:</span><span class="fv">${data.orderDate}</span></div>
          <div class="field"><span class="fl">Order Type:</span><span class="fv">Normal</span></div>
          <div class="field"><span class="fl">Weight:</span><span class="fv">${data.weight} kg</span></div>

          <div class="amount-box">COD: PKR ${codFormatted}</div>
        </div>

      </div>

      <!-- Footer -->
      <div class="footer-row">
        ZainStore.pk — Powered by PostEx · Handle with care
      </div>

    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Popup blocked — please allow popups for this site to print labels.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

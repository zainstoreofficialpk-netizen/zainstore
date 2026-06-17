const POSTEX_BASE_URL = "https://api.postex.pk/services/integration/api/order/v3";
const TOKEN = process.env.POSTEX_API_TOKEN ?? "";

export interface PostExOrderPayload {
  orderRefNumber: string;
  orderDate: string; // DD-MMM-YYYY e.g. "10-Jun-2024"
  orderType: string; // "Normal"
  paymentMode: string; // "COD"
  invoicePayment: number; // COD amount in PKR
  orderWeight: number; // in kg
  orderDetail: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  cityName: string; // delivery city
  pickupAddressCode: string;
  returnAddressCode: string;
}

export interface PostExOrderResponse {
  statusCode: string;
  statusMessage: string;
  dist: {
    trackingNumber: string;
    orderRefNumber: string;
    transactionNotes?: string;
  };
}

export interface PostExTrackingResponse {
  statusCode: string;
  statusMessage: string;
  dist: {
    trackingNumber: string;
    orderRefNumber: string;
    orderStatus: string;
    shipmentActivity: Array<{
      activityDateTime: string;
      activityDescription: string;
      location: string;
    }>;
  };
}

async function postexFetch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${POSTEX_BASE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      token: TOKEN,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.statusMessage ?? `PostEx API error: ${res.status}`);
  }

  return data as T;
}

export async function createPostExOrder(payload: PostExOrderPayload) {
  return postexFetch<PostExOrderResponse>("/create-order", payload);
}

export async function getPostExTracking(trackingNumber: string) {
  return postexFetch<PostExTrackingResponse>(`/track-order/${trackingNumber}`);
}

export async function cancelPostExOrder(trackingNumber: string) {
  return postexFetch<{ statusCode: string; statusMessage: string }>(
    "/cancel-order",
    { trackingNumber },
  );
}

export async function getPostExAirwaybill(trackingNumber: string) {
  return postexFetch<{ statusCode: string; statusMessage: string; dist: { base64: string } }>(
    "/get-air-waybill",
    { trackingNumber },
  );
}

export function formatPostExDate(date: Date): string {
  return date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-");
}

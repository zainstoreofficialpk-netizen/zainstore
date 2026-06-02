import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  getVendorBalance,
  getVendorPayoutHistory,
  getOpenWithdrawalRequest,
  getVendorEarningsBreakdown,
} from "@/lib/vendor/withdrawal-data";
import { WithdrawalPanel } from "@/components/vendor/withdrawal-panel";

export default async function VendorWithdrawalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "VENDOR") redirect("/login");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      bankName: true,
      accountTitle: true,
      accountNumber: true,
      iban: true,
    },
  });
  if (!vendor) redirect("/vendor");

  const [balance, withdrawals, openRequest, earningsBreakdown] = await Promise.all([
    getVendorBalance(vendor.id),
    getVendorPayoutHistory(vendor.id),
    getOpenWithdrawalRequest(vendor.id),
    getVendorEarningsBreakdown(vendor.id, 20),
  ]);

  const openFull = openRequest
    ? {
        id: openRequest.id,
        amount: Number(openRequest.amount),
        method: openRequest.method,
        status: openRequest.status,
        initiatedByAdmin: openRequest.initiatedByAdmin,
        adminNote: openRequest.adminNote,
        rejectionReason: openRequest.rejectionReason,
        reference: openRequest.reference,
        requestedAt: openRequest.requestedAt,
        paidAt: openRequest.paidAt,
      }
    : null;

  return (
    <WithdrawalPanel
      balance={balance}
      withdrawals={withdrawals}
      earningsBreakdown={earningsBreakdown}
      openRequest={openFull}
      bankInfo={{
        bankName: vendor.bankName,
        accountTitle: vendor.accountTitle,
        accountNumber: vendor.accountNumber,
        iban: vendor.iban,
      }}
    />
  );
}

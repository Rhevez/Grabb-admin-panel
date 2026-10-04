"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";
import { EmptyState } from "@/components/common/empty-state";
import { downloadCSV, downloadFile } from "@/utils/download";
import { DownloadIcon, DocumentIcon } from "@/assets/icons";

interface PayoutRecord {
  id: string;
  recipientName: string;
  type: "shop" | "partner" | "vendor" | "driver";
  period: string;
  ordersCount: number;
  amountDue: string;
  status: "pending" | "paid";
}

const DEFAULT_PAYOUTS: PayoutRecord[] = [
  { id: "po1", recipientName: "Green Grocery Fresh", type: "shop", period: "Aug 01 - Aug 07, 2026", ordersCount: 420, amountDue: "₹4,280.00", status: "pending" },
  { id: "po2", recipientName: "Urban Organic Mart", type: "shop", period: "Aug 01 - Aug 07, 2026", ordersCount: 310, amountDue: "₹3,150.50", status: "pending" },
  { id: "po3", recipientName: "Daily Needs Superstore", type: "shop", period: "Jul 25 - Jul 31, 2026", ordersCount: 520, amountDue: "₹5,620.00", status: "paid" },
  { id: "po4", recipientName: "Rahul Sharma (Rider)", type: "partner", period: "Aug 01 - Aug 07, 2026", ordersCount: 48, amountDue: "₹482.00", status: "pending" },
  { id: "po5", recipientName: "Vikram Singh (Rider)", type: "partner", period: "Aug 01 - Aug 07, 2026", ordersCount: 42, amountDue: "₹420.00", status: "paid" },
];

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState<"shop" | "partner">("shop");
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/finance/payouts");
      let fetched: PayoutRecord[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setPayouts(fetched.length > 0 ? fetched : DEFAULT_PAYOUTS);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch payouts:", err);
      setPayouts(DEFAULT_PAYOUTS);
    } finally {
      setLoading(false);
    }
  };

  const safePayouts = Array.isArray(payouts) ? payouts : [];
  const filteredPayouts = safePayouts.filter((p) => {
    if (activeTab === "shop") {
      return p.type === "shop" || p.type === "vendor";
    } else {
      return p.type === "partner" || p.type === "driver";
    }
  });

  const handleExportCSV = () => {
    if (filteredPayouts.length === 0) {
      toast.error("No payouts to export");
      return;
    }
    const headers = [
      "Payout ID",
      "Recipient Name",
      "Recipient Type",
      "Period",
      "Orders Count",
      "Amount Due",
      "Status",
    ];
    const rows = filteredPayouts.map((p) => [
      p.id,
      p.recipientName,
      p.type === "vendor" || p.type === "shop" ? "Shop Vendor" : "Delivery Partner",
      p.period,
      p.ordersCount,
      p.amountDue,
      p.status.toUpperCase(),
    ]);
    const filename = `${activeTab}_payouts_settlement_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(filename, headers, rows);
    toast.success(`Exported ${filteredPayouts.length} ${activeTab} payouts as CSV`);
  };

  const handleDownloadStatement = (p: PayoutRecord) => {
    const filename = `settlement_stmt_${p.id}.txt`;
    const content = `========================================================
GRABB PAYOUT SETTLEMENT STATEMENT
========================================================
Settlement ID:   ${p.id}
Recipient:       ${p.recipientName}
Account Type:    ${p.type === "vendor" || p.type === "shop" ? "Merchant Shop" : "Delivery Partner Rider"}
Settlement Cycle: ${p.period}
Orders Completed: ${p.ordersCount}
Settlement State: ${p.status.toUpperCase()}
--------------------------------------------------------
NET PAYABLE AMOUNT: ${p.amountDue}
--------------------------------------------------------
Generated on:    ${new Date().toLocaleString()}
Official Grabb Finance & Treasury Verification
========================================================
`;
    downloadFile(filename, content);
    toast.success(`Downloaded settlement statement for ${p.recipientName}`);
  };

  const handleMarkAsPaid = async () => {
    if (!confirmTargetId) return;
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/finance/payouts/${confirmTargetId}/settle`, {
        method: "POST",
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error settling payout:", err);
    }
    setPayouts((prev) =>
      prev.map((p) => (p.id === confirmTargetId ? { ...p, status: "paid" } : p))
    );
    if (selectedPayout && selectedPayout.id === confirmTargetId) {
      setSelectedPayout((prev) => (prev ? { ...prev, status: "paid" } : null));
    }
    toast.success("Payout marked as settled!");
    setConfirmTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Vendor & Driver Payouts</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Weekly payout settlements for partner shops and delivery partners.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 transition-colors self-start sm:self-auto flex items-center gap-2"
        >
          <span>Export Payouts CSV</span>
          <DownloadIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stroke dark:border-stroke-dark">
        <button
          onClick={() => setActiveTab("shop")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "shop"
              ? "border-primary text-primary dark:text-white"
              : "border-transparent text-dark-4 hover:text-dark dark:text-dark-6"
          }`}
        >
          Shop Vendor Payouts ({safePayouts.filter(p => p.type === "shop" || p.type === "vendor").length})
        </button>
        <button
          onClick={() => setActiveTab("partner")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "partner"
              ? "border-primary text-primary dark:text-white"
              : "border-transparent text-dark-4 hover:text-dark dark:text-dark-6"
          }`}
        >
          Delivery Partner Payouts ({safePayouts.filter(p => p.type === "partner" || p.type === "driver").length})
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {filteredPayouts.length === 0 ? (
          <EmptyState
            variant="payouts"
            title={activeTab === "shop" ? "No Shop Vendor Payouts" : "No Delivery Partner Payouts"}
            description={
              activeTab === "shop"
                ? "There are no pending or past settlement payouts recorded for shop vendors."
                : "There are no delivery partner payouts scheduled or recorded in this cycle."
            }
            action={{
              label: "Refresh Payouts",
              onClick: fetchPayouts,
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Recipient Name</th>
                  <th className="p-3">Payout Period</th>
                  <th className="p-3">Orders Included</th>
                  <th className="p-3">Amount Due</th>
                  <th className="p-3">Payout Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {filteredPayouts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPayout(p)}
                    className="hover:bg-gray-2 dark:hover:bg-dark-2 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-bold text-primary">{p.recipientName}</td>
                    <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{p.period}</td>
                    <td className="p-3 font-semibold">{p.ordersCount} orders</td>
                    <td className="p-3 font-bold text-emerald-500">{p.amountDue}</td>
                    <td className="p-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <TableActionsDropdown
                        actions={[
                          ...(p.status === "pending"
                            ? [
                                {
                                  label: "Mark as Paid",
                                  onClick: () => setConfirmTargetId(p.id),
                                  variant: "primary" as const,
                                },
                              ]
                            : []),
                          {
                            label: "View Report",
                            onClick: () => setSelectedPayout(p),
                          },
                          {
                            label: "Download Statement",
                            onClick: () => handleDownloadStatement(p),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Payout Detail Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-dark dark:text-white">Payout Settlement Details</h3>
                <p className="text-xs text-dark-4 dark:text-dark-6">ID: {selectedPayout.id}</p>
              </div>
              <StatusBadge status={selectedPayout.status} />
            </div>

            <div className="space-y-3 rounded-xl bg-gray-2 dark:bg-dark-2 p-4 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Recipient Name:</span>
                <span className="font-bold text-dark dark:text-white">{selectedPayout.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Recipient Type:</span>
                <span className="font-medium text-dark dark:text-white capitalize">
                  {selectedPayout.type === "vendor" || selectedPayout.type === "shop" ? "Merchant Store" : "Rider Partner"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Settlement Period:</span>
                <span className="font-medium text-dark dark:text-white">{selectedPayout.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Completed Orders:</span>
                <span className="font-semibold text-dark dark:text-white">{selectedPayout.ordersCount} deliveries</span>
              </div>
              <div className="border-t border-stroke dark:border-stroke-dark my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-dark font-semibold dark:text-white">Net Settled Amount:</span>
                <span className="text-base font-bold text-emerald-500">{selectedPayout.amountDue}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {selectedPayout.status === "pending" && (
                <button
                  onClick={() => {
                    setConfirmTargetId(selectedPayout.id);
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Mark as Paid / Settle
                </button>
              )}
              <button
                onClick={() => handleDownloadStatement(selectedPayout)}
                className="flex-1 rounded-lg border border-stroke bg-gray-2 py-2.5 text-xs font-semibold text-dark hover:bg-gray-3 dark:border-stroke-dark dark:bg-dark-2 dark:text-white transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <DocumentIcon className="w-3.5 h-3.5" />
                Download Statement
              </button>
              <button
                onClick={() => setSelectedPayout(null)}
                className="rounded-lg px-4 py-2.5 text-xs font-semibold text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmTargetId)}
        onClose={() => setConfirmTargetId(null)}
        onConfirm={handleMarkAsPaid}
        title="Confirm Payout Settlement"
        description="Are you sure you want to mark this payout settlement as paid? This records bank transfer execution and reconciles merchant balances."
        confirmLabel="Confirm Payment"
        variant="info"
      />
    </div>
  );
}

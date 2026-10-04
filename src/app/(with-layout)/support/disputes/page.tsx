"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { downloadCSV } from "@/utils/download";
import { DownloadIcon } from "@/assets/icons";

interface DisputeItem {
  id: string;
  orderId: string;
  customerName: string;
  shopName: string;
  driverName: string;
  issue: string;
  refundRequested: string;
  status: "open" | "resolved";
  liability?: "shop" | "driver" | "platform" | string;
}

const DEFAULT_DISPUTES: DisputeItem[] = [
  { id: "DSP-501", orderId: "ORD-9821", customerName: "Rahul Sharma", shopName: "Green Grocery Fresh", driverName: "Vikram Singh", issue: "Damaged apples & spilled oil bottle", refundRequested: "₹18.50", status: "open" },
  { id: "DSP-502", orderId: "ORD-9755", customerName: "Anita Desai", shopName: "Daily Needs Superstore", driverName: "Amit Kumar", issue: "Missing 1x Olive Oil bottle from package", refundRequested: "₹12.00", status: "open" },
  { id: "DSP-500", orderId: "ORD-9610", customerName: "Karan Patel", shopName: "Organic Mart", driverName: "Sunil Verma", issue: "Order arrived 90 mins late and spoiled", refundRequested: "₹24.00", status: "resolved", liability: "driver" },
];

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals state
  const [resolveModal, setResolveModal] = useState<DisputeItem | null>(null);
  const [viewModal, setViewModal] = useState<DisputeItem | null>(null);
  const [selectedLiability, setSelectedLiability] = useState<"shop" | "driver" | "platform">("shop");

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/support/disputes");
      let fetched: DisputeItem[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setDisputes(fetched.length > 0 ? fetched : DEFAULT_DISPUTES);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch disputes:", err);
      setDisputes(DEFAULT_DISPUTES);
    } finally {
      setLoading(false);
    }
  };

  const safeDisputes = Array.isArray(disputes) ? disputes : [];

  const filteredDisputes = safeDisputes.filter((d) => {
    const matchesStatus = selectedStatus === "all" || d.status === selectedStatus;
    const matchesSearch =
      (d.orderId || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.shopName || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.driverName || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.id || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredDisputes.length === 0) {
      toast.error("No disputes to export");
      return;
    }
    const headers = [
      "Dispute ID",
      "Order ID",
      "Customer",
      "Shop",
      "Driver",
      "Reported Issue",
      "Refund Requested",
      "Status",
      "Assigned Liability",
    ];
    const rows = filteredDisputes.map((d) => [
      d.id,
      d.orderId,
      d.customerName,
      d.shopName,
      d.driverName,
      d.issue,
      d.refundRequested,
      d.status.toUpperCase(),
      d.liability ? `Billed to: ${d.liability}` : "Pending Assignment",
    ]);
    downloadCSV("disputes_liability_register.csv", headers, rows);
    toast.success(`Exported ${filteredDisputes.length} disputes to CSV!`);
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/support/disputes/${resolveModal.id}/refund`, {
        method: "POST",
        body: JSON.stringify({ liability: selectedLiability, refundAmount: resolveModal.refundRequested }),
      });
      toast.success(`Refund of ${resolveModal.refundRequested} processed and billed to ${selectedLiability}!`);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to process dispute refund:", err);
    }
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === resolveModal.id
          ? { ...d, status: "resolved", liability: selectedLiability }
          : d
      )
    );
    if (viewModal && viewModal.id === resolveModal.id) {
      setViewModal((prev) =>
        prev ? { ...prev, status: "resolved", liability: selectedLiability } : null
      );
    }
    setResolveModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Disputes & Refunds</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Resolve missing item or damaged goods reports by assigning financial liability to the Shop, Driver, or Platform.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Export Disputes</span>
          <DownloadIcon className="w-4 h-4" />
        </button>
      </div>

      <FilterBar
        searchPlaceholder="Search by Order ID, customer, store, or driver..."
        searchValue={search}
        onSearchChange={setSearch}
        onExport={handleExportCSV}
      />

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedStatus("all")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
            selectedStatus === "all"
              ? "bg-primary text-white border-primary"
              : "bg-transparent text-dark-4 border-stroke dark:border-stroke-dark dark:text-dark-6 hover:bg-gray-2 dark:hover:bg-dark-2"
          }`}
        >
          All Disputes ({safeDisputes.length})
        </button>
        <button
          onClick={() => setSelectedStatus("open")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
            selectedStatus === "open"
              ? "bg-primary text-white border-primary"
              : "bg-transparent text-dark-4 border-stroke dark:border-stroke-dark dark:text-dark-6 hover:bg-gray-2 dark:hover:bg-dark-2"
          }`}
        >
          Open Requires Action ({safeDisputes.filter((d) => d.status === "open").length})
        </button>
        <button
          onClick={() => setSelectedStatus("resolved")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
            selectedStatus === "resolved"
              ? "bg-primary text-white border-primary"
              : "bg-transparent text-dark-4 border-stroke dark:border-stroke-dark dark:text-dark-6 hover:bg-gray-2 dark:hover:bg-dark-2"
          }`}
        >
          Resolved ({safeDisputes.filter((d) => d.status === "resolved").length})
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {filteredDisputes.length === 0 ? (
          <EmptyState
            variant="disputes"
            title="No Dispute Records Found"
            description={
              selectedStatus === "open"
                ? "No open customer disputes requiring resolution! All claims have been settled."
                : "No disputes match your active search and filter criteria."
            }
            action={
              selectedStatus !== "all" || search
                ? {
                    label: "Reset Dispute Filters",
                    onClick: () => {
                      setSelectedStatus("all");
                      setSearch("");
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Dispute ID</th>
                  <th className="p-3">Order Details</th>
                  <th className="p-3">Reported Issue</th>
                  <th className="p-3">Refund Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action / Liability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {filteredDisputes.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setViewModal(d)}
                    className="hover:bg-gray-2 dark:hover:bg-dark-2 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-bold text-dark dark:text-white">{d.id}</td>
                    <td className="p-3">
                      <p className="font-bold text-primary">{d.orderId}</p>
                      <p className="text-xs text-dark-4 dark:text-dark-6">Customer: {d.customerName}</p>
                      <p className="text-xs text-dark-4 dark:text-dark-6">Store: {d.shopName}</p>
                      <p className="text-xs text-dark-4 dark:text-dark-6">Driver: {d.driverName}</p>
                    </td>
                    <td className="p-3 font-semibold text-rose-500 max-w-xs truncate">{d.issue}</td>
                    <td className="p-3 font-bold text-dark dark:text-white">{d.refundRequested}</td>
                    <td className="p-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="p-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      {d.status === "open" ? (
                        <button
                          onClick={() => {
                            setSelectedLiability("shop");
                            setResolveModal(d);
                          }}
                          className="px-4 py-2 bg-dark text-white dark:bg-white dark:text-dark rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                          Resolve Liability
                        </button>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-2 text-dark dark:bg-dark-2 dark:text-white capitalize">
                          Billed to: {d.liability}
                        </span>
                      )}
                      <button
                        onClick={() => setViewModal(d)}
                        className="px-3 py-2 border border-stroke rounded-lg text-xs font-semibold text-dark hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-white transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Dispute Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-dark dark:text-white">Dispute Case: {viewModal.id}</h3>
                <p className="text-xs text-dark-4 dark:text-dark-6">Order #{viewModal.orderId}</p>
              </div>
              <StatusBadge status={viewModal.status} />
            </div>

            <div className="space-y-3 rounded-xl bg-gray-2 dark:bg-dark-2 p-4 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Customer:</span>
                <span className="font-bold text-dark dark:text-white">{viewModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Store Partner:</span>
                <span className="font-medium text-dark dark:text-white">{viewModal.shopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Assigned Driver:</span>
                <span className="font-medium text-dark dark:text-white">{viewModal.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Claimed Refund:</span>
                <span className="font-bold text-rose-500">{viewModal.refundRequested}</span>
              </div>
              <div className="border-t border-stroke dark:border-stroke-dark my-2"></div>
              <div>
                <span className="text-xs font-semibold text-dark-4 dark:text-dark-6 block mb-1">
                  Reported Issue Description:
                </span>
                <p className="text-sm font-medium text-dark dark:text-white bg-white dark:bg-dark-3 p-3 rounded-lg border border-stroke dark:border-stroke-dark">
                  "{viewModal.issue}"
                </p>
              </div>
              {viewModal.status === "resolved" && (
                <div className="flex justify-between pt-2">
                  <span className="text-dark-4 dark:text-dark-6">Adjudicated Liability:</span>
                  <span className="font-bold text-emerald-500 capitalize">Billed to: {viewModal.liability}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              {viewModal.status === "open" && (
                <button
                  onClick={() => {
                    const d = viewModal;
                    setViewModal(null);
                    setSelectedLiability("shop");
                    setResolveModal(d);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                >
                  Resolve Liability
                </button>
              )}
              <button
                onClick={() => setViewModal(null)}
                className="rounded-lg border border-stroke bg-gray-2 px-4 py-2 text-xs font-medium text-dark hover:bg-gray-3 dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-xl font-bold text-dark dark:text-white mb-2">Resolve Dispute: {resolveModal.id}</h3>
            <p className="text-sm text-dark-4 dark:text-dark-6 mb-4">
              Refund Amount: <span className="font-bold text-rose-500">{resolveModal.refundRequested}</span>
            </p>

            <p className="font-semibold text-xs text-dark dark:text-white mb-2 uppercase tracking-wide">
              Who is liable for this loss?
            </p>
            <div className="space-y-3 mb-6">
              <label
                className={`block p-3 border rounded-xl cursor-pointer transition-all ${
                  selectedLiability === "shop"
                    ? "border-primary bg-primary/5"
                    : "border-stroke dark:border-stroke-dark"
                }`}
              >
                <input
                  type="radio"
                  name="liability"
                  className="mr-3"
                  checked={selectedLiability === "shop"}
                  onChange={() => setSelectedLiability("shop")}
                />
                <span className="font-bold text-dark dark:text-white">Shop ({resolveModal.shopName})</span>
                <p className="text-xs text-dark-4 dark:text-dark-6 ml-6">
                  Deduct from next shop payout. (Missing/Wrong item packaged by store)
                </p>
              </label>

              <label
                className={`block p-3 border rounded-xl cursor-pointer transition-all ${
                  selectedLiability === "driver"
                    ? "border-primary bg-primary/5"
                    : "border-stroke dark:border-stroke-dark"
                }`}
              >
                <input
                  type="radio"
                  name="liability"
                  className="mr-3"
                  checked={selectedLiability === "driver"}
                  onChange={() => setSelectedLiability("driver")}
                />
                <span className="font-bold text-dark dark:text-white">Driver ({resolveModal.driverName})</span>
                <p className="text-xs text-dark-4 dark:text-dark-6 ml-6">
                  Deduct from driver delivery payout. (Damaged in transit / Unreported drop-off)
                </p>
              </label>

              <label
                className={`block p-3 border rounded-xl cursor-pointer transition-all ${
                  selectedLiability === "platform"
                    ? "border-primary bg-primary/5"
                    : "border-stroke dark:border-stroke-dark"
                }`}
              >
                <input
                  type="radio"
                  name="liability"
                  className="mr-3"
                  checked={selectedLiability === "platform"}
                  onChange={() => setSelectedLiability("platform")}
                />
                <span className="font-bold text-dark dark:text-white">Platform Loss (Grabb Platform)</span>
                <p className="text-xs text-dark-4 dark:text-dark-6 ml-6">
                  Absorb cost as platform customer retention expense.
                </p>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setResolveModal(null)}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold border border-stroke text-dark hover:bg-gray-2 dark:text-white dark:border-stroke-dark dark:hover:bg-dark-2"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { downloadCSV } from "@/utils/download";
import { DownloadIcon } from "@/assets/icons";

interface Subscription {
  id: string;
  shopName: string;
  ownerName: string;
  planName: string;
  startDate: string;
  expiryDate: string;
  amountPaid: string;
  autoRenew: boolean;
  status: "active" | "past_due" | "cancelled";
  paymentStatus: "paid" | "pending" | "failed";
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
}

const DEFAULT_PLAN_OPTIONS: PlanOption[] = [
  { id: "SUB-PLAN-1", name: "Lite Starter", price: "₹499.00" },
  { id: "SUB-PLAN-2", name: "Growth Professional", price: "₹1,499.00" },
  { id: "SUB-PLAN-3", name: "Enterprise Elite", price: "₹3,999.00" },
  { id: "SUB-PLAN-4", name: "Legacy Trial", price: "₹0.00" },
];

const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "SUB-8921",
    shopName: "Green Grocery Fresh",
    ownerName: "Rajesh Kumar",
    planName: "Growth Professional",
    startDate: "2026-07-01",
    expiryDate: "2026-08-01",
    amountPaid: "₹1,499.00",
    autoRenew: true,
    status: "active",
    paymentStatus: "paid",
  },
  {
    id: "SUB-8922",
    shopName: "Urban Organic Mart",
    ownerName: "Priya Sharma",
    planName: "Enterprise Elite",
    startDate: "2026-06-15",
    expiryDate: "2026-07-15",
    amountPaid: "₹3,999.00",
    autoRenew: false,
    status: "past_due",
    paymentStatus: "pending",
  },
  {
    id: "SUB-8923",
    shopName: "Daily Needs Superstore",
    ownerName: "Amit Patel",
    planName: "Lite Starter",
    startDate: "2026-07-10",
    expiryDate: "2026-08-10",
    amountPaid: "₹499.00",
    autoRenew: true,
    status: "active",
    paymentStatus: "paid",
  },
  {
    id: "SUB-8924",
    shopName: "Spice Garden Essentials",
    ownerName: "Sunita Rao",
    planName: "Growth Professional",
    startDate: "2026-05-01",
    expiryDate: "2026-06-01",
    amountPaid: "₹1,499.00",
    autoRenew: false,
    status: "cancelled",
    paymentStatus: "paid",
  },
];

export default function ActiveSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>(DEFAULT_PLAN_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [viewingSub, setViewingSub] = useState<Subscription | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // Edit fields
  const [editPlanName, setEditPlanName] = useState("");
  const [editAmountPaid, setEditAmountPaid] = useState("");
  const [editAutoRenew, setEditAutoRenew] = useState(true);
  const [editStatus, setEditStatus] = useState<"active" | "past_due" | "cancelled">("active");

  useEffect(() => {
    fetchSubscriptions();
    fetchAvailablePlans();
  }, []);

  const fetchAvailablePlans = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/subscriptions/plans");
      let fetched: any[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      if (fetched.length > 0) {
        setAvailablePlans(
          fetched.map((p: any) => ({
            id: p.id || p.plan_id || "",
            name: p.name || p.title || "",
            price: p.price ? (String(p.price).startsWith("₹") ? String(p.price) : `₹${p.price}`) : "₹0.00",
          }))
        );
      }
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch available plans:", err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/subscriptions/active");
      let fetched: any[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      if (fetched.length > 0) {
        const mapped = fetched.map((s: any) => ({
          id: s.id || s.subscription_id || `SUB-${s.pk}`,
          shopName: s.shopName || s.shop_name || s.shop?.name || "",
          ownerName: s.ownerName || s.owner_name || s.shop?.owner_name || "",
          planName: s.planName || s.plan_name || s.plan?.name || "",
          startDate: s.startDate || s.start_date || "",
          expiryDate: s.expiryDate || s.expiry_date || s.end_date || "",
          amountPaid: s.amountPaid
            ? (String(s.amountPaid).startsWith("₹") ? String(s.amountPaid) : `₹${s.amountPaid}`)
            : (s.amount_paid
                ? (String(s.amount_paid).startsWith("₹") ? String(s.amount_paid) : `₹${s.amount_paid}`)
                : "₹0.00"),
          autoRenew: typeof s.autoRenew === "boolean" ? s.autoRenew : (typeof s.auto_renew === "boolean" ? s.auto_renew : true),
          status: (s.status || "active").toLowerCase() as "active" | "past_due" | "cancelled",
          paymentStatus: (s.paymentStatus || s.payment_status || "paid").toLowerCase() as "paid" | "pending" | "failed",
        }));
        setSubscriptions(mapped);
      } else {
        setSubscriptions(DEFAULT_SUBSCRIPTIONS);
      }
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch subscriptions:", err);
      setSubscriptions(DEFAULT_SUBSCRIPTIONS);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubs = subscriptions.filter(
    (s) =>
      s.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    if (filteredSubs.length === 0) {
      toast.error("No subscriptions to export");
      return;
    }
    const headers = [
      "Subscription ID",
      "Shop Name",
      "Owner Name",
      "Plan Name",
      "Start Date",
      "Expiry Date",
      "Amount Paid",
      "Auto-Renew",
      "Subscription Status",
      "Payment Status",
    ];
    const rows = filteredSubs.map((s) => [
      s.id,
      s.shopName,
      s.ownerName,
      s.planName,
      s.startDate,
      s.expiryDate,
      s.amountPaid,
      s.autoRenew ? "Enabled" : "Disabled",
      s.status.toUpperCase(),
      s.paymentStatus.toUpperCase(),
    ]);
    downloadCSV("active_merchant_subscriptions.csv", headers, rows);
    toast.success(`Exported ${filteredSubs.length} subscriptions to CSV!`);
  };

  const openModifyModal = (sub: Subscription) => {
    setEditingSub(sub);
    setEditPlanName(sub.planName);
    setEditAmountPaid(sub.amountPaid);
    setEditAutoRenew(sub.autoRenew);
    setEditStatus(sub.status);
  };

  const handleSaveModification = async () => {
    if (!editingSub) return;

    const updatedSub: Subscription = {
      ...editingSub,
      planName: editPlanName,
      amountPaid: editAmountPaid,
      autoRenew: editAutoRenew,
      status: editStatus,
    };

    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/subscriptions/active/${editingSub.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...updatedSub,
          plan_name: editPlanName,
          amount_paid: editAmountPaid.replace(/[^0-9.]/g, ""),
          auto_renew: editAutoRenew,
        }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to update subscription:", err);
    }

    setSubscriptions((prev) =>
      prev.map((s) => (s.id === editingSub.id ? updatedSub : s))
    );
    toast.success(`Subscription ${editingSub.id} modified successfully!`);
    setEditingSub(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;

    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/subscriptions/active/${cancelTargetId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "cancelled",
          autoRenew: false,
          auto_renew: false,
        }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to cancel subscription:", err);
    }

    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === cancelTargetId ? { ...s, status: "cancelled", autoRenew: false } : s
      )
    );
    toast.success("Subscription cancelled successfully");
    setCancelTargetId(null);
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubs.map((s) => s.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Active Subscriptions</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Monitor subscribed merchant shops, billing schedules, and plan auto-renewals.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Export CSV</span>
          <DownloadIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-white p-4 dark:bg-gray-dark border border-stroke dark:border-stroke-dark flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-[360px]">
          <input
            type="text"
            placeholder="Search shop, owner, plan, subscription ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-gray-2 py-2 pl-4 pr-10 text-sm outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
          />
        </div>
        <div className="text-xs font-semibold text-dark-4 dark:text-dark-6">
          Showing {filteredSubs.length} subscriptions
        </div>
      </div>

      {/* Main Table section */}
      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {filteredSubs.length === 0 ? (
          <EmptyState
            variant="subscriptions"
            title="No Active Subscriptions Found"
            description={
              searchQuery
                ? `No subscriptions found matching "${searchQuery}".`
                : "There are currently no active merchant shop subscriptions recorded in the system."
            }
            action={
              searchQuery
                ? {
                    label: "Clear Search Filter",
                    onClick: () => setSearchQuery(""),
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredSubs.length && filteredSubs.length > 0}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-stroke cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Subscription ID</th>
                  <th className="p-3">Shop & Owner</th>
                  <th className="p-3">Active Plan</th>
                  <th className="p-3">Billing Cycle</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Auto-Renew</th>
                  <th className="p-3">Subscription Status</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {filteredSubs.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors cursor-pointer ${
                        isSelected ? "bg-primary/5 dark:bg-primary/5" : ""
                      }`}
                      onClick={() => setViewingSub(s)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(s.id)}
                          className="size-4 rounded border-stroke cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-bold text-primary">{s.id}</td>
                      <td className="p-3">
                        <p className="font-semibold">{s.shopName}</p>
                        <p className="text-xs text-dark-4 dark:text-dark-6">Owner: {s.ownerName}</p>
                      </td>
                      <td className="p-3 font-medium text-dark dark:text-white">{s.planName}</td>
                      <td className="p-3 text-xs">
                        <div>Start: {s.startDate}</div>
                        <div className="text-dark-4 dark:text-dark-6">Expiry: {s.expiryDate}</div>
                      </td>
                      <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {s.amountPaid}
                      </td>
                      <td className="p-3 font-semibold text-center sm:text-left">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
                            s.autoRenew
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                        >
                          {s.autoRenew ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="p-3">
                        <StatusBadge status={s.paymentStatus} />
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <TableActionsDropdown
                          actions={[
                            {
                              label: "View Details",
                              onClick: () => setViewingSub(s),
                            },
                            {
                              label: "Modify Plan",
                              onClick: () => openModifyModal(s),
                              variant: "primary",
                            },
                            ...(s.status !== "cancelled"
                              ? [
                                  {
                                    label: "Cancel Subscription",
                                    onClick: () => setCancelTargetId(s.id),
                                    variant: "danger" as const,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Subscription Details Modal */}
      {viewingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-dark dark:text-white">Subscription Details</h3>
                <p className="text-xs text-dark-4 dark:text-dark-6">{viewingSub.id}</p>
              </div>
              <StatusBadge status={viewingSub.status} />
            </div>

            <div className="space-y-3 rounded-xl bg-gray-2 dark:bg-dark-2 p-4 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Store Name:</span>
                <span className="font-bold text-dark dark:text-white">{viewingSub.shopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Merchant Owner:</span>
                <span className="font-medium text-dark dark:text-white">{viewingSub.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Subscribed Tier:</span>
                <span className="font-bold text-primary">{viewingSub.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Billing Start Date:</span>
                <span className="font-medium text-dark dark:text-white">{viewingSub.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Next Expiry / Renewal:</span>
                <span className="font-medium text-dark dark:text-white">{viewingSub.expiryDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Amount Paid:</span>
                <span className="font-bold text-emerald-500">{viewingSub.amountPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Auto Renewal:</span>
                <span className="font-bold">{viewingSub.autoRenew ? "Enabled (Credit Card)" : "Disabled"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Payment Status:</span>
                <StatusBadge status={viewingSub.paymentStatus} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  const s = viewingSub;
                  setViewingSub(null);
                  openModifyModal(s);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Modify Plan
              </button>
              <button
                onClick={() => setViewingSub(null)}
                className="rounded-lg border border-stroke bg-gray-2 px-4 py-2 text-xs font-medium text-dark hover:bg-gray-3 dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Subscription Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">
              Modify Subscription: {editingSub.id}
            </h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">
              Update merchant plan level, recurring fee, and renewal state.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Assigned Plan</label>
                <select
                  value={editPlanName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setEditPlanName(selectedName);
                    const matched = availablePlans.find((p) => p.name === selectedName);
                    if (matched) setEditAmountPaid(matched.price);
                  }}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  {!availablePlans.some((p) => p.name === editPlanName) && editPlanName && (
                    <option value={editPlanName}>
                      {editPlanName} ({editAmountPaid}/mo)
                    </option>
                  )}
                  {availablePlans.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.price}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Billing Amount</label>
                <input
                  type="text"
                  value={editAmountPaid}
                  onChange={(e) => setEditAmountPaid(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "active" | "past_due" | "cancelled")}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoRenewCheck"
                  checked={editAutoRenew}
                  onChange={(e) => setEditAutoRenew(e.target.checked)}
                  className="size-4 rounded border-stroke cursor-pointer"
                />
                <label htmlFor="autoRenewCheck" className="text-xs font-semibold text-dark dark:text-white cursor-pointer">
                  Enable automatic recurring card renewal
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingSub(null)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModification}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(cancelTargetId)}
        onClose={() => setCancelTargetId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Active Subscription"
        description="Are you sure you want to cancel this merchant's subscription? Auto-renewal will be immediately disabled and merchant benefits will revert at cycle expiration."
        confirmLabel="Cancel Subscription"
        variant="danger"
      />
    </div>
  );
}

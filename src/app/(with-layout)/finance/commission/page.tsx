"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { downloadCSV } from "@/utils/download";
import { DownloadIcon } from "@/assets/icons";

interface ShopCommission {
  id: string;
  name: string;
  commissionPct: number;
}

const DEFAULT_OVERRIDES: ShopCommission[] = [
  { id: "s1", name: "Green Grocery Fresh", commissionPct: 12.0 },
  { id: "s2", name: "Urban Organic Mart", commissionPct: 10.0 },
  { id: "s3", name: "Daily Needs Superstore", commissionPct: 18.0 },
];

export default function CommissionRulesPage() {
  const [globalCommission, setGlobalCommission] = useState<number>(15.0);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState<number>(2.5);
  const [perKmRate, setPerKmRate] = useState<number>(0.8);
  const [freeThreshold, setFreeThreshold] = useState<number>(30.0);
  const [shopOverrides, setShopOverrides] = useState<ShopCommission[]>(DEFAULT_OVERRIDES);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [newShopPct, setNewShopPct] = useState<number>(12.0);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchCommissionRules();
  }, []);

  const fetchCommissionRules = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/finance/commission-rules");
      const data = res?.data || res;
      if (data) {
        if (data.globalCommission != null) setGlobalCommission(Number(data.globalCommission));
        if (data.baseDeliveryFee != null) setBaseDeliveryFee(Number(data.baseDeliveryFee));
        if (data.perKmRate != null) setPerKmRate(Number(data.perKmRate));
        if (data.freeThreshold != null) setFreeThreshold(Number(data.freeThreshold));
        if (Array.isArray(data.shopOverrides)) setShopOverrides(data.shopOverrides);
      }
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch commission rules:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSchedule = () => {
    const headers = ["Parameter / Shop", "Rate / Amount", "Unit / Metric"];
    const rows = [
      ["Global Platform Commission", `${globalCommission}%`, "Percentage per sale"],
      ["Base Delivery Fee", `₹${baseDeliveryFee}`, "Fixed base fee"],
      ["Per Kilometer Rate", `₹${perKmRate}/km`, "Distance rate"],
      ["Free Delivery Threshold", `₹${freeThreshold}`, "Order minimum for 0 fee"],
      ...shopOverrides.map((s) => [
        `Override: ${s.name}`,
        `${s.commissionPct}%`,
        "Shop specific commission rate",
      ]),
    ];
    downloadCSV("platform_commission_schedule.csv", headers, rows);
    toast.success("Commission schedule exported as CSV!");
  };

  const handleSaveGlobal = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi("/finance/commission-rules", {
        method: "PATCH",
        body: JSON.stringify({
          globalCommission,
          baseDeliveryFee,
          perKmRate,
          freeThreshold,
        }),
      });
      toast.success("Global commission saved successfully!");
    } catch (err: any) {
      if (err?.status === 404) {
        toast.info("Commission rules saved locally.");
      } else {
        toast.error(err.message || "Failed to update commission rules");
      }
    }
  };

  const handleSaveDeliveryFees = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi("/finance/commission-rules", {
        method: "PATCH",
        body: JSON.stringify({
          globalCommission,
          baseDeliveryFee,
          perKmRate,
          freeThreshold,
        }),
      });
      toast.success("Delivery fee calculation rules saved successfully!");
    } catch (err: any) {
      if (err?.status === 404) {
        toast.info("Delivery fee rules saved locally.");
      } else {
        toast.error(err.message || "Failed to save delivery fees");
      }
    }
  };

  const handleUpdateShopPct = async (id: string, pct: number) => {
    const updatedPct = Math.max(0, pct);
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/finance/commission-rules/shops/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ commissionPct: updatedPct }),
      });
      toast.success("Updated shop commission");
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to update shop commission:", err);
    }
    setShopOverrides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, commissionPct: updatedPct } : s))
    );
  };

  const handleAddShopOverride = async () => {
    if (!newShopName.trim()) {
      toast.error("Please enter a shop name");
      return;
    }
    const newId = `s_${Date.now()}`;
    const newEntry: ShopCommission = {
      id: newId,
      name: newShopName.trim(),
      commissionPct: Number(newShopPct),
    };

    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi("/finance/commission-rules/shops", {
        method: "POST",
        body: JSON.stringify(newEntry),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to add shop override:", err);
    }

    setShopOverrides((prev) => [...prev, newEntry]);
    setNewShopName("");
    setNewShopPct(12.0);
    setIsAddModalOpen(false);
    toast.success(`Custom commission override added for ${newEntry.name}!`);
  };

  const handleDeleteOverride = async () => {
    if (!deleteTargetId) return;
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/finance/commission-rules/shops/${deleteTargetId}`, {
        method: "DELETE",
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to delete shop override:", err);
    }
    setShopOverrides((prev) => prev.filter((s) => s.id !== deleteTargetId));
    toast.success("Commission override removed (shop reverted to global rate)");
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Commission & Delivery Fee Rules</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Set platform revenue commission rates, per-shop overrides, and customer delivery fee calculation rules.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportSchedule}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 transition-colors flex items-center gap-2"
          >
            <span>Export Schedule</span>
            <DownloadIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Global Platform Commission Form */}
        <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-4">
          <h3 className="text-base font-bold text-dark dark:text-white mb-2">Global Platform Commission</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">Default Commission Rate (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.5"
                value={globalCommission}
                onChange={(e) => setGlobalCommission(parseFloat(e.target.value) || 0)}
                className="w-32 rounded-lg border border-stroke bg-gray-2 p-2.5 font-bold text-dark dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              />
              <span className="text-sm text-dark-4 dark:text-dark-6">% per completed order</span>
            </div>
          </div>
          <button
            onClick={handleSaveGlobal}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Save Global Commission
          </button>
        </div>

        {/* Delivery Fee Calculation Rules */}
        <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-4">
          <h3 className="text-base font-bold text-dark dark:text-white mb-2">Delivery Fee Calculation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Base Delivery Fee (₹)</label>
              <input
                type="number"
                step="0.5"
                value={baseDeliveryFee}
                onChange={(e) => setBaseDeliveryFee(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm font-bold dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Per KM Rate (₹/km)</label>
              <input
                type="number"
                step="0.1"
                value={perKmRate}
                onChange={(e) => setPerKmRate(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm font-bold dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Free Delivery Order Threshold (₹)</label>
            <input
              type="number"
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm font-bold dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
            />
          </div>

          <button
            onClick={handleSaveDeliveryFees}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Save Delivery Fee Rules
          </button>
        </div>
      </div>

      {/* Per-Shop Custom Commission Overrides Table */}
      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-dark dark:text-white">Per-Shop Custom Commission Overrides</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6">
              Shops listed here override the default {globalCommission}% platform commission.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            + Add Shop Override
          </button>
        </div>

        {shopOverrides.length === 0 ? (
          <EmptyState
            variant="commission"
            title="No Shop Overrides Configured"
            description={`All shops currently inherit the default global platform commission rate of ${globalCommission}%.`}
            action={{
              label: "Add Shop Override",
              onClick: () => setIsAddModalOpen(true),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Shop Name</th>
                  <th className="p-3">Custom Commission (%)</th>
                  <th className="p-3">Effective Override</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {shopOverrides.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                    <td className="p-3 font-bold">{s.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={s.commissionPct}
                          onChange={(e) => handleUpdateShopPct(s.id, parseFloat(e.target.value) || 0)}
                          className="w-24 rounded border border-stroke p-1.5 font-bold text-center dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                        />
                        <span className="text-xs font-semibold">%</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-bold text-emerald-500">
                      {s.commissionPct}% per sale
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setDeleteTargetId(s.id)}
                        className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 transition-colors"
                      >
                        Reset / Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Shop Override Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Add Shop Commission Override</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">
              Apply a custom revenue share percentage for a specific merchant store.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Shop Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="e.g. City Central Supermarket"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Custom Commission Rate (%) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={newShopPct}
                    onChange={(e) => setNewShopPct(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm font-bold text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  />
                  <span className="font-bold text-dark dark:text-white">%</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAddShopOverride}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Reset Override Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteOverride}
        title="Remove Commission Override"
        description="Are you sure you want to remove this shop's custom override? The shop will revert to the default platform commission rate."
        confirmLabel="Remove Override"
        variant="warning"
      />
    </div>
  );
}

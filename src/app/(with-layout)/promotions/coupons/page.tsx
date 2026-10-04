"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TrashTabWrapper } from "@/components/common/trash-tab-wrapper";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";

interface Coupon {
  id: string;
  code: string;
  type: "%" | "flat";
  value: string;
  minOrder: string;
  maxDiscount: string;
  validDates: string;
  usageCount: number;
  usageLimit: number;
  status: "active" | "inactive";
  isDeleted?: boolean;
}

export default function CouponsPage() {
  const [tab, setTab] = useState<"active" | "trash">("active");

  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: "c1", code: "WELCOME50", type: "%", value: "50%", minOrder: "₹20.00", maxDiscount: "₹10.00", validDates: "Aug 01 - Aug 31, 2026", usageCount: 420, usageLimit: 1000, status: "active" },
    { id: "c2", code: "FREESHIP", type: "flat", value: "₹4.00", minOrder: "₹30.00", maxDiscount: "₹4.00", validDates: "Aug 10 - Aug 20, 2026", usageCount: 180, usageLimit: 500, status: "active" },
    { id: "c3", code: "SUMMER15", type: "%", value: "15%", minOrder: "₹50.00", maxDiscount: "₹15.00", validDates: "Jul 01 - Jul 31, 2026", usageCount: 500, usageLimit: 500, status: "inactive" },
    { id: "c4", code: "EXPIRED20", type: "%", value: "20%", minOrder: "₹15.00", maxDiscount: "₹5.00", validDates: "Jun 01 - Jun 30, 2026", usageCount: 120, usageLimit: 200, status: "inactive", isDeleted: true },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"%" | "flat">("%");
  const [val, setVal] = useState("20");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleSave = () => {
    if (!code.trim()) return;
    setCoupons((prev) => [
      ...prev,
      {
        id: `cp_${Date.now()}`,
        code: code.toUpperCase(),
        type,
        value: type === "%" ? `${val}%` : `$${val}`,
        minOrder: "₹25.00",
        maxDiscount: "₹10.00",
        validDates: "Aug 10 - Sep 10, 2026",
        usageCount: 0,
        usageLimit: 500,
        status: "active",
      },
    ]);
    setModalOpen(false);
    setCode("");
  };

  const handleSoftDelete = (id: string) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, isDeleted: true } : c)));
  };

  const handleRestore = (id: string) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, isDeleted: false } : c)));
  };

  const activeCoupons = coupons.filter((c) => !c.isDeleted);
  const trashCoupons = coupons.filter((c) => c.isDeleted);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Coupon & Promo Management</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Create percentage/flat discount promo codes, usage limits, and valid date windows.
          </p>
        </div>
        <button
          onClick={() => {
            setCode(`GRABB${Math.floor(100 + Math.random() * 900)}`);
            setModalOpen(true);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90"
        >
          + Create Coupon
        </button>
      </div>

      <TrashTabWrapper
        activeTab={tab}
        onTabChange={setTab}
        activeCount={activeCoupons.length}
        trashCount={trashCoupons.length}
      >
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Coupon Code</th>
                  <th className="p-3">Discount Value</th>
                  <th className="p-3">Min Order / Cap</th>
                  <th className="p-3">Valid Window</th>
                  <th className="p-3">Redemptions</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {(tab === "active" ? activeCoupons : trashCoupons).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                    <td className="p-3 font-mono font-bold text-primary">{c.code}</td>
                    <td className="p-3 font-bold text-emerald-500">{c.value}</td>
                    <td className="p-3 text-xs">
                      Min: {c.minOrder} • Cap: {c.maxDiscount}
                    </td>
                    <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{c.validDates}</td>
                    <td className="p-3 text-xs font-semibold">
                      {c.usageCount} / {c.usageLimit} redeemed
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.status === "active"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <TableActionsDropdown
                        actions={
                          tab === "active"
                            ? [
                                {
                                  label: "Edit Coupon",
                                  onClick: () => toast.info(`Editing coupon: ${c.code}...`),
                                  variant: "primary",
                                },
                                {
                                  label: "Delete",
                                  onClick: () => setDeleteTargetId(c.id),
                                  variant: "danger",
                                },
                              ]
                            : [
                                {
                                  label: "Restore Coupon",
                                  onClick: () => handleRestore(c.id),
                                  variant: "primary",
                                },
                              ]
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TrashTabWrapper>

      {/* Add Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Create Promo Coupon</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 uppercase font-mono rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  />
                  <button
                    onClick={() => setCode(`PROMO${Math.floor(100 + Math.random() * 900)}`)}
                    className="rounded-lg border border-stroke bg-gray-2 px-3 py-2 text-xs font-semibold"
                  >
                    Auto Generate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  >
                    <option value="%">Percentage (%)</option>
                    <option value="flat">Flat Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                Create Coupon
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) handleSoftDelete(deleteTargetId);
        }}
        title="Soft Delete Coupon"
        description="Are you sure you want to move this coupon code to the Trash tab?"
        confirmLabel="Move to Trash"
      />
    </div>
  );
}

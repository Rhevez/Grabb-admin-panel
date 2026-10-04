"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { downloadCSV } from "@/utils/download";
import { DownloadIcon } from "@/assets/icons";

interface Plan {
  id: string;
  name: string;
  price: string;
  billingPeriod: string;
  orderLimit: string;
  activeSubscribers: number;
  status: "active" | "inactive";
  features: string[];
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: "SUB-PLAN-1",
    name: "Lite Starter",
    price: "₹499.00",
    billingPeriod: "Monthly",
    orderLimit: "150 orders/mo",
    activeSubscribers: 1,
    status: "active",
    features: ["1 Outlet", "Standard Listing", "Email Support", "Daily Order Quota (50/day)"],
  },
  {
    id: "SUB-PLAN-2",
    name: "Growth Professional",
    price: "₹1,499.00",
    billingPeriod: "Monthly",
    orderLimit: "1,000 orders/mo",
    activeSubscribers: 1,
    status: "active",
    features: ["3 Outlets", "0% Commission on first 100 orders", "Priority Search Ranking", "Dedicated Support"],
  },
  {
    id: "SUB-PLAN-3",
    name: "Enterprise Elite",
    price: "₹3,999.00",
    billingPeriod: "Monthly",
    orderLimit: "Unlimited",
    activeSubscribers: 1,
    status: "active",
    features: ["Unlimited Outlets", "Zero Order Limits", "24/7 Phone Support", "Custom Marketing Banners"],
  },
  {
    id: "SUB-PLAN-4",
    name: "Legacy Trial",
    price: "₹0.00",
    billingPeriod: "One-time",
    orderLimit: "20 orders total",
    activeSubscribers: 0,
    status: "inactive",
    features: ["1 Outlet", "Basic Analytics"],
  },
];

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("₹29.99");
  const [formBillingPeriod, setFormBillingPeriod] = useState("Monthly");
  const [formOrderLimit, setFormOrderLimit] = useState("500 orders/mo");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [formFeatures, setFormFeatures] = useState("2 Shops, Priority Support, Analytics");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const [resPlans, resActive] = await Promise.allSettled([
        fetchApi("/subscriptions/plans"),
        fetchApi("/subscriptions/active"),
      ]);

      let fetchedPlans: any[] = [];
      if (resPlans.status === "fulfilled") {
        const val = resPlans.value;
        if (Array.isArray(val)) fetchedPlans = val;
        else if (val && Array.isArray(val.data)) fetchedPlans = val.data;
        else if (val && Array.isArray(val.results)) fetchedPlans = val.results;
      }

      let activeSubs: any[] = [];
      if (resActive.status === "fulfilled") {
        const val = resActive.value;
        if (Array.isArray(val)) activeSubs = val;
        else if (val && Array.isArray(val.data)) activeSubs = val.data;
        else if (val && Array.isArray(val.results)) activeSubs = val.results;
      }

      const basePlans = fetchedPlans.length > 0 ? fetchedPlans : DEFAULT_PLANS;
      const mapped: Plan[] = basePlans.map((p: any) => {
        const planName = p.name || p.title || "";
        let activeCount = typeof p.activeSubscribers === "number" ? p.activeSubscribers : (typeof p.active_subscribers === "number" ? p.active_subscribers : 0);
        if (activeSubs.length > 0) {
          const matchingActive = activeSubs.filter((s: any) => {
            const sName = (s.planName || s.plan_name || s.plan?.name || "").trim().toLowerCase();
            const sStatus = (s.status || "").trim().toLowerCase();
            return sName === planName.trim().toLowerCase() && sStatus === "active";
          });
          activeCount = matchingActive.length;
        }

        return {
          id: p.id || p.plan_id || `SUB-PLAN-${p.pk || Date.now()}`,
          name: planName,
          price: p.price ? (String(p.price).startsWith("₹") ? String(p.price) : `₹${p.price}`) : "₹0.00",
          billingPeriod: p.billingPeriod || p.billing_period || "Monthly",
          orderLimit: p.orderLimit || p.order_limit || "Unlimited",
          activeSubscribers: activeCount,
          status: p.status || (p.is_active ? "active" : "inactive") || "active",
          features: Array.isArray(p.features) ? p.features : (typeof p.features === "string" ? p.features.split(",").map((f: string) => f.trim()) : []),
        };
      });

      setPlans(mapped);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch subscription plans:", err);
      setPlans(DEFAULT_PLANS);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (plans.length === 0) {
      toast.error("No plans to export");
      return;
    }
    const headers = ["Plan ID", "Name", "Price", "Billing Cycle", "Order Limit", "Active Subscribers", "Status", "Features"];
    const rows = plans.map((p) => [
      p.id,
      p.name,
      p.price,
      p.billingPeriod,
      p.orderLimit,
      p.activeSubscribers,
      p.status.toUpperCase(),
      p.features.join("; "),
    ]);
    downloadCSV("subscription_plans.csv", headers, rows);
    toast.success("Subscription plans exported as CSV!");
  };

  const openAddModal = () => {
    setEditingPlan(null);
    setFormName("");
    setFormPrice("₹999.00");
    setFormBillingPeriod("Monthly");
    setFormOrderLimit("500 orders/mo");
    setFormStatus("active");
    setFormFeatures("2 Shops, Priority Support, Standard Analytics");
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormPrice(plan.price);
    setFormBillingPeriod(plan.billingPeriod);
    setFormOrderLimit(plan.orderLimit);
    setFormStatus(plan.status);
    setFormFeatures(plan.features.join(", "));
    setIsModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!formName.trim()) {
      toast.error("Plan name is required");
      return;
    }

    const featureList = formFeatures
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    if (editingPlan) {
      // Editing
      const updated: Plan = {
        ...editingPlan,
        name: formName.trim(),
        price: formPrice,
        billingPeriod: formBillingPeriod,
        orderLimit: formOrderLimit,
        status: formStatus,
        features: featureList,
      };

      try {
        const { fetchApi } = await import("@/utils/api");
        await fetchApi(`/subscriptions/plans/${editingPlan.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...updated,
            billing_period: formBillingPeriod,
            order_limit: formOrderLimit,
            features: featureList,
          }),
        });
      } catch (err: any) {
        if (err?.status !== 404) console.error("Failed to update plan:", err);
      }

      setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? updated : p)));
      toast.success(`Plan "${formName}" updated successfully!`);
    } else {
      // Creating
      const newId = `SUB-PLAN-${Date.now().toString().slice(-4)}`;
      const newPlan: Plan = {
        id: newId,
        name: formName.trim(),
        price: formPrice,
        billingPeriod: formBillingPeriod,
        orderLimit: formOrderLimit,
        activeSubscribers: 0,
        status: formStatus,
        features: featureList,
      };

      try {
        const { fetchApi } = await import("@/utils/api");
        await fetchApi("/subscriptions/plans", {
          method: "POST",
          body: JSON.stringify({
            ...newPlan,
            billing_period: formBillingPeriod,
            order_limit: formOrderLimit,
            active_subscribers: 0,
            features: featureList,
          }),
        });
      } catch (err: any) {
        if (err?.status !== 404) console.error("Failed to create plan:", err);
      }

      setPlans((prev) => [newPlan, ...prev]);
      toast.success(`Plan "${formName}" created successfully!`);
    }

    setIsModalOpen(false);
  };

  const handleDeletePlan = async () => {
    if (!deleteTargetId) return;
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/subscriptions/plans/${deleteTargetId}`, {
        method: "DELETE",
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to delete plan:", err);
    }
    setPlans((prev) => prev.filter((item) => item.id !== deleteTargetId));
    toast.success("Subscription plan removed");
    setDeleteTargetId(null);
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === plans.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(plans.map((p) => p.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Subscription Plans</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Configure premium subscription packages, pricing terms, and platform limits.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 transition-colors flex items-center gap-2"
          >
            <span>Export CSV</span>
            <DownloadIcon className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors"
          >
            + Add New Plan
          </button>
        </div>
      </div>

      {/* Main Table section */}
      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {plans.length === 0 ? (
          <EmptyState
            variant="plans"
            title="No Subscription Plans Configured"
            description="There are currently no active merchant subscription tiers. Create your first plan to start monetizing merchant accounts."
            action={{
              label: "Add New Plan",
              onClick: openAddModal,
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === plans.length && plans.length > 0}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-stroke cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Plan Name</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Billing Cycle</th>
                  <th className="p-3">Order Limit</th>
                  <th className="p-3">Subscribers</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Key Features</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {plans.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors cursor-pointer ${
                        isSelected ? "bg-primary/5 dark:bg-primary/5" : ""
                      }`}
                      onClick={() => toggleSelectRow(p.id)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(p.id)}
                          className="size-4 rounded border-stroke cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-dark dark:text-white">{p.name}</p>
                        <p className="text-xs text-dark-4 dark:text-dark-6">{p.id}</p>
                      </td>
                      <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {p.price}
                      </td>
                      <td className="p-3 font-medium">{p.billingPeriod}</td>
                      <td className="p-3 text-dark-4 dark:text-dark-6">{p.orderLimit}</td>
                      <td className="p-3 font-bold text-center sm:text-left">{p.activeSubscribers} shops</td>
                      <td className="p-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-3 max-w-[240px] truncate">
                        <div className="flex flex-wrap gap-1">
                          {p.features.slice(0, 2).map((f, i) => (
                            <span key={i} className="rounded bg-gray-100 dark:bg-dark-3 px-1.5 py-0.5 text-[10px]">
                              {f}
                            </span>
                          ))}
                          {p.features.length > 2 && (
                            <span className="text-[10px] text-dark-4 dark:text-dark-6">
                              +{p.features.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <TableActionsDropdown
                          actions={[
                            {
                              label: "Edit Plan",
                              onClick: () => openEditModal(p),
                              variant: "primary",
                            },
                            {
                              label: "Delete Plan",
                              onClick: () => setDeleteTargetId(p.id),
                              variant: "danger",
                            },
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

      {/* Add / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Subscription Plan"}
            </h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">
              Configure package pricing, order throughput quotas, and feature entitlements.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Growth Accelerator"
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Price</label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="₹49.99"
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Billing Period</label>
                  <select
                    value={formBillingPeriod}
                    onChange={(e) => setFormBillingPeriod(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Order Limit</label>
                  <input
                    type="text"
                    value={formOrderLimit}
                    onChange={(e) => setFormOrderLimit(e.target.value)}
                    placeholder="e.g. 1,000 orders/mo"
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Plan Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "active" | "inactive")}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Features (comma separated)
                </label>
                <input
                  type="text"
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  placeholder="3 Shops, Priority Support, Realtime Tracking"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
              >
                {editingPlan ? "Save Changes" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeletePlan}
        title="Delete Subscription Plan"
        description="Are you sure you want to delete this subscription plan? Existing merchant contracts on this plan will not be terminated, but new subscriptions cannot be initiated."
        confirmLabel="Confirm Delete"
        variant="danger"
      />
    </div>
  );
}

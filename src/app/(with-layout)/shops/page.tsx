"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { TrashTabWrapper } from "@/components/common/trash-tab-wrapper";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";
import { EmptyState } from "@/components/common/empty-state";
import { downloadCSV } from "@/utils/download";

interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  status: "active" | "inactive" | "pending";
  hours: string;
  radius: string;
  productsCount: number;
  ordersMonth: number;
  isDeleted?: boolean;
}

export default function ShopsPage() {
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchShops();
    fetchPendingCount();
  }, []);

  const fetchPendingCount = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/vendor/shops/pending");
      const list = Array.isArray(res) ? res : res?.data || res?.results || [];
      if (Array.isArray(list)) {
        setPendingCount(list.length);
      }
    } catch {
      // Non-critical count
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/vendor/shops");
      let fetched: any[] = [];
      if (Array.isArray(res)) {
        fetched = res;
      } else if (res && Array.isArray(res.data)) {
        fetched = res.data;
      } else if (res && Array.isArray(res.results)) {
        fetched = res.results;
      }

      const mapped: Shop[] = fetched.map((s) => ({
        id: s.id,
        name: s.name || "Unnamed Shop",
        ownerName: s.ownerName || s.owner_name || "N/A",
        phone: s.phone || "N/A",
        status: s.status || "active",
        hours: s.hours || "08:00 AM - 10:00 PM",
        radius: typeof s.radius === "number" ? `${s.radius} km` : (s.radius || "5.0 km"),
        productsCount: s.productsCount ?? s.products_count ?? 0,
        ordersMonth: s.ordersMonth ?? s.orders_month ?? 0,
        isDeleted: Boolean(s.isDeleted ?? s.is_deleted),
      }));

      setShops(mapped);
    } catch (err: any) {
      console.error("Failed to fetch shops:", err);
      toast.error(err?.message || "Failed to load shops from backend");
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const safeShops = Array.isArray(shops) ? shops : [];

  const filteredShops = safeShops.filter((s) => {
    const matchesTab = tab === "trash" ? s.isDeleted : !s.isDeleted;
    const matchesSearch =
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.ownerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setShops((prev) => prev.map((s) => (s.id === id ? { ...s, status: nextStatus as any } : s)));
      toast.success(`Shop status changed to ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: true, is_deleted: true }),
      });
      setShops((prev) => prev.map((s) => (s.id === id ? { ...s, isDeleted: true } : s)));
      toast.success("Shop moved to trash");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete shop");
    }
    setDeleteTargetId(null);
  };

  const handleRestore = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: false, is_deleted: false }),
      });
      setShops((prev) => prev.map((s) => (s.id === id ? { ...s, isDeleted: false } : s)));
      toast.success("Shop restored successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to restore shop");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Shop Directory</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Partner grocery stores, operating hours, service coverage radius, and approvals.
          </p>
        </div>
        <Link
          href="/shops/onboarding"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors self-start sm:self-auto flex items-center gap-2"
        >
          <span>Pending Approvals Queue</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
            {pendingCount}
          </span>
        </Link>
      </div>

      <FilterBar
        searchPlaceholder="Search shop or owner name..."
        searchValue={search}
        onSearchChange={setSearch}
        onExport={() => {
          if (filteredShops.length === 0) {
            toast.error("No shops to export");
            return;
          }
          const headers = ["Shop ID", "Shop Name", "Owner", "Phone", "Hours", "Coverage Radius", "Products Count", "Orders (Month)", "Status"];
          const rows = filteredShops.map(s => [s.id, s.name, s.ownerName, s.phone, s.hours, s.radius, s.productsCount, s.ordersMonth, s.status.toUpperCase()]);
          downloadCSV("shops_directory.csv", headers, rows);
          toast.success(`Exported ${filteredShops.length} shops as CSV!`);
        }}
      />

      <TrashTabWrapper
        activeTab={tab}
        onTabChange={setTab}
        activeCount={shops.filter((s) => !s.isDeleted).length}
        trashCount={shops.filter((s) => s.isDeleted).length}
      >
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-dark-4 dark:text-dark-6">Loading shops...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <EmptyState
              variant="catalog"
              title={tab === "trash" ? "Trash is Empty" : "No Shops Found"}
              description={tab === "trash" ? "There are no deleted shops in the trash." : (search ? `No shops found matching "${search}".` : "There are currently no active merchant shops.")}
              action={search ? { label: "Clear Search", onClick: () => setSearch("") } : undefined}
            />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Shop Name</th>
                  <th className="p-3">Owner / Contact</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Service Radius</th>
                  <th className="p-3">Products</th>
                  <th className="p-3">Orders (Month)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {filteredShops.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                    <td className="p-3 font-bold text-primary">
                      <Link href={`/shops/${s.id}`}>{s.name}</Link>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold">{s.ownerName}</p>
                      <p className="text-xs text-dark-4 dark:text-dark-6">{s.phone}</p>
                    </td>
                    <td className="p-3 text-xs">{s.hours}</td>
                    <td className="p-3 font-semibold text-emerald-500">{s.radius}</td>
                    <td className="p-3">{s.productsCount} items</td>
                    <td className="p-3 font-bold">{s.ordersMonth}</td>
                    <td className="p-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <TableActionsDropdown
                        actions={
                          tab === "active"
                            ? [
                                {
                                  label: "Edit Shop",
                                  onClick: () => window.location.href = `/shops/${s.id}`,
                                  variant: "primary",
                                },
                                {
                                  label: s.status === "active" ? "Set Inactive" : "Set Active",
                                  onClick: () => handleToggleStatus(s.id, s.status),
                                },
                                {
                                  label: "Delete",
                                  onClick: () => setDeleteTargetId(s.id),
                                  variant: "danger",
                                },
                              ]
                            : [
                                {
                                  label: "Restore Shop",
                                  onClick: () => handleRestore(s.id),
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
          )}
        </div>
      </TrashTabWrapper>

      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) handleSoftDelete(deleteTargetId);
        }}
        title="Soft Delete Shop"
        description="Are you sure you want to move this shop to the Trash tab?"
        confirmLabel="Move to Trash"
      />
    </div>
  );
}

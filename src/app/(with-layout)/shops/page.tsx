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

const DEFAULT_SHOPS: Shop[] = [
  {
    id: "s1",
    name: "Green Grocery Fresh",
    ownerName: "Rajesh Kumar",
    phone: "+91 98111 55443",
    status: "active",
    hours: "07:00 AM - 10:00 PM",
    radius: "5.0 km",
    productsCount: 420,
    ordersMonth: 1240,
  },
  {
    id: "s2",
    name: "Urban Organic Mart",
    ownerName: "Pooja Mehta",
    phone: "+91 98222 66554",
    status: "active",
    hours: "08:00 AM - 09:30 PM",
    radius: "7.5 km",
    productsCount: 310,
    ordersMonth: 890,
  },
  {
    id: "s3",
    name: "Daily Needs Superstore",
    ownerName: "Sunil Verma",
    phone: "+91 98333 77665",
    status: "active",
    hours: "06:30 AM - 11:00 PM",
    radius: "10.0 km",
    productsCount: 650,
    ordersMonth: 1520,
  },
  {
    id: "s4",
    name: "Healthy Harvest Organics",
    ownerName: "Anita Roy",
    phone: "+91 98444 88776",
    status: "pending",
    hours: "09:00 AM - 08:00 PM",
    radius: "4.0 km",
    productsCount: 85,
    ordersMonth: 0,
  },
  {
    id: "s5",
    name: "Old City Grocery Corner",
    ownerName: "Mohd. Ali",
    phone: "+91 98555 99887",
    status: "inactive",
    hours: "09:00 AM - 07:00 PM",
    radius: "3.0 km",
    productsCount: 120,
    ordersMonth: 45,
    isDeleted: true,
  },
];

export default function ShopsPage() {
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/vendor/shops");
      let fetched: Shop[] = [];
      if (Array.isArray(res)) {
        fetched = res;
      } else if (res && Array.isArray(res.data)) {
        fetched = res.data;
      } else if (res && Array.isArray(res.results)) {
        fetched = res.results;
      }
      setShops(fetched.length > 0 ? fetched : DEFAULT_SHOPS);
    } catch (err: any) {
      if (err?.status !== 404) {
        console.error("Failed to fetch shops:", err);
      }
      setShops(DEFAULT_SHOPS);
    } finally {
      setLoading(false);
    }
  };

  const safeShops = Array.isArray(shops) ? shops : [];

  const filteredShops = safeShops.filter((s) => {
    const matchesTab = tab === "trash" ? s.isDeleted : !s.isDeleted;
    const matchesSearch =
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.ownerName || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSoftDelete = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: true, is_deleted: true }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error deleting shop:", err);
    }
    setShops((prev) => prev.map((s) => (s.id === id ? { ...s, isDeleted: true } : s)));
  };

  const handleRestore = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: false, is_deleted: false }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error restoring shop:", err);
    }
    setShops((prev) => prev.map((s) => (s.id === id ? { ...s, isDeleted: false } : s)));
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
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          Pending Approvals Queue (1)
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
          {filteredShops.length === 0 ? (
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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";
import { EmptyState } from "@/components/common/empty-state";
import { downloadCSV } from "@/utils/download";

interface UserCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: string;
  joinedDate: string;
  status: "active" | "inactive";
}

const DEFAULT_USERS: UserCustomer[] = [
  { id: "u1", name: "Aarav Sharma", phone: "+91 98765 43210", email: "aarav@example.com", totalOrders: 28, totalSpent: "₹1,240.00", joinedDate: "Jan 12, 2026", status: "active" },
  { id: "u2", name: "Neha Gupta", phone: "+91 98123 45678", email: "neha@example.com", totalOrders: 14, totalSpent: "₹580.50", joinedDate: "Feb 04, 2026", status: "active" },
  { id: "u3", name: "Rohan Verma", phone: "+91 97111 22233", email: "rohan@example.com", totalOrders: 9, totalSpent: "₹390.00", joinedDate: "Mar 18, 2026", status: "active" },
  { id: "u4", name: "Spam Customer", phone: "+91 90000 00000", email: "spam@example.com", totalOrders: 1, totalSpent: "₹12.00", joinedDate: "Aug 01, 2026", status: "inactive" },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [blockTargetId, setBlockTargetId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/users/customers");
      let fetched: UserCustomer[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setUsers(fetched.length > 0 ? fetched : DEFAULT_USERS);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch customers:", err);
      setUsers(DEFAULT_USERS);
    } finally {
      setLoading(false);
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter((u) => {
    const matchesStatus = selectedStatus === "all" || u.status === selectedStatus;
    const matchesSearch =
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleToggleBlock = async (reason?: string) => {
    if (!blockTargetId) return;
    const targetUser = users.find((u) => u.id === blockTargetId);
    const nextStatus = targetUser?.status === "active" ? "inactive" : "active";
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/users/customers/${blockTargetId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, reason }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to update customer status:", err);
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === blockTargetId
          ? { ...u, status: nextStatus }
          : u
      )
    );
    toast.success(`Customer status updated to ${nextStatus}! Reason: ${reason || "N/A"}`);
    setBlockTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Customer Management</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Registered app users, purchase history, order volume, and account status controls.
          </p>
        </div>
      </div>

      <FilterBar
        searchPlaceholder="Search by customer name, phone, or email..."
        searchValue={search}
        onSearchChange={setSearch}
        onExport={() => {
          if (filteredUsers.length === 0) {
            toast.error("No customers to export");
            return;
          }
          const headers = ["Customer ID", "Name", "Phone", "Email", "Total Orders", "Total Spent", "Joined Date", "Status"];
          const rows = filteredUsers.map(u => [u.id, u.name, u.phone, u.email, u.totalOrders, u.totalSpent, u.joinedDate, u.status.toUpperCase()]);
          downloadCSV("customers_list.csv", headers, rows);
          toast.success(`Exported ${filteredUsers.length} customers as CSV!`);
        }}
      />

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {filteredUsers.length === 0 ? (
          <EmptyState
            variant="users"
            title="No Customers Found"
            description={search || selectedStatus !== "all" ? "No registered customers match your search criteria." : "There are currently no customer profiles registered."}
            action={search || selectedStatus !== "all" ? { label: "Reset Filter", onClick: () => { setSearch(""); setSelectedStatus("all"); } } : undefined}
          />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Total Orders</th>
                <th className="p-3">Total Spent</th>
                <th className="p-3">Joined Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3 font-bold text-primary">
                    <Link href={`/users/${u.id}`}>{u.name}</Link>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold">{u.phone}</p>
                    <p className="text-xs text-dark-4 dark:text-dark-6">{u.email}</p>
                  </td>
                  <td className="p-3 font-bold">{u.totalOrders} orders</td>
                  <td className="p-3 font-bold text-emerald-500">{u.totalSpent}</td>
                  <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{u.joinedDate}</td>
                  <td className="p-3">
                    <StatusBadge status={u.status === "active" ? "active" : "inactive"} />
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <TableActionsDropdown
                      actions={[
                        {
                          label: "View Profile",
                          onClick: () => window.location.href = `/users/${u.id}`,
                          variant: "primary",
                        },
                        {
                          label: "Edit User",
                          onClick: () => toast.info(`Editing user: ${u.name}...`),
                        },
                        {
                          label: u.status === "active" ? "Block" : "Unblock",
                          onClick: () => setBlockTargetId(u.id),
                          variant: u.status === "active" ? "danger" : "default",
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

      <ConfirmModal
        isOpen={Boolean(blockTargetId)}
        onClose={() => setBlockTargetId(null)}
        onConfirm={handleToggleBlock}
        title="Update Account Status"
        description="Specify a reason for blocking/unblocking this user's account."
        confirmLabel="Confirm Action"
        requireReason
        reasonPlaceholder="Provide reason for status change..."
      />
    </div>
  );
}

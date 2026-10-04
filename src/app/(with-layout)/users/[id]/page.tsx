"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { LocationPinIcon } from "@/assets/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [status, setStatus] = useState("active");
  const [userName, setUserName] = useState("Aarav Sharma");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [email, setEmail] = useState("aarav@example.com");
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "addresses">("history");

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi(`/users/customers/${id}`);
      const data = res?.data || res;
      if (data && data.name) {
        setUserName(data.name || userName);
        setPhone(data.phone || phone);
        setEmail(data.email || email);
        setStatus(data.status || status);
      }
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch customer detail:", err);
    }
  };

  const handleToggleBlock = async (reason?: string) => {
    const nextStatus = status === "active" ? "inactive" : "active";
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/users/customers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, reason }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error toggling customer status:", err);
    }
    setStatus(nextStatus);
    toast.success(`User status changed to ${nextStatus}! Reason: ${reason || "N/A"}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col gap-2">
            <Link href="/users" className="text-xs font-semibold text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white w-fit">
              ← Back to Customer Directory
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-dark dark:text-white">Aarav Sharma</h1>
              <StatusBadge status={status} />
            </div>
          </div>
          <p className="text-sm text-dark-4 dark:text-dark-6 mt-1">
            Customer ID: {id} • Phone: <span className="font-semibold text-dark dark:text-white">+91 98765 43210</span> • Joined: Jan 12, 2026
          </p>
        </div>

        <button
          onClick={() => setBlockModalOpen(true)}
          className={`rounded-lg px-4 py-2 text-xs font-semibold ${
            status === "active"
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
          }`}
        >
          {status === "active" ? "Block Account" : "Unblock Account"}
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-4 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-4">
          <h3 className="text-base font-bold text-dark dark:text-white mb-2">Customer Profile</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-stroke dark:border-stroke-dark">
              <span className="text-dark-4 dark:text-dark-6">Email:</span>
              <span className="font-semibold">aarav@example.com</span>
            </div>
            <div className="flex justify-between py-2 border-b border-stroke dark:border-stroke-dark">
              <span className="text-dark-4 dark:text-dark-6">Total Orders:</span>
              <span className="font-semibold">28 orders</span>
            </div>
            <div className="flex justify-between py-2 border-b border-stroke dark:border-stroke-dark">
              <span className="text-dark-4 dark:text-dark-6">Total Lifetime Spend:</span>
              <span className="font-bold text-emerald-500">₹1,240.00</span>
            </div>
          </div>
        </div>

        {/* Right Section: Tabs for Order History & Addresses */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="flex border-b border-stroke dark:border-stroke-dark">
            <button
              onClick={() => setActiveTab("history")}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-primary text-primary dark:text-white"
                  : "border-transparent text-dark-4 hover:text-dark dark:text-dark-6"
              }`}
            >
              Order History (28)
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "addresses"
                  ? "border-primary text-primary dark:text-white"
                  : "border-transparent text-dark-4 hover:text-dark dark:text-dark-6"
              }`}
            >
              Saved Delivery Addresses (2)
            </button>
          </div>

          {activeTab === "history" && (
            <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
                  <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Shop</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                    {[
                      { id: "ORD-94821", shop: "Green Grocery Fresh", amount: "₹42.50", status: "out-for-delivery" },
                      { id: "ORD-94100", shop: "Urban Organic Mart", amount: "₹78.00", status: "delivered" },
                      { id: "ORD-93500", shop: "Daily Needs Superstore", amount: "₹35.20", status: "delivered" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                        <td className="p-3 font-bold text-primary">
                          <Link href={`/orders/${row.id}`}>{row.id}</Link>
                        </td>
                        <td className="p-3">{row.shop}</td>
                        <td className="p-3 font-bold text-emerald-500">{row.amount}</td>
                        <td className="p-3">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="space-y-4">
              {[
                { title: "Home Address (Default)", text: "Flat 402, Sunshine Heights, Sector 18, Cyber City, Gurugram, HR - 122002" },
                { title: "Work Office Address", text: "Building 10B, 5th Floor, DLF Cyber City, Phase 2, Gurugram, HR - 122002" },
              ].map((addr, idx) => (
                <div key={idx} className="rounded-2xl bg-white p-5 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
                  <p className="text-sm font-bold text-dark dark:text-white mb-1 inline-flex items-center gap-1.5">
                    <LocationPinIcon className="w-4 h-4 text-primary" />
                    {addr.title}
                  </p>
                  <p className="text-xs text-dark-4 dark:text-dark-6 leading-relaxed">{addr.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onConfirm={handleToggleBlock}
        title={status === "active" ? "Block Account" : "Unblock Account"}
        description="Provide a reason for changing this customer's account status."
        confirmLabel="Confirm"
        requireReason
        reasonPlaceholder="Type reason..."
      />
    </div>
  );
}

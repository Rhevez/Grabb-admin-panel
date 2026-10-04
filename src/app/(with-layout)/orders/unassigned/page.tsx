"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckIcon, CloseIcon, StarIcon } from "@/assets/icons";

interface UnassignedOrder {
  id: string;
  shopName: string;
  itemsCount: number;
  amount: string;
  waitTime: string;
}

interface Partner {
  id: string;
  name: string;
  phone: string;
  distance: string;
  activeLoad: number;
  rating: string;
}

const DEFAULT_UNASSIGNED: UnassignedOrder[] = [
  { id: "ORD-94820", shopName: "Urban Organic Mart", itemsCount: 4, amount: "₹28.00", waitTime: "25 mins" },
  { id: "ORD-94818", shopName: "Green Grocery Fresh", itemsCount: 2, amount: "₹15.20", waitTime: "40 mins" },
  { id: "ORD-94815", shopName: "Daily Needs Superstore", itemsCount: 7, amount: "₹64.00", waitTime: "12 mins" },
];

export default function UnassignedOrdersPage() {
  const [orders, setOrders] = useState<UnassignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<UnassignedOrder | null>(null);

  useEffect(() => {
    fetchUnassigned();
  }, []);

  const fetchUnassigned = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/orders/unassigned");
      let fetched: UnassignedOrder[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setOrders(fetched.length > 0 ? fetched : DEFAULT_UNASSIGNED);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch unassigned orders:", err);
      setOrders(DEFAULT_UNASSIGNED);
    } finally {
      setLoading(false);
    }
  };

  const partners: Partner[] = [
    { id: "p1", name: "Rahul Sharma", phone: "+91 98111 22334", distance: "0.8 km", activeLoad: 1, rating: "4.9" },
    { id: "p2", name: "Vikram Singh", phone: "+91 98222 33445", distance: "1.4 km", activeLoad: 0, rating: "4.8" },
    { id: "p3", name: "Amit Patel", phone: "+91 98333 44556", distance: "2.1 km", activeLoad: 2, rating: "4.7" },
  ];

  const handleAssign = async (partnerName: string, partnerId?: string) => {
    if (!selectedOrder) return;
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/orders/${selectedOrder.id}/assign-driver`, {
        method: "POST",
        body: JSON.stringify({ driverName: partnerName, driverId: partnerId }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to assign driver:", err);
    }
    setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
    toast.success(`Assigned order ${selectedOrder.id} to partner ${partnerName}!`);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/orders" className="text-xs font-semibold text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white">
              ← Back to All Orders
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-dark dark:text-white mt-1">Unassigned Orders Queue</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Orders waiting for delivery partner assignment. Assign nearest available partner.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Shop</th>
                <th className="p-3">Items</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Waiting Time</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3 font-bold text-primary">{o.id}</td>
                  <td className="p-3 font-semibold">{o.shopName}</td>
                  <td className="p-3">{o.itemsCount} items</td>
                  <td className="p-3 font-bold text-emerald-500">{o.amount}</td>
                  <td className="p-3 text-rose-500 font-bold text-xs">{o.waitTime}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
                    >
                      Assign Partner
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-emerald-500 font-bold">
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                      All orders have been assigned to delivery partners!
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner Picker Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark dark:text-white">
                Assign Partner for {selectedOrder.id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">
              Available partners near <span className="font-semibold text-dark dark:text-white">{selectedOrder.shopName}</span>:
            </p>

            <div className="space-y-3">
              {partners.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-stroke bg-gray-2 dark:border-stroke-dark dark:bg-dark-2"
                >
                  <div>
                    <p className="text-sm font-bold text-dark dark:text-white">{p.name}</p>
                    <p className="text-xs text-dark-4 dark:text-dark-6">
                      {p.phone} • {p.distance} away • Load: {p.activeLoad} active
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-500 inline-flex items-center gap-1">
                      <StarIcon className="w-3.5 h-3.5 fill-current" />
                      {p.rating}
                    </span>
                    <button
                      onClick={() => handleAssign(p.name)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

interface OrderItem {
  id: string;
  customerName: string;
  phone: string;
  shopName: string;
  itemsCount: number;
  amount: string;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  orderStatus: "placed" | "confirmed" | "packed" | "out-for-delivery" | "delivered" | "cancelled" | "returned";
  deliveryPartner: string;
  placedTime: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedShop, setSelectedShop] = useState("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatusModal, setBulkStatusModal] = useState(false);
  const [targetBulkStatus, setTargetBulkStatus] = useState("delivered");

  useEffect(() => {
    fetchOrders();
    fetchUnassignedCount();
  }, []);

  const fetchUnassignedCount = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/orders/unassigned");
      const list = Array.isArray(res) ? res : res?.data || res?.results || [];
      if (Array.isArray(list)) {
        setUnassignedCount(list.length);
      }
    } catch {
      // Non-critical count
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/orders");
      let fetched: any[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;

      const mapped: OrderItem[] = fetched.map((o) => ({
        id: o.id || `ORD-${o.pk}`,
        customerName: o.customerName || o.customer_name || "Customer",
        phone: o.phone || "N/A",
        shopName: o.shopName || o.shop_name || "Partner Shop",
        itemsCount: o.itemsCount ?? o.items_count ?? 1,
        amount: typeof o.amount === "string" && o.amount.startsWith("₹") ? o.amount : `₹${o.amount || "0.00"}`,
        paymentStatus: (o.paymentStatus || o.payment_status || "paid").toLowerCase() as any,
        orderStatus: (o.orderStatus || o.order_status || "placed").toLowerCase() as any,
        deliveryPartner: o.deliveryPartner || o.delivery_partner || (o.driver_id ? `Partner #${o.driver_id}` : "Unassigned"),
        placedTime: o.placedTime || o.placed_time || (o.created_at ? new Date(o.created_at).toLocaleTimeString() : "Recent"),
      }));

      setOrders(mapped);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      toast.error(err?.message || "Failed to load orders from backend");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrders = safeOrders.filter((o) => {
    const matchesStatus = selectedStatus === "all" || o.orderStatus === selectedStatus;
    const matchesShop = selectedShop === "all" || (o.shopName || "").toLowerCase().includes(selectedShop.toLowerCase());
    const matchesSearch =
      (o.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.phone || "").includes(search);
    return matchesStatus && matchesShop && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkUpdateStatus = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi("/orders/bulk-status", {
        method: "POST",
        body: JSON.stringify({ orderIds: selectedOrderIds, status: targetBulkStatus }),
      });
      toast.success(`Updated ${selectedOrderIds.length} orders to ${targetBulkStatus}`);
      setOrders((prev) =>
        prev.map((o) =>
          selectedOrderIds.includes(o.id) ? { ...o, orderStatus: targetBulkStatus as any } : o
        )
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update bulk status");
    } finally {
      setSelectedOrderIds([]);
      setBulkStatusModal(false);
    }
  };

  const handleCancelOrder = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/orders/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Admin cancelled from console" }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, orderStatus: "cancelled" } : o))
      );
      toast.success(`Order #${id} has been cancelled`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Order Management</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Track, filter, update, and manage customer orders across all partner shops.
          </p>
        </div>
        <Link
          href="/orders/unassigned"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          <span>Unassigned Queue</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
            {unassignedCount}
          </span>
        </Link>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Search order ID, customer name, phone..."
        searchValue={search}
        onSearchChange={setSearch}
        selectedShop={selectedShop}
        onShopChange={setSelectedShop}
        onExport={() => {
          if (filteredOrders.length === 0) {
            toast.error("No orders to export");
            return;
          }
          const headers = ["Order ID", "Customer", "Phone", "Shop", "Items Count", "Amount", "Payment Status", "Order Status", "Delivery Partner", "Placed Time"];
          const rows = filteredOrders.map(o => [o.id, o.customerName, o.phone, o.shopName, o.itemsCount, o.amount, o.paymentStatus.toUpperCase(), o.orderStatus.toUpperCase(), o.deliveryPartner, o.placedTime]);
          downloadCSV("orders_register.csv", headers, rows);
          toast.success(`Exported ${filteredOrders.length} orders as CSV!`);
        }}
      />

      {/* Status Chips */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {["all", "placed", "confirmed", "packed", "out-for-delivery", "delivered", "cancelled", "returned"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                selectedStatus === status
                  ? "bg-dark text-white dark:bg-white dark:text-dark shadow-md"
                  : "bg-white text-dark-4 hover:bg-gray-2 dark:bg-gray-dark dark:text-dark-6 dark:hover:bg-dark-2 border border-stroke dark:border-stroke-dark"
              }`}
            >
              {status === "all" ? "All Orders" : status.replace(/-/g, " ")}
            </button>
          )
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 p-4">
          <span className="text-sm font-semibold text-primary">
            {selectedOrderIds.length} orders selected
          </span>
          <div className="flex items-center gap-3">
            <select
              value={targetBulkStatus}
              onChange={(e) => setTargetBulkStatus(e.target.value)}
              className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs text-dark dark:bg-dark-2 dark:text-white"
            >
              <option value="confirmed">Mark Confirmed</option>
              <option value="packed">Mark Packed</option>
              <option value="out-for-delivery">Mark Out for Delivery</option>
              <option value="delivered">Mark Delivered</option>
              <option value="cancelled">Mark Cancelled</option>
            </select>
            <button
              onClick={() => setBulkStatusModal(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Apply Bulk Status
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-dark-4 dark:text-dark-6">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            variant="orders"
            title="No Orders Found"
            description={search || selectedStatus !== "all" || selectedShop !== "all" ? "No orders match your active filter criteria." : "There are currently no orders in the queue."}
            action={search || selectedStatus !== "all" || selectedShop !== "all" ? { label: "Reset Filters", onClick: () => { setSearch(""); setSelectedStatus("all"); setSelectedShop("all"); } } : undefined}
          />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-stroke"
                  />
                </th>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Shop</th>
                <th className="p-3">Items</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Delivery Partner</th>
                <th className="p-3">Time</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(o.id)}
                      onChange={() => toggleSelectRow(o.id)}
                      className="size-4 rounded border-stroke"
                    />
                  </td>
                  <td className="p-3 font-bold text-primary">
                    <Link href={`/orders/${o.id}`}>{o.id}</Link>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold">{o.customerName}</p>
                    <p className="text-xs text-dark-4 dark:text-dark-6">{o.phone}</p>
                  </td>
                  <td className="p-3 font-medium">{o.shopName}</td>
                  <td className="p-3">{o.itemsCount} items</td>
                  <td className="p-3 font-bold text-emerald-500">{o.amount}</td>
                  <td className="p-3">
                    <StatusBadge status={o.paymentStatus} />
                  </td>
                  <td className="p-3">
                    <StatusBadge status={o.orderStatus} />
                  </td>
                  <td className="p-3 text-xs font-medium">
                    {o.deliveryPartner === "Unassigned" ? (
                      <span className="text-rose-500 font-bold">Unassigned</span>
                    ) : (
                      o.deliveryPartner
                    )}
                  </td>
                  <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{o.placedTime}</td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <TableActionsDropdown
                      actions={[
                        {
                          label: "View Detail",
                          onClick: () => window.location.href = `/orders/${o.id}`,
                          variant: "primary",
                        },
                        ...(o.orderStatus !== "cancelled" && o.orderStatus !== "delivered"
                          ? [
                              {
                                label: "Cancel Order",
                                onClick: () => handleCancelOrder(o.id),
                                variant: "danger" as const,
                              },
                            ]
                          : []),
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

      {/* Confirm Bulk Status Modal */}
      <ConfirmModal
        isOpen={bulkStatusModal}
        onClose={() => setBulkStatusModal(false)}
        onConfirm={handleBulkUpdateStatus}
        title="Confirm Bulk Status Update"
        description={`Are you sure you want to update ${selectedOrderIds.length} selected orders to '${targetBulkStatus.replace(/-/g, " ")}'?`}
        confirmLabel="Update Orders"
        variant="info"
      />
    </div>
  );
}

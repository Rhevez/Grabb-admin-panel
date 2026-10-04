"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { CheckIcon } from "@/assets/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [orderStatus, setOrderStatus] = useState("out-for-delivery");
  const [partner, setPartner] = useState("Rahul Sharma (+91 98111 22334)");
  const [shopName, setShopName] = useState("Green Grocery Fresh");
  const [customerName, setCustomerName] = useState("Aarav Sharma");
  const [customerPhone, setCustomerPhone] = useState("+91 98765 43210");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi(`/orders/${id}`);
      const data = res?.data || res;
      if (data && data.orderStatus) {
        setOrderStatus(data.orderStatus || data.status || orderStatus);
        setPartner(data.deliveryPartner || data.delivery_partner || partner);
        setShopName(data.shopName || data.shop_name || shopName);
        setCustomerName(data.customerName || data.customer_name || customerName);
        setCustomerPhone(data.phone || customerPhone);
      }
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch order details:", err);
    }
  };

  const handleCancelOrder = async (reason?: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/orders/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error cancelling order:", err);
    }
    setOrderStatus("cancelled");
    toast.success("Order cancelled successfully");
  };

  const handleRefundOrder = async (reason?: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/orders/${id}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error processing refund:", err);
    }
    toast.success("Refund processed successfully to customer original payment method.");
  };

  const handleStatusChange = async (newStatus: string) => {
    setOrderStatus(newStatus);
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ orderStatus: newStatus, status: newStatus }),
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error updating order status:", err);
    }
  };

  const stages = [
    { key: "placed", label: "Placed", time: "10:14 AM" },
    { key: "confirmed", label: "Confirmed", time: "10:16 AM" },
    { key: "packed", label: "Packed", time: "10:25 AM" },
    { key: "out-for-delivery", label: "Out for Delivery", time: "10:35 AM" },
    { key: "delivered", label: "Delivered", time: "--" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === orderStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col gap-2">
            <Link
              href="/orders"
              className="text-xs font-semibold text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white w-fit"
            >
              ← Back to Orders
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-dark dark:text-white">{id}</h1>
              <StatusBadge status={orderStatus} />
            </div>
          </div>
          <p className="text-sm text-dark-4 dark:text-dark-6 mt-1">
            Placed on August 10, 2026 at 10:14 AM • Shop:{" "}
            <span className="font-semibold text-dark dark:text-white">{shopName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCancelModalOpen(true)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
          >
            Cancel Order
          </button>
          <button
            onClick={() => setRefundModalOpen(true)}
            className="rounded-lg border border-stroke bg-gray-2 px-4 py-2 text-xs font-semibold text-dark hover:bg-gray-3 dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
          >
            Initiate Refund
          </button>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
        <h3 className="text-sm font-bold text-dark dark:text-white mb-6 uppercase tracking-wider">
          Order Status Stepper
        </h3>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
          {stages.map((stage, idx) => {
            const isDone = currentStageIndex >= idx;
            return (
              <div key={stage.key} className="flex flex-row sm:flex-col items-center gap-3 flex-1">
                <div
                  className={`size-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-gray-2 text-dark-4 dark:bg-dark-2 dark:text-dark-6"
                  }`}
                >
                  {isDone ? <CheckIcon className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-xs font-bold text-dark dark:text-white">{stage.label}</p>
                  <p className="text-[11px] text-dark-4 dark:text-dark-6">{stage.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manual Status Override */}
        <div className="mt-8 border-t border-stroke dark:border-stroke-dark pt-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-dark-4 dark:text-dark-6">
            Manual Status Override:
          </span>
          <select
            value={orderStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-stroke bg-gray-2 px-3 py-1.5 text-xs font-semibold text-dark dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
          >
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="packed">Packed</option>
            <option value="out-for-delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Items Table & Order Summary */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-base font-bold text-dark dark:text-white mb-4">Itemized Products (4)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
                <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                  {[
                    { name: "Fresh Organic Whole Milk 1L", price: "₹3.50", qty: 2, sub: "₹7.00" },
                    { name: "Farm Fresh Large Eggs 12pk", price: "₹4.20", qty: 1, sub: "₹4.20" },
                    { name: "Organic Brown Bread 400g", price: "₹2.80", qty: 3, sub: "₹8.40" },
                    { name: "Avocado Hass (Pack of 2)", price: "₹5.90", qty: 2, sub: "₹11.80" },
                  ].map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                      <td className="p-3 font-semibold">{item.name}</td>
                      <td className="p-3">{item.price}</td>
                      <td className="p-3">{item.qty}</td>
                      <td className="p-3 text-right font-bold">{item.sub}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Summary Calculation */}
            <div className="mt-6 border-t border-stroke dark:border-stroke-dark pt-4 max-w-xs ml-auto space-y-2 text-sm">
              <div className="flex justify-between text-dark-4 dark:text-dark-6">
                <span>Subtotal</span>
                <span className="font-semibold text-dark dark:text-white">₹31.40</span>
              </div>
              <div className="flex justify-between text-dark-4 dark:text-dark-6">
                <span>Delivery Fee</span>
                <span className="font-semibold text-dark dark:text-white">₹4.00</span>
              </div>
              <div className="flex justify-between text-dark-4 dark:text-dark-6">
                <span>Taxes & Service</span>
                <span className="font-semibold text-dark dark:text-white">₹2.10</span>
              </div>
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span>Discount (WELCOME5)</span>
                <span>-₹5.00</span>
              </div>
              <div className="flex justify-between border-t border-stroke dark:border-stroke-dark pt-2 text-base font-bold text-dark dark:text-white">
                <span>Total Amount</span>
                <span className="text-emerald-500">₹32.50</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info, Payment Info, Delivery Partner */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Customer Info Card */}
          <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-base font-bold text-dark dark:text-white mb-3">Customer Details</h3>
            <div className="space-y-2 text-sm text-dark dark:text-white">
              <p className="font-bold">Aarav Sharma</p>
              <p className="text-xs text-dark-4 dark:text-dark-6">+91 98765 43210 • aarav@example.com</p>
              <div className="mt-3 p-3 rounded-lg bg-gray-2 dark:bg-dark-2 text-xs leading-relaxed">
                <span className="font-semibold block mb-1">Delivery Address:</span>
                Flat 402, Sunshine Heights, Sector 18, Cyber City, Gurugram, HR - 122002
              </div>
            </div>
          </div>

          {/* Payment Info Card */}
          <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-base font-bold text-dark dark:text-white mb-3">Payment Info</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Method:</span>
                <span className="font-bold text-dark dark:text-white">UPI / Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Txn ID:</span>
                <span className="font-mono text-dark dark:text-white">TXN_991823719</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-4 dark:text-dark-6">Status:</span>
                <StatusBadge status="paid" />
              </div>
            </div>
          </div>

          {/* Delivery Partner Card */}
          <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-base font-bold text-dark dark:text-white mb-3">Delivery Partner</h3>
            <div className="p-3 rounded-lg bg-gray-2 dark:bg-dark-2 mb-4">
              <p className="text-sm font-bold text-dark dark:text-white">{partner}</p>
              <p className="text-xs text-emerald-500 font-semibold mt-0.5">● On-the-way (Live GPS Active)</p>
            </div>
            <button
              onClick={() => {
                const newP = prompt("Reassign partner to:", partner);
                if (newP) setPartner(newP);
              }}
              className="w-full rounded-lg border border-stroke bg-white py-2 text-xs font-semibold text-dark hover:bg-gray-100 dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
            >
              Reassign Delivery Partner
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={(reason) => handleCancelOrder(reason)}
        title="Cancel Order"
        description="Cancelling an order will update its status to cancelled and trigger an automatic refund process."
        confirmLabel="Confirm Cancellation"
        requireReason
        reasonPlaceholder="Specify cancellation reason (e.g. customer request, out of stock)..."
      />

      {/* Refund Modal */}
      <ConfirmModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        onConfirm={(reason) => handleRefundOrder(reason)}
        title="Initiate Full Refund"
        description="Are you sure you want to refund ₹32.50 for this order?"
        confirmLabel="Process Refund"
        variant="warning"
      />
    </div>
  );
}

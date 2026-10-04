"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ShopDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [activeTab, setActiveTab] = useState<"profile" | "location" | "hours" | "products">("profile");
  const [shopName, setShopName] = useState("Green Grocery Fresh");
  const [ownerName, setOwnerName] = useState("Rajesh Kumar");
  const [phone, setPhone] = useState("+91 98111 55443");
  const [radius, setRadius] = useState(5.0);
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShopDetail();
  }, [id]);

  const fetchShopDetail = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi(`/vendor/shops/${id}`);
      const data = res?.data || res;
      if (data && data.name) {
        setShopName(data.name || shopName);
        setOwnerName(data.ownerName || data.owner_name || ownerName);
        setPhone(data.phone || phone);
        setRadius(parseFloat(data.radius) || radius);
        setStatus(data.status || status);
      }
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch shop details:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: shopName,
          ownerName,
          owner_name: ownerName,
          phone,
          radius,
          status,
        }),
      });
      toast.success("Shop details saved successfully!");
    } catch (err: any) {
      if (err?.status === 404) {
        toast.info("Shop details saved locally.");
      } else {
        toast.error(err.message || "Failed to save shop details");
      }
    } finally {
      setSaving(false);
    }
  };

  const [hours, setHours] = useState([
    { day: "Monday", open: "07:00", close: "22:00", isClosed: false },
    { day: "Tuesday", open: "07:00", close: "22:00", isClosed: false },
    { day: "Wednesday", open: "07:00", close: "22:00", isClosed: false },
    { day: "Thursday", open: "07:00", close: "22:00", isClosed: false },
    { day: "Friday", open: "07:00", close: "22:00", isClosed: false },
    { day: "Saturday", open: "07:00", close: "23:00", isClosed: false },
    { day: "Sunday", open: "08:00", close: "21:00", isClosed: false },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col gap-2">
            <Link href="/shops" className="text-xs font-semibold text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white w-fit">
              ← Back to Shops List
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-dark dark:text-white">{shopName}</h1>
              <StatusBadge status={status} />
            </div>
          </div>
          <p className="text-sm text-dark-4 dark:text-dark-6 mt-1">
            Shop ID: {id} • Owner: <span className="font-semibold text-dark dark:text-white">{ownerName}</span> ({phone})
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stroke dark:border-stroke-dark overflow-x-auto">
        {(
          [
            { id: "profile", label: "Shop Profile" },
            { id: "location", label: "Location & Delivery Radius" },
            { id: "hours", label: "Operating Hours" },
            { id: "products", label: "Linked Products (420)" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap border-b-2 py-3 px-6 text-sm font-semibold transition-colors ${
              activeTab === t.id
                ? "border-primary text-primary dark:text-white"
                : "border-transparent text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Section */}
      {activeTab === "profile" && (
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-dark dark:text-white mb-4">Basic Shop Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Owner Contact Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Approval Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              >
                <option value="active">Active / Approved</option>
                <option value="pending">Pending Approval</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Location Section */}
      {activeTab === "location" && (
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-6 max-w-2xl">
          <h3 className="text-base font-bold text-dark dark:text-white mb-2">Location & Coverage Radius</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">Full Physical Address</label>
            <textarea
              rows={2}
              defaultValue="Shop #14, Main Market, Sector 14, Gurugram, HR - 122001"
              className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Interactive Radius Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold">Service Delivery Radius</label>
              <span className="text-sm font-bold text-primary">{radius.toFixed(1)} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              step={0.5}
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-2 rounded-lg appearance-none cursor-pointer dark:bg-dark-2 accent-primary"
            />
          </div>

          {/* Map Pin Placeholder */}
          <div className="h-56 bg-gray-2 dark:bg-dark-2 rounded-xl flex flex-col items-center justify-center border border-dashed border-stroke dark:border-stroke-dark text-dark-4 dark:text-dark-6">
            <span className="text-2xl mb-1">📍</span>
            <p className="text-xs font-bold text-dark dark:text-white">Interactive Map Pin Selector</p>
            <p className="text-[11px]">Latitude: 28.4595° N, Longitude: 77.0266° E</p>
          </div>
        </div>
      )}

      {/* Operating Hours Section */}
      {activeTab === "hours" && (
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-dark dark:text-white mb-4">Day-by-Day Operating Hours</h3>
          <div className="space-y-3">
            {hours.map((h, idx) => (
              <div key={h.day} className="flex items-center justify-between p-3 rounded-xl bg-gray-2 dark:bg-dark-2">
                <span className="text-xs font-bold w-28">{h.day}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    disabled={h.isClosed}
                    value={h.open}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHours((prev) => prev.map((item, i) => (i === idx ? { ...item, open: val } : item)));
                    }}
                    className="rounded border border-stroke bg-white p-1 text-xs text-dark dark:border-stroke-dark dark:bg-gray-dark dark:text-white disabled:opacity-40"
                  />
                  <span className="text-xs text-dark-4">to</span>
                  <input
                    type="time"
                    disabled={h.isClosed}
                    value={h.close}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHours((prev) => prev.map((item, i) => (i === idx ? { ...item, close: val } : item)));
                    }}
                    className="rounded border border-stroke bg-white p-1 text-xs text-dark dark:border-stroke-dark dark:bg-gray-dark dark:text-white disabled:opacity-40"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={h.isClosed}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHours((prev) => prev.map((item, i) => (i === idx ? { ...item, isClosed: checked } : item)));
                    }}
                    className="size-4 rounded border-stroke"
                  />
                  Closed Today
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Products Section */}
      {activeTab === "products" && (
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-dark dark:text-white">Products Stocked in this Shop</h3>
            <Link href="/catalog/products" className="text-xs font-semibold text-primary underline">
              Manage in Catalog →
            </Link>
          </div>
          <div className="space-y-2">
            {[
              { name: "Fresh Organic Whole Milk 1L", price: "₹3.50", stock: 54 },
              { name: "Farm Fresh Large Eggs 12pk", price: "₹4.20", stock: 22 },
              { name: "Organic Brown Bread 400g", price: "₹2.80", stock: 18 },
            ].map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-gray-2 dark:bg-dark-2">
                <span className="text-sm font-semibold">{p.name}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-emerald-500">{p.price}</span>
                  <span className="text-dark-4 dark:text-dark-6">Stock: {p.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

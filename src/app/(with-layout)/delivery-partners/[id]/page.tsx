"use client";

import { use, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/status-badge";
import { StarIcon, BikeIcon, LocationPinIcon } from "@/assets/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PartnerDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [activeTab, setActiveTab] = useState<"profile" | "kyc" | "orders" | "earnings" | "map">("profile");

  const [docs, setDocs] = useState([
    { name: "Driving License", status: "approved", file: "DL_Rahul_Sharma.pdf" },
    { name: "Vehicle Registration (RC)", status: "approved", file: "RC_Motorcycle.pdf" },
    { name: "National ID (Aadhaar)", status: "approved", file: "Aadhaar_ID.pdf" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col gap-2">
            <Link href="/delivery-partners" className="text-xs font-semibold text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white w-fit">
              ← Back to Delivery Partners
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-dark dark:text-white">Rahul Sharma</h1>
              <StatusBadge status="online" />
            </div>
          </div>
          <p className="text-sm text-dark-4 dark:text-dark-6 mt-1">
            Partner ID: {id} • Phone: <span className="font-semibold text-dark dark:text-white">+91 98111 22334</span> • Vehicle: Motorcycle
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stroke dark:border-stroke-dark overflow-x-auto">
        {(
          [
            { id: "profile", label: "Profile Overview" },
            { id: "kyc", label: "KYC & Documents" },
            { id: "orders", label: "Delivery History (184)" },
            { id: "earnings", label: "Earnings & Payouts" },
            { id: "map", label: "Live GPS Tracking" },
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

      {activeTab === "profile" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-4">
            <h3 className="text-base font-bold text-dark dark:text-white mb-2">Personal Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-stroke dark:border-stroke-dark">
                <span className="text-dark-4 dark:text-dark-6">Full Name:</span>
                <span className="font-semibold">Rahul Sharma</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stroke dark:border-stroke-dark">
                <span className="text-dark-4 dark:text-dark-6">Email:</span>
                <span className="font-semibold">rahul.partner@example.com</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stroke dark:border-stroke-dark">
                <span className="text-dark-4 dark:text-dark-6">Joined Date:</span>
                <span className="font-semibold">January 15, 2026</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stroke dark:border-stroke-dark">
                <span className="text-dark-4 dark:text-dark-6">Overall Rating:</span>
                <span className="font-bold text-amber-500 inline-flex items-center gap-1">
                  <StarIcon className="w-3.5 h-3.5 fill-current" />
                  4.9 (140 reviews)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "kyc" && (
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark max-w-3xl">
          <h3 className="text-base font-bold text-dark dark:text-white mb-4">KYC Documents Verification</h3>
          <div className="space-y-3">
            {docs.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-2 dark:bg-dark-2">
                <div>
                  <p className="text-sm font-bold text-dark dark:text-white">{d.name}</p>
                  <p className="text-xs text-dark-4 dark:text-dark-6">{d.file}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.status} />
                  <button
                    onClick={() => {
                      const newStatus = d.status === "approved" ? "rejected" : "approved";
                      setDocs((prev) => prev.map((item, idx) => (idx === i ? { ...item, status: newStatus } : item)));
                    }}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-dark shadow-1 hover:bg-gray-100 dark:bg-gray-dark dark:text-white"
                  >
                    Toggle Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
          <h3 className="text-base font-bold text-dark dark:text-white mb-4">Completed Deliveries</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Shop</th>
                  <th className="p-3">Delivery Time</th>
                  <th className="p-3">Customer Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {[
                  { id: "ORD-94821", shop: "Green Grocery Fresh", time: "22 mins", rating: "5" },
                  { id: "ORD-94812", shop: "Urban Organic Mart", time: "19 mins", rating: "5" },
                  { id: "ORD-94800", shop: "Daily Needs Superstore", time: "28 mins", rating: "4" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                    <td className="p-3 font-bold text-primary">{row.id}</td>
                    <td className="p-3">{row.shop}</td>
                    <td className="p-3 font-medium text-emerald-500">{row.time}</td>
                    <td className="p-3 font-bold text-amber-500">
                      <span className="inline-flex items-center gap-1">
                        <StarIcon className="w-3.5 h-3.5 fill-current" />
                        {row.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "earnings" && (
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark max-w-2xl space-y-4">
          <h3 className="text-base font-bold text-dark dark:text-white">Earnings Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-2 dark:bg-dark-2">
              <p className="text-xs text-dark-4 dark:text-dark-6">This Week's Earnings</p>
              <p className="text-2xl font-bold text-emerald-500">₹482.00</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-2 dark:bg-dark-2">
              <p className="text-xs text-dark-4 dark:text-dark-6">Pending Payout</p>
              <p className="text-2xl font-bold text-amber-500">₹142.50</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "map" && (
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
          <h3 className="text-base font-bold text-dark dark:text-white mb-4">Live GPS Position</h3>
          <div className="h-80 bg-gray-2 dark:bg-dark-2 rounded-xl flex flex-col items-center justify-center border border-dashed border-stroke dark:border-stroke-dark text-dark-4 dark:text-dark-6">
            <div className="flex items-center gap-2 text-primary mb-2">
              <BikeIcon className="w-8 h-8 text-primary" />
              <LocationPinIcon className="w-6 h-6 text-rose-500" />
            </div>
            <p className="text-sm font-bold text-dark dark:text-white">Rahul Sharma (Online & Moving)</p>
            <p className="text-xs">Current Speed: 24 km/h • Heading towards Sector 18</p>
          </div>
        </div>
      )}
    </div>
  );
}

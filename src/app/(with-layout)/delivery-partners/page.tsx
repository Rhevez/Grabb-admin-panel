"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";
import { StarIcon } from "@/assets/icons";

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  status: "online" | "busy" | "offline";
  activeDeliveries: number;
  rating: string;
  verificationStatus: "approved" | "pending" | "rejected";
}

export default function DeliveryPartnersPage() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [partners, setPartners] = useState<DeliveryPartner[]>([
    {
      id: "dp1",
      name: "Rahul Sharma",
      phone: "+91 98111 22334",
      vehicleType: "Motorcycle",
      status: "online",
      activeDeliveries: 1,
      rating: "4.9",
      verificationStatus: "approved",
    },
    {
      id: "dp2",
      name: "Vikram Singh",
      phone: "+91 98222 33445",
      vehicleType: "Electric Scooter",
      status: "busy",
      activeDeliveries: 2,
      rating: "4.8",
      verificationStatus: "approved",
    },
    {
      id: "dp3",
      name: "Amit Patel",
      phone: "+91 98333 44556",
      vehicleType: "Bicycle",
      status: "offline",
      activeDeliveries: 0,
      rating: "4.7",
      verificationStatus: "approved",
    },
    {
      id: "dp4",
      name: "Karan Malhotra",
      phone: "+91 98444 55667",
      vehicleType: "Motorcycle",
      status: "offline",
      activeDeliveries: 0,
      rating: "N/A",
      verificationStatus: "pending",
    },
  ]);

  const filteredPartners = partners.filter((p) => {
    const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Delivery Partners</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Fleet tracking, real-time availability, delivery ratings, and onboarding verification.
          </p>
        </div>
        <Link
          href="/delivery-partners/onboarding"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          KYC Verification Queue (1)
        </Link>
      </div>

      <FilterBar
        searchPlaceholder="Search partner name or phone..."
        searchValue={search}
        onSearchChange={setSearch}
        onExport={() => toast.info("Exporting Fleet Report...")}
      />

      {/* Status Chips */}
      <div className="flex items-center gap-2">
        {["all", "online", "busy", "offline"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
              selectedStatus === st
                ? "bg-dark text-white dark:bg-white dark:text-dark"
                : "bg-white text-dark-4 hover:bg-gray-2 dark:bg-gray-dark dark:text-dark-6 border border-stroke dark:border-stroke-dark"
            }`}
          >
            {st === "all" ? "All Fleet" : st}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Partner Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Availability</th>
                <th className="p-3">Active Orders</th>
                <th className="p-3">Rating</th>
                <th className="p-3">KYC Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {filteredPartners.map((p) => (
                <tr key={p.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3 font-bold text-primary">
                    <Link href={`/delivery-partners/${p.id}`}>{p.name}</Link>
                  </td>
                  <td className="p-3 font-medium">{p.phone}</td>
                  <td className="p-3 text-xs">{p.vehicleType}</td>
                  <td className="p-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-3 font-bold">{p.activeDeliveries} active</td>
                  <td className="p-3 font-bold text-amber-500">
                    {p.rating !== "N/A" ? (
                      <span className="inline-flex items-center gap-1">
                        <StarIcon className="w-3.5 h-3.5 fill-current" />
                        {p.rating}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={p.verificationStatus} />
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <TableActionsDropdown
                      actions={[
                        {
                          label: "View Profile",
                          onClick: () => window.location.href = `/delivery-partners/${p.id}`,
                          variant: "primary",
                        },
                        {
                          label: "Edit Partner",
                          onClick: () => toast.info(`Editing partner: ${p.name}...`),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

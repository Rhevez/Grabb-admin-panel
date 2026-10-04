"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";
import { DynamicMap } from "@/components/Map";

interface Zone {
  id: string;
  name: string;
  coverageArea: string;
  baseFee: string;
  assignedShops: number;
  status: "active" | "inactive";
}

export default function ZonesPage() {
  const [viewTab, setViewTab] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);

  const [zones, setZones] = useState<Zone[]>([
    { id: "z1", name: "Downtown Metro", coverageArea: "12.5 sq km", baseFee: "₹2.50", assignedShops: 45, status: "active" },
    { id: "z2", name: "North Hills Suburb", coverageArea: "28.0 sq km", baseFee: "₹4.00", assignedShops: 12, status: "active" },
    { id: "z3", name: "University District", coverageArea: "8.2 sq km", baseFee: "₹1.80", assignedShops: 34, status: "active" },
    { id: "z4", name: "Westside Industrial", coverageArea: "15.0 sq km", baseFee: "₹3.50", assignedShops: 5, status: "inactive" },
  ]);

  const filteredZones = zones.filter((z) => {
    const matchesStatus = selectedStatus === "all" || z.status === selectedStatus;
    const matchesSearch = z.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Operational Zones</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Define delivery polygons, manage base delivery fees, and assign local stores to specific areas.
          </p>
        </div>
        <button
          onClick={() => setIsDrawModalOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          + Draw New Zone
        </button>
      </div>

      <div className="flex border-b border-stroke dark:border-stroke-dark">
        <button
          onClick={() => setViewTab("list")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            viewTab === "list"
              ? "border-primary text-primary"
              : "border-transparent text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white"
          }`}
        >
          Data View
        </button>
        <button
          onClick={() => setViewTab("map")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            viewTab === "map"
              ? "border-primary text-primary"
              : "border-transparent text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white"
          }`}
        >
          Map View
        </button>
      </div>

      {viewTab === "map" ? (
        /* Map Placeholder */
      <div className="w-full h-[400px] rounded-2xl bg-gray-2 dark:bg-dark-2 border border-stroke dark:border-stroke-dark overflow-hidden flex items-center justify-center relative">
        <DynamicMap type="zones" />
      </div>
      ) : (
        <>
          <FilterBar
            searchPlaceholder="Search zones by name..."
            searchValue={search}
            onSearchChange={setSearch}
            onExport={() => toast.info("Exporting Zone Data...")}
          />

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Zone Name</th>
                <th className="p-3">Coverage Area</th>
                <th className="p-3">Base Delivery Fee</th>
                <th className="p-3">Assigned Shops</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {filteredZones.map((z) => (
                <tr key={z.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3 font-bold text-primary">
                    <span className="cursor-pointer hover:underline">{z.name}</span>
                  </td>
                  <td className="p-3 font-semibold">{z.coverageArea}</td>
                  <td className="p-3 font-bold text-emerald-500">{z.baseFee}</td>
                  <td className="p-3 font-semibold">{z.assignedShops}</td>
                  <td className="p-3">
                    <StatusBadge status={z.status} />
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <TableActionsDropdown
                      actions={[
                        { label: "Edit Zone", onClick: () => toast.info(`Editing ${z.name}`) },
                        { label: "Delete", onClick: () => toast.info(`Deleted ${z.name}`), variant: "danger" }
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {filteredZones.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-dark-4 dark:text-dark-6">
                    No zones found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {isDrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">Draw New Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Zone Name</label>
                <input type="text" className="w-full rounded-lg border border-stroke bg-transparent p-3 text-dark outline-none focus:border-primary dark:border-stroke-dark dark:text-white" placeholder="e.g. Downtown Metro" />
              </div>
              <div className="h-[200px] w-full rounded-lg border border-stroke overflow-hidden relative">
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/10">
                  <span className="bg-white px-2 py-1 rounded text-xs font-bold text-primary shadow">Click Map to Draw Points</span>
                </div>
                <DynamicMap type="zones" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Base Fee (₹)</label>
                  <input type="number" className="w-full rounded-lg border border-stroke bg-transparent p-3 text-dark outline-none focus:border-primary dark:border-stroke-dark dark:text-white" placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Status</label>
                  <select className="w-full rounded-lg border border-stroke bg-transparent p-3 text-dark outline-none focus:border-primary dark:border-stroke-dark dark:text-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDrawModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success("Zone created successfully!");
                  setIsDrawModalOpen(false);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Save Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

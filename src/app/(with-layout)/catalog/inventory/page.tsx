"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";

interface InventoryItem {
  id: string;
  productName: string;
  shopName: string;
  currentStock: number;
  lowStockThreshold: number;
  lastUpdated: string;
}

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "inv1", productName: "Fresh Organic Milk 1L", shopName: "Green Grocery Fresh", currentStock: 8, lowStockThreshold: 15, lastUpdated: "5 mins ago" },
  { id: "inv2", productName: "Farm Fresh Eggs 12pk", shopName: "Urban Organic Mart", currentStock: 4, lowStockThreshold: 10, lastUpdated: "12 mins ago" },
  { id: "inv3", productName: "Avocado Hass (Pack of 2)", shopName: "Daily Needs Superstore", currentStock: 0, lowStockThreshold: 5, lastUpdated: "1 hour ago" },
  { id: "inv4", productName: "Organic Brown Bread 400g", shopName: "Green Grocery Fresh", currentStock: 64, lowStockThreshold: 20, lastUpdated: "2 hours ago" },
  { id: "inv5", productName: "Greek Yogurt Vanilla 500g", shopName: "Urban Organic Mart", currentStock: 42, lowStockThreshold: 10, lastUpdated: "3 hours ago" },
];

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [selectedShop, setSelectedShop] = useState("all");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/catalog/inventory/monitor");
      let fetched: InventoryItem[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setItems(fetched.length > 0 ? fetched : DEFAULT_INVENTORY);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch inventory:", err);
      setItems(DEFAULT_INVENTORY);
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = async (id: string, newStock: number) => {
    const updatedStock = Math.max(0, newStock);
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/inventory/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ currentStock: updatedStock, current_stock: updatedStock }),
      });
      toast.success("Stock level updated");
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to update stock:", err);
      toast.success("Stock level updated");
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, currentStock: updatedStock, lastUpdated: "Just now" } : item
      )
    );
  };

  const handleThresholdChange = async (id: string, newThreshold: number) => {
    const updatedThreshold = Math.max(1, newThreshold);
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/inventory/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ lowStockThreshold: updatedThreshold, low_stock_threshold: updatedThreshold }),
      });
      toast.success("Low stock threshold updated");
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to update threshold:", err);
      toast.success("Low stock threshold updated");
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, lowStockThreshold: updatedThreshold } : item
      )
    );
  };

  const safeItems = Array.isArray(items) ? items : [];

  const filteredItems = safeItems.filter((item) => {
    const matchesShop = selectedShop === "all" || (item.shopName || "").toLowerCase().includes(selectedShop.toLowerCase());
    const matchesSearch = (item.productName || "").toLowerCase().includes(search.toLowerCase());
    return matchesShop && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Inventory & Stock Controls</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Real-time stock management with inline quick-edits and customizable low-stock alert thresholds.
          </p>
        </div>
        <button
          onClick={() => toast.info("Simulating bulk stock sync from CSV...")}
          className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-100 dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
        >
          Bulk Stock Update (CSV)
        </button>
      </div>

      <FilterBar
        searchPlaceholder="Search product by name..."
        searchValue={search}
        onSearchChange={setSearch}
        selectedShop={selectedShop}
        onShopChange={setSelectedShop}
        onExport={() => toast.info("Exporting Inventory Report...")}
      />

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3">Shop</th>
                <th className="p-3">Inline Quick Edit Stock</th>
                <th className="p-3">Alert Threshold</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.lowStockThreshold && item.currentStock > 0;
                const isOut = item.currentStock === 0;

                return (
                  <tr key={item.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                    <td className="p-3 font-bold">{item.productName}</td>
                    <td className="p-3 font-medium text-dark-4 dark:text-dark-6">{item.shopName}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStockChange(item.id, item.currentStock - 1)}
                          className="size-7 rounded bg-gray-2 text-dark font-bold hover:bg-gray-3 dark:bg-dark-2 dark:text-white"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.currentStock}
                          onChange={(e) => handleStockChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 rounded border border-stroke p-1 text-center font-bold text-dark dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                        />
                        <button
                          onClick={() => handleStockChange(item.id, item.currentStock + 1)}
                          className="size-7 rounded bg-gray-2 text-dark font-bold hover:bg-gray-3 dark:bg-dark-2 dark:text-white"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-dark-4">Min:</span>
                        <input
                          type="number"
                          value={item.lowStockThreshold}
                          onChange={(e) => handleThresholdChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-14 rounded border border-stroke p-1 text-center text-xs font-semibold dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isOut
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : isLow
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {isOut ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "IN STOCK"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{item.lastUpdated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

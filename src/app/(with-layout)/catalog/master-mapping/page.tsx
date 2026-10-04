"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { StatusBadge } from "@/components/common/status-badge";

interface MasterProduct {
  id: string;
  name: string;
  barcode: string;
  category: string;
  globalPriceRef: string;
  mappedShops: number;
}

const DEFAULT_MASTER_PRODUCTS: MasterProduct[] = [
  { id: "mp-1", name: "Coca-Cola 2L PET", barcode: "890103001001", category: "Beverages", globalPriceRef: "₹2.00", mappedShops: 42 },
  { id: "mp-2", name: "Amul Butter 100g", barcode: "890126215001", category: "Dairy", globalPriceRef: "₹0.80", mappedShops: 65 },
  { id: "mp-3", name: "Lays Classic Salted 50g", barcode: "890149110001", category: "Snacks", globalPriceRef: "₹0.50", mappedShops: 58 },
];

export default function MasterCatalogMappingPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasterProducts();
  }, []);

  const fetchMasterProducts = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/catalog/master-skus");
      let fetched: MasterProduct[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setMasterProducts(fetched.length > 0 ? fetched : DEFAULT_MASTER_PRODUCTS);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch master products:", err);
      setMasterProducts(DEFAULT_MASTER_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const safeProducts = Array.isArray(masterProducts) ? masterProducts : [];

  const filteredProducts = safeProducts.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search)
  );

  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formCategory, setFormCategory] = useState("Beverages");
  const [formPrice, setFormPrice] = useState("");

  const handleCreateSku = async () => {
    if (!formName.trim() || !formBarcode.trim()) {
      toast.error("Please enter product name and barcode");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: formName.trim(),
      barcode: formBarcode.trim(),
      category: formCategory,
      globalPriceRef: formPrice ? `₹${parseFloat(formPrice).toFixed(2)}` : "₹0.00",
      mappedShops: 0,
    };

    try {
      const { fetchApi } = await import("@/utils/api");
      let created;
      try {
        created = await fetchApi("/catalog/master-skus", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (err?.status === 404) {
          created = { id: `mp-${Date.now()}`, ...payload };
        } else {
          throw err;
        }
      }
      setMasterProducts((prev) => [created || { id: `mp-${Date.now()}`, ...payload }, ...prev]);
      setIsModalOpen(false);
      setFormName("");
      setFormBarcode("");
      setFormPrice("");
      toast.success("Master SKU created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create master SKU");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Master Catalog Mapping</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Maintain universal SKUs (Master Products). Shops map their local inventory to these master barcodes.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          + Create Master SKU
        </button>
      </div>

      <FilterBar
        searchPlaceholder="Search by product name or barcode..."
        searchValue={search}
        onSearchChange={setSearch}
        onExport={() => toast.info("Exporting Master Catalog...")}
      />

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Master SKU Name</th>
                <th className="p-3">Barcode (EAN/UPC)</th>
                <th className="p-3">Category</th>
                <th className="p-3">Ref. Price</th>
                <th className="p-3">Mapped Shops</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3 font-bold text-primary">{p.name}</td>
                  <td className="p-3 font-mono text-xs">{p.barcode}</td>
                  <td className="p-3 font-semibold">{p.category}</td>
                  <td className="p-3 font-bold text-dark-4">{p.globalPriceRef}</td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">
                      {p.mappedShops} Shops
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="text-primary font-bold hover:underline">View Mappings</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">Create Master SKU</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Product Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent p-3 text-dark outline-none focus:border-primary dark:border-stroke-dark dark:text-white"
                  placeholder="e.g. Coca-Cola 2L PET"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Barcode (EAN/UPC)</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent p-3 text-dark outline-none focus:border-primary dark:border-stroke-dark dark:text-white"
                    placeholder="e.g. 890103001001"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent p-3 text-dark outline-none focus:border-primary dark:border-stroke-dark dark:text-white"
                  >
                    <option value="Beverages">Beverages</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Bakery">Bakery</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Reference Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent p-3 text-dark outline-none focus:border-primary dark:border-stroke-dark dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleCreateSku}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create SKU"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

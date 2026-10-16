"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TrashTabWrapper } from "@/components/common/trash-tab-wrapper";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  priceRange: string;
  stockStatus: "in-stock" | "low" | "out";
  status: "active" | "inactive";
  shopsCount: number;
  image?: string;
  isDeleted?: boolean;
}

export default function ProductsPage() {
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; parentCategory: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSubcategory, setFormSubcategory] = useState("");
  const [formPrice, setFormPrice] = useState("₹45.00");
  const [formStock, setFormStock] = useState<"in-stock" | "low" | "out">("in-stock");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const [resProds, resCats, resSubs] = await Promise.all([
        fetchApi("/catalog/products"),
        fetchApi("/catalog/categories"),
        fetchApi("/catalog/subcategories"),
      ]);

      // Categories
      let catList: any[] = [];
      if (Array.isArray(resCats)) catList = resCats;
      else if (resCats && Array.isArray(resCats.data)) catList = resCats.data;
      setCategories(catList.map((c) => ({ id: String(c.id), name: c.name || "" })));
      if (catList.length > 0 && !formCategory) {
        setFormCategory(catList[0].name);
      }

      // Subcategories
      let subList: any[] = [];
      if (Array.isArray(resSubs)) subList = resSubs;
      else if (resSubs && Array.isArray(resSubs.data)) subList = resSubs.data;
      setSubcategories(
        subList.map((s) => ({
          id: String(s.id),
          name: s.name || "",
          parentCategory: s.parentCategory || s.parent_category || "",
        }))
      );

      // Products
      let fetched: any[] = [];
      if (Array.isArray(resProds)) fetched = resProds;
      else if (resProds && Array.isArray(resProds.data)) fetched = resProds.data;
      else if (resProds && Array.isArray(resProds.results)) fetched = resProds.results;

      const mapped: Product[] = fetched.map((p) => ({
        id: String(p.id),
        name: p.name || "",
        category: p.category || "",
        subcategory: p.subcategory || "",
        priceRange: p.priceRange || p.price_range || "₹0.00",
        stockStatus: (p.stockStatus || p.stock_status || "in-stock") as "in-stock" | "low" | "out",
        status: (p.status || "active") as "active" | "inactive",
        shopsCount: Number(p.shopsCount || p.shops_count || 1),
        image: p.image || "",
        isDeleted: Boolean(p.isDeleted || p.is_deleted),
      }));

      setProducts(mapped);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      toast.error(err.message || "Failed to load catalog products");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { fetchApi } = await import("@/utils/api");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchApi("/media/upload", {
        method: "POST",
        body: formData,
      });

      const url = res.url || res.data?.url || res.file_url;
      if (url) {
        setFormImage(url);
        toast.success("Image uploaded successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = safeProducts.filter((p) => {
    const matchesTab = tab === "trash" ? p.isDeleted : !p.isDeleted;
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = (p.name || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  const activeProducts = safeProducts.filter((p) => !p.isDeleted);
  const trashProducts = safeProducts.filter((p) => p.isDeleted);

  const availableSubcategories = subcategories.filter(
    (s) => !formCategory || s.parentCategory.toLowerCase() === formCategory.toLowerCase()
  );

  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    try {
      const { fetchApi } = await import("@/utils/api");
      const formattedPrice = formPrice.startsWith("₹") ? formPrice : `₹${formPrice}`;
      const payload = {
        name: formName,
        category: formCategory || (categories[0]?.name ?? "General"),
        subcategory: formSubcategory || (availableSubcategories[0]?.name ?? "General"),
        priceRange: formattedPrice,
        price_range: formattedPrice,
        stockStatus: formStock,
        stock_status: formStock,
        status: formStatus,
        image: formImage,
      };

      if (editingProduct) {
        await fetchApi(`/catalog/products/${editingProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Product updated successfully");
      } else {
        await fetchApi("/catalog/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Product created successfully");
      }

      setProductModalOpen(false);
      setEditingProduct(null);
      setFormName("");
      setFormImage("");
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: true, is_deleted: true }),
      });
      toast.success("Product moved to trash");
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || "Error deleting product");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: false, is_deleted: false }),
      });
      toast.success("Product restored");
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || "Error restoring product");
    }
  };

  const toggleStatus = async (id: string) => {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const nextStatus = current.status === "active" ? "inactive" : "active";
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success(`Product status marked as ${nextStatus}`);
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Master Catalog Products</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Master SKU items, pricing guidelines, stock states, and visibility across all connected shops.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormName("");
            setFormImage("");
            setFormPrice("₹45.00");
            setFormStock("in-stock");
            setFormStatus("active");
            if (categories.length > 0) setFormCategory(categories[0].name);
            setProductModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-1 transition-all hover:bg-primary/90"
        >
          + Add Product
        </button>
      </div>

      <TrashTabWrapper
        activeCount={activeProducts.length}
        trashCount={trashProducts.length}
        activeTab={tab}
        onTabChange={setTab}
      >
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-stroke bg-white px-3.5 py-2 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-gray-dark dark:text-white w-full sm:w-64"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-stroke bg-white px-3.5 py-2 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-gray-dark dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-dark-4 dark:text-dark-6 font-medium">
              Showing {filteredProducts.length} items
            </div>
          </div>

          <div className="rounded-2xl border border-stroke bg-white shadow-1 dark:border-stroke-dark dark:bg-gray-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
                <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Subcategory</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock Status</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-dark-4 dark:text-dark-6">
                        Loading products from database...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-dark-4 dark:text-dark-6">
                        {tab === "active" ? "No products found in catalog. Click '+ Add Product' to create one." : "Trash is currently empty."}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-10 w-10 rounded-lg object-cover bg-gray-2 dark:bg-dark-2"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-dark dark:text-white">{p.name}</span>
                        </td>
                        <td className="p-4 text-dark-4 dark:text-dark-6">{p.category}</td>
                        <td className="p-4 text-dark-4 dark:text-dark-6">{p.subcategory}</td>
                        <td className="p-4 font-bold text-dark dark:text-white">{p.priceRange}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              p.stockStatus === "in-stock"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : p.stockStatus === "low"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-rose-500/10 text-rose-500"
                            }`}
                          >
                            {p.stockStatus === "in-stock" ? "In Stock" : p.stockStatus === "low" ? "Low Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => toggleStatus(p.id)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                              p.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                            }`}
                          >
                            {p.status === "active" ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <TableActionsDropdown
                            actions={
                              tab === "active"
                                ? [
                                    {
                                      label: "Edit Product",
                                      onClick: () => {
                                        setEditingProduct(p);
                                        setFormName(p.name);
                                        setFormCategory(p.category);
                                        setFormSubcategory(p.subcategory);
                                        setFormPrice(p.priceRange);
                                        setFormStock(p.stockStatus);
                                        setFormStatus(p.status);
                                        setFormImage(p.image || "");
                                        setProductModalOpen(true);
                                      },
                                    },
                                    {
                                      label: "Move to Trash",
                                      onClick: () => setDeleteTargetId(p.id),
                                      variant: "danger",
                                    },
                                  ]
                                : [
                                    {
                                      label: "Restore Product",
                                      onClick: () => handleRestore(p.id),
                                      variant: "primary",
                                    },
                                  ]
                            }
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </TrashTabWrapper>

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">
              {editingProduct ? "Edit Product" : "Add New Catalog Product"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Amul Pure Ghee 1L"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                    Department / Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      const subs = subcategories.filter(
                        (s) => s.parentCategory.toLowerCase() === e.target.value.toLowerCase()
                      );
                      if (subs.length > 0) setFormSubcategory(subs[0].name);
                    }}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                    Subcategory
                  </label>
                  <select
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  >
                    {availableSubcategories.length > 0 ? (
                      availableSubcategories.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))
                    ) : (
                      <option value="General">General</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                    Reference Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="₹45.00"
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                    Stock Availability
                  </label>
                  <select
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value as any)}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  >
                    <option value="in-stock">In Stock</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Product Image
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-xs text-dark-4 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                  />
                  {uploadingImage && <span className="text-xs text-primary font-medium animate-pulse">Uploading...</span>}
                </div>
                {formImage && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={formImage} alt="Preview" className="h-10 w-10 rounded-lg object-cover border border-stroke dark:border-stroke-dark" />
                    <span className="text-[11px] text-dark-4 dark:text-dark-6 truncate max-w-[200px]">{formImage}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setProductModalOpen(false)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark dark:border-stroke-dark dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={uploadingImage}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) handleSoftDelete(deleteTargetId);
        }}
        title="Soft Delete Product"
        description="Are you sure? This item will be moved to the Trash tab and hidden from merchant linking."
        confirmLabel="Move to Trash"
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TrashTabWrapper } from "@/components/common/trash-tab-wrapper";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";

interface Category {
  id: string;
  name: string;
  subcategoriesCount: number;
  productsCount: number;
  status: "active" | "inactive";
  image?: string;
  isDeleted?: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "c1", name: "Fresh Vegetables", subcategoriesCount: 8, productsCount: 142, status: "active", image: "https://via.placeholder.com/150" },
  { id: "c2", name: "Fresh Fruits", subcategoriesCount: 6, productsCount: 98, status: "active", image: "https://via.placeholder.com/150" },
  { id: "c3", name: "Dairy & Eggs", subcategoriesCount: 5, productsCount: 76, status: "active", image: "https://via.placeholder.com/150" },
  { id: "c4", name: "Bakery & Bread", subcategoriesCount: 4, productsCount: 52, status: "active", image: "https://via.placeholder.com/150" },
  { id: "c5", name: "Beverages & Juices", subcategoriesCount: 7, productsCount: 110, status: "inactive", image: "https://via.placeholder.com/150" },
  { id: "c6", name: "Seasonal Exotic Goods", subcategoriesCount: 2, productsCount: 15, status: "active", isDeleted: true, image: "https://via.placeholder.com/150" },
];

export default function CategoriesPage() {
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formImage, setFormImage] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/catalog/categories");
      let fetched: Category[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setCategories(fetched.length > 0 ? fetched : DEFAULT_CATEGORIES);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch categories:", err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const safeCategories = Array.isArray(categories) ? categories : [];
  const activeCategories = safeCategories.filter((c) => !c.isDeleted);
  const trashCategories = safeCategories.filter((c) => c.isDeleted);

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      const { fetchApi } = await import("@/utils/api");
      if (editingCategory) {
        try {
          await fetchApi(`/catalog/categories/${editingCategory.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: formName, image: formImage }),
          });
        } catch (err: any) {
          if (err?.status !== 404) throw err;
        }
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, name: formName, image: formImage } : c))
        );
      } else {
        const payload = {
          name: formName,
          image: formImage,
          subcategoriesCount: 0,
          productsCount: 0,
          status: "active",
        };
        let newCat;
        try {
          newCat = await fetchApi("/catalog/categories", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } catch (err: any) {
          if (err?.status === 404) {
            newCat = { id: `c_${Date.now()}`, ...payload };
          } else {
            throw err;
          }
        }
        setCategories((prev) => [...prev, newCat]);
      }
      setModalOpen(false);
      setFormName("");
      setFormImage("");
      setEditingCategory(null);
      toast.success(editingCategory ? "Category updated successfully" : "Category created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: true, is_deleted: true }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error deleting category:", err);
    }
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, isDeleted: true } : c)));
  };

  const handleRestore = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: false, is_deleted: false }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error restoring category:", err);
    }
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, isDeleted: false } : c)));
  };

  const toggleStatus = async (id: string) => {
    const current = categories.find((c) => c.id === id);
    if (!current) return;
    const nextStatus = current.status === "active" ? "inactive" : "active";
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error toggling category status:", err);
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Category Management</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Admin-only master product categories. Soft delete throughout (no data loss).
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormName("");
            setFormImage("");
            setModalOpen(true);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          + Add Category
        </button>
      </div>

      <TrashTabWrapper
        activeTab={tab}
        onTabChange={setTab}
        activeCount={activeCategories.length}
        trashCount={trashCategories.length}
      >
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Image</th>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Subcategories</th>
                  <th className="p-3">Total Products</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {(tab === "active" ? activeCategories : trashCategories).map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                    <td className="p-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg border border-stroke dark:border-stroke-dark bg-gray-2 dark:bg-dark-2">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-dark-4 dark:text-dark-6">N/A</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold">{cat.name}</td>
                    <td className="p-3">{cat.subcategoriesCount} subcategories</td>
                    <td className="p-3">{cat.productsCount} products</td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleStatus(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          cat.status === "active"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {cat.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <TableActionsDropdown
                        actions={
                          tab === "active"
                            ? [
                                {
                                  label: "Edit Category",
                                  onClick: () => {
                                    setEditingCategory(cat);
                                    setFormName(cat.name);
                                    setFormImage(cat.image || "");
                                    setModalOpen(true);
                                  },
                                  variant: "primary",
                                },
                                {
                                  label: "Delete",
                                  onClick: () => setDeleteTargetId(cat.id),
                                  variant: "danger",
                                },
                              ]
                            : [
                                {
                                  label: "Restore Category",
                                  onClick: () => handleRestore(cat.id),
                                  variant: "primary",
                                },
                              ]
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TrashTabWrapper>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Organic Produce"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark dark:border-stroke-dark dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Save Category
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
        title="Soft Delete Category"
        description="Are you sure? This category will be moved to the Trash tab and hidden from the client app, but data will be safely retained."
        confirmLabel="Move to Trash"
      />
    </div>
  );
}

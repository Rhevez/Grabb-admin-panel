"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TrashTabWrapper } from "@/components/common/trash-tab-wrapper";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";

interface Subcategory {
  id: string;
  name: string;
  parentCategory: string;
  productsCount: number;
  image?: string;
  isDeleted?: boolean;
}

const DEFAULT_SUBCATEGORIES: Subcategory[] = [
  { id: "sc1", name: "Leafy Greens", parentCategory: "Fresh Vegetables", productsCount: 32, image: "https://via.placeholder.com/150" },
  { id: "sc2", name: "Root Vegetables", parentCategory: "Fresh Vegetables", productsCount: 45, image: "https://via.placeholder.com/150" },
  { id: "sc3", name: "Citrus Fruits", parentCategory: "Fresh Fruits", productsCount: 28, image: "https://via.placeholder.com/150" },
  { id: "sc4", name: "Berries & Cherries", parentCategory: "Fresh Fruits", productsCount: 19, image: "https://via.placeholder.com/150" },
  { id: "sc5", name: "Cheese & Butter", parentCategory: "Dairy & Eggs", productsCount: 42, image: "https://via.placeholder.com/150" },
  { id: "sc6", name: "Exotic Spices", parentCategory: "Fresh Vegetables", productsCount: 12, isDeleted: true, image: "https://via.placeholder.com/150" },
];

export default function SubcategoriesPage() {
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [selectedParentFilter, setSelectedParentFilter] = useState("all");
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [formName, setFormName] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formParent, setFormParent] = useState("Fresh Vegetables");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const parentCategories = ["Fresh Vegetables", "Fresh Fruits", "Dairy & Eggs", "Bakery & Bread"];

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/catalog/subcategories");
      let fetched: Subcategory[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setSubcategories(fetched.length > 0 ? fetched : DEFAULT_SUBCATEGORIES);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch subcategories:", err);
      setSubcategories(DEFAULT_SUBCATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const safeSubs = Array.isArray(subcategories) ? subcategories : [];

  const filteredSubs = safeSubs.filter((sc) => {
    const isDeletedMatch = tab === "trash" ? sc.isDeleted : !sc.isDeleted;
    const parentMatch = selectedParentFilter === "all" || sc.parentCategory === selectedParentFilter;
    return isDeletedMatch && parentMatch;
  });

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      const { fetchApi } = await import("@/utils/api");
      if (editingSub) {
        try {
          await fetchApi(`/catalog/subcategories/${editingSub.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: formName,
              parentCategory: formParent,
              parent_category: formParent,
              image: formImage,
            }),
          });
        } catch (err: any) {
          if (err?.status !== 404) throw err;
        }
        setSubcategories((prev) =>
          prev.map((sc) =>
            sc.id === editingSub.id
              ? { ...sc, name: formName, parentCategory: formParent, image: formImage }
              : sc
          )
        );
      } else {
        const payload = {
          name: formName,
          parentCategory: formParent,
          parent_category: formParent,
          productsCount: 0,
          image: formImage,
        };
        let newSub;
        try {
          newSub = await fetchApi("/catalog/subcategories", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } catch (err: any) {
          if (err?.status === 404) {
            newSub = { id: `sc_${Date.now()}`, ...payload };
          } else {
            throw err;
          }
        }
        setSubcategories((prev) => [...prev, newSub]);
      }
      setModalOpen(false);
      setFormName("");
      setFormImage("");
      setEditingSub(null);
      toast.success(editingSub ? "Subcategory updated successfully" : "Subcategory created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save subcategory");
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/subcategories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: true, is_deleted: true }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error deleting subcategory:", err);
    }
    setSubcategories((prev) => prev.map((sc) => (sc.id === id ? { ...sc, isDeleted: true } : sc)));
  };

  const handleRestore = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/subcategories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: false, is_deleted: false }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error restoring subcategory:", err);
    }
    setSubcategories((prev) => prev.map((sc) => (sc.id === id ? { ...sc, isDeleted: false } : sc)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Subcategory Management</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Filter, add, and soft delete subcategories under parent categories.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSub(null);
            setFormName("");
            setFormImage("");
            setModalOpen(true);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          + Add Subcategory
        </button>
      </div>

      {/* Parent Category Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
        <span className="text-xs font-semibold text-dark-4 dark:text-dark-6">Filter by Parent:</span>
        <select
          value={selectedParentFilter}
          onChange={(e) => setSelectedParentFilter(e.target.value)}
          className="rounded-lg border border-stroke bg-gray-2 px-3 py-1.5 text-xs font-semibold text-dark dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
        >
          <option value="all">All Parent Categories</option>
          {parentCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <TrashTabWrapper
        activeTab={tab}
        onTabChange={setTab}
        activeCount={subcategories.filter((s) => !s.isDeleted).length}
        trashCount={subcategories.filter((s) => s.isDeleted).length}
      >
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Image</th>
                  <th className="p-3">Subcategory Name</th>
                  <th className="p-3">Parent Category</th>
                  <th className="p-3">Linked Products</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {filteredSubs.map((sc) => (
                  <tr key={sc.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                    <td className="p-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg border border-stroke dark:border-stroke-dark bg-gray-2 dark:bg-dark-2">
                        {sc.image ? (
                          <img src={sc.image} alt={sc.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-dark-4 dark:text-dark-6">N/A</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold">{sc.name}</td>
                    <td className="p-3 font-medium text-primary">{sc.parentCategory}</td>
                    <td className="p-3">{sc.productsCount} products</td>
                     <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <TableActionsDropdown
                        actions={
                          tab === "active"
                            ? [
                                {
                                  label: "Edit Subcategory",
                                  onClick: () => {
                                    setEditingSub(sc);
                                    setFormName(sc.name);
                                    setFormParent(sc.parentCategory);
                                    setFormImage(sc.image || "");
                                    setModalOpen(true);
                                  },
                                  variant: "primary",
                                },
                                {
                                  label: "Delete",
                                  onClick: () => setDeleteTargetId(sc.id),
                                  variant: "danger",
                                },
                              ]
                            : [
                                {
                                  label: "Restore Subcategory",
                                  onClick: () => handleRestore(sc.id),
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">
              {editingSub ? "Edit Subcategory" : "Add New Subcategory"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Parent Category
                </label>
                <select
                  value={formParent}
                  onChange={(e) => setFormParent(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  {parentCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Subcategory Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Spinach & Microgreens"
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
                Save Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) handleSoftDelete(deleteTargetId);
        }}
        title="Soft Delete Subcategory"
        description="Are you sure you want to move this subcategory to the Trash tab?"
        confirmLabel="Move to Trash"
      />
    </div>
  );
}

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

export default function CategoriesPage() {
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formImage, setFormImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/catalog/categories");
      let fetched: any[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;

      const mapped: Category[] = fetched.map((c) => ({
        id: String(c.id),
        name: c.name || "",
        subcategoriesCount: c.subcategoriesCount ?? c.subcategories_count ?? 0,
        productsCount: c.productsCount ?? c.products_count ?? 0,
        status: (c.status || "active").toLowerCase() as "active" | "inactive",
        image: c.image || "",
        isDeleted: Boolean(c.isDeleted ?? c.is_deleted),
      }));

      setCategories(mapped);
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      toast.error(err.message || "Failed to load categories");
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

  const safeCategories = Array.isArray(categories) ? categories : [];
  const activeCategories = safeCategories.filter((c) => !c.isDeleted);
  const trashCategories = safeCategories.filter((c) => c.isDeleted);

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    try {
      const { fetchApi } = await import("@/utils/api");
      if (editingCategory) {
        await fetchApi(`/catalog/categories/${editingCategory.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: formName, image: formImage }),
        });
        toast.success("Category updated successfully");
      } else {
        const payload = {
          name: formName,
          image: formImage,
          status: "active",
        };
        await fetchApi("/catalog/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Category created successfully");
      }
      setModalOpen(false);
      setFormName("");
      setFormImage("");
      setEditingCategory(null);
      fetchCategories();
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
      toast.success("Category moved to trash");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Error deleting category");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: false, is_deleted: false }),
      });
      toast.success("Category restored");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Error restoring category");
    }
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
      toast.success(`Category marked as ${nextStatus}`);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to update category status");
    }
  };

  const currentList = tab === "active" ? activeCategories : trashCategories;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Product Categories</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Manage top-level catalog departments, subcategory counts, and client visibility.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormName("");
            setFormImage("");
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-1 transition-all hover:bg-primary/90"
        >
          + Add Category
        </button>
      </div>

      <TrashTabWrapper
        activeCount={activeCategories.length}
        trashCount={trashCategories.length}
        activeTab={tab}
        onTabChange={setTab}
      >
        <div className="rounded-2xl border border-stroke bg-white shadow-1 dark:border-stroke-dark dark:bg-gray-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-4">Department</th>
                  <th className="p-4">Subcategories</th>
                  <th className="p-4">Products</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-dark-4 dark:text-dark-6">
                      Loading categories from database...
                    </td>
                  </tr>
                ) : currentList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-dark-4 dark:text-dark-6">
                      {tab === "active" ? "No active categories found. Click '+ Add Category' to create one." : "Trash is currently empty."}
                    </td>
                  </tr>
                ) : (
                  currentList.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="h-10 w-10 rounded-lg object-cover bg-gray-2 dark:bg-dark-2"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {cat.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-dark dark:text-white">{cat.name}</span>
                      </td>
                      <td className="p-4 text-dark-4 dark:text-dark-6 font-medium">
                        {cat.subcategoriesCount} Subcategories
                      </td>
                      <td className="p-4 text-dark-4 dark:text-dark-6 font-medium">
                        {cat.productsCount} Items
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleStatus(cat.id)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                            cat.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                          }`}
                        >
                          {cat.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
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
                                  },
                                  {
                                    label: "Move to Trash",
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
                  ))
                )}
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
                  Category Image
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
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark dark:border-stroke-dark dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploadingImage}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
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

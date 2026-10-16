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

export default function SubcategoriesPage() {
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [selectedParentFilter, setSelectedParentFilter] = useState("all");
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [parentCategories, setParentCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [formName, setFormName] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formParent, setFormParent] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const [resSubs, resCats] = await Promise.all([
        fetchApi("/catalog/subcategories"),
        fetchApi("/catalog/categories"),
      ]);

      // Categories for dropdowns
      let catList: any[] = [];
      if (Array.isArray(resCats)) catList = resCats;
      else if (resCats && Array.isArray(resCats.data)) catList = resCats.data;
      const catNames = catList.map((c: any) => c.name || "").filter(Boolean);
      setParentCategories(catNames);
      if (catNames.length > 0 && !formParent) {
        setFormParent(catNames[0]);
      }

      // Subcategories
      let fetched: any[] = [];
      if (Array.isArray(resSubs)) fetched = resSubs;
      else if (resSubs && Array.isArray(resSubs.data)) fetched = resSubs.data;
      else if (resSubs && Array.isArray(resSubs.results)) fetched = resSubs.results;

      const mapped: Subcategory[] = fetched.map((s) => ({
        id: String(s.id),
        name: s.name || "",
        parentCategory: s.parentCategory || s.parent_category || "",
        productsCount: s.productsCount ?? s.products_count ?? 0,
        image: s.image || "",
        isDeleted: Boolean(s.isDeleted ?? s.is_deleted),
      }));

      setSubcategories(mapped);
    } catch (err: any) {
      console.error("Failed to fetch subcategories:", err);
      toast.error(err.message || "Failed to load subcategories");
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

  const safeSubs = Array.isArray(subcategories) ? subcategories : [];

  const filteredSubs = safeSubs.filter((sc) => {
    const isDeletedMatch = tab === "trash" ? sc.isDeleted : !sc.isDeleted;
    const parentMatch = selectedParentFilter === "all" || sc.parentCategory === selectedParentFilter;
    return isDeletedMatch && parentMatch;
  });

  const activeCount = safeSubs.filter((s) => !s.isDeleted).length;
  const trashCount = safeSubs.filter((s) => s.isDeleted).length;

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Please enter a subcategory name");
      return;
    }
    const chosenParent = formParent || (parentCategories.length > 0 ? parentCategories[0] : "General");
    try {
      const { fetchApi } = await import("@/utils/api");
      if (editingSub) {
        await fetchApi(`/catalog/subcategories/${editingSub.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: formName,
            parentCategory: chosenParent,
            parent_category: chosenParent,
            image: formImage,
          }),
        });
        toast.success("Subcategory updated successfully");
      } else {
        const payload = {
          name: formName,
          parentCategory: chosenParent,
          parent_category: chosenParent,
          image: formImage,
        };
        await fetchApi("/catalog/subcategories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Subcategory created successfully");
      }
      setModalOpen(false);
      setFormName("");
      setFormImage("");
      setEditingSub(null);
      fetchData();
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
      toast.success("Subcategory moved to trash");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error deleting subcategory");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/catalog/subcategories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: false, is_deleted: false }),
      });
      toast.success("Subcategory restored");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error restoring subcategory");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Product Subcategories</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Detailed segmentations belonging to parent categories.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSub(null);
            setFormName("");
            setFormImage("");
            if (parentCategories.length > 0) setFormParent(parentCategories[0]);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-1 transition-all hover:bg-primary/90"
        >
          + Add Subcategory
        </button>
      </div>

      <TrashTabWrapper
        activeCount={activeCount}
        trashCount={trashCount}
        activeTab={tab}
        onTabChange={setTab}
      >
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-dark-4 dark:text-dark-6">Filter by Parent:</span>
            <select
              value={selectedParentFilter}
              onChange={(e) => setSelectedParentFilter(e.target.value)}
              className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-gray-dark dark:text-white"
            >
              <option value="all">All Parent Categories</option>
              {parentCategories.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-stroke bg-white shadow-1 dark:border-stroke-dark dark:bg-gray-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
                <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                  <tr>
                    <th className="p-4">Subcategory</th>
                    <th className="p-4">Parent Category</th>
                    <th className="p-4">Products</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-dark-4 dark:text-dark-6">
                        Loading subcategories from database...
                      </td>
                    </tr>
                  ) : filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-dark-4 dark:text-dark-6">
                        {tab === "active" ? "No subcategories found. Click '+ Add Subcategory' to create one." : "Trash is currently empty."}
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sc) => (
                      <tr key={sc.id} className="hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          {sc.image ? (
                            <img
                              src={sc.image}
                              alt={sc.name}
                              className="h-10 w-10 rounded-lg object-cover bg-gray-2 dark:bg-dark-2"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {sc.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-dark dark:text-white">{sc.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-2 dark:bg-dark-2 text-dark dark:text-white">
                            {sc.parentCategory}
                          </span>
                        </td>
                        <td className="p-4 text-dark-4 dark:text-dark-6 font-medium">
                          {sc.productsCount} Items
                        </td>
                        <td className="p-4 text-right">
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
                                    },
                                    {
                                      label: "Move to Trash",
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </TrashTabWrapper>

      {/* Add / Edit Subcategory Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">
              {editingSub ? "Edit Subcategory" : "Add New Subcategory"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Subcategory Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Exotic Citrus"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Parent Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formParent}
                  onChange={(e) => setFormParent(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  {parentCategories.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">
                  Subcategory Image
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
                Save Subcategory
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
        title="Soft Delete Subcategory"
        description="Are you sure? This subcategory will be moved to the Trash tab and hidden from the client catalog."
        confirmLabel="Move to Trash"
      />
    </div>
  );
}

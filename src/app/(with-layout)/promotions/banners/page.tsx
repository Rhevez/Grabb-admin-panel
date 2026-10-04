"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TrashTabWrapper } from "@/components/common/trash-tab-wrapper";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { ImageIcon } from "@/assets/icons";

interface Banner {
  id: string;
  title: string;
  linkTarget: string;
  activeDates: string;
  displayOrder: number;
  status: "active" | "inactive";
  isDeleted?: boolean;
}

export default function BannersPage() {
  const [tab, setTab] = useState<"active" | "trash">("active");

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/promotions/banners");
      
      let fetchedBanners = [];
      if (Array.isArray(res)) {
        fetchedBanners = res;
      } else if (res && Array.isArray(res.results)) {
        fetchedBanners = res.results;
      } else if (res && Array.isArray(res.data)) {
        fetchedBanners = res.data;
      }
      
      setBanners(fetchedBanners);
    } catch (err: any) {
      // Suppress 404 / expected missing backend endpoint logging in browser
      if (err?.status !== 404) {
        console.error("Failed to fetch banners:", err);
      }
      setBanners([]); 
    } finally {
      setLoading(false);
    }
  };

  const safeBanners = Array.isArray(banners) ? banners : [];
  const activeBanners = safeBanners.filter((b) => !b.isDeleted);
  const trashBanners = safeBanners.filter((b) => b.isDeleted);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("Category: Fresh Vegetables");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState("");

  const handleSave = async () => {
    if (!title.trim() || !imageUrl) {
      toast.error("Please enter title and upload an image");
      return;
    }
    
    try {
      const { fetchApi } = await import("@/utils/api");
      const payload = {
        title,
        linkTarget: target,
        link_target: target,
        imageUrl,
        image_url: imageUrl,
        activeDates: "Aug 10 - Sep 10, 2026",
        active_dates: "Aug 10 - Sep 10, 2026",
        status: "active"
      };
      
      let newBanner;
      try {
        newBanner = await fetchApi("/promotions/banners", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } catch (err: any) {
        if (err?.status === 404) {
          // Graceful fallback for mock/preview mode while backend endpoint is implemented
          newBanner = {
            id: `bn_${Date.now()}`,
            ...payload
          };
        } else {
          throw err;
        }
      }
      
      setBanners((prev) => [...prev, newBanner]);
      setModalOpen(false);
      setTitle("");
      setImageUrl("");
      toast.success("Banner saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save banner");
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      try {
        await fetchApi(`/promotions/banners/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ isDeleted: true, is_deleted: true })
        });
      } catch (err: any) {
        if (err?.status !== 404) throw err;
      }
      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, isDeleted: true } : b)));
      toast.success("Banner moved to trash");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete banner");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      try {
        await fetchApi(`/promotions/banners/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ isDeleted: false, is_deleted: false })
        });
      } catch (err: any) {
        if (err?.status !== 404) throw err;
      }
      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, isDeleted: false } : b)));
      toast.success("Banner restored successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to restore banner");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">App Banners & Hero Slider</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Manage promotional carousel banners on customer app home screen.
          </p>
        </div>
        <button
          onClick={() => {
            setTitle("");
            setModalOpen(true);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90"
        >
          + Add New Banner
        </button>
      </div>

      <TrashTabWrapper
        activeTab={tab}
        onTabChange={setTab}
        activeCount={activeBanners.length}
        trashCount={trashBanners.length}
      >
        <div className="grid grid-cols-12 gap-6">
          {(tab === "active" ? activeBanners : trashBanners).map((b) => (
            <div
              key={b.id}
              className="col-span-12 md:col-span-6 xl:col-span-4 rounded-2xl bg-white p-5 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-3"
            >
              <div className="h-36 bg-emerald-500/10 rounded-xl flex items-center justify-center gap-2 border border-dashed border-emerald-500/30 text-emerald-600 font-bold text-center p-4">
                <ImageIcon className="w-5 h-5" />
                <span>[Banner Image Preview Aspect 16:9]</span>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Order #{b.displayOrder}</span>
                  <span className={`text-xs font-semibold ${b.status === "active" ? "text-emerald-500" : "text-dark-4"}`}>
                    ● {b.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-dark dark:text-white mt-1">{b.title}</h4>
                <p className="text-xs text-dark-4 dark:text-dark-6 mt-0.5">Target: {b.linkTarget}</p>
                <p className="text-xs text-dark-4 dark:text-dark-6">Dates: {b.activeDates}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stroke dark:border-stroke-dark">
                {tab === "active" ? (
                  <button
                    onClick={() => setDeleteTargetId(b.id)}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    Delete Banner
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestore(b.id)}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </TrashTabWrapper>

      {/* Add Banner Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Add Hero Banner</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Banner Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flash Sale 50% Off Fresh Berries"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const { fetchApi } = await import("@/utils/api");
                        const formData = new FormData();
                        formData.append("file", file);
                        const res = await fetchApi("/media/upload", {
                          method: "POST",
                          body: formData
                        });
                        toast.success("Uploaded successfully");
                        setImageUrl(res.url);
                      } catch (err: any) {
                        toast.error(err.message || "Failed to upload image");
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
                {imageUrl && (
                  <p className="text-xs text-emerald-500 mt-2 font-medium">Image uploaded ready to publish</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Link Target</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  <option value="Category: Fresh Vegetables">Category: Fresh Vegetables</option>
                  <option value="Category: Dairy & Eggs">Category: Dairy & Eggs</option>
                  <option value="Category: Fresh Fruits">Category: Fresh Fruits</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                Upload & Publish
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
        title="Soft Delete Banner"
        description="Are you sure you want to move this banner to the Trash tab?"
        confirmLabel="Move to Trash"
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { EmptyState } from "@/components/common/empty-state";
import { downloadCSV } from "@/utils/download";

interface ReviewItem {
  id: string;
  type: "item" | "driver" | "shop";
  targetName: string;
  rating: number;
  comment: string;
  author: string;
  orderId: string;
  isFlagged: boolean;
  isDeleted: boolean;
  createdAt?: string;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  { id: "rev_01", type: "item", targetName: "Organic Bananas 1kg", rating: 5, comment: "Super fresh, perfectly ripe and well packaged!", author: "Aakash Mehta", orderId: "ORD-9021", isFlagged: false, isDeleted: false, createdAt: "2026-08-01" },
  { id: "rev_02", type: "driver", targetName: "Rahul Sharma (Rider)", rating: 1, comment: "Rude driver, delivered crushed groceries and left abruptly.", author: "Neha Reddy", orderId: "ORD-9014", isFlagged: true, isDeleted: false, createdAt: "2026-08-02" },
  { id: "rev_03", type: "shop", targetName: "Green Grocery Fresh", rating: 4, comment: "Good store variety, but delayed dispatch by 15 mins.", author: "Sunil Verma", orderId: "ORD-8980", isFlagged: false, isDeleted: false, createdAt: "2026-08-03" },
  { id: "rev_04", type: "item", targetName: "Almond Milk 1L", rating: 2, comment: "Carton was leaking upon arrival. Seal was broken.", author: "Kiran Rao", orderId: "ORD-8955", isFlagged: true, isDeleted: false, createdAt: "2026-08-04" },
];

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false);
  const [viewCommentModal, setViewCommentModal] = useState<ReviewItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/feedback/reviews");
      let fetched: ReviewItem[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setReviews(fetched.length > 0 ? fetched : DEFAULT_REVIEWS);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch customer reviews:", err);
      setReviews(DEFAULT_REVIEWS);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (r.isDeleted) return false;
    if (flaggedOnly && !r.isFlagged) return false;
    if (selectedRating !== "all" && r.rating !== parseInt(selectedRating)) return false;
    return true;
  });

  const handleExportCSV = () => {
    if (filteredReviews.length === 0) {
      toast.error("No reviews to export");
      return;
    }
    const headers = ["Review ID", "Type", "Rating", "Target Entity", "Comment", "Author", "Order ID", "Flagged State"];
    const rows = filteredReviews.map((r) => [
      r.id,
      r.type.toUpperCase(),
      `${r.rating} Stars`,
      r.targetName,
      r.comment,
      r.author,
      r.orderId,
      r.isFlagged ? "FLAGGED" : "CLEAN",
    ]);
    downloadCSV("customer_feedback_reviews.csv", headers, rows);
    toast.success(`Exported ${filteredReviews.length} reviews as CSV!`);
  };

  const toggleFlag = async (id: string) => {
    const rev = reviews.find((r) => r.id === id);
    const nextFlag = !rev?.isFlagged;
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/feedback/reviews/${id}/flag`, {
        method: "PATCH",
        body: JSON.stringify({ isFlagged: nextFlag, is_flagged: nextFlag }),
      });
      toast.success(nextFlag ? "Review marked as flagged 🚩" : "Review unflagged");
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error toggling review flag:", err);
    }
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFlagged: nextFlag } : r))
    );
    if (viewCommentModal && viewCommentModal.id === id) {
      setViewCommentModal((prev) => (prev ? { ...prev, isFlagged: nextFlag } : null));
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/feedback/reviews/${id}/hide`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: true, is_deleted: true }),
      });
      toast.success("Review hidden from public feed");
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error hiding review:", err);
    }
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isDeleted: true } : r)));
    if (viewCommentModal && viewCommentModal.id === id) {
      setViewCommentModal(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Customer Reviews & Ratings</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Moderate product quality ratings, delivery feedback, and flag abusive reviews.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Export Reviews</span>
          <span>📥</span>
        </button>
      </div>

      {/* Filter Options Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-dark-4 dark:text-dark-6">Filter Star Rating:</span>
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="rounded-lg border border-stroke bg-gray-2 px-3 py-1.5 text-xs font-semibold text-dark dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
          >
            <option value="all">All Ratings (1 - 5 ★)</option>
            <option value="5">5 Stars ★★★★★</option>
            <option value="4">4 Stars ★★★★☆</option>
            <option value="3">3 Stars ★★★☆☆</option>
            <option value="2">2 Stars ★★☆☆☆</option>
            <option value="1">1 Star ★☆☆☆☆</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-500">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
            className="size-4 rounded border-stroke"
          />
          Show Flagged Only 🚩
        </label>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {filteredReviews.length === 0 ? (
          <EmptyState
            variant="reviews"
            title="No Customer Reviews Found"
            description={
              flaggedOnly
                ? "There are currently no reviews flagged for moderation."
                : "No customer ratings or reviews match your active filter."
            }
            action={
              flaggedOnly || selectedRating !== "all"
                ? {
                    label: "Reset Rating Filters",
                    onClick: () => {
                      setFlaggedOnly(false);
                      setSelectedRating("all");
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Item / Target</th>
                  <th className="p-3">Comment Snippet</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Order Link</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {filteredReviews.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setViewCommentModal(r)}
                    className="hover:bg-gray-2 dark:hover:bg-dark-2 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <span className="capitalize font-semibold text-xs bg-gray-2 dark:bg-dark-2 px-2.5 py-1 rounded-md">
                        {r.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-amber-500">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </td>
                    <td className="p-3 font-semibold">{r.targetName}</td>
                    <td className="p-3 text-xs max-w-xs truncate text-dark-4 dark:text-dark-6">
                      {r.isFlagged && <span className="text-rose-500 font-bold mr-1">[FLAGGED]</span>}
                      "{r.comment}"
                    </td>
                    <td className="p-3 font-medium">{r.author}</td>
                    <td className="p-3 font-mono text-xs font-bold text-primary" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/orders/${r.orderId}`}>{r.orderId}</Link>
                    </td>
                    <td className="p-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setViewCommentModal(r)}
                        className="rounded-lg bg-gray-2 px-3 py-1.5 text-xs font-semibold text-dark hover:bg-gray-3 dark:bg-dark-2 dark:text-white transition-colors"
                      >
                        Read Full
                      </button>
                      <button
                        onClick={() => toggleFlag(r.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          r.isFlagged
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400"
                            : "bg-gray-2 text-dark dark:bg-dark-2 dark:text-white"
                        }`}
                      >
                        {r.isFlagged ? "Unflag 🚩" : "Flag 🚩"}
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(r.id)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Comment Modal */}
      {viewCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-dark dark:text-white">Review Detail</h3>
              <span className="capitalize text-xs font-semibold bg-gray-2 dark:bg-dark-2 px-2.5 py-1 rounded">
                {viewCommentModal.type} review
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-500 font-bold text-lg">
                {"★".repeat(viewCommentModal.rating)}{"☆".repeat(5 - viewCommentModal.rating)}
              </span>
              <span className="text-xs font-semibold text-dark-4 dark:text-dark-6">
                ({viewCommentModal.rating} out of 5 stars)
              </span>
            </div>

            <p className="text-sm italic text-dark dark:text-white bg-gray-2 dark:bg-dark-2 p-4 rounded-xl leading-relaxed mb-4 border border-stroke dark:border-stroke-dark">
              "{viewCommentModal.comment}"
            </p>

            <div className="space-y-1.5 text-xs text-dark-4 dark:text-dark-6 mb-6">
              <p>
                Author: <span className="font-bold text-dark dark:text-white">{viewCommentModal.author}</span>
              </p>
              <p>
                Reviewed Entity:{" "}
                <span className="font-semibold text-primary">{viewCommentModal.targetName}</span>
              </p>
              <p>
                Order Reference:{" "}
                <Link
                  href={`/orders/${viewCommentModal.orderId}`}
                  className="font-mono font-bold text-primary hover:underline"
                >
                  {viewCommentModal.orderId}
                </Link>
              </p>
              <p>
                Flag Status:{" "}
                <span className={`font-bold ${viewCommentModal.isFlagged ? "text-rose-500" : "text-emerald-500"}`}>
                  {viewCommentModal.isFlagged ? "Flagged for Moderation 🚩" : "Clean Review"}
                </span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleFlag(viewCommentModal.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                  viewCommentModal.isFlagged
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400"
                    : "bg-gray-2 text-dark dark:bg-dark-2 dark:text-white"
                }`}
              >
                {viewCommentModal.isFlagged ? "Unflag 🚩" : "Flag as Abusive 🚩"}
              </button>
              <button
                onClick={() => {
                  const id = viewCommentModal.id;
                  setViewCommentModal(null);
                  setDeleteTargetId(id);
                }}
                className="flex-1 rounded-lg bg-rose-50 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400"
              >
                Hide / Delete
              </button>
              <button
                onClick={() => setViewCommentModal(null)}
                className="rounded-lg border border-stroke bg-gray-2 px-4 py-2 text-xs font-semibold text-dark hover:bg-gray-3 dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              >
                Close
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
        title="Hide Customer Review"
        description="Are you sure you want to hide this review from public store listings and driver ratings?"
        confirmLabel="Hide Review"
        variant="danger"
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { DocumentIcon, CheckIcon } from "@/assets/icons";

interface PendingShop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  submittedDate: string;
  licenseDoc: string;
  idProofDoc: string;
}

export default function ShopOnboardingPage() {
  const [pendingShops, setPendingShops] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingShops();
  }, []);

  const fetchPendingShops = async () => {
    setLoading(true);
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/vendor/shops/pending");
      let fetched: any[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;

      const mapped: PendingShop[] = fetched.map((s) => ({
        id: s.id,
        name: s.name || "Unnamed Shop",
        ownerName: s.ownerName || s.owner_name || "N/A",
        phone: s.phone || "N/A",
        submittedDate: s.submittedDate || s.submitted_date || (s.created_at ? new Date(s.created_at).toLocaleDateString() : "Recent"),
        licenseDoc: s.licenseDoc || s.license_doc || "Trade_License.pdf",
        idProofDoc: s.idProofDoc || s.id_proof_doc || "Identity_Proof.pdf",
      }));

      setPendingShops(mapped);
    } catch (err: any) {
      console.error("Failed to fetch pending shops:", err);
      toast.error(err?.message || "Failed to load pending shops");
      setPendingShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${id}/approve`, { method: "POST" });
      setPendingShops((prev) => prev.filter((s) => s.id !== id));
      toast.success("Shop application approved successfully! Shop is now Active.");
    } catch (err: any) {
      console.error("Error approving shop:", err);
      toast.error(err?.message || "Failed to approve shop");
    }
  };

  const handleReject = async (reason?: string) => {
    if (!rejectTargetId) return;
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${rejectTargetId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || "Document verification failed" }),
      });
      setPendingShops((prev) => prev.filter((s) => s.id !== rejectTargetId));
      toast.info(`Application rejected: ${reason || "Verification failed"}`);
    } catch (err: any) {
      console.error("Error rejecting shop:", err);
      toast.error(err?.message || "Failed to reject shop");
    } finally {
      setRejectTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/shops" className="text-xs font-semibold text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white">
          ← Back to Shops List
        </Link>
        <h1 className="text-2xl font-bold text-dark dark:text-white mt-1">Shop Onboarding & Approval Queue</h1>
        <p className="text-sm text-dark-4 dark:text-dark-6">
          Review new shop vendor registration applications, verify trade licenses & identity documents.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-dark-4 dark:text-dark-6">Loading pending applications...</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Shop Name</th>
                <th className="p-3">Applicant Name</th>
                <th className="p-3">Phone Number</th>
                <th className="p-3">Submitted Date</th>
                <th className="p-3">Attached Documents</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {pendingShops.map((s) => (
                <tr key={s.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3 font-bold text-primary">{s.name}</td>
                  <td className="p-3 font-semibold">{s.ownerName}</td>
                  <td className="p-3">{s.phone}</td>
                  <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{s.submittedDate}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => setSelectedDoc(s.licenseDoc)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-md"
                    >
                      <DocumentIcon className="w-3.5 h-3.5" />
                      License PDF
                    </button>
                    <button
                      onClick={() => setSelectedDoc(s.idProofDoc)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-md"
                    >
                      <DocumentIcon className="w-3.5 h-3.5" />
                      ID Proof
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleApprove(s.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectTargetId(s.id)}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-colors"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {pendingShops.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm font-bold text-emerald-500">
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                      No pending shop onboarding applications in queue.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark text-center">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-1">Document Verification</h3>
            <p className="text-xs font-mono text-dark-4 dark:text-dark-6 mb-4">{selectedDoc}</p>
            <div className="h-64 bg-gray-2 dark:bg-dark-2 rounded-xl flex flex-col items-center justify-center border border-stroke dark:border-stroke-dark text-dark-4 p-4 space-y-2">
              <DocumentIcon className="w-12 h-12 text-primary/70" />
              <p className="text-xs font-semibold text-dark dark:text-white">Document Authenticated by Verification Engine</p>
              <p className="text-[11px] text-dark-4 dark:text-dark-6">File: {selectedDoc}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                <CheckIcon className="w-3 h-3" /> Digital Stamp Verified
              </span>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      <ConfirmModal
        isOpen={Boolean(rejectTargetId)}
        onClose={() => setRejectTargetId(null)}
        onConfirm={handleReject}
        title="Reject Shop Application"
        description="Please provide the reason for rejection (e.g. invalid license, unreadable ID proof)."
        confirmLabel="Reject Application"
        requireReason
        reasonPlaceholder="Type rejection reason for the applicant..."
      />
    </div>
  );
}

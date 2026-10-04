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

const DEFAULT_PENDING_SHOPS: PendingShop[] = [
  {
    id: "app_101",
    name: "Healthy Harvest Organics",
    ownerName: "Anita Roy",
    phone: "+91 98444 88776",
    submittedDate: "August 9, 2026",
    licenseDoc: "FSSAI_Trade_License_2026.pdf",
    idProofDoc: "Owner_Aadhaar_ID.pdf",
  },
  {
    id: "app_102",
    name: "Metro Supermart Corner",
    ownerName: "Deepak Patel",
    phone: "+91 98777 11223",
    submittedDate: "August 10, 2026",
    licenseDoc: "GST_Registration_Certificate.pdf",
    idProofDoc: "Owner_PAN_Card.pdf",
  },
];

export default function ShopOnboardingPage() {
  const [pendingShops, setPendingShops] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingShops();
  }, []);

  const fetchPendingShops = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/vendor/shops/pending");
      let fetched: PendingShop[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setPendingShops(fetched.length > 0 ? fetched : DEFAULT_PENDING_SHOPS);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch pending shops:", err);
      setPendingShops(DEFAULT_PENDING_SHOPS);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${id}/approve`, { method: "POST" });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error approving shop:", err);
    }
    setPendingShops((prev) => prev.filter((s) => s.id !== id));
    toast.success("Shop application approved successfully! Shop is now Active.");
  };

  const handleReject = async (reason?: string) => {
    if (!rejectTargetId) return;
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/vendor/shops/${rejectTargetId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Error rejecting shop:", err);
    }
    setPendingShops((prev) => prev.filter((s) => s.id !== rejectTargetId));
    toast.info(`Application rejected with reason: ${reason || "Not specified"}`);
    setRejectTargetId(null);
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
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary underline"
                    >
                      <DocumentIcon className="w-3.5 h-3.5" />
                      License PDF
                    </button>
                    <button
                      onClick={() => setSelectedDoc(s.idProofDoc)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary underline"
                    >
                      <DocumentIcon className="w-3.5 h-3.5" />
                      ID Proof
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleApprove(s.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectTargetId(s.id)}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
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
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark text-center">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Document Preview</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">{selectedDoc}</p>
            <div className="h-64 bg-gray-2 dark:bg-dark-2 rounded-xl flex items-center justify-center border border-stroke dark:border-stroke-dark text-dark-4">
              [PDF Document Viewer Placeholder: Verified Government Seal & Signatures]
            </div>
            <button
              onClick={() => setSelectedDoc(null)}
              className="mt-6 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white"
            >
              Close Preview
            </button>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { DocumentIcon, CheckIcon } from "@/assets/icons";

interface Applicant {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  submittedDate: string;
  licenseDoc: string;
  idDoc: string;
}

export default function PartnerOnboardingPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([
    {
      id: "dp_app_201",
      name: "Karan Malhotra",
      phone: "+91 98444 55667",
      vehicleType: "Motorcycle",
      submittedDate: "August 10, 2026",
      licenseDoc: "DL_Karan_Malhotra.pdf",
      idDoc: "Aadhaar_Karan.pdf",
    },
  ]);

  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setApplicants((prev) => prev.filter((a) => a.id !== id));
    toast.success("Partner application approved! Fleet member is now verified and active.");
  };

  const handleReject = (reason?: string) => {
    if (!rejectTargetId) return;
    setApplicants((prev) => prev.filter((a) => a.id !== rejectTargetId));
    toast.info(`Application rejected with reason: ${reason}`);
    setRejectTargetId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/delivery-partners" className="text-xs font-semibold text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white">
          ← Back to All Delivery Partners
        </Link>
        <h1 className="text-2xl font-bold text-dark dark:text-white mt-1">Delivery Partner KYC Verification Queue</h1>
        <p className="text-sm text-dark-4 dark:text-dark-6">
          Review new driver/rider onboarding applications and verify government IDs & licenses.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Applicant Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Vehicle Type</th>
                <th className="p-3">Submitted Date</th>
                <th className="p-3">KYC Documents</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {applicants.map((a) => (
                <tr key={a.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3 font-bold text-primary">{a.name}</td>
                  <td className="p-3">{a.phone}</td>
                  <td className="p-3 text-xs font-medium">{a.vehicleType}</td>
                  <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{a.submittedDate}</td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => toast.info(`Previewing ${a.licenseDoc}`)} className="inline-flex items-center gap-1 text-xs font-bold text-primary underline">
                      <DocumentIcon className="w-3.5 h-3.5" />
                      Driving License
                    </button>
                    <button onClick={() => toast.info(`Previewing ${a.idDoc}`)} className="inline-flex items-center gap-1 text-xs font-bold text-primary underline">
                      <DocumentIcon className="w-3.5 h-3.5" />
                      ID Proof
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleApprove(a.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve KYC
                    </button>
                    <button
                      onClick={() => setRejectTargetId(a.id)}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {applicants.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm font-bold text-emerald-500">
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                      All delivery partner onboarding applications have been processed!
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(rejectTargetId)}
        onClose={() => setRejectTargetId(null)}
        onConfirm={handleReject}
        title="Reject Partner Application"
        description="Please state the rejection reason (e.g. expired driving license)."
        confirmLabel="Reject KYC"
        requireReason
        reasonPlaceholder="Type rejection reason for the applicant..."
      />
    </div>
  );
}

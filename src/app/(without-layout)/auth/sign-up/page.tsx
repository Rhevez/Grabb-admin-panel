import { Logo } from "@/components/logo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Administrator Access | Grabb Admin",
  description: "Administrator provisioning and access control for Grabb Admin Portal",
};

export default function SignUp() {
  return (
    <div className="flex min-h-screen flex-wrap items-center">
      {/* Left Column: Access Control Notice */}
      <div className="w-full xl:w-1/2">
        <div className="mx-auto w-[570px] max-w-full p-4 sm:p-12.5 xl:p-15">
          <div className="mb-6 flex flex-col items-center xl:hidden">
            <Link href="/" className="inline-flex flex-col items-center">
              <Logo width={180} height={56} showAdminBadge badgeText="Admin Panel" />
            </Link>
          </div>

          <div className="rounded-2xl border border-stroke bg-white p-6 sm:p-8 shadow-1 dark:border-stroke-dark dark:bg-gray-dark">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="mb-2 text-2xl font-bold text-dark dark:text-white">
              Restricted Access Portal
            </h1>
            <p className="mb-6 text-sm text-dark-4 dark:text-dark-6">
              Grabb Administration is a closed enterprise management environment. Administrator and supervisor accounts are strictly provisioned by authorized System Superadmins.
            </p>

            <div className="mb-6 space-y-3 rounded-xl border border-stroke bg-gray-1 p-4 dark:border-dark-3 dark:bg-dark-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-dark-3 dark:text-dark-5">
                How to gain access:
              </h2>
              <ul className="space-y-2 text-xs font-medium text-dark-4 dark:text-dark-6">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Contact your department lead or Superadmin to obtain an administrative invitation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Once your role is provisioned in the Admin Registry, use your verified company credentials.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Sign in securely with your assigned privileges.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/auth/sign-in"
                className="flex w-full items-center justify-center rounded-lg bg-primary py-3 px-4 font-semibold text-white shadow-1 transition hover:bg-primary/90 text-sm"
              >
                ← Return to Sign In
              </Link>
              <a
                href="mailto:support@grabb.com?subject=Grabb%20Admin%20Access%20Request"
                className="flex w-full items-center justify-center rounded-lg border border-stroke bg-transparent py-3 px-4 font-semibold text-dark hover:bg-gray-2 dark:border-stroke-dark dark:text-white dark:hover:bg-dark-3 transition-colors text-sm"
              >
                Contact Superadmin (support@grabb.com)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Symmetrical High-End Branded Card */}
      <div className="hidden w-full p-6 xl:block xl:w-1/2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-1 to-white p-12 dark:from-[#122031] dark:to-[#0d1724] border border-stroke dark:border-stroke-dark shadow-sm">
          <Link className="mb-8 inline-flex flex-col items-start" href="/">
            <Logo width={200} height={62} showAdminBadge badgeText="Admin Panel" />
          </Link>
          
          <p className="mb-2 text-sm font-semibold text-primary uppercase tracking-wider">
            Enterprise Security
          </p>

          <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
            Role-Based Administration
          </h2>

          <p className="mb-8 max-w-[420px] text-sm font-medium text-dark-4 dark:text-dark-6 leading-relaxed">
            Strict separation of duties across Operations, Customer Support, Financial Auditing, and System Configuration ensures regulatory compliance and merchant data isolation.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-xs font-semibold text-dark-3 dark:text-dark-6">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">✓</span>
              <span>Granular Permission Scopes & Audit Trails</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-dark-3 dark:text-dark-6">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">✓</span>
              <span>Encrypted Session Management & CSRF Defense</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-dark-3 dark:text-dark-6">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">✓</span>
              <span>Multi-Tenant Store Catalog Partitioning</span>
            </div>
          </div>

          <div className="pt-6 border-t border-stroke dark:border-stroke-dark/60 flex items-center justify-between text-xs text-dark-4 dark:text-dark-6">
            <span>Grabb Admin Suite v1.3.0</span>
            <span className="font-semibold text-primary">Security & IAM Standards</span>
          </div>
        </div>
      </div>
    </div>
  );
}

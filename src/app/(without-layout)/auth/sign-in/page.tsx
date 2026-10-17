import Signin from "@/components/Auth/Signin";
import { Logo } from "@/components/logo";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In | Grabb Admin",
  description: "Sign in to Grabb Fleet & Commerce Administration Portal",
};

export default function SignIn() {
  return (
    <div className="flex min-h-screen flex-wrap items-center">
      <div className="w-full xl:w-1/2">
        <div className="mx-auto w-[570px] max-w-full p-4 sm:p-12.5 xl:p-15">
          <div className="mb-6 flex flex-col items-center xl:hidden">
            <Link href="/" className="inline-flex flex-col items-center">
              <Logo width={180} height={56} showAdminBadge badgeText="Admin Panel" />
            </Link>
          </div>
          <Signin />
        </div>
      </div>

      <div className="hidden w-full p-6 xl:block xl:w-1/2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-1 to-white p-12 dark:from-[#122031] dark:to-[#0d1724] border border-stroke dark:border-stroke-dark shadow-sm">
          <Link className="mb-8 inline-flex flex-col items-start" href="/">
            <Logo width={200} height={62} showAdminBadge badgeText="Admin Panel" />
          </Link>
          
          <p className="mb-2 text-sm font-semibold text-primary uppercase tracking-wider">
            Enterprise Fleet & Commerce
          </p>

          <h1 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
            Administrative Control Center
          </h1>

          <p className="mb-8 max-w-[420px] text-sm font-medium text-dark-4 dark:text-dark-6 leading-relaxed">
            Manage real-time grocery dispatches, vendor payouts, operational surge zones, and multi-tenant catalogs from a single centralized console.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-xs font-semibold text-dark-3 dark:text-dark-6">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">✓</span>
              <span>Real-time Order Dispatch & Driver Allocation</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-dark-3 dark:text-dark-6">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">✓</span>
              <span>Merchant Onboarding & Commission Automation</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-dark-3 dark:text-dark-6">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">✓</span>
              <span>Enterprise Role-Based Access & Audit Logging</span>
            </div>
          </div>

          <div className="pt-6 border-t border-stroke dark:border-stroke-dark/60 flex items-center justify-between text-xs text-dark-4 dark:text-dark-6">
            <span>Grabb Admin Suite v1.3.0</span>
            <span className="font-semibold text-primary">Built for Rhevez Team</span>
          </div>
        </div>
      </div>
    </div>
  );
}


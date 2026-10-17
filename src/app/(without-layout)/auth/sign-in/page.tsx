import Signin from "@/components/Auth/Signin";
import { AuthBrandingCard } from "@/components/Auth/AuthBrandingCard";
import { Logo } from "@/components/logo";
import type { Metadata } from "next";
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
        <AuthBrandingCard
          category="Operations & Commerce"
          title="Hyperlocal Fleet & Store Console"
          description="Live administration for daily grocery fulfillment. Track unassigned dispatch queues, verify partner stores, monitor dynamic surge zones, and settle merchant ledgers."
          highlights={[
            { text: "Real-time dispatch queue & driver assignment monitoring" },
            { text: "Direct merchant onboarding & store catalog controls" },
            { text: "Zone-based dynamic delivery fee & surge pricing triggers" },
            { text: "Automated merchant payouts & commission reconciliation" },
          ]}
          footerCategory="Quick-Commerce Operations"
        />
      </div>
    </div>
  );
}


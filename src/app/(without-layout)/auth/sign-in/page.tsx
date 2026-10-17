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
        <div className="custom-gradient-1 overflow-hidden rounded-2xl px-15 pt-12.5 dark:bg-[#122031] dark:!bg-none border border-stroke dark:border-stroke-dark shadow-sm">
          <Link className="mb-8 inline-flex flex-col items-start" href="/">
            <Logo width={200} height={62} showAdminBadge badgeText="Admin Panel" />
          </Link>
          <p className="mb-3 text-xl font-medium text-dark dark:text-white">
            Sign in to your account
          </p>

          <h1 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
            Welcome Back!
          </h1>

          <p className="w-full max-w-[375px] font-medium text-dark-4 dark:text-dark-6">
            Please sign in to your administrator account by completing the necessary fields below
          </p>

          <div className="mt-31">
            <Image
              src={"/images/grids/grid-02.svg"}
              alt="Grid Decoration"
              width={405}
              height={325}
              className="mx-auto dark:opacity-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


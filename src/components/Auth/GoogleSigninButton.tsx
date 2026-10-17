"use client";

import { GoogleIcon } from "@/assets/icons";
import { signIn } from "@/lib/auth/auth-client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function GoogleSigninButton({ text }: { text: string }) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const handleGoogleSignIn = async () => {
    toast.info("Google Enterprise SSO is restricted to authorized @grabb.com domains. Please sign in using your administrator email and password.", {
      duration: 5000,
    });
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="flex w-full cursor-pointer items-center justify-center gap-3.5 rounded-lg border border-stroke bg-gray-1 p-3.75 font-medium outline-0 hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-3 dark:bg-dark-2 text-dark dark:text-white transition-colors"
    >
      <GoogleIcon />
      <span>{text} with Enterprise Google SSO</span>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/utils/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const adminData = await fetchApi("/auth/me");
        localStorage.setItem("admin", JSON.stringify(adminData));
        setLoading(false);
      } catch (err: any) {
        console.error("AuthGuard verification failed:", err);
        
        // If it's explicitly a 401 Unauthorized, log them out gracefully
        if (err.status === 401 || err.message?.toLowerCase().includes("unauthorized") || err.message?.toLowerCase().includes("invalid token")) {
          localStorage.removeItem("token");
          localStorage.removeItem("admin");
          import("sonner").then(({ toast }) => toast.info("Your session has expired. Please log in again."));
          router.push("/auth/sign-in");
        } else {
          // If it's a 404 or 500 (meaning backend endpoint missing/broken), 
          // don't delete the token, just let them in or show a warning.
          import("sonner").then(({ toast }) => toast.error(`Auth Verification Failed: ${err.message}`));
          setLoading(false); // Let them see the dashboard anyway for debugging
        }
      }
    };

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/sign-in");
    } else {
      verifyAuth();
    }
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-2 dark:bg-dark-2">Loading...</div>;
  }

  return <>{children}</>;
}

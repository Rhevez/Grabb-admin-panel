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
        
        // Clear stored session on any authorization or token error
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        
        const isAuthError =
          err.status === 401 ||
          err.status === 403 ||
          err.message?.toLowerCase().includes("unauthorized") ||
          err.message?.toLowerCase().includes("forbidden") ||
          err.message?.toLowerCase().includes("permission") ||
          err.message?.toLowerCase().includes("invalid token");

        import("sonner").then(({ toast }) => {
          if (isAuthError) {
            toast.info("Your session has expired or is unauthorized. Please log in again.");
          } else {
            toast.error(`Session verification failed: ${err.message}`);
          }
        });
        
        router.push("/auth/sign-in");
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

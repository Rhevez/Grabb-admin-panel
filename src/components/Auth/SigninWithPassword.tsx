"use client";

import { EmailIcon } from "@/assets/icons";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import InputGroup from "../FormElements/InputGroup";
import { Checkbox } from "../FormElements/checkbox";

export default function SigninWithPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("");

  // Load remembered admin email on mount
  React.useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("remembered_admin_email");
      if (savedEmail) {
        setData((prev) => ({ ...prev, email: savedEmail, remember: true }));
      }
    } catch (e) {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleFillDemo = () => {
    setData({
      email: "admin@graabb.com",
      password: "admin123",
      remember: true,
    });
    setError("");
    toast.info("Demo administrator credentials populated!");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!data.email.trim() || !data.password) {
      toast.error("Please enter both email and password.");
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    setLoadingStatus("Authenticating credentials...");
    setError("");

    try {
      const { fetchApi } = await import("@/utils/api");
      const response = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: data.email.trim(), password: data.password }),
      });

      const token = response.token || response.access_token || response.data?.token;
      const adminObj = response.admin || response.user || response.data?.admin || response;

      if (token) {
        setLoadingStatus("Verifying permissions...");
        localStorage.setItem("token", token);
        localStorage.setItem("admin", JSON.stringify(adminObj));
        
        // Persist or clear remembered email
        if (data.remember) {
          localStorage.setItem("remembered_admin_email", data.email.trim());
        } else {
          localStorage.removeItem("remembered_admin_email");
        }

        // Ensure token cookie is set for Next.js SSR / route guards
        document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;

        // Standard Sonner success feedback
        toast.success("Authentication successful! Welcome to Grabb Admin.");

        // Brief 300ms transition for smooth UX
        await new Promise((resolve) => setTimeout(resolve, 350));
        setLoadingStatus("Redirecting to Dashboard...");

        const callbackURL = searchParams.get("callbackUrl") || "/";
        router.push(callbackURL);
      } else {
        setLoading(false);
        toast.error("Login succeeded but no access token received.");
        console.error("Login response:", response);
      }
    } catch (err: any) {
      setLoading(false);
      const errMsg = err?.data?.detail || err?.data?.error || err.message || "Failed to sign in";
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div className="relative">
      {/* Modern Interactive Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-white/85 backdrop-blur-md dark:bg-gray-dark/85 shadow-2xl transition-all">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute h-full w-full animate-[spin_1.5s_linear_infinite] rounded-full border-4 border-dashed border-primary/50"></div>
            <div className="absolute h-10 w-10 animate-pulse rounded-full bg-primary/80 shadow-[0_0_20px_rgba(87,80,241,0.6)]"></div>
          </div>
          <h3 className="mt-5 text-base font-bold text-dark dark:text-white">
            {loadingStatus}
          </h3>
          <p className="mt-1.5 text-xs font-medium text-dark-4 dark:text-dark-6">
            Connecting to Grabb Admin Gateway...
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={loading ? "opacity-30 blur-sm pointer-events-none transition-all" : "transition-all"}>
        <InputGroup
          type="email"
          label="Email Address"
          className="mb-4 [&_input]:py-3.75"
          placeholder="admin@grabb.com"
          name="email"
          handleChange={handleChange}
          value={data.email}
          required
          icon={<EmailIcon />}
        />

        <div className="relative mb-5">
          <InputGroup
            type={showPassword ? "text" : "password"}
            label="Password"
            className="[&_input]:py-3.75 [&_input]:pr-12"
            placeholder="Enter password"
            name="password"
            handleChange={handleChange}
            value={data.password}
            required
            icon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            }
          />
        </div>

        <div className="mb-6 flex items-center justify-between gap-2 py-1 font-medium text-xs sm:text-sm">
          <Checkbox
            label="Remember me"
            name="remember"
            withIcon="check"
            minimal
            radius="md"
            onChange={(e) =>
              setData({
                ...data,
                remember: e.target.checked,
              })
            }
          />

          <button
            type="button"
            onClick={() =>
              toast.info("To reset administrator credentials, please contact your Superadmin or devops@grabb.com.", {
                duration: 5000,
              })
            }
            className="text-xs text-dark-4 hover:text-primary outline-none focus-visible:text-primary dark:text-dark-6 dark:hover:text-primary transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        <div className="mb-4">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary py-3.5 px-4 font-semibold text-white shadow-1 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-xs text-dark-4 dark:text-dark-6 border-t border-stroke dark:border-stroke-dark">
          <span>Need demo credentials?</span>
          <button
            type="button"
            onClick={handleFillDemo}
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Quick Fill Demo Admin
          </button>
        </div>
      </form>
    </div>
  );
}


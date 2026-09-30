"use client";

import { EmailIcon, PasswordIcon } from "@/assets/icons";
import { signIn } from "@/lib/auth/auth-client";
import Link from "next/link";
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loadingStatus, setLoadingStatus] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStatus("Authenticating credentials...");
    setError("");

    try {
      const { fetchApi } = await import("@/utils/api");
      const response = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const token = response.token || response.access_token || response.data?.token;
      const adminObj = response.admin || response.user || response.data?.admin || response;

      if (token) {
        setLoadingStatus("Verifying permissions...");
        localStorage.setItem("token", token);
        localStorage.setItem("admin", JSON.stringify(adminObj));
        
        // Artificial delay for modern onboarding feel
        await new Promise((resolve) => setTimeout(resolve, 800));
        setLoadingStatus("Redirecting to Dashboard...");
        await new Promise((resolve) => setTimeout(resolve, 600));

        const callbackURL = searchParams.get("callbackUrl") || "/";
        router.push(callbackURL);
      } else {
        setLoading(false);
        toast.error("Login succeeded but no token received in response.");
        console.error("Login response:", response);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to sign in");
      toast.error(err.message || "Failed to sign in");
    }
  };

  return (
    <div className="relative">
      {/* Modern Interactive Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-md dark:bg-gray-dark/80">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute h-full w-full animate-[spin_2s_linear_infinite] rounded-full border-4 border-dashed border-primary/40"></div>
            <div className="absolute h-10 w-10 animate-pulse rounded-full bg-primary/80 shadow-[0_0_15px_rgba(var(--color-primary),0.5)]"></div>
          </div>
          <h3 className="mt-6 text-lg font-bold text-dark dark:text-white animate-pulse">
            {loadingStatus}
          </h3>
          <p className="mt-2 text-xs font-medium text-dark-4 dark:text-dark-6">
            Please wait securely connecting...
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={loading ? "opacity-30 blur-sm pointer-events-none transition-all" : "transition-all"}>
        <InputGroup
          type="email"
          label="Email"
          className="mb-4 [&_input]:py-3.75"
          placeholder="Enter your email"
          name="email"
          handleChange={handleChange}
          value={data.email}
          icon={<EmailIcon />}
        />

        <InputGroup
          type="password"
          label="Password"
          className="mb-5 [&_input]:py-3.75"
          placeholder="Enter your password"
          name="password"
          handleChange={handleChange}
          value={data.password}
          icon={<PasswordIcon />}
        />

        <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
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

          <Link
            href="/"
            className="ring-primary outline-0 hover:text-primary focus-visible:text-primary focus-visible:ring dark:text-white dark:hover:text-primary"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="mb-4.5">
          <button
            type="submit"
            disabled={loading}
            className="hover:bg-opacity-90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            Sign In
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>
    </div>
  );
}

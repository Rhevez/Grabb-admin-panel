import Link from "next/link";
import { Suspense } from "react";
import GoogleSigninButton from "../GoogleSigninButton";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleSigninButton text="Sign in" />

      <div className="my-6 flex items-center justify-center">
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
        <div className="block w-full min-w-fit bg-white px-3 text-center font-medium dark:bg-gray-dark">
          Or sign in with email
        </div>
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
      </div>

      <div>
        <SigninWithPassword />
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-dark-4 dark:text-dark-6">
          Need administrator credentials?{" "}
          <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline transition-colors">
            Request Access
          </Link>
        </p>
      </div>
    </Suspense>
  );
}

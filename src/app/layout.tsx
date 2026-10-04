import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Grabb Admin Panel",
    default: "Grabb Admin Panel - Built By Rhevez Team",
  },
  description:
    "Grabb client administration and fleet management portal. Designed and built by Rhevez Team.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />

          {children}

          <Toaster
            position="top-center"
            richColors
            closeButton
            duration={4000}
            toastOptions={{
              className: "dark:bg-gray-dark dark:border-stroke-dark dark:text-white shadow-2xl rounded-2xl border font-medium text-sm py-3 px-4",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

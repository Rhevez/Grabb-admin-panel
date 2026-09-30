import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { type PropsWithChildren } from "react";
import { AuthGuard } from "@/components/Auth/AuthGuard";

export default function WithLayout({ children }: PropsWithChildren) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#1C2434] dark:bg-[#0a0a0a]">
        <Sidebar />

        <div className="flex flex-1 flex-col min-w-0 p-3 pl-0 lg:p-4 lg:pl-0">
          <div className="flex flex-1 flex-col min-w-0 rounded-2xl bg-gray-2 dark:bg-[#161f30] overflow-hidden">
            <Header />

            <main className="isolate mx-auto w-full max-w-(--breakpoint-2xl) flex-1 overflow-y-auto p-4 md:p-6 2xl:p-10">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

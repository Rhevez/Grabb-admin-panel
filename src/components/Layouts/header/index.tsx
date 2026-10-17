"use client";

import { SearchIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const pathname = usePathname();
  const isDashboard = pathname === "/";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-transparent px-4 py-6 md:px-5 2xl:px-10">
      <div className="flex items-center gap-4">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="dark:border-stroke-dark rounded-lg border px-1.5 py-1 dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A]"
          >
            <MenuIcon />
            <span className="sr-only">Toggle Sidebar</span>
          </button>
        )}

        {isMobile && (
          <Link href={"/"} className="max-[430px]:hidden flex items-center gap-1.5">
            <div className="relative h-8 w-24">
              <Image
                src="/images/file_0000000075c881f88071932eaa9e6bb8.png"
                fill
                sizes="96px"
                className="object-contain"
                alt="Grabb"
                priority
              />
            </div>
            <span className="text-[9px] font-bold tracking-widest text-[#f59e0b] uppercase">
              Admin
            </span>
          </Link>
        )}

        {isDashboard && (
          <div>
            <p className="text-sm font-medium text-dark-4 dark:text-dark-6 mb-1">
              Welcome back
            </p>
            <h1 className="text-heading-6 text-dark font-bold dark:text-white sm:text-heading-5">
              Admin User
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 2xsm:gap-6">
        <div className="relative hidden sm:block">
          <input
            type="search"
            placeholder="Search here..."
            className="bg-gray-2 focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 flex w-60 items-center gap-3.5 rounded-full border-none py-3 pr-5 pl-11 transition-colors outline-none text-sm"
          />
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 size-4 text-dark-4 dark:text-dark-6" />
        </div>

        <Notification />
        
        <UserInfo />
      </div>
    </header>
  );
}

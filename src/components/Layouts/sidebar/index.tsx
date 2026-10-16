"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

import { ThemeToggleSwitch } from "../header/theme-toggle";

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isCollapsed = !isMobile && !isOpen;

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
  };

  useEffect(() => {
    NAV_DATA.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          if (subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }
            return true;
          }
        });
      });
    });
  }, [pathname]);

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex-shrink-0 overflow-hidden bg-transparent transition-[width] duration-300 ease-in-out",
          isMobile ? "fixed bottom-0 top-0 z-50 w-[290px] bg-[#1C2434] dark:bg-[#0a0a0a]" : "sticky top-0 h-screen",
          isCollapsed ? "w-[80px]" : "w-[250px]",
          isMobile && !isOpen && "w-0"
        )}
        aria-label="Main navigation"
        aria-hidden={isMobile && !isOpen}
        inert={isMobile && !isOpen ? true : undefined}
      >
        <div className="flex h-full flex-col py-6 px-4">
          <div className="relative flex items-center justify-between pr-2">
            {!isCollapsed && (
              <Link
                href={"/"}
                onClick={() => isMobile && toggleSidebar()}
                className="flex flex-col items-center gap-1 px-0 py-2.5 min-[850px]:py-0 w-[180px]"
              >
                <Logo />
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#f59e0b] uppercase select-none opacity-90 text-center w-full">
                  Admin
                </span>
              </Link>
            )}

            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className={cn(
                  "flex items-center justify-center rounded-lg p-1.5 hover:bg-white/10 text-gray-400 hover:text-white transition",
                  isCollapsed && "w-full"
                )}
              >
                <div className={cn("transition-transform duration-300", isCollapsed && "rotate-180")}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </div>
              </button>
            )}

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-0 top-1/2 -translate-y-1/2 text-right"
              >
                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-1">


            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-6">
                {!isCollapsed && (
                  <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {section.label}
                  </h2>
                )}

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {item.items.length ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(({ url }) => url === pathname)}
                              onClick={() => {
                                if (isCollapsed) setIsOpen(true);
                                toggleExpanded(item.title);
                              }}
                            >
                              <item.icon className="size-6 shrink-0" aria-hidden="true" />
                              {!isCollapsed && <span>{item.title}</span>}
                              {"badge" in item && Boolean(item.badge) && !isCollapsed && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold uppercase tracking-wider">
                                  {String(item.badge)}
                                </span>
                              )}
                              {!isCollapsed && (
                                <ChevronUp
                                  className={cn(
                                    "ml-auto rotate-180 transition-transform duration-200",
                                    expandedItems.includes(item.title) && "rotate-0"
                                  )}
                                  aria-hidden="true"
                                />
                              )}
                            </MenuItem>

                            {!isCollapsed && expandedItems.includes(item.title) && (
                              <ul className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2" role="menu">
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItem as="link" href={subItem.url} isActive={pathname === subItem.url}>
                                      <span className="flex items-center justify-between w-full">
                                        <span>{subItem.title}</span>
                                        {"badge" in subItem && Boolean(subItem.badge) && (
                                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold uppercase tracking-wider">
                                            {String(subItem.badge)}
                                          </span>
                                        )}
                                      </span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href = "url" in item ? item.url + "" : "/" + item.title.toLowerCase().split(" ").join("-");
                            return (
                              <MenuItem className="flex items-center gap-3 py-3" as="link" href={href} isActive={pathname === href}>
                                <item.icon className="size-6 shrink-0" aria-hidden="true" />
                                {!isCollapsed && (
                                  <span className="flex items-center justify-between flex-1">
                                    <span>{item.title}</span>
                                    {"badge" in item && Boolean(item.badge) && (
                                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold uppercase tracking-wider">
                                        {String(item.badge)}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}

            <div className="mb-6">
              {!isCollapsed && (
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Settings
                </h2>
              )}
              <div className={cn("flex flex-col gap-4", isCollapsed && "items-center")}>
                {!isCollapsed ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Theme</span>
                    <ThemeToggleSwitch />
                  </div>
                ) : (
                  <ThemeToggleSwitch isCollapsed />
                )}
              </div>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
}

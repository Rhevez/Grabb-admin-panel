"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ActionItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "primary";
}

interface TableActionsDropdownProps {
  actions: ActionItem[];
  className?: string;
}

export function TableActionsDropdown({ actions, className }: TableActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        aria-label="Row actions menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex size-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-lg border border-stroke bg-white py-1 shadow-lg outline-none dark:border-stroke-dark dark:bg-[#1b2536] dark:shadow-card"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-0.5">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  action.onClick();
                }}
                className={cn(
                  "w-full px-4 py-2 text-left text-xs font-semibold transition-colors duration-100 hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer",
                  action.variant === "danger"
                    ? "text-rose-500 hover:text-rose-600"
                    : action.variant === "primary"
                    ? "text-primary hover:text-primary-dark"
                    : "text-dark dark:text-gray-200"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


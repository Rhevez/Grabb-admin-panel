"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { BellIcon } from "./icons";

export interface OperationalNotification {
  id: string;
  type: "ORDER" | "SHOP" | "AUDIT" | "SUPPORT";
  title: string;
  subtitle: string;
  time: string;
  timestamp: number;
  url: string;
  priority?: "high" | "medium" | "low";
}

function OrderIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2"/><path d="M17 7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2"/><path d="M12 7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2"/><path d="M7 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2"/>
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

function CheckAllIcon() {
  return (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>
    </svg>
  );
}

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<OperationalNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  // Load persisted read IDs on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("grabb_read_notifications");
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch {
      // Ignore read error
    }
  }, []);

  const fetchOperationalAlerts = useCallback(async () => {
    try {
      const { fetchApi } = await import("@/utils/api");

      const [unassignedRes, pendingShopsRes, auditRes] = await Promise.allSettled([
        fetchApi("/orders/unassigned"),
        fetchApi("/vendor/shops/pending"),
        fetchApi("/system/audit-logs"),
      ]);

      const items: OperationalNotification[] = [];

      // 1. Process Unassigned Orders Queue
      if (unassignedRes.status === "fulfilled") {
        const res = unassignedRes.value;
        const list = Array.isArray(res) ? res : res?.data || res?.results || [];
        list.slice(0, 3).forEach((o: any, idx: number) => {
          const id = String(o.id || `ORD-${idx + 1}`);
          items.push({
            id: `order-unassigned-${id}`,
            type: "ORDER",
            title: `Unassigned Order #${id}`,
            subtitle: `${o.shopName || o.shop_name || "Partner Shop"} · ${o.amount ? (String(o.amount).startsWith("₹") ? o.amount : `₹${o.amount}`) : "Pending Driver"}`,
            time: o.waitTime || "Awaiting Driver",
            timestamp: Date.now() - (idx + 1) * 300000,
            url: "/orders/unassigned",
            priority: "high",
          });
        });
      }

      // 2. Process Pending Shop Onboarding Requests
      if (pendingShopsRes.status === "fulfilled") {
        const res = pendingShopsRes.value;
        const list = Array.isArray(res) ? res : res?.data || res?.results || [];
        list.slice(0, 3).forEach((s: any, idx: number) => {
          const id = String(s.id || idx);
          items.push({
            id: `shop-pending-${id}`,
            type: "SHOP",
            title: "New Shop Approval Required",
            subtitle: `${s.name || "New Partner"} (${s.ownerName || s.owner_name || "Owner"})`,
            time: s.submittedDate || "Awaiting Review",
            timestamp: Date.now() - (idx + 2) * 600000,
            url: "/shops/onboarding",
            priority: "medium",
          });
        });
      }

      // 3. Process System Audit Logs
      if (auditRes.status === "fulfilled") {
        const res = auditRes.value;
        const list = Array.isArray(res) ? res : res?.data?.results || res?.results || res?.data || [];
        list.slice(0, 4).forEach((l: any, idx: number) => {
          const id = String(l.id || idx);
          const createdTime = l.created_at
            ? new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Logged";
          items.push({
            id: `audit-${id}`,
            type: "AUDIT",
            title: `${l.action || "Admin Event"} on ${l.resource || "System"}`,
            subtitle: `By ${l.admin_email || "Administrator"}`,
            time: createdTime,
            timestamp: l.created_at ? new Date(l.created_at).getTime() : Date.now() - (idx + 3) * 900000,
            url: "/settings/audit-log",
            priority: "low",
          });
        });
      }

      // Sort chronological descending
      items.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(items);
    } catch (err) {
      console.error("Failed to load operational notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperationalAlerts();
    // Poll updates every 60 seconds
    const interval = setInterval(fetchOperationalAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchOperationalAlerts]);

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem("grabb_read_notifications", JSON.stringify(updated));
    } catch {
      // Ignore write error
    }
    toast.success("All notifications marked as read");
  };

  const markItemAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem("grabb_read_notifications", JSON.stringify(updated));
      } catch {
        // Ignore write error
      }
    }
    setIsOpen(false);
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger
        className="grid size-12 cursor-pointer place-items-center rounded-full border border-stroke bg-gray-2 text-dark outline-none transition-colors hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
        aria-label="View Operational Notifications"
      >
        <span className="relative">
          <BellIcon />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 z-1 flex size-2.5 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-dark-2" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white p-4 shadow-xl min-[350px]:min-w-[22rem] sm:min-w-[24rem] rounded-2xl dark:border-dark-3 dark:bg-gray-dark"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between pb-2 border-b border-stroke dark:border-dark-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-dark dark:text-white">
              Operational Alerts
            </span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20">
                {unreadCount} new
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                All read
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs font-medium text-dark-4 hover:text-primary transition-colors dark:text-dark-6 dark:hover:text-white cursor-pointer"
              title="Mark all as read"
            >
              <CheckAllIcon />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-88 space-y-1.5 overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-2 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl animate-pulse bg-gray-2/50 dark:bg-dark-2/50">
                  <div className="size-9 rounded-lg bg-gray-3 dark:bg-dark-3 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 bg-gray-3 dark:bg-dark-3 rounded" />
                    <div className="h-2.5 w-1/2 bg-gray-3 dark:bg-dark-3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <div className="size-12 rounded-full bg-gray-2 dark:bg-dark-2 mx-auto flex items-center justify-center text-dark-4 dark:text-dark-6 mb-2">
                <BellIcon />
              </div>
              <p className="text-sm font-semibold text-dark dark:text-white">All Caught Up</p>
              <p className="text-xs text-dark-4 dark:text-dark-6 mt-1">
                No unassigned orders or pending approvals require your attention.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = !readIds.includes(item.id);

              return (
                <Link
                  key={item.id}
                  href={item.url}
                  onClick={() => markItemAsRead(item.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl p-2.5 transition-all outline-none",
                    isUnread
                      ? "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15"
                      : "hover:bg-gray-2 dark:hover:bg-dark-3/60 opacity-80 hover:opacity-100",
                  )}
                >
                  {/* Badge Icon */}
                  <div
                    className={cn(
                      "size-9 shrink-0 rounded-lg flex items-center justify-center mt-0.5",
                      item.type === "ORDER" && "bg-amber-500/15 text-amber-500",
                      item.type === "SHOP" && "bg-primary/15 text-primary",
                      item.type === "AUDIT" && "bg-emerald-500/15 text-emerald-500",
                      item.type === "SUPPORT" && "bg-rose-500/15 text-rose-500",
                    )}
                  >
                    {item.type === "ORDER" && <OrderIcon />}
                    {item.type === "SHOP" && <ShopIcon />}
                    {item.type === "AUDIT" && <AuditIcon />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <strong className="truncate text-xs font-semibold text-dark dark:text-white">
                        {item.title}
                      </strong>
                      <span className="text-[10px] whitespace-nowrap text-dark-4 dark:text-dark-6 shrink-0">
                        {item.time}
                      </span>
                    </div>

                    <p className="truncate text-xs text-dark-4 dark:text-dark-6">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Unread indicator dot */}
                  {isUnread && (
                    <span className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-stroke dark:border-dark-3 flex items-center justify-between">
          <Link
            href="/orders/unassigned"
            onClick={() => setIsOpen(false)}
            className="text-xs font-semibold text-primary hover:underline transition-colors"
          >
            Unassigned Queue &rarr;
          </Link>
          <Link
            href="/settings/audit-log"
            onClick={() => setIsOpen(false)}
            className="text-xs font-medium text-dark-4 dark:text-dark-6 hover:text-dark dark:hover:text-white transition-colors"
          >
            System Audit Log
          </Link>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

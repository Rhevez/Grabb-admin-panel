"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BellIcon } from "./icons";

interface NotificationItem {
  image: string;
  title: string;
  subTitle: string;
  href: string;
}

const defaultOperationalNotifications: NotificationItem[] = [
  {
    image: "/images/user/user-15.png",
    title: "Unassigned Order #ORD-94820",
    subTitle: "Urban Organic Mart · ₹28.00",
    href: "/orders/unassigned",
  },
  {
    image: "/images/user/user-03.png",
    title: "New Shop Approval Required",
    subTitle: "Healthy Harvest Organics (Anita Roy)",
    href: "/shops/onboarding",
  },
  {
    image: "/images/user/user-26.png",
    title: "Vendor Payout Settled",
    subTitle: "Weekly vendor payout completed",
    href: "/finance/payouts",
  },
  {
    image: "/images/user/user-28.png",
    title: "Driver Rajesh Assigned",
    subTitle: "Delivery partner active in Koramangala",
    href: "/delivery-partners",
  },
  {
    image: "/images/user/user-27.png",
    title: "Customer Review Added",
    subTitle: "5-star rating for Daily Fresh Mart",
    href: "/reviews",
  },
];

const avatarImages = [
  "/images/user/user-15.png",
  "/images/user/user-03.png",
  "/images/user/user-26.png",
  "/images/user/user-28.png",
  "/images/user/user-27.png",
  "/images/user/user-16.png",
  "/images/user/user-17.png",
];

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDotVisible, setIsDotVisible] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    defaultOperationalNotifications,
  );

  useEffect(() => {
    const fetchLiveAlerts = async () => {
      try {
        const { fetchApi } = await import("@/utils/api");

        const [unassignedRes, pendingShopsRes, auditRes] =
          await Promise.allSettled([
            fetchApi("/orders/unassigned"),
            fetchApi("/vendor/shops/pending"),
            fetchApi("/system/audit-logs"),
          ]);

        const liveItems: NotificationItem[] = [];

        // 1. Live Unassigned Orders
        if (unassignedRes.status === "fulfilled") {
          const res = unassignedRes.value;
          const list = Array.isArray(res)
            ? res
            : res?.data || res?.results || [];
          list.slice(0, 3).forEach((o: any, idx: number) => {
            const id = o.id || `ORD-${idx + 1}`;
            const amount = o.amount
              ? String(o.amount).startsWith("₹")
                ? o.amount
                : `₹${o.amount}`
              : "Pending Driver";
            liveItems.push({
              image: avatarImages[idx % avatarImages.length],
              title: `Unassigned Order #${id}`,
              subTitle: `${o.shopName || o.shop_name || "Partner Shop"} · ${amount}`,
              href: "/orders/unassigned",
            });
          });
        }

        // 2. Live Pending Shop Onboardings
        if (pendingShopsRes.status === "fulfilled") {
          const res = pendingShopsRes.value;
          const list = Array.isArray(res)
            ? res
            : res?.data || res?.results || [];
          list.slice(0, 2).forEach((s: any, idx: number) => {
            liveItems.push({
              image: avatarImages[(idx + 2) % avatarImages.length],
              title: "New Shop Approval Required",
              subTitle: `${s.name || "New Partner"} (${s.ownerName || s.owner_name || "Owner"})`,
              href: "/shops/onboarding",
            });
          });
        }

        // 3. Live System Audit Logs
        if (auditRes.status === "fulfilled") {
          const res = auditRes.value;
          const list = Array.isArray(res)
            ? res
            : res?.data?.results || res?.results || res?.data || [];
          list.slice(0, 3).forEach((l: any, idx: number) => {
            liveItems.push({
              image: avatarImages[(idx + 4) % avatarImages.length],
              title: `${l.action || "Admin Action"} on ${l.resource || "System"}`,
              subTitle: `By ${l.admin_email || "System Administrator"}`,
              href: "/settings/audit-log",
            });
          });
        }

        if (liveItems.length > 0) {
          setNotifications(liveItems);
        }
      } catch (err) {
        console.error("Failed to load live operational alerts:", err);
      }
    };

    fetchLiveAlerts();
    const interval = setInterval(fetchLiveAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);

        if (setIsDotVisible) setIsDotVisible(false);
      }}
    >
      <DropdownTrigger
        className="grid size-12 cursor-pointer place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />

          {isDotVisible && (
            <span
              className={cn(
                "absolute top-0 right-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align="end"
        className="border border-stroke bg-white px-3.5 py-3 shadow-md min-[350px]:min-w-[20rem] dark:border-dark-3 dark:bg-gray-dark"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-dark dark:text-white">
            Notifications
          </span>
          <span className="rounded-md bg-primary px-2.25 py-0.5 text-xs font-medium text-white">
            {notifications.length} new
          </span>
        </div>

        <ul className="mb-3 max-h-92 space-y-1.5 overflow-y-auto">
          {notifications.map((item, index) => (
            <li key={index} role="menuitem">
              <Link
                href={item.href || "#"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 rounded-lg px-2 py-1.5 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3"
              >
                <Image
                  src={item.image}
                  className="size-14 rounded-full object-cover shrink-0"
                  width={200}
                  height={200}
                  alt="User"
                />

                <div className="min-w-0 flex-1">
                  <strong className="block text-sm font-medium text-dark dark:text-white truncate">
                    {item.title}
                  </strong>

                  <span className="truncate text-sm font-medium text-dark-5 dark:text-dark-6 block">
                    {item.subTitle}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/orders/unassigned"
          onClick={() => setIsOpen(false)}
          className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary transition-colors outline-none hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
        >
          See all notifications
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}

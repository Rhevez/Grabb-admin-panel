"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OverviewCard } from "./card";
import * as icons from "./icons";

interface MetricsData {
  monthlyRev: string;
  monthlyRevGrowth: number;
  activeShops: string;
  activeShopsGrowth: number;
  pendingShops: string;
  pendingShopsGrowth: number;
  activeDrivers: string;
  activeDriversGrowth: number;
  unassignedOrders: string;
  unassignedOrdersGrowth: number;
  openTickets: string;
  openTicketsGrowth: number;
}

const DEFAULT_METRICS: MetricsData = {
  monthlyRev: "₹14,250",
  monthlyRevGrowth: 14.2,
  activeShops: "185",
  activeShopsGrowth: 8.5,
  pendingShops: "14",
  pendingShopsGrowth: -2.4,
  activeDrivers: "42/50",
  activeDriversGrowth: 5.0,
  unassignedOrders: "8",
  unassignedOrdersGrowth: -15.0,
  openTickets: "5",
  openTicketsGrowth: -10.0,
};

export function OverviewCardsGroup() {
  const [metrics, setMetrics] = useState<MetricsData>(DEFAULT_METRICS);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const { fetchApi } = await import("@/utils/api");
        const res = await fetchApi("/analytics/dashboard-summary");
        const data = res?.data || res;
        if (data && typeof data === "object") {
          setMetrics((prev) => ({
            ...prev,
            monthlyRev: data.monthlySubscriptionRev || data.monthly_revenue || prev.monthlyRev,
            monthlyRevGrowth: typeof data.monthlySubscriptionRevGrowth === "number" ? data.monthlySubscriptionRevGrowth : prev.monthlyRevGrowth,
            activeShops: data.activePremiumShops !== undefined ? String(data.activePremiumShops) : prev.activeShops,
            pendingShops: data.pendingShops !== undefined ? String(data.pendingShops) : prev.pendingShops,
            activeDrivers: data.activeDeliveryDrivers || prev.activeDrivers,
            unassignedOrders: data.unassignedOrders !== undefined ? String(data.unassignedOrders) : prev.unassignedOrders,
            openTickets: data.openSupportTickets !== undefined ? String(data.openSupportTickets) : prev.openTickets,
          }));
        }
      } catch (err: any) {
        if (err?.status !== 404) console.error("Failed to load dashboard overview summary:", err);
      }
    }
    loadMetrics();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:gap-6 2xl:gap-7.5">
      <OverviewCard
        label="Monthly Subscription Rev"
        data={{
          value: metrics.monthlyRev,
          growthRate: metrics.monthlyRevGrowth,
        }}
        Icon={icons.Profit}
      />

      <Link href="/subscriptions/active" className="block transition-transform hover:scale-[1.02]">
        <OverviewCard
          label="Active Premium Shops"
          data={{
            value: metrics.activeShops,
            growthRate: metrics.activeShopsGrowth,
          }}
          Icon={icons.Views}
        />
      </Link>

      <Link href="/shops/onboarding" className="block transition-transform hover:scale-[1.02]">
        <OverviewCard
          label="Pending Shops"
          data={{
            value: metrics.pendingShops,
            growthRate: metrics.pendingShopsGrowth,
          }}
          Icon={icons.Product}
        />
      </Link>

      <Link href="/delivery-partners" className="block transition-transform hover:scale-[1.02]">
        <OverviewCard
          label="Active Delivery Drivers"
          data={{
            value: metrics.activeDrivers,
            growthRate: metrics.activeDriversGrowth,
          }}
          Icon={icons.Users}
        />
      </Link>

      <Link href="/orders/unassigned" className="block transition-transform hover:scale-[1.02]">
        <OverviewCard
          label="Unassigned Orders"
          data={{
            value: metrics.unassignedOrders,
            growthRate: metrics.unassignedOrdersGrowth,
          }}
          Icon={icons.Product}
        />
      </Link>

      <Link href="/support" className="block transition-transform hover:scale-[1.02]">
        <OverviewCard
          label="Open Support Tickets"
          data={{
            value: metrics.openTickets,
            growthRate: metrics.openTicketsGrowth,
          }}
          Icon={icons.Users}
        />
      </Link>
    </div>
  );
}

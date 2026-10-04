"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OverviewCard } from "./card";
import * as icons from "./icons";
import { OverviewCardsSkeleton } from "./skeleton";

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

export function OverviewCardsGroup() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const { fetchApi } = await import("@/utils/api");
        const res = await fetchApi("/analytics/dashboard-summary");
        const data = res?.data || res;
        if (data && typeof data === "object") {
          setMetrics({
            monthlyRev: data.monthlySubscriptionRev || (typeof data.monthly_revenue === "number" ? `₹${data.monthly_revenue.toLocaleString()}` : "₹0"),
            monthlyRevGrowth: typeof data.monthlySubscriptionRevGrowth === "number" ? data.monthlySubscriptionRevGrowth : 0,
            activeShops: String(data.activePremiumShops ?? data.active_shops ?? 0),
            activeShopsGrowth: typeof data.activePremiumShopsGrowth === "number" ? data.activePremiumShopsGrowth : 0,
            pendingShops: String(data.pendingShops ?? 0),
            pendingShopsGrowth: typeof data.pendingShopsGrowth === "number" ? data.pendingShopsGrowth : 0,
            activeDrivers: data.activeDeliveryDrivers || "0/0",
            activeDriversGrowth: typeof data.activeDeliveryDriversGrowth === "number" ? data.activeDeliveryDriversGrowth : 0,
            unassignedOrders: String(data.unassignedOrders ?? 0),
            unassignedOrdersGrowth: typeof data.unassignedOrdersGrowth === "number" ? data.unassignedOrdersGrowth : 0,
            openTickets: String(data.openSupportTickets ?? 0),
            openTicketsGrowth: typeof data.openSupportTicketsGrowth === "number" ? data.openSupportTicketsGrowth : 0,
          });
        }
      } catch (err: any) {
        console.error("Failed to load dashboard overview summary:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return <OverviewCardsSkeleton />;
  }

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

"use client";

import { useEffect, useState } from "react";
import { PeriodPicker } from "@/components/period-picker";
import { cn } from "@/lib/utils";
import { WeeksProfitChart } from "./chart";

type PropsType = {
  timeFrame?: string;
  className?: string;
};

export function WeeksProfit({ className, timeFrame = "this week" }: PropsType) {
  const [profitData, setProfitData] = useState<{
    sales: { x: string; y: number }[];
    revenue: { x: string; y: number }[];
  }>({
    sales: [],
    revenue: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { fetchApi } = await import("@/utils/api");
        const res = await fetchApi(`/analytics/dashboard-summary?dateRange=7d`);
        const apiData = res?.data || res;
        if (apiData && typeof apiData === "object") {
          const totalOrders = Number(apiData.total_orders || 0);
          const totalSales = Number(apiData.total_sales || 0);

          const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

          // Distribute real orders & sales to active days
          const sales = days.map((d, i) => ({
            x: d,
            y: d === "Fri" ? totalOrders : 0,
          }));

          const revenue = days.map((d, i) => ({
            x: d,
            y: d === "Fri" ? Math.round(totalSales) : 0,
          }));

          setProfitData({ sales, revenue });
        }
      } catch (err: any) {
        console.error("WeeksProfit live fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [timeFrame]);

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Profit {timeFrame || "this week"}
        </h2>

        <PeriodPicker
          items={["this week", "last week"]}
          defaultValue={timeFrame || "this week"}
          sectionKey="weeks_profit"
        />
      </div>

      <div className="min-h-[300px]">
        {loading || profitData.sales.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-dark-4 dark:text-dark-6">
            Loading real weekly metrics...
          </div>
        ) : (
          <WeeksProfitChart data={profitData} />
        )}
      </div>
    </div>
  );
}

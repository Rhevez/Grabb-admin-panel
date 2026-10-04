"use client";

import { useEffect, useState } from "react";
import { PeriodPicker } from "@/components/period-picker";
import { cn } from "@/lib/utils";
import { DonutChart } from "./chart";

type PropsType = {
  timeFrame?: string;
  className?: string;
};

export function UsedDevices({
  timeFrame = "monthly",
  className,
}: PropsType) {
  const [userData, setUserData] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { fetchApi } = await import("@/utils/api");
        const res = await fetchApi(`/analytics/dashboard-summary`);
        const apiData = res?.data || res;
        if (apiData && typeof apiData === "object") {
          const customers = Number(apiData.total_customers ?? 0);
          const vendors = Number(apiData.active_shops ?? 0);
          const driversMatch = String(apiData.activeDeliveryDrivers || "").match(/\d+/);
          const drivers = driversMatch ? parseInt(driversMatch[0]) : 0;

          setUserData([
            { name: "Customers", amount: customers },
            { name: "Vendors", amount: vendors },
            { name: "Delivery Fleet", amount: drivers },
          ]);
        }
      } catch (err: any) {
        console.error("UsedDevices live fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [timeFrame]);

  return (
    <div
      className={cn(
        "grid grid-cols-1 grid-rows-[auto_1fr] gap-9 rounded-[10px] bg-white p-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Platform User Distribution
        </h2>

        <PeriodPicker defaultValue={timeFrame} sectionKey="used_devices" />
      </div>

      <div className="grid place-items-center min-h-[260px]">
        {loading || userData.length === 0 ? (
          <div className="text-sm text-dark-4 dark:text-dark-6">Loading real platform counts...</div>
        ) : (
          <DonutChart data={userData} />
        )}
      </div>
    </div>
  );
}

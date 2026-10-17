"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { StarIcon } from "@/assets/icons";
import { downloadCSV } from "@/utils/download";
import {
  RevenueTrendChart,
  CategoryRevenueDonut,
  OrderStatusDonut,
  CustomerSegmentsBarChart,
  DeliveryZoneBarChart,
} from "./_components/analytics-charts";

type TabType = "sales" | "orders" | "delivery" | "customers" | "products";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sales");
  const [dateRange, setDateRange] = useState("30d");
  const [shop, setShop] = useState("all");
  const [compare, setCompare] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, shop]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi(`/analytics/dashboard-summary?dateRange=${dateRange}&shop=${shop}`);
      const data = res?.data || res;
      if (data && typeof data === "object") setAnalyticsData(data);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (activeTab === "sales") {
      const rows = (analyticsData?.shopSalesBreakdown || []).map((r: any) => [
        r.shop || r.name,
        String(r.orders ?? 0),
        `₹${r.revenue || r.rev || 0}`,
        `₹${r.aov || 0}`,
        r.share || r.pct || "0%",
      ]);
      downloadCSV(`sales_analytics_${dateRange}.csv`, ["Shop Name", "Total Orders", "Total Revenue", "AOV", "% of Total"], rows);
    } else if (activeTab === "delivery") {
      const rows = (analyticsData?.deliveryLeaderboard || []).map((r: any) => [
        r.driver || r.name,
        String(r.orders || r.count || 0),
        String(r.rating || "0.0"),
        r.on_time || r.onTime || "0%",
        r.earnings || "₹0",
      ]);
      downloadCSV(`delivery_partner_leaderboard_${dateRange}.csv`, ["Partner Name", "Deliveries Completed", "Rating", "On-Time %", "Earnings"], rows);
    } else if (activeTab === "customers") {
      const rows = (analyticsData?.topCustomers || []).map((r: any) => [
        r.name,
        r.phone || "",
        String(r.orders ?? 0),
        r.spent || "₹0",
        r.status || "Active",
      ]);
      downloadCSV(`top_customers_${dateRange}.csv`, ["Customer Name", "Phone", "Total Orders", "Total Spent", "Status"], rows);
    } else if (activeTab === "products") {
      const rows = (analyticsData?.top_selling_products || analyticsData?.bestSellingProducts || []).map((r: any) => [
        r.name,
        String(r.units_sold || r.units || 0),
        `₹${r.revenue || r.rev || 0}`,
      ]);
      downloadCSV(`bestselling_products_${dateRange}.csv`, ["Product Name", "Units Sold", "Revenue"], rows);
    } else {
      const rows = (analyticsData?.cancellationReasons || []).map((r: any) => [
        r.reason,
        String(r.count ?? 0),
        r.percentage || r.pct || "0%",
      ]);
      downloadCSV(`cancellation_reasons_${dateRange}.csv`, ["Cancellation Reason", "Order Count", "Percentage"], rows);
    }
    toast.success(`Exported ${activeTab} analytics as CSV!`);
  };

  const totalSales = analyticsData?.total_sales ?? 0;
  const revenueGrowth = analyticsData?.revenueGrowth || "+0.0% vs Previous Period";

  const shopSales = analyticsData?.shopSalesBreakdown || [];
  const cancellationReasons = analyticsData?.cancellationReasons || [];
  const deliveryLeaderboard = analyticsData?.deliveryLeaderboard || [];
  const topCustomers = analyticsData?.topCustomers || [];
  const topProducts = analyticsData?.top_selling_products || analyticsData?.bestSellingProducts || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Analytics & Deep Insights</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Real-time operational KPIs, revenue distributions, delivery metrics, and platform performance.
          </p>
        </div>
      </div>

      {/* Shared Filter Bar */}
      <FilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedShop={shop}
        onShopChange={setShop}
        showCompare
        isCompareOn={compare}
        onCompareChange={setCompare}
        onExport={handleExport}
      />

      {/* Tabs */}
      <div className="flex border-b border-stroke dark:border-stroke-dark overflow-x-auto">
        {(
          [
            { id: "sales", label: "Sales Analytics" },
            { id: "orders", label: "Order Analytics" },
            { id: "delivery", label: "Delivery Analytics" },
            { id: "customers", label: "Customer Analytics" },
            { id: "products", label: "Product Analytics" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap border-b-2 py-3 px-6 text-sm font-semibold transition-colors ${
              activeTab === t.id
                ? "border-primary text-primary dark:text-white"
                : "border-transparent text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Sales Analytics */}
      {activeTab === "sales" && (
        loading ? (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-7 h-[360px] animate-pulse rounded-2xl bg-white dark:bg-gray-dark border border-stroke dark:border-stroke-dark p-6 flex flex-col justify-between">
              <div className="h-6 w-48 bg-gray-2 dark:bg-dark-2 rounded" />
              <div className="h-56 bg-gray-2/60 dark:bg-dark-2/60 rounded-xl" />
            </div>
            <div className="col-span-12 xl:col-span-5 h-[360px] animate-pulse rounded-2xl bg-white dark:bg-gray-dark border border-stroke dark:border-stroke-dark p-6 flex flex-col items-center justify-center">
              <div className="size-44 rounded-full border-8 border-gray-2 dark:border-dark-2 animate-pulse" />
            </div>
            <div className="col-span-12 h-64 animate-pulse rounded-2xl bg-white dark:bg-gray-dark border border-stroke dark:border-stroke-dark p-6" />
          </div>
        ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-7 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-dark dark:text-white">Revenue Trend & Comparison</h3>
                <p className="text-xs text-dark-4 dark:text-dark-6">
                  {shop === "all" ? "Aggregated platform sales" : "Filtered shop volume"} ({dateRange})
                </p>
              </div>
              {compare && (
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  {revenueGrowth}
                </span>
              )}
            </div>
            <RevenueTrendChart dateRange={dateRange} totalSales={totalSales} isCompareOn={compare} />
          </div>

          <div className="col-span-12 xl:col-span-5 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Revenue by Category</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">Department distribution of platform sales</p>
            <CategoryRevenueDonut categories={analyticsData?.sales_by_category} />
          </div>

          <div className="col-span-12 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Shop-Wise Sales Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
                <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                  <tr>
                    <th className="p-3">Shop Name</th>
                    <th className="p-3">Total Orders</th>
                    <th className="p-3">Total Revenue</th>
                    <th className="p-3">Avg Order Value (AOV)</th>
                    <th className="p-3">% of Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                  {shopSales.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                      <td className="p-3 font-semibold">{row.shop || row.name}</td>
                      <td className="p-3">{row.orders}</td>
                      <td className="p-3 font-medium text-emerald-500">
                        {typeof row.revenue === "number" ? `₹${row.revenue.toLocaleString()}` : (row.revenue || row.rev)}
                      </td>
                      <td className="p-3">
                        {typeof row.aov === "number" ? `₹${row.aov.toFixed(2)}` : row.aov}
                      </td>
                      <td className="p-3 font-semibold">{row.share || row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* Tab 2: Order Analytics */}
      {activeTab === "orders" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Order Status Distribution</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">Fulfillment pipeline breakdown across all orders</p>
            <OrderStatusDonut ordersByStatus={analyticsData?.orders_by_status} />
          </div>

          <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Cancellation Root Causes</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">Post-order abandonment & SLA breach analysis</p>
            <div className="space-y-3 pt-2">
              {cancellationReasons.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-2 dark:bg-dark-2">
                  <span className="text-sm font-medium text-dark dark:text-white">{c.reason}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-dark-4 dark:text-dark-6">{c.count} orders</span>
                    <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      {c.percentage || c.pct}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Delivery Analytics */}
      {activeTab === "delivery" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Delivery Performance by Zone</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">Average turnaround time (mins) and SLA on-time rate (%) by hub</p>
            <DeliveryZoneBarChart performance={analyticsData?.delivery_performance} />
          </div>

          <div className="col-span-12 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Delivery Partner Leaderboard</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
                <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                  <tr>
                    <th className="p-3">Partner</th>
                    <th className="p-3">Deliveries Completed</th>
                    <th className="p-3">On-Time Rate</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                  {deliveryLeaderboard.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                      <td className="p-3 font-semibold">{row.driver || row.name}</td>
                      <td className="p-3">{row.orders || row.count}</td>
                      <td className="p-3 font-bold text-emerald-500">{row.on_time || row.onTime}</td>
                      <td className="p-3 text-amber-500 font-bold inline-flex items-center gap-1">
                        <StarIcon className="w-3.5 h-3.5 fill-current" />
                        {row.rating}
                      </td>
                      <td className="p-3 font-semibold text-primary">{row.earnings || "₹14,000"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Customer Analytics */}
      {activeTab === "customers" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-7 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Customer Segmentation & Cohorts</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">Volume vs Revenue Share by spending tier</p>
            <CustomerSegmentsBarChart segments={analyticsData?.customer_segments} />
          </div>

          <div className="col-span-12 xl:col-span-5 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Top Customers by Spend</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">Highest lifetime value accounts</p>
            <div className="space-y-3 pt-2">
              {topCustomers.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-2 dark:bg-dark-2">
                  <div>
                    <p className="text-sm font-semibold text-dark dark:text-white">{c.name}</p>
                    <p className="text-xs text-dark-4 dark:text-dark-6">{c.phone || "+91 98765 43210"} • {c.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-500">{c.spent}</span>
                    <span className="block text-[11px] font-semibold text-primary">{c.status || "Active"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Product Analytics */}
      {activeTab === "products" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Top-Selling Volume Products</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">Catalog leaders ranked by units dispatched and gross revenue</p>
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-2 dark:bg-dark-2 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-dark dark:text-white">{p.name}</p>
                      <p className="text-xs text-dark-4 dark:text-dark-6">{p.units_sold || p.units} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-500">
                      {typeof p.revenue === "number" ? `₹${p.revenue.toLocaleString()}` : (p.revenue || p.rev)}
                    </span>
                    <span className="block text-xs text-dark-4 dark:text-dark-6">Gross Sales</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

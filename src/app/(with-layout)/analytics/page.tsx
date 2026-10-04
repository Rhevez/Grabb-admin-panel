"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { StarIcon } from "@/assets/icons";
import { downloadCSV } from "@/utils/download";

type TabType = "sales" | "orders" | "delivery" | "customers" | "products";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sales");
  const [dateRange, setDateRange] = useState("7d");
  const [shop, setShop] = useState("all");
  const [compare, setCompare] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, shop]);

  const fetchAnalytics = async () => {
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
      const rows = (analyticsData?.shopSalesBreakdown || [
        { name: "Green Grocery Fresh", orders: 480, rev: "₹14,200", aov: "₹29.58", pct: "42%" },
        { name: "Urban Organic Mart", orders: 320, rev: "₹10,800", aov: "₹33.75", pct: "32%" },
        { name: "Daily Needs Superstore", orders: 210, rev: "₹8,600", aov: "₹40.95", pct: "26%" },
      ]).map((r: any) => [r.name, String(r.orders), r.rev, r.aov, r.pct]);
      downloadCSV(`sales_analytics_${dateRange}.csv`, ["Shop Name", "Total Orders", "Total Revenue", "AOV", "% of Total"], rows);
    } else if (activeTab === "delivery") {
      const rows = (analyticsData?.deliveryLeaderboard || [
        { name: "Rahul Sharma", count: 184, avg: "22 mins", onTime: "98.5%", rating: "4.9" },
        { name: "Vikram Singh", count: 162, avg: "24 mins", onTime: "96.2%", rating: "4.8" },
        { name: "Amit Patel", count: 145, avg: "26 mins", onTime: "94.0%", rating: "4.7" },
      ]).map((r: any) => [r.name, String(r.count), r.avg, r.onTime, r.rating]);
      downloadCSV(`delivery_partner_leaderboard_${dateRange}.csv`, ["Partner Name", "Deliveries Completed", "Avg Time", "On-Time %", "Rating"], rows);
    } else if (activeTab === "customers") {
      const rows = (analyticsData?.topCustomers || [
        { name: "Priya Sharma", orders: 28, spent: "₹1,240.00" },
        { name: "Rajesh Kumar", orders: 22, spent: "₹980.50" },
        { name: "Ananya Roy", orders: 19, spent: "₹890.00" },
      ]).map((r: any) => [r.name, String(r.orders), r.spent]);
      downloadCSV(`top_customers_${dateRange}.csv`, ["Customer Name", "Total Orders", "Total Spent"], rows);
    } else if (activeTab === "products") {
      const rows = (analyticsData?.bestSellingProducts || [
        { name: "Fresh Organic Milk (1L)", shop: "Green Grocery", units: 1420, rev: "₹4,260.00" },
        { name: "Farm Fresh Eggs (12 pk)", shop: "Urban Organic Mart", units: 980, rev: "₹3,430.00" },
        { name: "Whole Wheat Bread", shop: "Daily Needs", units: 850, rev: "₹2,125.00" },
      ]).map((r: any) => [r.name, r.shop, String(r.units), r.rev]);
      downloadCSV(`bestselling_products_${dateRange}.csv`, ["Product Name", "Shop", "Units Sold", "Revenue"], rows);
    } else {
      const rows = (analyticsData?.cancellationReasons || [
        { reason: "Customer changed mind", count: 42, pct: "40%" },
        { reason: "Delivery delay / SLA breach", count: 31, pct: "30%" },
        { reason: "Item out of stock", count: 18, pct: "18%" },
        { reason: "Wrong item ordered", count: 12, pct: "12%" },
      ]).map((r: any) => [r.reason, String(r.count), r.pct]);
      downloadCSV(`cancellation_reasons_${dateRange}.csv`, ["Cancellation Reason", "Order Count", "Percentage"], rows);
    }
    toast.success(`Exported ${activeTab} analytics as CSV!`);
  };

  const shopSales = analyticsData?.shopSalesBreakdown || analyticsData?.shop_sales || [
    { name: "Green Grocery Fresh", orders: 480, rev: "₹14,200", aov: "₹29.58", pct: "42%" },
    { name: "Urban Organic Mart", orders: 320, rev: "₹10,800", aov: "₹33.75", pct: "32%" },
    { name: "Daily Needs Superstore", orders: 210, rev: "₹8,600", aov: "₹40.95", pct: "26%" },
  ];

  const cancellationReasons = analyticsData?.cancellationReasons || analyticsData?.cancellation_reasons || [
    { reason: "Customer changed mind", count: 42, pct: "40%" },
    { reason: "Delivery delay / SLA breach", count: 31, pct: "30%" },
    { reason: "Item out of stock", count: 18, pct: "18%" },
    { reason: "Wrong item ordered", count: 12, pct: "12%" },
  ];

  const deliveryLeaderboard = analyticsData?.deliveryLeaderboard || analyticsData?.driver_leaderboard || [
    { name: "Rahul Sharma", count: 184, avg: "22 mins", onTime: "98.5%", rating: "4.9" },
    { name: "Vikram Singh", count: 162, avg: "24 mins", onTime: "96.2%", rating: "4.8" },
    { name: "Amit Patel", count: 145, avg: "26 mins", onTime: "94.0%", rating: "4.7" },
  ];

  const topCustomers = analyticsData?.topCustomers || analyticsData?.top_customers || [
    { name: "Priya Sharma", orders: 28, spent: "₹1,240.00" },
    { name: "Rajesh Kumar", orders: 22, spent: "₹980.50" },
    { name: "Ananya Roy", orders: 19, spent: "₹890.00" },
  ];

  const bestSellingProducts = analyticsData?.bestSellingProducts || analyticsData?.top_products || [
    { name: "Fresh Organic Milk (1L)", shop: "Green Grocery", units: 1420, rev: "₹4,260.00" },
    { name: "Farm Fresh Eggs (12 pk)", shop: "Urban Organic Mart", units: 980, rev: "₹3,430.00" },
    { name: "Whole Wheat Bread", shop: "Daily Needs", units: 850, rev: "₹2,125.00" },
  ];

  const slowMovingProducts = analyticsData?.slowMovingProducts || analyticsData?.slow_products || [
    { name: "Artisanal Dragon Fruit Jam", shop: "Urban Organic", days: "42 days", stock: 24 },
    { name: "Imported Truffle Oil (100ml)", shop: "Green Grocery", days: "38 days", stock: 12 },
    { name: "Organic Quinoa Flour", shop: "Daily Needs", days: "31 days", stock: 18 },
  ];

  const revenueGrowth = analyticsData?.revenueGrowth || analyticsData?.growthRate || "+14.2% vs Previous Period";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Analytics & Deep Insights</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Detailed performance tracking for sales, orders, delivery partners, customers, and catalog items.
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

      {/* Tab Contents */}
      {activeTab === "sales" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark dark:text-white">Revenue Trend & Comparison</h3>
              {compare && (
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  {revenueGrowth}
                </span>
              )}
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-2 dark:bg-dark-2 rounded-xl text-dark-4 dark:text-dark-6">
              [Line Chart: Daily Revenue Distribution ({shop === "all" ? "All Shops" : "Filtered Shop"})]
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Revenue by Category</h3>
            <div className="h-64 flex items-center justify-center bg-gray-2 dark:bg-dark-2 rounded-xl text-dark-4 dark:text-dark-6">
              [Donut Chart: Fresh Vegetables (35%), Dairy (25%), Fruits (20%), Snacks (20%)]
            </div>
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
                      <td className="p-3 font-semibold">{row.name}</td>
                      <td className="p-3">{row.orders}</td>
                      <td className="p-3 font-medium text-emerald-500">{row.rev}</td>
                      <td className="p-3">{row.aov}</td>
                      <td className="p-3">{row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Order Status Distribution</h3>
            <div className="h-64 flex items-center justify-center bg-gray-2 dark:bg-dark-2 rounded-xl text-dark-4 dark:text-dark-6">
              [Donut Chart: Delivered 78%, Placed 10%, Out for Delivery 8%, Cancelled 4%]
            </div>
          </div>

          <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Cancellation Reasons</h3>
            <div className="space-y-3">
              {cancellationReasons.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-2 dark:bg-dark-2">
                  <span className="text-sm font-medium">{c.reason}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-dark-4 dark:text-dark-6">{c.count} orders</span>
                    <span className="text-xs font-bold text-rose-500">{c.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "delivery" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Delivery Partner Leaderboard</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
                <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                  <tr>
                    <th className="p-3">Partner</th>
                    <th className="p-3">Deliveries Completed</th>
                    <th className="p-3">Avg Delivery Time</th>
                    <th className="p-3">On-Time %</th>
                    <th className="p-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                  {deliveryLeaderboard.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                      <td className="p-3 font-semibold">{row.name}</td>
                      <td className="p-3">{row.count}</td>
                      <td className="p-3">{row.avg}</td>
                      <td className="p-3 font-bold text-emerald-500">{row.onTime}</td>
                      <td className="p-3 text-amber-500 font-bold inline-flex items-center gap-1">
                        <StarIcon className="w-3.5 h-3.5 fill-current" />
                        {row.rating}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "customers" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Customer Order Frequency</h3>
            <div className="h-64 flex items-center justify-center bg-gray-2 dark:bg-dark-2 rounded-xl text-dark-4 dark:text-dark-6">
              [Histogram: 1 order (40%), 2-5 orders (45%), 6+ orders (15%)]
            </div>
          </div>
          <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Top Customers by Spend</h3>
            <div className="space-y-3">
              {topCustomers.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-2 dark:bg-dark-2">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-dark-4 dark:text-dark-6">{c.orders} total orders</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-500">{c.spent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Best-Selling Products</h3>
            <div className="space-y-3">
              {bestSellingProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-2 dark:bg-dark-2">
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-dark-4 dark:text-dark-6">{p.shop} • {p.units} units sold</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-500">{p.rev}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Slow-Moving Products</h3>
            <div className="space-y-3">
              {slowMovingProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-2 dark:bg-dark-2">
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-dark-4 dark:text-dark-6">{p.shop} • Stock: {p.stock}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500">{p.days} without sale</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

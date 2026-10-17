"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// 1. Revenue Trend Area Chart
interface RevenueTrendProps {
  dateRange: string;
  totalSales: number;
  isCompareOn: boolean;
}

export function RevenueTrendChart({ dateRange, totalSales, isCompareOn }: RevenueTrendProps) {
  const getPoints = () => {
    if (dateRange === "today") {
      return ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM", "11 PM"];
    }
    if (dateRange === "7d") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    }
    if (dateRange === "90d") {
      return ["Week 1", "Week 3", "Week 5", "Week 7", "Week 9", "Week 11", "Week 13"];
    }
    if (dateRange === "1y") {
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    }
    // Default 30d
    return ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"];
  };

  const points = getPoints();
  const sales = totalSales ?? 0;
  const baseStep = sales > 0 ? sales / (points.length * 1.25) : 0;

  const currentSeries = points.map((_, i) => Math.round(baseStep * (0.65 + (i * 0.08))));
  const previousSeries = currentSeries.map((v) => Math.round(v * 0.86));

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#5750F1", "#0ABEF9"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100],
      },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    grid: {
      strokeDashArray: 5,
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: points,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => `₹${Math.round(val).toLocaleString()}`,
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `₹${val.toLocaleString()}`,
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontFamily: "inherit",
      fontWeight: 500,
      fontSize: "13px",
      markers: { size: 6, shape: "circle" },
    },
  };

  const series = [
    {
      name: "Current Period",
      data: currentSeries,
    },
    ...(isCompareOn
      ? [
          {
            name: "Previous Period",
            data: previousSeries,
          },
        ]
      : []),
  ];

  return (
    <div className="h-[280px] w-full">
      <Chart options={options} series={series} type="area" height={280} />
    </div>
  );
}

// 2. Revenue by Category Donut Chart
interface CategoryRevenueProps {
  categories: Array<{ category: string; total_sales: number; order_count: number }>;
}

export function CategoryRevenueDonut({ categories }: CategoryRevenueProps) {
  const activeData = categories && categories.length > 0 ? categories : [];

  if (activeData.length === 0) {
    return (
      <div className="h-[280px] w-full flex flex-col items-center justify-center text-center p-4">
        <div className="size-16 rounded-full bg-gray-2 dark:bg-dark-2 flex items-center justify-center mb-3">
          <span className="text-xl font-bold text-dark-4 dark:text-dark-6">₹0</span>
        </div>
        <p className="text-sm font-semibold text-dark dark:text-white">No Category Data</p>
        <p className="text-xs text-dark-4 dark:text-dark-6 mt-1">No sales breakdown recorded for this filter.</p>
      </div>
    );
  }

  const labels = activeData.map((c) => c.category);
  const series = activeData.map((c) => Number(c.total_sales));
  const total = series.reduce((acc, curr) => acc + curr, 0);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: ["#5750F1", "#0ABEF9", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"],
    labels,
    plotOptions: {
      pie: {
        donut: {
          size: "76%",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: "Total Sales",
              fontSize: "14px",
              fontWeight: "500",
              formatter: () => `₹${Math.round(total).toLocaleString()}`,
            },
            value: {
              fontSize: "20px",
              fontWeight: "700",
              formatter: (val) => `₹${Math.round(+val).toLocaleString()}`,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      itemMargin: { horizontal: 8, vertical: 4 },
      formatter: (legendName, opts) => {
        const val = opts.w.globals.seriesTotals[opts.seriesIndex];
        const pct = total > 0 ? ((val / total) * 100).toFixed(0) : "0";
        return `${legendName} (${pct}%)`;
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `₹${Math.round(val).toLocaleString()}`,
      },
    },
  };

  return (
    <div className="h-[280px] w-full flex items-center justify-center">
      <Chart options={options} series={series} type="donut" height={280} />
    </div>
  );
}

// 3. Order Status Distribution Donut Chart
interface OrderStatusProps {
  ordersByStatus: Array<{ status: string; count: number; value: number }>;
}

export function OrderStatusDonut({ ordersByStatus }: OrderStatusProps) {
  const activeData = ordersByStatus && ordersByStatus.length > 0 ? ordersByStatus : [];

  if (activeData.length === 0) {
    return (
      <div className="h-[280px] w-full flex flex-col items-center justify-center text-center p-4">
        <div className="size-16 rounded-full bg-gray-2 dark:bg-dark-2 flex items-center justify-center mb-3">
          <span className="text-xl font-bold text-dark-4 dark:text-dark-6">0</span>
        </div>
        <p className="text-sm font-semibold text-dark dark:text-white">No Order Status Data</p>
        <p className="text-xs text-dark-4 dark:text-dark-6 mt-1">No orders recorded for this filter.</p>
      </div>
    );
  }

  const labels = activeData.map((s) => s.status.replace(/_/g, " "));
  const series = activeData.map((s) => Number(s.count));
  const total = series.reduce((acc, curr) => acc + curr, 0);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: ["#10B981", "#F59E0B", "#EF4444", "#0EA5E9", "#6366F1"],
    labels,
    plotOptions: {
      pie: {
        donut: {
          size: "76%",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: "Total Orders",
              fontSize: "14px",
              fontWeight: "500",
              formatter: () => `${total.toLocaleString()}`,
            },
            value: {
              fontSize: "20px",
              fontWeight: "700",
              formatter: (val) => `${(+val).toLocaleString()} orders`,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      itemMargin: { horizontal: 8, vertical: 4 },
      formatter: (legendName, opts) => {
        const val = opts.w.globals.seriesTotals[opts.seriesIndex];
        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
        return `${legendName} (${pct}%)`;
      },
    },
  };

  return (
    <div className="h-[280px] w-full flex items-center justify-center">
      <Chart options={options} series={series} type="donut" height={280} />
    </div>
  );
}

// 4. Customer Segments Bar Chart
interface CustomerSegmentsProps {
  segments: Array<{ segment: string; count: number; revenue_share: number }>;
}

export function CustomerSegmentsBarChart({ segments }: CustomerSegmentsProps) {
  const activeData = segments && segments.length > 0 ? segments : [];

  if (activeData.length === 0) {
    return (
      <div className="h-[280px] w-full flex flex-col items-center justify-center text-center p-4">
        <p className="text-sm font-semibold text-dark dark:text-white">No Customer Segment Data</p>
        <p className="text-xs text-dark-4 dark:text-dark-6 mt-1">No customer activity recorded for this filter.</p>
      </div>
    );
  }

  const categories = activeData.map((s) => s.segment);
  const counts = activeData.map((s) => s.count);
  const shares = activeData.map((s) => s.revenue_share);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#5750F1", "#0ABEF9"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: -15,
        style: { fontSize: "11px" },
      },
    },
    yaxis: [
      {
        title: { text: "Customers", style: { fontSize: "12px" } },
      },
      {
        opposite: true,
        title: { text: "Revenue Share (%)", style: { fontSize: "12px" } },
        labels: { formatter: (val) => `${val}%` },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontFamily: "inherit",
      fontWeight: 500,
      fontSize: "12px",
    },
  };

  const series = [
    { name: "Customer Count", data: counts },
    { name: "Revenue Share (%)", data: shares },
  ];

  return (
    <div className="h-[280px] w-full">
      <Chart options={options} series={series} type="bar" height={280} />
    </div>
  );
}

// 5. Delivery Zone Performance Column Chart
interface DeliveryZoneProps {
  performance: Array<{ zone: string; avg_time_mins: number; on_time_rate: number }>;
}

export function DeliveryZoneBarChart({ performance }: DeliveryZoneProps) {
  const activeData = performance && performance.length > 0 ? performance : [];

  if (activeData.length === 0) {
    return (
      <div className="h-[280px] w-full flex flex-col items-center justify-center text-center p-4">
        <p className="text-sm font-semibold text-dark dark:text-white">No Delivery Zone Data</p>
        <p className="text-xs text-dark-4 dark:text-dark-6 mt-1">No delivery metrics recorded for this filter.</p>
      </div>
    );
  }

  const categories = activeData.map((d) => d.zone.replace("Central ", "").replace(" 4th Block", ""));
  const times = activeData.map((d) => d.avg_time_mins);
  const onTime = activeData.map((d) => d.on_time_rate);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#F59E0B", "#10B981"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px" } },
    },
    yaxis: [
      {
        title: { text: "Avg Time (mins)", style: { fontSize: "12px" } },
      },
      {
        opposite: true,
        title: { text: "On-Time Rate (%)", style: { fontSize: "12px" } },
        min: 80,
        max: 100,
        labels: { formatter: (val) => `${val}%` },
      },
    ],
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontFamily: "inherit",
      fontWeight: 500,
      fontSize: "12px",
    },
  };

  const series = [
    { name: "Avg Time (mins)", data: times },
    { name: "On-Time Rate (%)", data: onTime },
  ];

  return (
    <div className="h-[280px] w-full">
      <Chart options={options} series={series} type="bar" height={280} />
    </div>
  );
}

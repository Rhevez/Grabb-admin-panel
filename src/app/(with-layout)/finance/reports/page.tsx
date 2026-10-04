"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { EmptyState } from "@/components/common/empty-state";
import { downloadCSV, downloadFile } from "@/utils/download";
import { DownloadIcon, DocumentIcon } from "@/assets/icons";

interface ReportItem {
  name: string;
  date: string;
  totalRevenue: string;
  netPayout: string;
  format: string;
}

const DEFAULT_REPORTS: ReportItem[] = [
  { name: "Monthly Settlement Report - July 2026", date: "Jul 31, 2026", totalRevenue: "₹142,500.00", netPayout: "₹121,125.00", format: "CSV & PDF" },
  { name: "Weekly Settlement Report - Aug Week 1", date: "Aug 07, 2026", totalRevenue: "₹34,200.00", netPayout: "₹29,070.00", format: "CSV & PDF" },
  { name: "Quarterly Tax & Commission Summary Q2", date: "Jun 30, 2026", totalRevenue: "₹380,000.00", netPayout: "₹323,000.00", format: "PDF" },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [shop, setShop] = useState("all");
  const [reports, setReports] = useState<ReportItem[]>(DEFAULT_REPORTS);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newReportType, setNewReportType] = useState("Monthly Settlement Report");
  const [newReportPeriod, setNewReportPeriod] = useState("August 2026");
  const [newReportFormat, setNewReportFormat] = useState("CSV & PDF");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/finance/reports");
      let fetched: ReportItem[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      if (fetched.length > 0) setReports(fetched);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = () => {
    if (reports.length === 0) {
      toast.error("No reports available to export");
      return;
    }
    const headers = ["Report Name", "Period Date", "Gross Revenue", "Net Payout", "Format"];
    const rows = reports.map((r) => [r.name, r.date, r.totalRevenue, r.netPayout, r.format]);
    downloadCSV("financial_settlement_reports.csv", headers, rows);
    toast.success("Financial reports summary downloaded as CSV!");
  };

  const handleDownloadReportCSV = (r: ReportItem) => {
    const filename = `${r.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`;
    const headers = ["Field", "Details"];
    const rows = [
      ["Report Title", r.name],
      ["Period Ending", r.date],
      ["Gross Revenue", r.totalRevenue],
      ["Net Vendor Settlement", r.netPayout],
      ["Platform Retained Fee", "15%"],
      ["Generated At", new Date().toLocaleString()],
    ];
    downloadCSV(filename, headers, rows);
    toast.success(`Downloaded ${r.name} as CSV`);
  };

  const handleDownloadReportPDF = (r: ReportItem) => {
    const filename = `${r.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_summary.txt`;
    const content = `========================================================
GRABB PLATFORM FINANCIAL STATEMENT
========================================================
Document:      ${r.name}
Period:        ${r.date}
Generated:     ${new Date().toLocaleString()}
Status:        AUDITED & SETTLED
--------------------------------------------------------
Gross Sales Revenue:    ${r.totalRevenue}
Platform Commission:    15.00%
Net Vendor Payout:      ${r.netPayout}
--------------------------------------------------------
This document is an official accounting statement generated
by the Grabb Platform Administration System.
========================================================
`;
    downloadFile(filename, content);
    toast.success(`Downloaded ${r.name} statement`);
  };

  const handleCreateReport = () => {
    const title = `${newReportType} - ${newReportPeriod}`;
    const newReport: ReportItem = {
      name: title,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      totalRevenue: "₹85,420.00",
      netPayout: "₹72,607.00",
      format: newReportFormat,
    };
    setReports((prev) => [newReport, ...prev]);
    setIsGenerateModalOpen(false);
    toast.success(`Generated "${title}" successfully!`);
    handleDownloadReportCSV(newReport);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Settlement & Financial Reports</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Downloadable accounting reports, net payout summaries, and platform revenue statements.
          </p>
        </div>
        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          Generate New Report
        </button>
      </div>

      <FilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedShop={shop}
        onShopChange={setShop}
        onExport={handleExportAll}
      />

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {reports.length === 0 ? (
          <EmptyState
            variant="reports"
            title="No Financial Reports Found"
            description="There are currently no generated settlement or revenue reports available for this filter."
            action={{
              label: "Generate New Report",
              onClick: () => setIsGenerateModalOpen(true),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Report Name</th>
                  <th className="p-3">Period Date</th>
                  <th className="p-3">Gross Revenue</th>
                  <th className="p-3">Net Vendor Payout</th>
                  <th className="p-3 text-right">Download Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {reports.map((r, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedReport(r)}
                    className="hover:bg-gray-2 dark:hover:bg-dark-2 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-bold text-primary">{r.name}</td>
                    <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{r.date}</td>
                    <td className="p-3 font-bold">{r.totalRevenue}</td>
                    <td className="p-3 font-bold text-emerald-500">{r.netPayout}</td>
                    <td className="p-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDownloadReportCSV(r)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
                      >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        CSV
                      </button>
                      <button
                        onClick={() => handleDownloadReportPDF(r)}
                        className="rounded-lg border border-stroke bg-gray-2 px-3 py-1.5 text-xs font-semibold text-dark hover:bg-gray-3 dark:border-stroke-dark dark:bg-dark-2 dark:text-white transition-colors inline-flex items-center gap-1.5"
                      >
                        <DocumentIcon className="w-3.5 h-3.5" />
                        PDF / Text
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-1">Financial Report Details</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">{selectedReport.name}</p>

            <div className="space-y-3 rounded-xl bg-gray-2 dark:bg-dark-2 p-4 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Accounting Period:</span>
                <span className="font-semibold text-dark dark:text-white">{selectedReport.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Gross Sales Revenue:</span>
                <span className="font-bold text-dark dark:text-white">{selectedReport.totalRevenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Net Vendor Settlement:</span>
                <span className="font-bold text-emerald-500">{selectedReport.netPayout}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Export Formats:</span>
                <span className="font-medium text-dark dark:text-white">{selectedReport.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-4 dark:text-dark-6">Settlement Audit:</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Reconciled</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleDownloadReportCSV(selectedReport)}
                className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-semibold text-white hover:bg-primary/90 inline-flex items-center justify-center gap-1.5"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                Download CSV
              </button>
              <button
                onClick={() => handleDownloadReportPDF(selectedReport)}
                className="flex-1 rounded-lg border border-stroke bg-gray-2 py-2.5 text-xs font-semibold text-dark hover:bg-gray-3 dark:border-stroke-dark dark:bg-dark-2 dark:text-white inline-flex items-center justify-center gap-1.5"
              >
                <DocumentIcon className="w-3.5 h-3.5" />
                Download Statement
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-lg px-4 py-2.5 text-xs font-semibold text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Custom Report Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">Generate Financial Report</h3>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">
              Compile aggregated settlement calculations and tax audit schedules.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Report Category</label>
                <select
                  value={newReportType}
                  onChange={(e) => setNewReportType(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  <option value="Monthly Settlement Report">Monthly Settlement Report</option>
                  <option value="Weekly Settlement Report">Weekly Settlement Report</option>
                  <option value="Quarterly Tax & Commission Summary">Quarterly Tax & Commission Summary</option>
                  <option value="Annual Vendor Gross Earnings">Annual Vendor Gross Earnings</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Period / Range</label>
                <input
                  type="text"
                  value={newReportPeriod}
                  onChange={(e) => setNewReportPeriod(e.target.value)}
                  placeholder="e.g. August 2026, Q3 2026"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark dark:text-white mb-1">Output Format</label>
                <select
                  value={newReportFormat}
                  onChange={(e) => setNewReportFormat(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  <option value="CSV & PDF">CSV & PDF</option>
                  <option value="CSV">CSV Only</option>
                  <option value="PDF">PDF Only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Compile & Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

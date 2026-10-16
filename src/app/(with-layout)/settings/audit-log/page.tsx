"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { downloadCSV } from "@/utils/download";

interface AuditEntry {
  id: string;
  created_at: string;
  admin_email: string;
  action: string;
  resource: string;
  details: any;
  ip_address: string;
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/system/audit-logs");
      
      let fetchedLogs: any[] = [];
      if (Array.isArray(res)) {
        fetchedLogs = res;
      } else if (res?.data && Array.isArray(res.data.results)) {
        fetchedLogs = res.data.results;
        setTotalCount(res.data.count || res.data.results.length);
      } else if (res && Array.isArray(res.results)) {
        fetchedLogs = res.results;
        setTotalCount(res.count || res.results.length);
      } else if (res?.data && Array.isArray(res.data)) {
        fetchedLogs = res.data;
        setTotalCount(res.data.length);
      }
      
      setLogs(fetchedLogs);
    } catch (err: any) {
      console.error("Failed to load audit logs:", err);
      toast.error(err?.message || "Failed to load audit logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const adminUser = l.admin_email || "";
    const action = l.action || "";
    const resource = l.resource || "";
    const ip = l.ip_address || "";
    const s = search.toLowerCase();
    
    return (
      adminUser.toLowerCase().includes(s) ||
      action.toLowerCase().includes(s) ||
      resource.toLowerCase().includes(s) ||
      ip.toLowerCase().includes(s)
    );
  });

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.error("No audit logs to export");
      return;
    }
    const headers = ["Log ID", "Timestamp", "Admin Email", "HTTP Action", "Resource / Endpoint", "Client IP", "Details Payload"];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.created_at).toLocaleString(),
      l.admin_email || "System Admin",
      l.action,
      l.resource,
      l.ip_address || "Internal",
      JSON.stringify(l.details || {}),
    ]);
    downloadCSV("system_audit_logs.csv", headers, rows);
    toast.success(`Exported ${filteredLogs.length} audit records to CSV!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">System Audit & Compliance Log</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Immutable audit trail of administrative changes, approvals, status updates, and config modifications.
          </p>
        </div>
        {totalCount > 0 && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:bg-primary/20 self-start sm:self-auto">
            {totalCount} Total Logged Events
          </span>
        )}
      </div>

      <FilterBar
        searchPlaceholder="Filter audit log by admin, action, endpoint, or IP..."
        searchValue={search}
        onSearchChange={setSearch}
        onExport={handleExport}
      />

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-dark-4 dark:text-dark-6">Loading audit trails...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-dark-4 dark:text-dark-6">
            {search ? `No audit log entries matching "${search}".` : "No audit entries recorded yet."}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Admin User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Endpoint / Resource</th>
                <th className="p-3">Client IP</th>
                <th className="p-3 text-right">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {filteredLogs.map((l) => {
                const isExpanded = expandedId === l.id;
                return (
                  <tr key={l.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                    <td className="p-3 text-xs text-dark-4 dark:text-dark-6 font-mono">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-dark dark:text-white">
                      {l.admin_email || "System"}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                        l.action === "DELETE"
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                          : l.action === "POST"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs max-w-xs truncate text-dark-4 dark:text-dark-6" title={l.resource}>
                      {l.resource}
                    </td>
                    <td className="p-3 text-xs font-mono text-dark-4 dark:text-dark-6">
                      {l.ip_address || "127.0.0.1"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : l.id)}
                        className="rounded-lg bg-gray-2 px-3 py-1.5 text-xs font-semibold text-dark hover:bg-gray-3 dark:bg-dark-2 dark:text-white"
                      >
                        {isExpanded ? "Hide Details ▲" : "Inspect Payload ▼"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Expandable JSON Diff / Payload View */}
        {expandedId && (
          <div className="mt-6 border-t border-stroke dark:border-stroke-dark pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark-4 dark:text-dark-6 mb-3">
              Event Details & Payload State (ID: {expandedId})
            </h4>
            <div className="p-4 rounded-xl bg-gray-2 dark:bg-dark-2 border border-stroke dark:border-stroke-dark text-dark dark:text-white font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(logs.find((l) => l.id === expandedId)?.details || {}, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

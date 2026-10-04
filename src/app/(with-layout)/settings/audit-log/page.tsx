"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";

interface AuditEntry {
  id: string;
  timestamp: string;
  adminUser: string;
  action: string;
  module: string;
  beforeVal: string;
  afterVal: string;
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/system/audit-logs");
      
      let fetchedLogs = [];
      if (Array.isArray(res)) {
        fetchedLogs = res;
      } else if (res && Array.isArray(res.results)) {
        fetchedLogs = res.results;
      } else if (res && Array.isArray(res.data)) {
        fetchedLogs = res.data;
      } else if (res && typeof res === "object") {
        // Fallback if backend returned single object by mistake or something weird
        fetchedLogs = [];
      }
      
      setLogs(fetchedLogs);
    } catch (err: any) {
      if (err?.status !== 404) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter(
    (l) => {
      const adminUser = l.admin_email || l.adminUser || "";
      const action = l.action || "";
      const module = l.resource || l.module || "";
      const s = search.toLowerCase();
      
      return adminUser.toLowerCase().includes(s) ||
             action.toLowerCase().includes(s) ||
             module.toLowerCase().includes(s);
    }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">System Audit & Compliance Log</h1>
        <p className="text-sm text-dark-4 dark:text-dark-6">
          Immutable audit trail of administrative changes, status updates, payouts, and user blocks.
        </p>
      </div>

      <FilterBar
        searchPlaceholder="Filter audit log by admin, action, or module..."
        searchValue={search}
        onSearchChange={setSearch}
        onExport={() => toast.info("Exporting Audit Logs CSV...")}
      />

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Admin User</th>
                <th className="p-3">Module</th>
                <th className="p-3">Action</th>
                <th className="p-3 text-right">Payload Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {filteredLogs.map((l) => {
                const isExpanded = expandedId === l.id;
                return (
                  <tr key={l.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                    <td className="p-3 text-xs text-dark-4 dark:text-dark-6 font-mono">{l.created_at || l.timestamp}</td>
                    <td className="p-3 font-semibold">{l.admin_email || l.adminUser}</td>
                    <td className="p-3">
                      <span className="bg-gray-2 dark:bg-dark-2 px-2.5 py-1 rounded text-xs font-bold">
                        {l.resource || l.module}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs font-bold text-primary">{l.action}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : l.id)}
                        className="rounded-lg bg-gray-2 px-3 py-1.5 text-xs font-semibold text-dark hover:bg-gray-3 dark:bg-dark-2 dark:text-white"
                      >
                        {isExpanded ? "Hide Diff ▲" : "Inspect Diff ▼"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expandable JSON Diff View */}
        {expandedId && (
          <div className="mt-6 border-t border-stroke dark:border-stroke-dark pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark-4 mb-3">
              Before / After Value State Inspection ({expandedId})
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 overflow-x-auto">
                <p className="font-bold mb-2 uppercase text-[10px]">State Before Change (-):</p>
                <pre>{JSON.stringify(logs.find((l) => l.id === expandedId)?.details?.old_value || logs.find((l) => l.id === expandedId)?.beforeVal || {}, null, 2)}</pre>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 overflow-x-auto">
                <p className="font-bold mb-2 uppercase text-[10px]">State After Change (+):</p>
                <pre>{JSON.stringify(logs.find((l) => l.id === expandedId)?.details?.new_value || logs.find((l) => l.id === expandedId)?.afterVal || {}, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FilterBar } from "@/components/common/filter-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";
import { EmptyState } from "@/components/common/empty-state";
import { downloadCSV } from "@/utils/download";

interface Ticket {
  id: string;
  customerName: string;
  subject: string;
  priority: "low" | "medium" | "high";
  assignedAgent: string;
  status: "open" | "in-progress" | "resolved";
  createdDate: string;
}

const DEFAULT_TICKETS: Ticket[] = [
  { id: "TCK-1042", customerName: "Rahul Sharma", subject: "Wrong item delivered in order #ORD-9821", priority: "high", assignedAgent: "Support Rep Sarah", status: "open", createdDate: "10 mins ago" },
  { id: "TCK-1041", customerName: "Anita Desai", subject: "Refund query on cancelled milk delivery", priority: "medium", assignedAgent: "Support Rep Mike", status: "in-progress", createdDate: "1 hour ago" },
  { id: "TCK-1040", customerName: "Karan Patel", subject: "App crashed during UPI checkout", priority: "low", assignedAgent: "Support Rep Sarah", status: "resolved", createdDate: "3 hours ago" },
  { id: "TCK-1039", customerName: "Pooja Verma", subject: "Driver did not deliver package to door", priority: "medium", assignedAgent: "Unassigned", status: "open", createdDate: "5 hours ago" },
];

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editStatus, setEditStatus] = useState<"open" | "in-progress" | "resolved">("open");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editAgent, setEditAgent] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newAgent, setNewAgent] = useState("Support Rep Sarah");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi("/support/tickets");
      let fetched: Ticket[] = [];
      if (Array.isArray(res)) fetched = res;
      else if (res && Array.isArray(res.data)) fetched = res.data;
      else if (res && Array.isArray(res.results)) fetched = res.results;
      setTickets(fetched.length > 0 ? fetched : DEFAULT_TICKETS);
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch tickets:", err);
      setTickets(DEFAULT_TICKETS);
    } finally {
      setLoading(false);
    }
  };

  const safeTickets = Array.isArray(tickets) ? tickets : [];

  const filteredTickets = safeTickets.filter((t) => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesSearch =
      (t.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.subject || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      toast.error("No tickets to export");
      return;
    }
    const headers = ["Ticket ID", "Customer Name", "Subject / Issue", "Priority", "Assigned Agent", "Status", "Created Date"];
    const rows = filteredTickets.map((t) => [
      t.id,
      t.customerName,
      t.subject,
      t.priority.toUpperCase(),
      t.assignedAgent,
      t.status.toUpperCase(),
      t.createdDate,
    ]);
    downloadCSV("support_tickets_inbox.csv", headers, rows);
    toast.success(`Exported ${filteredTickets.length} support tickets as CSV!`);
  };

  const openEditModal = (t: Ticket) => {
    setEditingTicket(t);
    setEditStatus(t.status);
    setEditPriority(t.priority);
    setEditAgent(t.assignedAgent);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTicket) return;

    const updated: Ticket = {
      ...editingTicket,
      status: editStatus,
      priority: editPriority,
      assignedAgent: editAgent,
    };

    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/support/tickets/${editingTicket.id}`, {
        method: "PATCH",
        body: JSON.stringify(updated),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to update ticket:", err);
    }

    setTickets((prev) => prev.map((t) => (t.id === editingTicket.id ? updated : t)));
    toast.success(`Ticket ${editingTicket.id} updated successfully!`);
    setIsEditModalOpen(false);
    setEditingTicket(null);
  };

  const handleCreateTicket = async () => {
    if (!newCustomerName.trim() || !newSubject.trim()) {
      toast.error("Please fill in customer name and subject");
      return;
    }

    const newId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: Ticket = {
      id: newId,
      customerName: newCustomerName.trim(),
      subject: newSubject.trim(),
      priority: newPriority,
      assignedAgent: newAgent.trim() || "Unassigned",
      status: "open",
      createdDate: "Just now",
    };

    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi("/support/tickets", {
        method: "POST",
        body: JSON.stringify(newTicket),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to create ticket:", err);
    }

    setTickets((prev) => [newTicket, ...prev]);
    toast.success(`Support ticket ${newId} created!`);
    setNewCustomerName("");
    setNewSubject("");
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Customer Support Tickets</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Helpdesk support inbox, order dispute handling, ticket assignment, and customer chat resolution.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 transition-colors flex items-center gap-2"
          >
            <span>Export CSV</span>
            <span>📥</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors"
          >
            + Create Ticket
          </button>
        </div>
      </div>

      <FilterBar
        searchPlaceholder="Search ticket ID, customer name, subject..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="flex items-center gap-2">
        {["all", "open", "in-progress", "resolved"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
              statusFilter === st
                ? "bg-dark text-white dark:bg-white dark:text-dark"
                : "bg-white text-dark-4 hover:bg-gray-2 dark:bg-gray-dark dark:text-dark-6 border border-stroke dark:border-stroke-dark"
            }`}
          >
            {st === "all" ? "All Tickets" : st.replace(/-/g, " ")}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        {filteredTickets.length === 0 ? (
          <EmptyState
            variant="tickets"
            title="No Support Tickets Found"
            description={
              statusFilter !== "all"
                ? `There are currently no tickets in "${statusFilter.replace(/-/g, " ")}" status.`
                : "Your customer support inbox is clear! No tickets match your query."
            }
            action={{
              label: "Create New Ticket",
              onClick: () => setIsCreateModalOpen(true),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
              <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Subject / Issue</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Assigned Agent</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors">
                    <td className="p-3 font-bold text-primary">
                      <Link href={`/support/${t.id}`} className="hover:underline">
                        {t.id}
                      </Link>
                    </td>
                    <td className="p-3 font-semibold">{t.customerName}</td>
                    <td className="p-3 font-medium max-w-xs truncate">{t.subject}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          t.priority === "high"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400"
                            : t.priority === "medium"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400"
                            : "bg-gray-100 text-gray-700 dark:bg-dark-3 dark:text-dark-6"
                        }`}
                      >
                        {t.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{t.assignedAgent}</td>
                    <td className="p-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{t.createdDate}</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <TableActionsDropdown
                        actions={[
                          {
                            label: "Open Thread",
                            onClick: () => (window.location.href = `/support/${t.id}`),
                            variant: "primary",
                          },
                          {
                            label: "Edit Ticket",
                            onClick: () => openEditModal(t),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Ticket Modal */}
      {isEditModalOpen && editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h2 className="mb-2 text-xl font-bold text-dark dark:text-white">Edit Ticket: {editingTicket.id}</h2>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">{editingTicket.subject}</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-dark dark:text-white">Ticket Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "open" | "in-progress" | "resolved")}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-dark dark:text-white">Assigned Agent</label>
                <input
                  type="text"
                  value={editAgent}
                  onChange={(e) => setEditAgent(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-dark dark:text-white">Priority Level</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as "low" | "medium" | "high")}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTicket(null);
                }}
                className="rounded-lg px-4 py-2 text-xs font-medium text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Support Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h2 className="mb-2 text-xl font-bold text-dark dark:text-white">Create New Support Ticket</h2>
            <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">
              File a customer inquiry, refund request, or delivery dispute ticket.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-dark dark:text-white">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-dark dark:text-white">
                  Subject / Reported Issue <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Broken packaging on order ORD-9120"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-dark dark:text-white">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-dark dark:text-white">Assign Agent</label>
                  <input
                    type="text"
                    value={newAgent}
                    onChange={(e) => setNewAgent(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-dark-4 hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

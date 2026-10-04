"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { TableActionsDropdown } from "@/components/common/table-actions-dropdown";
import { fetchApi } from "@/utils/api";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  lastLogin?: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetchApi("/users/admins");
      setAdmins(res.data || res.results || res || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddAdmin = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setSubmitting(true);
    try {
      await fetchApi("/users/admins/invite", {
        method: "POST",
        body: JSON.stringify({
          email,
          full_name: name,
          password,
          role,
        }),
      });
      toast.success("Admin invited successfully!");
      setModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to invite admin");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAction = async (id: string, action: string, data?: any) => {
    try {
      await fetchApi(`/users/admins/${id}/${action}`, {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      });
      toast.success(`Admin ${action} successful`);
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} admin`);
    }
  };

  const modules = ["Dashboard", "Analytics", "Orders", "Catalog", "Shops", "Delivery Partners", "Users", "Promotions", "Finance", "Settings"];
  const roles = ["Super Admin", "Ops Manager", "Support Rep", "Finance Manager"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Admin Users & Role Permissions</h1>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            Manage staff admin accounts, assign roles, and view access permission matrices.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-1 hover:bg-primary/90"
        >
          + Add Admin User
        </button>
      </div>

      {/* Admins Table */}
      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark overflow-hidden">
        <h3 className="text-base font-bold text-dark dark:text-white mb-4">Staff Admin Accounts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Admin Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3 font-bold">{a.name}</td>
                  <td className="p-3 font-medium text-dark-4 dark:text-dark-6">{a.email}</td>
                  <td className="p-3 font-semibold text-primary">{a.role}</td>
                  <td className="p-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{a.lastLogin}</td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <TableActionsDropdown
                      actions={[
                        {
                          label: "Edit Admin",
                          onClick: () => toast.info(`Editing admin: ${a.name}...`),
                          variant: "primary",
                        },
                        {
                          label: a.status === "active" ? "Suspend Admin" : "Activate Admin",
                          onClick: () => handleAction(a.id, a.status === "active" ? "suspend" : "activate"),
                          variant: a.status === "active" ? "danger" : "primary",
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
        <h3 className="text-base font-bold text-dark dark:text-white mb-2">Role Permission Matrix</h3>
        <p className="text-xs text-dark-4 dark:text-dark-6 mb-4">Access permissions grid by administrative role.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Module</th>
                {roles.map((r) => (
                  <th key={r} className="p-3 text-center">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark text-xs font-medium">
              {modules.map((m) => (
                <tr key={m}>
                  <td className="p-3 font-bold">{m}</td>
                  {roles.map((r) => {
                    const isSuper = r === "Super Admin";
                    const isOps = r === "Ops Manager" && m !== "Settings" && m !== "Finance";
                    const isSupport = r === "Support Rep" && (m === "Orders" || m === "Users" || m === "Reviews" || m === "Support");
                    const isFinance = r === "Finance Manager" && (m === "Finance" || m === "Orders" || m === "Analytics");
                    const hasAccess = isSuper || isOps || isSupport || isFinance;

                    return (
                      <td key={r} className="p-3 text-center">
                        <span className={`text-base ${hasAccess ? "text-emerald-500" : "text-gray-300 dark:text-gray-700"}`}>
                          {hasAccess ? "✓" : "✕"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Add Staff Admin User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="david@grabb.com"
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
                >
                  <option value="Ops Manager">Ops Manager</option>
                  <option value="Support Rep">Support Rep</option>
                  <option value="Finance Manager">Finance Manager</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleAddAdmin} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

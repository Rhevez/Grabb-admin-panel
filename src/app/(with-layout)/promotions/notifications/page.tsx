"use client";

import { useState } from "react";
import { toast } from "sonner";

interface PushHistory {
  id: string;
  title: string;
  body: string;
  audience: string;
  sentDate: string;
  audienceSize: number;
}

export default function PushNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");

  const [sentHistory, setSentHistory] = useState<PushHistory[]>([
    {
      id: "pn1",
      title: "⚡ Flash Sale on Fresh Produce!",
      body: "Get up to 30% off organic spinach, tomatoes, and berries for the next 3 hours.",
      audience: "All Active Users",
      sentDate: "Today at 09:00 AM",
      audienceSize: 12450,
    },
    {
      id: "pn2",
      title: "We miss you! Free delivery inside 🛵",
      body: "Order today and get free express delivery on orders over ₹15.",
      audience: "Inactive for 30+ days",
      sentDate: "August 08, 2026",
      audienceSize: 1850,
    },
  ]);

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSentHistory((prev) => [
      {
        id: `pn_${Date.now()}`,
        title,
        body,
        audience: audience === "all" ? "All Active Users" : audience === "inactive" ? "Inactive 30D" : "Green Grocery Customers",
        sentDate: "Just now",
        audienceSize: 12450,
      },
      ...prev,
    ]);

    toast.success("Push notification sent to broadcast queue successfully!");
    setTitle("");
    setBody("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Push Notifications Broadcast</h1>
        <p className="text-sm text-dark-4 dark:text-dark-6">
          Compose and send instant push notifications to all users or target customer segments.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Compose Form */}
        <div className="col-span-12 xl:col-span-6 rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
          <h3 className="text-base font-bold text-dark dark:text-white mb-4">Compose Broadcast Message</h3>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Target Audience Segment</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              >
                <option value="all">All Active Users (12,450)</option>
                <option value="inactive">Inactive Customers (30+ days without order)</option>
                <option value="green_grocery">Green Grocery Fresh Shoppers</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Notification Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🥦 Fresh Vegetables Arrived!"
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Message Body *</label>
              <textarea
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your notification message content here..."
                className="w-full rounded-lg border border-stroke bg-gray-2 p-3 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-1 hover:bg-primary/90 transition-colors"
            >
              Send Push Notification Now 🚀
            </button>
          </form>
        </div>

        {/* Live Device Preview */}
        <div className="col-span-12 xl:col-span-6 flex justify-center items-center">
          <div className="w-80 rounded-3xl bg-dark p-4 border-4 border-gray-700 shadow-2xl text-white">
            <div className="w-20 h-4 bg-gray-800 rounded-full mx-auto mb-4" />
            <p className="text-[10px] text-center text-gray-400 mb-4">iOS / Android Lock Screen Preview</p>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-gray-300">
                <span className="font-bold flex items-center gap-1">🟢 Grabb Grocery</span>
                <span>Now</span>
              </div>
              <p className="text-xs font-bold">{title || "Notification Title Preview"}</p>
              <p className="text-xs text-gray-300 leading-snug">{body || "Notification message content preview will appear here in real-time."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
        <h3 className="text-base font-bold text-dark dark:text-white mb-4">Sent Broadcast History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-dark dark:text-white whitespace-nowrap">
            <thead className="bg-gray-2 text-xs font-semibold uppercase text-dark-4 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="p-3">Title & Message</th>
                <th className="p-3">Target Audience</th>
                <th className="p-3">Recipients Count</th>
                <th className="p-3">Sent Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-stroke-dark">
              {sentHistory.map((pn) => (
                <tr key={pn.id} className="hover:bg-gray-2 dark:hover:bg-dark-2">
                  <td className="p-3">
                    <p className="font-bold text-primary">{pn.title}</p>
                    <p className="text-xs text-dark-4 dark:text-dark-6 max-w-md">{pn.body}</p>
                  </td>
                  <td className="p-3 font-semibold">{pn.audience}</td>
                  <td className="p-3 font-bold text-emerald-500">{pn.audienceSize.toLocaleString()} users</td>
                  <td className="p-3 text-xs text-dark-4 dark:text-dark-6">{pn.sentDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

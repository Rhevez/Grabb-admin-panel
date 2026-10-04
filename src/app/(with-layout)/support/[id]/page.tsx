"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/status-badge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("high");
  const [agent, setAgent] = useState("Support Rep Sarah");
  const [internalNote, setInternalNote] = useState("");
  const [notesList, setNotesList] = useState<string[]>([
    "Customer called via hotline; rider was notified to double-check missing item at shop.",
  ]);

  const [chatMessages, setChatMessages] = useState([
    { sender: "customer", text: "Hi, I received my order ORD-94821 but 2 packs of organic milk were missing from the bag!", time: "10:15 AM" },
    { sender: "agent", text: "Hello Aarav! I apologize for the inconvenience. Let me check with Green Grocery Fresh and rider Rahul right away.", time: "10:17 AM" },
    { sender: "customer", text: "Thank you, please process a refund or send the missing items.", time: "10:18 AM" },
  ]);

  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  const fetchTicketDetail = async () => {
    try {
      const { fetchApi } = await import("@/utils/api");
      const res = await fetchApi(`/support/tickets/${id}`);
      const data = res?.data || res;
      if (data) {
        if (data.status) setStatus(data.status);
        if (data.priority) setPriority(data.priority);
        if (data.assignedAgent) setAgent(data.assignedAgent);
        if (Array.isArray(data.messages)) setChatMessages(data.messages);
        if (Array.isArray(data.notes)) setNotesList(data.notes);
      }
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to fetch ticket detail:", err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const msg = replyText;
    setReplyText("");
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/support/tickets/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: msg, sender: "agent" }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to send reply:", err);
    }
    setChatMessages((prev) => [
      ...prev,
      { sender: "agent", text: msg, time: "Just now" },
    ]);
  };

  const handleAddNote = async () => {
    if (!internalNote.trim()) return;
    const note = internalNote;
    setInternalNote("");
    try {
      const { fetchApi } = await import("@/utils/api");
      await fetchApi(`/support/tickets/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
    } catch (err: any) {
      if (err?.status !== 404) console.error("Failed to add note:", err);
    }
    setNotesList((prev) => [...prev, note]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col gap-2">
            <Link href="/support" className="text-xs font-semibold text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white w-fit">
              ← Back to Support Tickets
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-dark dark:text-white">{id}</h1>
              <StatusBadge status={status} />
            </div>
          </div>
          <p className="text-sm text-dark-4 dark:text-dark-6 mt-1">
            Subject: <span className="font-bold text-dark dark:text-white">Items missing from my grocery bag</span> • Customer: Aarav Sharma
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Conversation Thread */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-4">
            <h3 className="text-base font-bold text-dark dark:text-white mb-4">Conversation Thread</h3>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.sender === "agent" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-md rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.sender === "agent"
                        ? "bg-primary text-white"
                        : "bg-gray-2 text-dark dark:bg-dark-2 dark:text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-dark-4 dark:text-dark-6 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-stroke dark:border-stroke-dark flex gap-3">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type customer reply message here..."
                className="flex-1 rounded-xl border border-stroke bg-gray-2 p-3 text-sm dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Send Reply
              </button>
            </form>
          </div>

          {/* Internal Notes Section (Hidden from Customer) */}
          <div className="rounded-2xl bg-amber-500/10 p-6 border border-amber-500/30 space-y-4">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
              🔒 Internal Staff Notes (Not visible to customer)
            </h3>
            <div className="space-y-2">
              {notesList.map((note, idx) => (
                <p key={idx} className="text-xs text-amber-900 dark:text-amber-200 bg-amber-500/10 p-3 rounded-lg">
                  • {note}
                </p>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Add internal note for team..."
                className="flex-1 rounded-lg border border-amber-500/30 p-2 text-xs dark:bg-dark-2 dark:text-white"
              />
              <button
                onClick={handleAddNote}
                className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Ticket Controls & Linked Order */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Controls Card */}
          <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark space-y-4">
            <h3 className="text-base font-bold text-dark dark:text-white mb-2">Ticket Controls</h3>

            <div>
              <label className="block text-xs font-semibold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm font-bold dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm font-bold dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Assign Agent</label>
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm font-bold dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
              >
                <option value="Support Rep Sarah">Support Rep Sarah</option>
                <option value="Finance Rep Alex">Finance Rep Alex</option>
                <option value="Ops Manager John">Ops Manager John</option>
              </select>
            </div>
          </div>

          {/* Linked Order Card */}
          <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
            <h3 className="text-base font-bold text-dark dark:text-white mb-2">Linked Reference Order</h3>
            <div className="p-3 rounded-xl bg-gray-2 dark:bg-dark-2 text-xs space-y-1">
              <p className="font-bold text-primary">
                <Link href="/orders/ORD-94821">ORD-94821 →</Link>
              </p>
              <p className="text-dark-4 dark:text-dark-6">Shop: Green Grocery Fresh</p>
              <p className="font-bold text-emerald-500">₹42.50 • Out for Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

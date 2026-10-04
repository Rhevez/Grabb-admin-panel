"use client";

import React from "react";
import { RocketIcon, GlobeIcon, PackageIcon } from "@/assets/icons";
import { ShoppingBagIcon } from "@/components/Layouts/sidebar/icons";

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark dark:text-white mb-2">Help & Instructions</h1>
        <p className="text-dark-4 dark:text-dark-6">
          Welcome to the Grabb Admin Panel. This guide will help you navigate and manage your hyperlocal marketplace effectively.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Getting Started */}
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
          <h2 className="text-xl font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
            <RocketIcon className="w-5 h-5 text-primary" />
            Getting Started
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-dark-5 dark:text-dark-6">
              Grabb is a hyperlocal delivery platform connecting nearby stores with customers. As an administrator, you oversee catalog accuracy, delivery partner assignment, and shop management.
            </p>
            <ul className="list-disc pl-5 text-sm text-dark-5 dark:text-dark-6 space-y-2">
              <li>Navigate using the sidebar on the left.</li>
              <li>Toggle Light/Dark mode in the top right corner.</li>
              <li>Every table includes a "Data View" for standard rows, and action menus (three dots) on the far right for Edit/Delete functions.</li>
            </ul>
          </div>
        </div>

        {/* Live Operations */}
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
          <h2 className="text-xl font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
            <GlobeIcon className="w-5 h-5 text-primary" />
            Live Operations
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
              <h3 className="font-semibold text-primary mb-1">Operational Zones</h3>
              <p className="text-xs text-dark-5 dark:text-dark-6">
                Use the <b>Map View</b> in Operational Zones to draw delivery polygons. This dictates the maximum distance a customer can order from a specific shop.
              </p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
              <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Live Fleet Map</h3>
              <p className="text-xs text-dark-5 dark:text-dark-6">
                Monitor delivery partners in real-time to manage unassigned orders and track live order progress.
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
              <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Surge Pricing</h3>
              <p className="text-xs text-dark-5 dark:text-dark-6">
                Toggle multipliers during peak hours or bad weather to incentivize delivery partners.
              </p>
            </div>
          </div>
        </div>

        {/* Catalog & Products */}
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
          <h2 className="text-xl font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
            <PackageIcon className="w-5 h-5 text-primary" />
            Catalog Management
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-dark-5 dark:text-dark-6">
              Our unique <b>Master Catalog</b> approach ensures consistency across all shops.
            </p>
            <ol className="list-decimal pl-5 text-sm text-dark-5 dark:text-dark-6 space-y-2">
              <li><b>Categories & Subcategories:</b> Define the top-level hierarchy (e.g., Dairy & Eggs {">"} Cheese).</li>
              <li><b>Master Mapping:</b> You create a master SKU (e.g., "Amul Milk 1L").</li>
              <li><b>Shop Inventory:</b> Individual shops link their inventory to your Master SKU and set their own local price and stock limits.</li>
            </ol>
            <p className="text-sm font-semibold text-rose-500 mt-2">
              Note: Soft-deleted items will appear in the "Trash" tab of their respective pages and can be restored.
            </p>
          </div>
        </div>

        {/* Orders & Disputes */}
        <div className="rounded-2xl bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
          <h2 className="text-xl font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5 text-primary" />
            Orders & Support
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-dark-5 dark:text-dark-6">
              Manage the end-to-end lifecycle of customer orders.
            </p>
            <ul className="list-disc pl-5 text-sm text-dark-5 dark:text-dark-6 space-y-2">
              <li><b>Unassigned Queue:</b> Orders that shops have accepted but no delivery partner has picked up. Action these manually if auto-assign fails.</li>
              <li><b>Disputes & Refunds:</b> Resolve customer complaints. Use the Liability Split modal to decide if the Shop, Delivery Partner, or Platform (Grabb) pays for the refund.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

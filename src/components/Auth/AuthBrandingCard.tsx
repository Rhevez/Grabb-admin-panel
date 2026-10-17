import { Logo } from "@/components/logo";
import Link from "next/link";
import React from "react";

interface HighlightItem {
  text: string;
}

interface AuthBrandingCardProps {
  category: string;
  title: string;
  description: string;
  highlights: HighlightItem[];
  footerCategory: string;
}

export function AuthBrandingCard({
  category,
  title,
  description,
  highlights,
  footerCategory,
}: AuthBrandingCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-1 to-white p-12 dark:from-[#122031] dark:to-[#0d1724] border border-stroke dark:border-stroke-dark shadow-sm">
      <Link className="mb-8 inline-flex flex-col items-start" href="/">
        <Logo width={200} height={62} showAdminBadge badgeText="Admin Panel" />
      </Link>

      <p className="mb-2 text-sm font-semibold text-primary uppercase tracking-wider">
        {category}
      </p>

      <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
        {title}
      </h2>

      <p className="mb-8 max-w-[440px] text-sm font-medium text-dark-4 dark:text-dark-6 leading-relaxed">
        {description}
      </p>

      <div className="space-y-4 mb-8">
        {highlights.map((item, index) => (
          <div key={index} className="flex items-center gap-3 text-xs font-semibold text-dark-3 dark:text-dark-6">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              ✓
            </span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-stroke dark:border-stroke-dark/60 flex items-center justify-between text-xs text-dark-4 dark:text-dark-6">
        <span>Grabb Admin Suite v1.3.0</span>
        <span className="font-semibold text-primary">{footerCategory}</span>
      </div>
    </div>
  );
}

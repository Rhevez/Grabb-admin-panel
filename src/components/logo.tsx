import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showAdminBadge?: boolean;
  badgeText?: string;
  priority?: boolean;
}

export function Logo({
  className,
  width = 180,
  height = 56,
  showAdminBadge = false,
  badgeText = "Admin",
  priority = true,
}: LogoProps) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
        <Image
          src="/images/file_0000000075c881f88071932eaa9e6bb8.png"
          fill
          sizes={`${width}px`}
          className="object-contain"
          alt="Grabb Admin Panel logo"
          priority={priority}
        />
      </div>
      {showAdminBadge && (
        <span className="text-[10px] font-bold tracking-[0.25em] text-[#f59e0b] uppercase select-none opacity-90 text-center w-full">
          {badgeText}
        </span>
      )}
    </div>
  );
}

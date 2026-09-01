"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  UtensilsCrossed,
  ShoppingBasket,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  // { href: "/fastfood", label: "Fast Food POS", icon: UtensilsCrossed, accent: "fastfood" as const },
  { href: "/minimart", label: "Mini Mart POS", icon: ShoppingBasket, accent: "minimart" as const },
  { href: "/stock/in", label: "Stock In", icon: ArrowDownToLine },
  { href: "/stock/out", label: "Stock Out", icon: ArrowUpFromLine },
  { href: "/stock/history", label: "Stock History", icon: History },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-[#262b33] bg-[#14171c] flex flex-col no-scrollbar font-sans text-white select-none">
      {/* Top Ticket Edge / Cut Sticker Header */}
      <div className="relative px-4 pt-6 pb-8">
        <div className="ticket-edge bg-gradient-to-r from-[#1b3a34] to-[#14171c] border border-[#232734] rounded-t-md px-4 py-4 shadow-sm">
          <p className="font-display text-lg tracking-tight text-white font-bold">Advance POS</p>
          <p className="text-xs text-[#33c9a8] mt-0.5 font-medium">Mini Mart Retail Store</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {NAV.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-[#1b1f26] text-white font-bold shadow-sm"
                  : "text-[#8b92a0] hover:text-white hover:bg-[#1b1f26]/60"
              )}
            >
              <Icon
                size={17}
                className={cn(
                  active && accent === "minimart" && "text-[#33c9a8]",
                  !active && "text-[#8b92a0]"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Label */}
      <div className="p-4 text-xs text-[#8b92a0] border-t border-[#262b33] font-mono">
        offline &middot; local data
      </div>
    </aside>
  );
}

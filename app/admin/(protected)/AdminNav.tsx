"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAdmin } from "./actions";

const links = [
  ["Today", "/admin/today"],
  ["Calendar", "/admin/calendar"],
  ["New Appointment", "/admin/appointments/new"],
  ["Clients", "/admin/clients"],
  ["Availability", "/admin/availability"],
  ["Nu Nu", "/admin/nunu"],
  ["Settings", "/admin/settings"],
] as const;

export default function AdminNav({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#3B2B09] bg-black px-4 py-3 md:px-8">
      <div className="flex items-center justify-between">
        <p className="font-bold uppercase tracking-widest text-[#C99A2E]">Go Foreign Admin</p>

        <button
          className="text-[#C99A2E] md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden items-center gap-6 md:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-semibold ${pathname.startsWith(href) ? "text-[#C99A2E]" : "text-gray-400 hover:text-[#C99A2E]"}`}
            >
              {label}
            </Link>
          ))}
          <span className="text-sm text-gray-500">{displayName}</span>
          <form action={signOutAdmin}>
            <button type="submit" className="text-sm font-semibold text-gray-400 hover:text-red-400">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {menuOpen && (
        <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-4 md:hidden">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-semibold ${pathname.startsWith(href) ? "text-[#C99A2E]" : "text-gray-400"}`}
            >
              {label}
            </Link>
          ))}
          <span className="text-sm text-gray-500">{displayName}</span>
          <form action={signOutAdmin}>
            <button type="submit" className="text-left text-sm font-semibold text-gray-400 hover:text-red-400">
              Sign out
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}

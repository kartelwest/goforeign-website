"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  ["Home", "/"],
  ["Services", "/#services"],
  ["Lifestyle", "/lifestyle"],
  ["Testimonials", "/#testimonials"],
  ["About", "/#about"],
  ["Pricing", "/#pricing"],
  ["Contact", "/#contact"],
] as const;

export default function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between overflow-hidden border-b border-[#3B2B09] bg-black px-3 py-4 md:px-10 md:py-5">
        <img src="/go-foreign-logo.png" alt="Go Foreign" className="h-9 w-[240px] object-contain md:h-16 md:w-auto" />

        <div className="hidden gap-8 text-lg font-semibold text-[#C99A2E] md:flex">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="hover:text-[#F2C14E]">
              {label}
            </a>
          ))}
        </div>

        <button
          className="block md:hidden text-[#C99A2E] z-50"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <Link
          href="/book"
          className="hidden rounded-full bg-[#B8860B] px-6 py-3 font-bold text-black transition-all duration-300 hover:bg-[#D4A017] md:inline-flex"
        >
          Book Consultation
        </Link>
      </nav>

      {menuOpen && (
        <div className="fixed left-0 top-[72px] z-[9999] w-full border-b border-[#3B2B09] bg-black px-6 py-6 md:hidden">
          <div className="flex flex-col gap-5 text-lg font-semibold text-[#C99A2E]">
            {links.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/lifestyle", label: "Lifestyle" },
  { href: "/brand-ambassadors", label: "Brand Ambassadors" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between overflow-hidden border-b border-[#3B2B09] bg-black px-3 py-4 md:px-10 md:py-5">
        <Link href="/">
          <Image
            src="/go-foreign-logo.png"
            alt="Go Foreign"
            width={240}
            height={64}
            priority
            className="h-9 w-[240px] object-contain md:h-16 md:w-auto"
          />
        </Link>

        <div className="hidden gap-8 text-lg font-semibold text-[#C99A2E] md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#F2C14E]">
              {link.label}
            </Link>
          ))}
        </div>

        <button
          className="z-50 block text-[#C99A2E] md:hidden"
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
          href="/#contact"
          className="hidden rounded-full bg-[#B8860B] px-6 py-3 font-bold text-black transition-all duration-300 hover:bg-[#D4A017] md:inline-flex"
        >
          Book Consultation
        </Link>
      </nav>

      {menuOpen && (
        <div className="fixed left-0 top-[72px] z-[9999] w-full border-b border-[#3B2B09] bg-black px-6 py-6 md:hidden">
          <div className="flex flex-col gap-5 text-lg font-semibold text-[#C99A2E]">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

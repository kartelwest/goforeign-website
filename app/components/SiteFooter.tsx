import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#3B2B09] bg-black px-6 py-10 text-sm text-gray-400 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <p>&copy; {new Date().getFullYear()} Go Foreign. All rights reserved.</p>

        <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-[#C99A2E]">
          <Link href="/book" className="hover:text-[#F2C14E]">Book a Consultation</Link>
          <Link href="/lifestyle" className="hover:text-[#F2C14E]">Lifestyle</Link>
          <Link href="/brand-ambassadors" className="hover:text-[#F2C14E]">Brand Ambassadors</Link>
          <Link href="/payments" className="hover:text-[#F2C14E]">Payments</Link>
          <Link href="/privacy" className="hover:text-[#F2C14E]">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#F2C14E]">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}

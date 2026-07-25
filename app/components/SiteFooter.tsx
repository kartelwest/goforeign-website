export default function SiteFooter() {
  return (
    <footer className="border-t border-[#3B2B09] bg-black px-6 py-10 text-sm text-gray-400 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <p>&copy; {new Date().getFullYear()} Go Foreign. All rights reserved.</p>

        <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-[#C99A2E]">
          <a href="/lifestyle" className="hover:text-[#F2C14E]">Lifestyle</a>
          <a href="/brand-ambassadors" className="hover:text-[#F2C14E]">Brand Ambassadors</a>
          <a href="/privacy" className="hover:text-[#F2C14E]">Privacy Policy</a>
          <a href="/terms" className="hover:text-[#F2C14E]">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const services = [
    ["🌎", "Relocation Planning", "Step-by-step guidance to help you move abroad with clarity."],
    ["💼", "Marketing & Branding", "Build your personal or business brand and grow your presence."],
    ["🏠", "Housing Assistance", "Find the right place to live for your lifestyle and budget."],
    ["📄", "Visa Guidance", "Understand your options and get help with the visa process."],
    ["📈", "Business Setup", "Open your business abroad with trusted local support."],
    ["🤝", "Local Connections", "Tap into our network and build real relationships."],
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-[#3B2B09] bg-black px-10 py-5">
        <img src="/go-foreign-logo.png" alt="Go Foreign" className="h-16 w-auto" //original was h14 but i made it a bit bigger
        />

        <div className="hidden gap-8 text-lg font-semibold text-[#C99A2E] md:flex">
          <a href="#">Home</a>
          <a href="#services" className="hover:text-[#F2C14E]">Services</a>
          <a href="#gallery" className="hover:text-[#F2C14E]">Gallery</a>
          <a href="#testimonials" className="hover:text-[#F2C14E]">Testimonials</a>
          <a href="#about" className="hover:text-[#F2C14E]">About</a>
          <a href="#pricing" className="hover:text-[#F2C14E]">Pricing</a>
          <a href="#contact" className="hover:text-[#F2C14E]">Contact</a>
        </div>

        <a href="#contact" className="rounded-full bg-[#C99A2E] px-6 py-3 font-bold text-black hover:bg-[#D6A93A]">
          Book Consultation
        </a>
      </nav>

      <section
        className="relative flex min-h-screen items-center bg-cover bg-center px-10 pt-24"
        style={{ backgroundImage: "url('/hero-bg.jpeg')" }}
      >
        <div className="absolute inset-0 bg-black/25"></div>

        <div className="relative z-10 max-w-2xl mt-16">
          <p className="mb-5 font-bold tracking-[0.25em] text-[#C99A2E]">
            LIVE BIGGER. LIVE ABROAD.
          </p>

          <h2 className="mb-6 text-6xl font-black leading-tight md:text-7xl">
            Your New Life <br /> Starts Here<span className="text-[#C99A2E]">.</span>
          </h2>

          <p className="mb-8 max-w-xl text-xl leading-relaxed text-gray-200">
            Lifestyle consulting, relocation guidance, and marketing support for people ready to stop dreaming and start living.
          </p>

          <div className="flex gap-4">
            <a href="#contact" 
             className="rounded-full bg-[#C99A2E] px-8 py-4 text-lg font-bold text-black shadow-xl shadow-yellow-500/30 transition-all duration-300 hover:scale-105 hover:bg-yellow-300">
              Book a Consultation ↗
            </a>
            <a href="#services" className="rounded-full border border-white/40 px-8 py-4 font-bold">
              See Services ↗
            </a>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="text-[#C99A2E] text-2x1">★★★★★</div>
            <p className="text-sm text-gray-200">Trusted by clients in 10+ countries</p>
          </div>
        </div>
      </section>

      <section id="services" className="bg-zinc-950 px-10 py-16">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <p className="mb-4 font-bold tracking-widest text-[#C99A2E]">WHAT WE DO</p>
            <h3 className="mb-6 text-4xl font-black">
              Services That Make Your Move Easier
            </h3>
            <p className="text-gray-400">
              From planning to execution, we help you build your dream life abroad with confidence.
            </p>
            <div className="mt-8 h-1 w-24 bg-[#C99A2E]"></div>
          </div>

          <div className="grid gap-4 lg:col-span-3 md:grid-cols-3">
            {services.map(([icon, title, text]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-black/40 p-6 text-center">
                <div className="mb-4 text-4xl">{icon}</div>
                <h4 className="mb-3 text-xl font-bold">{title}</h4>
                <p className="text-sm leading-relaxed text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
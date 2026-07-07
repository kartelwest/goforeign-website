const features = [
  ["/lifestyle/rio1.jpeg", "Christ the Redeemer", "history, views, photos, and unforgettable Rio energy", "/lifestyle/christ-the-redeemer"],
  ["/lifestyle/rio2.jpeg", "Sugarloaf Mountain", "cable cars, sunsets, ocean views, and luxury sightseeing", "/lifestyle/sugarloaf"],
  ["/lifestyle/rio3.jpeg", "Vidigal Views", "hilltop views, culture, food, music, and real local perspective", "/lifestyle/vidigal"],
  ["/lifestyle/rio4.jpeg", "Lapa", "historic arches, street culture, samba, bars, and nightlife energy", "/lifestyle/lapa"],
  ["/lifestyle/rio5.jpeg", "Copacabana Beach", "beach life, hotels, restaurants, boardwalks, and oceanfront living", "/lifestyle/copacabana"],
  ["/lifestyle/rio6.jpeg", "Golf & Coastal Living", "green space, ocean air, upscale leisure, and relaxed luxury", "/lifestyle/golf-coastal-living"],
];

const cities = [
  ["Rio de Janeiro", "Beaches, nightlife, mountains, samba, luxury views, and nonstop social energy."],
  ["São Paulo", "Fine dining, business, fashion, rooftop lounges, art, and elite networking."],
  ["Salvador", "Afro-Brazilian culture, music, food, beaches, festivals, and history."],
  ["Florianópolis", "Island life, surfing, beach clubs, wellness, and digital nomad energy."],
  ["Búzios", "Luxury beach town, boats, restaurants, nightlife, and romantic coastal escapes."],
  ["Balneário Camboriú", "Brazil’s high-rise beach city with nightlife, clubs, towers, and luxury appeal."],
];

export default function LifestylePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative flex min-h-screen items-center bg-[url('/lifestyle/rio2.jpeg')] bg-cover bg-center px-10 pt-28">
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
            LIVE BIGGER. LIVE ABROAD.
          </p>

          <h1 className="max-w-5xl text-5xl font-black leading-tight md:text-7xl">
            What If This Was Home?
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-relaxed text-gray-200">
            Every beach, every city, and every experience you see here is more than a destination—it could become your everyday life. Discover the culture, the people, the opportunities, and the unforgettable experiences that make Brazil one of the world's most exciting places to call home. Go Foreign helps you move beyond dreaming about Brazil and start building your future here.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/concierge"
              className="rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017]"
            >
              Explore Concierge Services
            </a>

            <a
              href="/brand-ambassadors"
              className="rounded-full border border-[#C99A2E] px-8 py-4 text-lg font-bold text-[#C99A2E] transition hover:bg-[#C99A2E] hover:text-black"
            >
              Meet Brand Ambassadors
            </a>
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 px-10 py-24">
        <div className="mx-auto max-w-7xl rounded-3xl border border-[#C99A2E]/30 bg-black p-10 shadow-2xl shadow-[#C99A2E]/10">
          <p className="mb-3 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
            Featured Access
          </p>

          <h2 className="text-4xl font-black md:text-5xl">
            Brand Ambassadors
          </h2>

          <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-300">
            Our Brand Ambassadors represent the Go Foreign lifestyle — social energy,
            local culture, nightlife, introductions, experiences, and the human side
            of living abroad. This is not tourism. This is access.
          </p>

          <a
            href="/brand-ambassadors"
            className="mt-8 inline-flex rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017]"
          >
            View Brand Ambassadors →
          </a>
        </div>
      </section>

      <section className="px-10 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-3xl">
            <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
              Rio Experiences
            </p>
            <h2 className="text-5xl font-black">
              Start with Rio. Then go deeper.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map(([image, title, text, link]) => (
              <a
                href={link}
                key={title}
                className="group relative h-96 overflow-hidden rounded-3xl border border-[#C99A2E]/20 bg-zinc-950 shadow-xl"
              >
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                <div className="absolute bottom-0 p-8">
                  <h3 className="mb-3 text-2xl font-bold text-[#C99A2E]">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-200">
                    Click to explore {text}.
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 px-10 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-3xl">
            <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
              Beyond Rio
            </p>
            <h2 className="text-5xl font-black">
              Brazil has more than one lifestyle.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {cities.map(([city, text]) => (
              <div
                key={city}
                className="rounded-3xl border border-[#C99A2E]/20 bg-black p-8 transition duration-500 hover:-translate-y-2 hover:border-[#C99A2E] hover:shadow-2xl hover:shadow-[#C99A2E]/20"
              >
                <h3 className="mb-4 text-2xl font-bold text-[#C99A2E]">
                  {city}
                </h3>
                <p className="text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
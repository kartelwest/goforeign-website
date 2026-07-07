const ambassadors = [
  { name: "Katherine", image: "/ambassadors/katherine.jpg", slug: "katherine" },
  { name: "Ambassador 2", image: "/ambassadors/placeholder.jpg", slug: "ambassador-2" },
  { name: "Ambassador 3", image: "/ambassadors/placeholder.jpg", slug: "ambassador-3" },
  { name: "Ambassador 4", image: "/ambassadors/placeholder.jpg", slug: "ambassador-4" },
  { name: "Ambassador 5", image: "/ambassadors/placeholder.jpg", slug: "ambassador-5" },
  { name: "Ambassador 6", image: "/ambassadors/placeholder.jpg", slug: "ambassador-6" },
  { name: "Ambassador 7", image: "/ambassadors/placeholder.jpg", slug: "ambassador-7" },
  { name: "Ambassador 8", image: "/ambassadors/placeholder.jpg", slug: "ambassador-8" },
  { name: "Ambassador 9", image: "/ambassadors/placeholder.jpg", slug: "ambassador-9" },
  { name: "Ambassador 10", image: "/ambassadors/placeholder.jpg", slug: "ambassador-10" },
  { name: "Ambassador 11", image: "/ambassadors/placeholder.jpg", slug: "ambassador-11" },
  { name: "Ambassador 12", image: "/ambassadors/placeholder.jpg", slug: "ambassador-12" },
];

const services = [
  ["Social Introductions", "Meet local people, explore the city socially, and experience Brazil with confidence."],
  ["Nightlife Access", "Bars, lounges, rooftops, samba nights, parties, and private social experiences."],
  ["Culture & Language", "Portuguese support, local customs, social guidance, and smoother communication."],
  ["Lifestyle Guidance", "Restaurants, beaches, gyms, shopping, neighborhoods, and hidden local spots."],
];

export default function BrandAmbassadorsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative flex min-h-screen items-center bg-[url('/lifestyle/rio4.jpeg')] bg-cover bg-center px-6 pt-28 md:px-10">
        <div className="absolute inset-0 bg-black/70"></div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
            GO FOREIGN BRAND AMBASSADORS
          </p>

          <h1 className="max-w-5xl text-5xl font-black leading-tight md:text-7xl">
            Meet the people who help introduce you to your new life.
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-relaxed text-gray-200">
            Our Brand Ambassadors represent the social side of Go Foreign —
            culture, conversation, nightlife, local experiences, and trusted
            introductions that help Brazil feel less foreign and more like home.
          </p>

          <a
            href="#ambassadors"
            className="mt-10 inline-flex rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017]"
          >
            View Ambassadors
          </a>
        </div>
      </section>

      <section className="bg-zinc-950 px-6 py-24 md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
            What They Help With
          </p>

          <h2 className="mb-12 max-w-4xl text-4xl font-black md:text-5xl">
            This is not tourism. This is social access with structure.
          </h2>

          <div className="grid gap-6 md:grid-cols-4">
            {services.map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-[#C99A2E]/20 bg-black p-8 transition duration-500 hover:-translate-y-2 hover:border-[#C99A2E] hover:shadow-2xl hover:shadow-[#C99A2E]/20"
              >
                <h3 className="mb-4 text-2xl font-bold text-[#C99A2E]">
                  {title}
                </h3>
                <p className="text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ambassadors" className="bg-black px-6 py-24 md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
            Meet The Team
          </p>

          <h2 className="mb-6 text-4xl font-black md:text-5xl">
            Brand Ambassadors
          </h2>

          <p className="mb-12 max-w-3xl text-lg leading-relaxed text-gray-300">
            Each ambassador brings a different connection to Brazil’s culture,
            nightlife, neighborhoods, social life, and everyday rhythm. Choose a
            profile to learn more.
          </p>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ambassadors.map((ambassador) => (
              <a
                key={ambassador.slug}
                href={`/brand-ambassadors/${ambassador.slug}`}
                className="group overflow-hidden rounded-3xl border border-[#C99A2E]/20 bg-zinc-950 transition duration-500 hover:-translate-y-2 hover:border-[#C99A2E] hover:shadow-2xl hover:shadow-[#C99A2E]/20"
              >
                <div className="relative h-[460px] overflow-hidden">
                  <img
                    src={ambassador.image}
                    alt={ambassador.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-3xl font-bold text-white">
                      {ambassador.name}
                    </h3>

                    <p className="mt-2 font-semibold text-[#C99A2E]">
                      View Profile →
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 px-6 py-24 md:px-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#C99A2E]/30 bg-black p-10 text-center">
          <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
            Private Access
          </p>

          <h2 className="text-4xl font-black md:text-5xl">
            Request a Brand Ambassador Introduction
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-300">
            Tell us what kind of experience you want: nightlife, culture,
            restaurants, social introductions, translation help, or local
            lifestyle guidance. We will help match you with the right experience.
          </p>

          <a
            href="https://wa.me/"
            className="mt-8 inline-flex rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017]"
          >
            Message Us on WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
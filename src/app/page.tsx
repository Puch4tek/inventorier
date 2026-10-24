import Link from "next/link";

const features = [
  {
    title: "Przedmioty",
    description: "Trzymaj informacje o tym, co znajduje się w magazynie.",
  },
  {
    title: "Lokalizacje",
    description: "Przypisuj przedmioty do konkretnych miejsc i pojemników.",
  },
  {
    title: "Historia",
    description: "W przyszłości śledź zmiany ilości i lokalizacji.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
        <div className="max-w-3xl">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.25em] text-[#6e6e73]">
            Inventory App
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
            Wszystko, co masz, w jednym miejscu.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6e6e73]">
            Prosty system do ewidencjonowania przedmiotów, zarządzania
            lokalizacjami i kontrolowania stanów magazynowych.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/users/new"
              className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#424245]"
            >
              Utwórz konto
            </Link>
            <span className="rounded-xl border border-black/[0.12] bg-white px-5 py-3 text-sm font-semibold text-[#6e6e73]">
              Projekt w budowie
            </span>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            >
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                {feature.title}
              </h2>
              <p className="mt-3 leading-7 text-[#6e6e73]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

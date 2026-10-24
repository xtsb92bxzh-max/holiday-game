import Image from 'next/image';
import Link from 'next/link';
import { games } from '@/lib/games';


export default function Home() {
  return (
    <div className="stage-bg relative min-h-dvh overflow-x-clip">
      <main id="main" className="relative isolate flex min-h-dvh flex-col items-center px-4 py-12 text-center sm:py-16">
        <div aria-hidden className="spotlight spotlight-left" />
        <div aria-hidden className="spotlight spotlight-right" />
        <div aria-hidden className="sparkle pointer-events-none absolute inset-0 opacity-60" />

        <p className="mb-4 font-display text-xs tracking-[0.18em] text-sky sm:tracking-[0.3em] sm:text-sm">
          Now showing
        </p>
        <h1 className="marquee-text text-4xl leading-none sm:text-6xl">Holiday Games</h1>
        <p className="mt-4 font-serif text-base italic text-gold sm:text-xl">Pick tonight’s show.</p>

        <ul className="mt-10 grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => {
            const card = (
              <>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={game.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className={`object-cover transition duration-500 ${
                      game.comingSoon ? 'grayscale opacity-60' : 'group-hover:scale-105'
                    }`}
                  />
                  {game.comingSoon && (
                    <span className="absolute right-3 top-3 rounded-full bg-mustard px-3 py-1 font-display text-xs tracking-wide text-ink">
                      Coming soon
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-5 text-left">
                  <h2 className="font-display text-lg leading-tight text-gold sm:text-xl">{game.title}</h2>
                  <p className="font-serif text-sm italic text-cream/85 sm:text-base">{game.tagline}</p>
                </div>
              </>
            );
            const frame =
              'group block overflow-hidden rounded-2xl border-2 bg-black/30 shadow-[0_20px_60px_rgb(0_0_0/0.45)]';
            return (
              <li key={game.slug}>
                {game.comingSoon ? (
                  <div className={`${frame} border-cream/15`} aria-disabled="true">
                    {card}
                  </div>
                ) : (
                  <Link href={`/${game.slug}`} className={`${frame} border-gold/60 transition hover:border-gold`}>
                    {card}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

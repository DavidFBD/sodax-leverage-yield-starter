import { brand } from '@/brand/brand.config';
import { InfoTip } from '@/components/ui/info-tip';

/** Page intro on the cream canvas: espresso heading, one word on a honey highlight, a linen rule below. */
export function Hero() {
  return (
    <section className="border-b text-hero-foreground">
      <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="max-w-3xl font-display text-4xl font-semibold sm:text-5xl">
          Leveraged staking yield, <span className="rounded-sm bg-hero-accent px-1.5">one</span> deposit.
        </h1>
        <p className="flex max-w-2xl items-center gap-2 text-lg text-hero-muted">
          {brand.tagline}
          <InfoTip label="How a deposit works">{brand.howItWorks}</InfoTip>
        </p>
      </div>
    </section>
  );
}

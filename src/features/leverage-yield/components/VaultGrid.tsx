import type { LeverageYieldVault } from '@sodax/types';
import { m } from 'motion/react';
import { BASE } from '@/components/ui/motion';
import { VaultCard } from './VaultCard';

export function VaultGrid({
  vaults,
  address,
  selected,
  onSelect,
}: {
  vaults: readonly LeverageYieldVault[];
  address: string | undefined;
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Vaults</h2>
        <p className="text-sm text-muted-foreground">
          Each vault holds a liquid staking token, borrows against it and re-stakes, earning a levered staking yield.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Staggered fade and rise on first mount only; a 2px lift on hover. */}
        {vaults.map((vault, index) => (
          <m.div
            key={vault.name}
            className="flex"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ ...BASE, delay: index * 0.05 }}
          >
            <VaultCard
              vault={vault}
              address={address}
              selected={vault.name === selected}
              onDeposit={() => onSelect(vault.name)}
            />
          </m.div>
        ))}
      </div>
    </section>
  );
}

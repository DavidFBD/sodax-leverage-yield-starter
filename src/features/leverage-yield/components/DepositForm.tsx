import { isNativeToken } from '@sodax/types';
import { useState } from 'react';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/info-tip';
import { Input } from '@/components/ui/input';
import { Reveal } from '@/components/ui/motion';
import { OrbPanel, ThinkingOrb } from '@/components/ui/thinking-orb';
import {
  DEFAULT_SOURCE_CHAIN,
  isSourceChain,
  NATIVE_GAS_RESERVE,
  SOURCE_CHAINS,
  type SourceChainKey,
} from '@/config/workshop';
import { chainName } from '@/lib/chains';
import { formatTokenAmount, parseTokenAmount } from '@/lib/format';
import { useEvmWallet } from '@/wallet';
import { useDepositQuote } from '../hooks/useDepositQuote';
import { useSourceEligibility } from '../hooks/useSourceEligibility';
import { useTokenChoice } from '../hooks/useTokenChoice';
import { useVault, useVaults } from '../hooks/useVaults';
import { ChainSelect } from './ChainSelect';
import { DepositDialog, type DepositReview } from './DepositDialog';
import { PositionCard } from './PositionCard';
import { QuoteDetails } from './QuoteDetails';
import { QuoteError } from './QuoteError';
import { RiskNotice, useRiskAcknowledgement } from './RiskNotice';
import { TokenSelect } from './TokenSelect';
import { VaultApr } from './VaultApr';
import { VaultPicker } from './VaultPicker';

/** Deposit card plus the user's position for the selected vault and source chain. */
export function DepositForm({
  vaultName,
  onVaultChange,
}: {
  vaultName: string;
  onVaultChange: (name: string) => void;
}) {
  const vaults = useVaults();
  const vault = useVault(vaultName) ?? vaults[0];

  // What the connected wallet can deposit from: one balances query per source network, shared and cached.
  const { address, currentChainKey } = useEvmWallet();
  const sources = useSourceEligibility(address);

  // Source chain: the user's pick, else the wallet's current chain if allowed and it has gas, else the first
  // network with gas, else the default.
  const [pickedChain, setPickedChain] = useState<SourceChainKey>();
  const chainKey =
    pickedChain ??
    [isSourceChain(currentChainKey) ? currentChainKey : undefined, DEFAULT_SOURCE_CHAIN, ...SOURCE_CHAINS].find(
      (key): key is SourceChainKey => !!key && sources.chains[key].eligible,
    ) ??
    (isSourceChain(currentChainKey) ? currentChainKey : DEFAULT_SOURCE_CHAIN);
  const wallet = useEvmWallet(chainKey);
  const tokenOptions = sources.tokens(chainKey);
  const { tokens, token, pickToken } = useTokenChoice(
    chainKey,
    t => tokenOptions.find(option => option.token.address === t.address)?.eligible ?? true,
  );

  const [amountText, setAmountText] = useState('');
  const [riskAcknowledged, setRiskAcknowledged] = useRiskAcknowledgement();
  const inputAmount = token ? parseTokenAmount(amountText, token.decimals) : undefined;
  const balance = sources.balance(chainKey, token);
  const balanceLoading = sources.isLoading(chainKey);

  // Inputs the user is reviewing. While the dialog is open it quotes them itself, so the form stops quoting.
  const [review, setReview] = useState<DepositReview | null>(null);
  const quote = useDepositQuote({ vault, srcChainKey: chainKey, token, inputAmount: review ? undefined : inputAmount });

  const action = (() => {
    if (!wallet.isConnected) return { label: 'Connect wallet', onClick: wallet.connect };
    if (wallet.isWrongChain) return { label: `Switch to ${chainName(chainKey)}`, onClick: wallet.switchChain };
    if (!amountText) return { label: 'Enter an amount', disabled: true };
    if (!inputAmount) return { label: 'Enter a valid amount', disabled: true };
    if (balance !== undefined && inputAmount > balance)
      return { label: `Insufficient ${token?.symbol}`, disabled: true };
    if (
      balance !== undefined &&
      token &&
      isNativeToken(chainKey, token) &&
      inputAmount > balance - NATIVE_GAS_RESERVE[chainKey]
    )
      return { label: `Leave some ${token.symbol} for gas`, disabled: true };
    if (quote.isLoading) return { label: 'Getting quote…', disabled: true, busy: true };
    if (!vault || !token || quote.error || quote.amountOut === undefined || quote.minAmountOut === undefined) {
      return { label: 'No quote', disabled: true };
    }
    if (!riskAcknowledged) return { label: 'Tick "I understand the risks" to continue', disabled: true };
    const reviewed = { vault, token, chainKey, inputAmount };
    return { label: 'Review deposit', onClick: () => setReview(reviewed) };
  })();

  if (!vault || !token) return null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Card>
        <CardHeader>
          <CardTitle>Deposit</CardTitle>
          <CardDescription>Choose a vault and pay with a token from the network you already use.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 font-medium">
                Vault
                <InfoTip label="Where your shares live">
                  Vaults live on Sonic. Whichever network you pay from, your shares go to your own SODAX hub wallet
                  there, which only your wallet controls.
                </InfoTip>
              </span>
              <VaultApr vault={vault.vault} className="font-semibold text-foreground" />
            </div>
            <VaultPicker vaults={vaults} value={vault.name} onChange={onVaultChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">From network</span>
              <ChainSelect
                value={chainKey}
                options={sources.active ? sources.chains : undefined}
                onChange={setPickedChain}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Pay with</span>
              <TokenSelect
                tokens={tokens}
                options={sources.active ? tokenOptions : undefined}
                value={token.address}
                onChange={pickToken}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <label htmlFor="deposit-amount" className="font-medium">
                  Amount
                </label>
                <InfoTip label="About gas">
                  You pay a little native gas (ETH on Base and Arbitrum, S on Sonic) for the approval and the deposit.
                  When you deposit the native token itself, some is kept back for gas.
                </InfoTip>
              </span>
              {wallet.isConnected && (
                <span className="text-muted-foreground">
                  Balance:{' '}
                  {balanceLoading ? (
                    <ThinkingOrb state="breathing" size={20} className="align-middle" label="Loading balance" />
                  ) : (
                    `${formatTokenAmount(balance, token.decimals)} ${token.symbol}`
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="deposit-amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amountText}
                onChange={event => setAmountText(event.target.value)}
                className="h-14 pr-20 text-xl"
              />
              {/* No Max for the native token: the user needs some of it for gas. */}
              {balance !== undefined && balance > 0n && !isNativeToken(chainKey, token) && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setAmountText(formatUnits(balance, token.decimals))}
                >
                  Max
                </Button>
              )}
            </div>
          </div>

          <Reveal
            id={
              inputAmount && quote.error
                ? 'error'
                : inputAmount && quote.isLoading
                  ? 'loading'
                  : inputAmount && quote.amountOut !== undefined && quote.minAmountOut !== undefined
                    ? 'quote'
                    : false
            }
          >
            {inputAmount && quote.error ? (
              <QuoteError message={quote.error} onRetry={quote.refetch} />
            ) : inputAmount && quote.isLoading ? (
              <OrbPanel className="h-32">Getting a live quote</OrbPanel>
            ) : inputAmount && quote.amountOut !== undefined && quote.minAmountOut !== undefined ? (
              <QuoteDetails
                vault={vault}
                token={token}
                inputAmount={inputAmount}
                shares={quote.amountOut}
                minShares={quote.minAmountOut}
              />
            ) : null}
          </Reveal>

          <RiskNotice acknowledged={riskAcknowledged} onAcknowledge={setRiskAcknowledged} />

          <div className="flex flex-col gap-2">
            <Button size="lg" disabled={action.disabled} busy={action.busy} onClick={action.onClick}>
              {action.label}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PositionCard vault={vault} chainKey={chainKey} address={wallet.address} />

      {review && (
        <DepositDialog
          review={review}
          onClose={completed => {
            setReview(null);
            if (completed) setAmountText('');
          }}
        />
      )}
    </div>
  );
}

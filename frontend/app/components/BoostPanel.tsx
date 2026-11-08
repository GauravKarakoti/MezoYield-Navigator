'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { type Abi, formatUnits, isAddress } from 'viem';
import deployment from '../../../deployments/combined-deployment-31611.json';

const BOOST_MANAGER = deployment.contracts.BoostManager.address as `0x${string}`;
const boostManagerAbi = deployment.contracts.BoostManager.abi as Abi;

const GAUGE_VOTE_MODULE = deployment.contracts.GaugeVoteModule.address as `0x${string}`;
const gaugeVoteAbi = deployment.contracts.GaugeVoteModule.abi as Abi;

const MEZO = ((deployment.contracts as any).MEZO?.address ??
  process.env.NEXT_PUBLIC_MEZO ??
  '0x7B7c000000000000000000000000000000000001') as `0x${string}`;
const erc20Abi = deployment.contracts.nyMUSD.abi as Abi;

export function BoostPanel() {
  const { address, isConnected } = useAccount();

  // ─── Reads ───
  const { data: pendingMezoRaw, refetch: refetchPending } = useReadContract({
    address: BOOST_MANAGER,
    abi: boostManagerAbi,
    functionName: 'pendingMezo',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: autoBoostRaw, refetch: refetchAutoBoost } = useReadContract({
    address: BOOST_MANAGER,
    abi: boostManagerAbi,
    functionName: 'autoBoost',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: veMezoCreditRaw, refetch: refetchVeMezo } = useReadContract({
    address: BOOST_MANAGER,
    abi: boostManagerAbi,
    functionName: 'veMezoCredit',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: mezoBalanceRaw } = useReadContract({
    address: MEZO,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: intent, refetch: refetchIntent } = useReadContract({
    address: GAUGE_VOTE_MODULE,
    abi: gaugeVoteAbi,
    functionName: 'intents',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const pendingMezo = pendingMezoRaw as bigint | undefined;
  const autoBoostOn = autoBoostRaw as boolean | undefined;
  const veMezoCredit = veMezoCreditRaw as bigint | undefined;
  const mezoBalance = mezoBalanceRaw as bigint | undefined;

  // ─── Writes: auto-boost toggle ───
  const {
    data: toggleHash,
    writeContract: toggleAutoBoost,
    isPending: isToggleSubmitting,
    error: toggleError,
    reset: resetToggle,
  } = useWriteContract();

  const { isLoading: isToggleConfirming, isSuccess: isToggleSuccess } =
    useWaitForTransactionReceipt({ hash: toggleHash });

  // ─── Writes: claim ───
  const {
    data: claimHash,
    writeContract: claim,
    isPending: isClaimSubmitting,
    error: claimError,
    reset: resetClaim,
  } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } =
    useWaitForTransactionReceipt({ hash: claimHash });

  // ─── Writes: vote intent ───
  const {
    data: intentHash,
    writeContract: setIntent,
    isPending: isIntentSubmitting,
    error: intentError,
    reset: resetIntent,
  } = useWriteContract();

  const { isLoading: isIntentConfirming, isSuccess: isIntentSuccess } =
    useWaitForTransactionReceipt({ hash: intentHash });

  // ─── Effects ───
  useEffect(() => {
    if (isToggleSuccess) {
      refetchAutoBoost();
    }
  }, [isToggleSuccess, refetchAutoBoost]);

  useEffect(() => {
    if (isClaimSuccess) {
      refetchPending();
      refetchVeMezo();
    }
  }, [isClaimSuccess, refetchPending, refetchVeMezo]);

  useEffect(() => {
    if (isIntentSuccess) {
      refetchIntent();
      setGaugeInput('');
      setWeightInput('');
    }
  }, [isIntentSuccess, refetchIntent]);

  // ─── Local form state ───
  const [gaugeInput, setGaugeInput] = useState('');
  const [weightInput, setWeightInput] = useState('');

  const gaugeValid = gaugeInput ? isAddress(gaugeInput) : false;
  const weightNum = Number(weightInput);
  const weightValid =
    !!weightInput && weightNum > 0 && weightNum <= 100 && Number.isFinite(weightNum);

  const canSubmitIntent = gaugeValid && weightValid;

  // ─── Derived ───
  const pendingMezoFormatted = pendingMezo
    ? Number(formatUnits(pendingMezo, 18))
    : 0;
  const veMezoFormatted = veMezoCredit
    ? Number(formatUnits(veMezoCredit, 18))
    : 0;
  const mezoBalanceFormatted = mezoBalance
    ? Number(formatUnits(mezoBalance, 18))
    : 0;
  const hasPending = pendingMezoFormatted > 0;

  const currentIntent = useMemo(() => {
    if (!intent) return null;
    const [gauge, weightBps, optIn] = intent as [string, bigint, boolean];
    if (!optIn || gauge === '0x0000000000000000000000000000000000000000')
      return null;
    return { gauge, weightPct: Number(weightBps) / 100 };
  }, [intent]);

  // ─── Handlers ───
  const onToggle = () => {
    resetClaim();
    resetIntent();
    toggleAutoBoost({
      address: BOOST_MANAGER,
      abi: boostManagerAbi,
      functionName: 'setAutoBoost',
      args: [!autoBoostOn],
    });
  };

  const onClaim = () => {
    resetToggle();
    claim({
      address: BOOST_MANAGER,
      abi: boostManagerAbi,
      functionName: 'claim',
    });
  };

  const onSubmitIntent = () => {
    if (!canSubmitIntent) return;
    resetIntent();
    const weightBps = BigInt(Math.round(weightNum * 100));
    setIntent({
      address: GAUGE_VOTE_MODULE,
      abi: gaugeVoteAbi,
      functionName: 'setIntent',
      args: [gaugeInput as `0x${string}`, weightBps],
    });
  };

  const onClearIntent = () => {
    resetIntent();
    setIntent({
      address: GAUGE_VOTE_MODULE,
      abi: gaugeVoteAbi,
      functionName: 'clearIntent',
    });
  };

  const errorMsg =
    (toggleError as any)?.shortMessage ||
    (claimError as any)?.shortMessage ||
    (intentError as any)?.shortMessage ||
    null;

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-semibold text-lg">MEZO boost & governance</h3>
          <p className="text-xs text-[var(--fg-subtle)] mt-1">
            Convert accrued MEZO into veMEZO and direct gauge votes
          </p>
        </div>
        {autoBoostOn && (
          <span className="pill pill-success">
            <span className="live-dot" />
            Auto-boost on
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <MiniStat
          label="Pending MEZO"
          value={pendingMezoFormatted.toLocaleString(undefined, {
            maximumFractionDigits: 4,
          })}
          highlight={hasPending}
        />
        <MiniStat
          label="veMEZO locked"
          value={veMezoFormatted.toLocaleString(undefined, {
            maximumFractionDigits: 4,
          })}
        />
        <MiniStat
          label="Wallet MEZO"
          value={mezoBalanceFormatted.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
        />
      </div>

      {/* Auto-boost toggle */}
      <div
        className="rounded-xl p-4 mb-4 flex items-center justify-between gap-4"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <div>
          <div className="text-sm font-medium">Auto-lock to veMEZO</div>
          <p className="text-xs text-[var(--fg-subtle)] mt-0.5 max-w-[280px]">
            {autoBoostOn
              ? 'When you claim, MEZO is automatically locked into veMEZO.'
              : 'Your MEZO claims will be sent to your wallet for manual management.'}
          </p>
        </div>
        <button
          className="btn btn-secondary shrink-0"
          style={{ width: 'auto', padding: '0.5rem 1rem' }}
          onClick={onToggle}
          disabled={!isConnected || isToggleSubmitting || isToggleConfirming}
        >
          {isToggleSubmitting || isToggleConfirming
            ? '…'
            : autoBoostOn
            ? 'Disable'
            : 'Enable'}
        </button>
      </div>

      {/* Claim */}
      <button
        className="btn btn-primary mb-5"
        onClick={onClaim}
        disabled={!isConnected || !hasPending || isClaimSubmitting || isClaimConfirming}
      >
        {isClaimSubmitting || isClaimConfirming ? (
          <>
            <span
              className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
            Claiming…
          </>
        ) : hasPending ? (
          `Claim ${pendingMezoFormatted.toLocaleString(undefined, {
            maximumFractionDigits: 4,
          })} MEZO`
        ) : (
          'Nothing to claim'
        )}
      </button>

      {/* Gauge vote intent */}
      <div className="pt-5 border-t border-[var(--border)]">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-sm font-medium">Gauge vote intent</div>
            <p className="text-xs text-[var(--fg-subtle)] mt-0.5">
              Keeper casts this vote for you each epoch
            </p>
          </div>
          {currentIntent && (
            <button
              className="btn-ghost"
              onClick={onClearIntent}
              disabled={isIntentSubmitting || isIntentConfirming}
            >
              Clear
            </button>
          )}
        </div>

        {currentIntent ? (
          <div
            className="rounded-lg p-3 mb-3 text-xs"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <div className="text-[var(--fg-muted)] mb-1">Current intent</div>
            <div className="tabular">
              <span className="text-[var(--accent)] font-medium">
                {currentIntent.weightPct.toFixed(0)}%
              </span>{' '}
              → {currentIntent.gauge.slice(0, 6)}…{currentIntent.gauge.slice(-4)}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-[1fr_100px] gap-2 mb-2">
          <input
            type="text"
            placeholder="Gauge address (0x…)"
            value={gaugeInput}
            onChange={(e) => setGaugeInput(e.target.value.trim())}
            className="!text-sm !font-mono !p-3 rounded-lg"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
            }}
            disabled={isIntentSubmitting || isIntentConfirming}
          />
          <div className="relative">
            <input
              type="number"
              placeholder="0"
              min={1}
              max={100}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="!text-sm !p-3 pr-7 rounded-lg"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: '0.85rem',
              }}
              disabled={isIntentSubmitting || isIntentConfirming}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] text-xs">
              %
            </span>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onSubmitIntent}
          disabled={!isConnected || !canSubmitIntent || isIntentSubmitting || isIntentConfirming}
        >
          {isIntentSubmitting || isIntentConfirming
            ? 'Submitting…'
            : 'Set vote intent'}
        </button>
      </div>

      {/* Errors / success */}
      {errorMsg && <div className="alert alert-error mt-4">{errorMsg}</div>}
      {isClaimSuccess && (
        <div className="alert alert-success mt-4">
          MEZO claimed successfully.
        </div>
      )}
      {isToggleSuccess && (
        <div className="alert alert-success mt-4">
          Auto-boost preference updated.
        </div>
      )}
      {isIntentSuccess && (
        <div className="alert alert-success mt-4">
          Vote intent saved. Keeper will execute next epoch.
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'var(--bg)',
        border: highlight
          ? '1px solid rgba(245, 158, 11, 0.35)'
          : '1px solid var(--border)',
      }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] mb-1">
        {label}
      </div>
      <div
        className={`tabular text-sm font-semibold ${
          highlight ? 'text-[var(--accent)]' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
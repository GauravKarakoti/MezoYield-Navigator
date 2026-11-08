'use client';

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { type Abi, formatUnits } from 'viem';
import deployment from '../../../deployments/combined-deployment-31611.json';

const ROUTER = deployment.contracts.YieldRouter.address as `0x${string}`;
const routerAbi = deployment.contracts.YieldRouter.abi as Abi;

// Strategy entries are optional: the deployment may have zero strategies registered.
const contractsMap = deployment.contracts as unknown as Record<
  string,
  { address?: string } | undefined
>;

const KNOWN_STRATEGIES: { key: string; name: string; color: string }[] = [
  { key: 'SMusdStrategy', name: 'sMUSD Vault', color: '#f59e0b' },
  { key: 'DittoStrategy', name: 'Ditto dMUSD', color: '#3b82f6' },
];

const STRATEGY_NAMES: Record<string, { name: string; color: string }> = {};
for (const s of KNOWN_STRATEGIES) {
  const addr = contractsMap[s.key]?.address;
  if (addr) STRATEGY_NAMES[addr.toLowerCase()] = { name: s.name, color: s.color };
}

const PALETTE = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ef4444'];

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function StrategyAllocation() {
  const { data: countRaw, isLoading: isLoadingCount } = useReadContract({
    address: ROUTER,
    abi: routerAbi,
    functionName: 'strategyCount',
    query: { refetchInterval: 15_000 },
  });

  const { data: totalAssetsRaw } = useReadContract({
    address: ROUTER,
    abi: routerAbi,
    functionName: 'totalAssets',
    query: { refetchInterval: 15_000 },
  });

  const { data: totalPendingAssetsRaw } = useReadContract({
    address: ROUTER,
    abi: routerAbi,
    functionName: 'totalPendingAssets',
    query: { refetchInterval: 15_000 },
  });

  const count = countRaw as bigint | undefined;
  const totalAssets = totalAssetsRaw as bigint | undefined;
  const totalPendingAssets = totalPendingAssetsRaw as bigint | undefined;
  const hasStrategies = count !== undefined && count > BigInt(0);

  // Read each strategy address
  const { data: addresses } = useReadContracts({
    contracts: Array.from({ length: Number(count ?? BigInt(0)) }, (_, i) => ({
      address: ROUTER,
      abi: routerAbi,
      functionName: 'strategies',
      args: [BigInt(i)],
    })),
    query: { enabled: hasStrategies, refetchInterval: 15_000 },
  });

  const strategyAddrs = useMemo(
    () =>
      (addresses ?? [])
        .map((r) => (r.status === 'success' ? (r.result as `0x${string}`) : null))
        .filter((a): a is `0x${string}` => !!a),
    [addresses]
  );

  // Read per-strategy value, cap, target
  const { data: perStrategyData } = useReadContracts({
    contracts: strategyAddrs.flatMap((addr) => [
      { address: ROUTER, abi: routerAbi, functionName: 'strategyValue', args: [addr] },
      { address: ROUTER, abi: routerAbi, functionName: 'strategyCap', args: [addr] },
      { address: ROUTER, abi: routerAbi, functionName: 'targetBps', args: [addr] },
    ]),
    query: { enabled: strategyAddrs.length > 0, refetchInterval: 15_000 },
  });

  const rows = useMemo(() => {
    if (!perStrategyData) return [];
    return strategyAddrs.map((addr, i) => {
      const valueRes = perStrategyData[i * 3];
      const capRes = perStrategyData[i * 3 + 1];
      const targetRes = perStrategyData[i * 3 + 2];

      // A failing strategy call shows as 0 instead of breaking the card.
      const valueWei =
        valueRes?.status === 'success' ? (valueRes.result as bigint) : BigInt(0);
      const capWei =
        capRes?.status === 'success' ? (capRes.result as bigint) : BigInt(0);
      const targetBpsRaw =
        targetRes?.status === 'success' ? (targetRes.result as bigint) : BigInt(0);

      const meta = STRATEGY_NAMES[addr.toLowerCase()];
      return {
        address: addr,
        name: meta?.name ?? short(addr),
        color: meta?.color ?? PALETTE[i % PALETTE.length],
        value: Number(formatUnits(valueWei, 18)),
        cap:
          capWei === BigInt(0) || capWei > BigInt(10) ** BigInt(30)
            ? null
            : Number(formatUnits(capWei, 18)),
        targetBps: Number(targetBpsRaw),
      };
    });
  }, [perStrategyData, strategyAddrs]);

  const totalManaged = rows.reduce((a, r) => a + r.value, 0);
  const totalAssetsNum = totalAssets ? Number(formatUnits(totalAssets, 18)) : 0;
  const idleMusd = Math.max(0, totalAssetsNum - totalManaged);
  const pendingMusd = totalPendingAssets
    ? Number(formatUnits(totalPendingAssets, 18))
    : 0;

  // Only show the skeleton while something is actually loading.
  const isLoading =
    isLoadingCount || (hasStrategies && !perStrategyData);

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-semibold text-lg">Strategy allocation</h3>
          <p className="text-xs text-[var(--fg-subtle)] mt-1">
            How MUSD in the router is deployed across venues
          </p>
        </div>
        <span className="pill pill-accent">
          <span className="live-dot" />
          Live
        </span>
      </div>

      {/* Total stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Managed" value={totalManaged} />
        <Stat label="Idle" value={idleMusd} muted />
        <Stat label="Pending" value={pendingMusd} muted />
      </div>

      {/* Stacked bar */}
      {rows.length > 0 && totalManaged > 0 && (
        <div className="mb-6">
          <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-elevated-hover)]">
            {rows.map((r) => {
              const pct = (r.value / totalManaged) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={r.address}
                  className="h-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: r.color }}
                  title={`${r.name}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Rows */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-[var(--bg-elevated-hover)] animate-pulse"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-[var(--fg-subtle)] text-sm">
          <p>No yield strategies are active yet.</p>
          <p className="text-xs mt-1">
            Deposited MUSD is held idle in the router until strategies are added.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const pct = totalManaged > 0 ? (r.value / totalManaged) * 100 : 0;
            const capPct = r.cap ? (r.value / r.cap) * 100 : null;
            const targetPct = r.targetBps / 100;
            return (
              <li
                key={r.address}
                className="rounded-xl p-4"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: r.color }}
                    />
                    <span className="font-medium text-sm">{r.name}</span>
                  </div>
                  <span className="tabular text-sm font-semibold">
                    {r.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                    <span className="text-[var(--fg-subtle)] text-xs font-normal">
                      MUSD
                    </span>
                  </span>
                </div>

                <div className="flex justify-between text-xs text-[var(--fg-subtle)] mb-2">
                  <span>
                    {pct.toFixed(1)}% of portfolio
                    {targetPct > 0 && (
                      <span className="ml-2 text-[var(--fg-muted)]">
                        (target {targetPct.toFixed(0)}%)
                      </span>
                    )}
                  </span>
                  {capPct !== null && <span>{capPct.toFixed(0)}% of cap</span>}
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: r.color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[10px] text-[var(--fg-subtle)] mt-4 text-center">
        Values refresh every 15s. Pending = awaiting async redemption from a
        vault.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] mb-1">
        {label}
      </div>
      <div
        className={`tabular text-base font-semibold ${
          muted ? 'text-[var(--fg-muted)]' : ''
        }`}
      >
        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
      <div className="text-[10px] text-[var(--fg-subtle)]">MUSD</div>
    </div>
  );
}
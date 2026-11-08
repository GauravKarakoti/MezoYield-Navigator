'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { type Abi, formatUnits, parseUnits } from 'viem';
import deployment from '../../../deployments/combined-deployment-31611.json';

const ROUTER = deployment.contracts.YieldRouter.address as `0x${string}`;
const routerAbi = deployment.contracts.YieldRouter.abi as Abi;

const NYMUSD = deployment.contracts.nyMUSD.address as `0x${string}`;
const erc20Abi = deployment.contracts.nyMUSD.abi as Abi;

const MUSD = ((deployment.contracts as any).MUSD?.address ??
  process.env.NEXT_PUBLIC_MUSD ??
  '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503') as `0x${string}`;

type Tab = 'deposit' | 'withdraw';

export function DepositCard() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>('deposit');
  const [amount, setAmount] = useState('');

  // ─── Read state ───
  const { data: ppsRaw, refetch: refetchPps } = useReadContract({
    address: ROUTER,
    abi: routerAbi,
    functionName: 'pricePerShare',
    query: { refetchInterval: 12_000 },
  });

  const { data: musdBalanceRaw, refetch: refetchMusdBalance } = useReadContract({
    address: MUSD,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });

  const { data: nymusdBalanceRaw, refetch: refetchShares } = useReadContract({
    address: NYMUSD,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });

  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: MUSD,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, ROUTER] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });

  const pps = ppsRaw as bigint | undefined;
  const musdBalance = musdBalanceRaw as bigint | undefined;
  const nymusdBalance = nymusdBalanceRaw as bigint | undefined;
  const allowance = allowanceRaw as bigint | undefined;

  // ─── Derived values ───
  const ppsNum = useMemo(
    () => (pps ? Number(formatUnits(pps, 18)) : 1),
    [pps]
  );

  const positionMusd = useMemo(() => {
    if (!nymusdBalance || !pps) return 0;
    return Number(formatUnits((nymusdBalance * pps) / BigInt(10) ** BigInt(18), 18));
  }, [nymusdBalance, pps]);

  const amountWei = useMemo(() => {
    try {
      return amount ? parseUnits(amount, 18) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, [amount]);

  const needsApproval =
    tab === 'deposit' &&
    amountWei > BigInt(0) &&
    allowance !== undefined &&
    allowance < amountWei;

  const insufficientDeposit =
    tab === 'deposit' &&
    musdBalance !== undefined &&
    amountWei > musdBalance;

  const insufficientWithdraw = useMemo(() => {
    if (tab !== 'withdraw' || !nymusdBalance || !pps) return false;
    const sharesNeeded = (amountWei * BigInt(10) ** BigInt(18)) / pps;
    return sharesNeeded > nymusdBalance;
  }, [tab, amountWei, nymusdBalance, pps]);

  // ─── Write: approve ───
  const {
    data: approveHash,
    writeContract: approve,
    isPending: isApproving,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // ─── Write: deposit ───
  const {
    data: depositHash,
    writeContract: deposit,
    isPending: isDepositSubmitting,
    error: depositError,
    reset: resetDeposit,
  } = useWriteContract();

  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({ hash: depositHash });

  // ─── Write: withdraw ───
  const {
    data: withdrawHash,
    writeContract: withdraw,
    isPending: isWithdrawSubmitting,
    error: withdrawError,
    reset: resetWithdraw,
  } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash });

  // ─── Effects: refresh reads on success ───
  useEffect(() => {
    if (isApproveSuccess) refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isDepositSuccess) {
      setAmount('');
      refetchPps();
      refetchMusdBalance();
      refetchShares();
      refetchAllowance();
    }
  }, [isDepositSuccess, refetchPps, refetchMusdBalance, refetchShares, refetchAllowance]);

  useEffect(() => {
    if (isWithdrawSuccess) {
      setAmount('');
      refetchPps();
      refetchMusdBalance();
      refetchShares();
    }
  }, [isWithdrawSuccess, refetchPps, refetchMusdBalance, refetchShares]);

  // ─── Handlers ───
  const onApprove = () => {
    if (!amountWei) return;
    resetDeposit();
    resetWithdraw();
    approve({
      address: MUSD,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ROUTER, amountWei],
    });
  };

  const onDeposit = () => {
    if (!amountWei) return;
    resetApprove();
    deposit({
      address: ROUTER,
      abi: routerAbi,
      functionName: 'deposit',
      args: [amountWei],
    });
  };

  const onWithdraw = () => {
    if (!amountWei || !pps) return;
    resetApprove();
    const shares = (amountWei * BigInt(10) ** BigInt(18)) / pps;
    if (shares === BigInt(0)) return;
    withdraw({
      address: ROUTER,
      abi: routerAbi,
      functionName: 'withdraw',
      args: [shares],
    });
  };

  const setMax = () => {
    if (tab === 'deposit' && musdBalance) {
      setAmount(formatUnits(musdBalance, 18));
    } else if (tab === 'withdraw') {
      setAmount(positionMusd.toString());
    }
  };

  // ─── UI state ───
  const isBusy =
    isApproving ||
    isApproveConfirming ||
    isDepositSubmitting ||
    isDepositConfirming ||
    isWithdrawSubmitting ||
    isWithdrawConfirming;

  const errorMsg =
    (approveError as any)?.shortMessage ||
    (depositError as any)?.shortMessage ||
    (withdrawError as any)?.shortMessage ||
    null;

  // ─── Button state ───
  let buttonLabel = tab === 'deposit' ? 'Deposit MUSD' : 'Withdraw MUSD';
  let buttonAction = tab === 'deposit' ? onDeposit : onWithdraw;
  let buttonDisabled = !isConnected || !amountWei || amountWei === BigInt(0) || isBusy;

  if (!isConnected) buttonLabel = 'Connect Wallet';
  else if (needsApproval) {
    buttonLabel = isApproveConfirming
      ? 'Approving…'
      : isApproving
      ? 'Confirm in wallet…'
      : 'Approve MUSD';
    buttonAction = onApprove;
  } else if (insufficientDeposit) {
    buttonLabel = 'Insufficient MUSD';
    buttonDisabled = true;
  } else if (insufficientWithdraw) {
    buttonLabel = 'Insufficient position';
    buttonDisabled = true;
  } else if (isDepositSubmitting) buttonLabel = 'Confirm in wallet…';
  else if (isDepositConfirming) buttonLabel = 'Depositing…';
  else if (isWithdrawSubmitting) buttonLabel = 'Confirm in wallet…';
  else if (isWithdrawConfirming) buttonLabel = 'Withdrawing…';

  return (
    <div className="card">
      {/* Tabs */}
      <div className="tabs">
        <button
          className="tab"
          data-active={tab === 'deposit'}
          onClick={() => setTab('deposit')}
        >
          Deposit
        </button>
        <button
          className="tab"
          data-active={tab === 'withdraw'}
          onClick={() => setTab('withdraw')}
        >
          Withdraw
        </button>
      </div>

      {/* Balance summary */}
      <div className="flex justify-between items-start mb-4 text-sm">
        <div>
          <div className="text-[var(--fg-subtle)] text-xs uppercase tracking-wider mb-1">
            Your position
          </div>
          <div className="tabular text-lg font-semibold">
            {positionMusd.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
            <span className="text-[var(--fg-muted)] text-sm font-normal">MUSD</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[var(--fg-subtle)] text-xs uppercase tracking-wider mb-1">
            Price per share
          </div>
          <div className="tabular text-lg font-semibold">
            {ppsNum.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Amount input */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[var(--fg-subtle)]">
            {tab === 'deposit' ? 'Amount to deposit' : 'Amount to withdraw'}
          </span>
          <button className="btn-ghost" onClick={setMax} disabled={isBusy}>
            Max
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (/^\d*\.?\d*$/.test(v)) setAmount(v);
            }}
            disabled={isBusy}
          />
          <span className="text-[var(--fg-muted)] font-medium text-lg shrink-0">
            MUSD
          </span>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs">
          <span className="text-[var(--fg-subtle)]">
            {tab === 'deposit'
              ? `Available: ${musdBalance ? Number(formatUnits(musdBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'} MUSD`
              : `Available: ${positionMusd.toLocaleString(undefined, { maximumFractionDigits: 4 })} MUSD`}
          </span>
        </div>
      </div>

      {/* Info row */}
      <div className="flex justify-between text-xs text-[var(--fg-muted)] mb-4 px-1">
        <span>You receive</span>
        <span className="tabular">
          {tab === 'deposit'
            ? amountWei && pps
              ? `${Number(formatUnits((amountWei * BigInt(10) ** BigInt(18)) / pps, 18)).toFixed(4)} nyMUSD`
              : '—'
            : amount
            ? `${amount} MUSD`
            : '—'}
        </span>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="alert alert-error mb-4">
          {errorMsg}
        </div>
      )}

      {/* Success */}
      {isDepositSuccess && (
        <div className="alert alert-success mb-4">
          Deposit confirmed. Your shares are now accruing yield.
        </div>
      )}
      {isWithdrawSuccess && (
        <div className="alert alert-success mb-4">
          Withdrawal confirmed. MUSD transferred to your wallet.
        </div>
      )}

      {/* CTA */}
      <button
        className="btn btn-primary"
        onClick={buttonAction}
        disabled={buttonDisabled}
      >
        {isBusy && (
          <span
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
        )}
        {buttonLabel}
      </button>

      {!isConnected && (
        <p className="text-center text-xs text-[var(--fg-subtle)] mt-3">
          Connect your wallet to deposit or withdraw.
        </p>
      )}
    </div>
  );
}
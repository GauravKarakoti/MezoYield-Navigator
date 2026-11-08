import { createWalletClient, createPublicClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from './config.js';
import { logger } from './logger.js';

type StrategyApy = { address: `0x${string}`; apyBps: number };

export async function tick() {
  const account = privateKeyToAccount(config.privateKey);
  const pub = createPublicClient({ transport: http(config.rpc) });
  const wallet = createWalletClient({ account, transport: http(config.rpc) });

  // Discover strategies from the router so the keeper always matches on-chain state.
  const count = (await pub.readContract({
    address: config.router,
    abi: config.routerAbi,
    functionName: 'strategyCount',
  })) as bigint;

  if (count < 2n) {
    logger.info({ count: count.toString() }, 'Fewer than 2 strategies registered, nothing to rebalance');
    return;
  }

  const strategies = (await Promise.all(
    Array.from({ length: Number(count) }, (_, i) =>
      pub.readContract({
        address: config.router,
        abi: config.routerAbi,
        functionName: 'strategies',
        args: [BigInt(i)],
      })
    )
  )) as `0x${string}`[];

  // Fetch APY per strategy from the subgraph / external feed.
  const apys = await fetchApys(strategies);
  if (apys.length < 2) {
    logger.info('No APY data for at least two strategies, skipping');
    return;
  }

  // Sort by APY desc.
  apys.sort((a, b) => b.apyBps - a.apyBps);
  const best = apys[0]!;
  const worst = apys[apys.length - 1]!;
  const diff = best.apyBps - worst.apyBps;
  if (diff < config.apyDiffBps) {
    logger.info({ diff, threshold: config.apyDiffBps }, 'Yield diff below threshold');
    return;
  }

  // Compute the amount to move: cap by destination's room.
  const [srcVal, dstVal, dstCap] = (await Promise.all([
    pub.readContract({
      address: config.router,
      abi: config.routerAbi,
      functionName: 'strategyValue',
      args: [worst.address],
    }),
    pub.readContract({
      address: config.router,
      abi: config.routerAbi,
      functionName: 'strategyValue',
      args: [best.address],
    }),
    pub.readContract({
      address: config.router,
      abi: config.routerAbi,
      functionName: 'strategyCap',
      args: [best.address],
    }),
  ])) as [bigint, bigint, bigint];

  const room = dstCap > dstVal ? dstCap - dstVal : 0n;
  const amount = room < srcVal ? room : srcVal;

  if (amount === 0n) {
    logger.info('Nothing to move (source empty or no room at destination)');
    return;
  }

  if (config.dryRun) {
    logger.info(
      { src: worst.address, dst: best.address, amount: amount.toString(), diffBps: diff },
      'DRY RUN rebalance'
    );
    return;
  }

  logger.info(
    { src: worst.address, dst: best.address, amount: formatUnits(amount, 18) },
    'Submitting rebalance'
  );
  const hash = await wallet.writeContract({
    address: config.router,
    abi: config.routerAbi,
    functionName: 'rebalance',
    args: [worst.address, best.address, amount],
  } as any);
  logger.info({ hash }, 'Rebalance submitted');

  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') {
    logger.error({ hash }, 'Rebalance transaction reverted');
    return;
  }
  logger.info({ hash, block: receipt.blockNumber.toString() }, 'Rebalance confirmed');
}

async function fetchApys(strategies: `0x${string}`[]): Promise<StrategyApy[]> {
  // TODO: query your subgraph (config.subgraphUrl) for current APY per strategy.
  if (config.useStaticApys) {
    logger.warn('Using STATIC placeholder APYs, not real yield data');
    return strategies.map((address, i) => ({ address, apyBps: 300 + i * 100 }));
  }
  logger.warn('No APY feed configured (set SUBGRAPH_URL or STATIC_APYS=1 for testing)');
  return [];
}
import { createWalletClient, createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from './config.js';
import { logger } from './logger.js';

const routerAbi = parseAbi([
  'function strategyValue(address) view returns (uint256)',
  'function strategyCap(address) view returns (uint256)',
  'function rebalance(address from, address to, uint256 amount)',
  'function KEEPER_ROLE() view returns (bytes32)',
]);

export async function tick() {
  const account = privateKeyToAccount(config.privateKey);
  const pub = createPublicClient({ transport: http(config.rpc) });
  const wallet = createWalletClient({ account, transport: http(config.rpc) });

  // Fetch APY per strategy from the subgraph / external feed.
  const apys = await fetchApys();
  if (apys.length < 2) {
    logger.info('Not enough strategies for rebalancing');
    return;
  }

  // Sort by APY desc.
  apys.sort((a, b) => b.apyBps - a.apyBps);
  const best = apys[0];
  const worst = apys[apys.length - 1];
  const diff = best!.apyBps - worst!.apyBps;
  if (diff < config.apyDiffBps) {
    logger.info({ diff, threshold: config.apyDiffBps }, 'Yield diff below threshold');
    return;
  }

  // Compute the amount to move: cap by destination's room.
  const [srcVal, dstVal, dstCap] = await Promise.all([
    pub.readContract({ address: config.router, abi: routerAbi, functionName: 'strategyValue', args: [worst!.address] }),
    pub.readContract({ address: config.router, abi: routerAbi, functionName: 'strategyValue', args: [best!.address] }),
    pub.readContract({ address: config.router, abi: routerAbi, functionName: 'strategyCap', args: [best!.address] }),
  ]);

  const room = dstCap > dstVal ? dstCap - dstVal : 0n;
  const amount = room < srcVal ? room : srcVal;

  if (amount === 0n) {
    logger.info('No room at destination');
    return;
  }

  if (config.dryRun) {
    logger.info({ src: worst!.address, dst: best!.address, amount: amount.toString(), diffBps: diff }, 'DRY RUN rebalance');
    return;
  }

  logger.info({ src: worst!.address, dst: best!.address, amount: formatUnits(amount, 18) }, 'Submitting rebalance');
  const hash = await wallet.writeContract({
    address: config.router,
    abi: routerAbi,
    functionName: 'rebalance',
    args: [worst!.address, best!.address, amount],
  } as any);
  logger.info({ hash }, 'Rebalance submitted');
}

async function fetchApys(): Promise<{ address: `0x${string}`; apyBps: number }[]> {
  // TODO: query your subgraph for current APY per strategy.
  // Fallback: return static values matching off-chain feeds.
  return config.strategies.map((address, i) => ({ address, apyBps: 300 + i * 100 }));
}
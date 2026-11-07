import 'dotenv/config';

export const config = {
  rpc: process.env.MEZO_TESTNET_RPC!,
  privateKey: process.env.KEEPER_PRIVATE_KEY as `0x${string}`,
  router: process.env.ROUTER_ADDRESS as `0x${string}`,
  strategies: (process.env.STRATEGIES ?? '').split(',').filter(Boolean) as `0x${string}`[],
  apyDiffBps: Number(process.env.APY_DIFF_BPS ?? '200'), // 2%
  cooldownSec: Number(process.env.COOLDOWN_SEC ?? '3600'),
  dryRun: process.env.DRY_RUN === '1',
  subgraphUrl: process.env.SUBGRAPH_URL ?? '',
};
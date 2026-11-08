import 'dotenv/config';
import fs from 'node:fs';
import type { Abi } from 'viem';

const chainId = process.env.CHAIN_ID ?? '31611';
const deploymentUrl = new URL(
  `../../deployments/combined-deployment-${chainId}.json`,
  import.meta.url
);

const deployment = JSON.parse(fs.readFileSync(deploymentUrl, 'utf8'));
const { YieldRouter } = deployment.contracts;

if (!YieldRouter?.address) {
  throw new Error(`YieldRouter missing from combined-deployment-${chainId}.json`);
}
if (!process.env.MEZO_TESTNET_RPC) {
  throw new Error('MEZO_TESTNET_RPC is not set');
}

const rawKey = (process.env.KEEPER_PRIVATE_KEY ?? '').trim();
if (!rawKey) {
  throw new Error('KEEPER_PRIVATE_KEY is not set');
}
const privateKey = (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) as `0x${string}`;

export const config = {
  rpc: process.env.MEZO_TESTNET_RPC,
  privateKey,
  router: YieldRouter.address as `0x${string}`,
  routerAbi: YieldRouter.abi as Abi,
  // Strategies are discovered on-chain from the router each tick (see tick.ts).
  apyDiffBps: Number(process.env.APY_DIFF_BPS ?? '50'), // 0.5%
  cooldownSec: Number(process.env.COOLDOWN_SEC ?? '60'),
  dryRun: process.env.DRY_RUN === '1',
  // Fake APYs are opt-in only. Never enable this on a deployment that holds real funds.
  useStaticApys: process.env.STATIC_APYS === '1',
  subgraphUrl: process.env.SUBGRAPH_URL ?? '',
};
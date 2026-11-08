import 'dotenv/config';
import fs from 'node:fs';
import type { Abi } from 'viem';

const chainId = process.env.CHAIN_ID ?? '31611';
const deploymentUrl = new URL(
  `../../deployments/combined-deployment-${chainId}.json`,
  import.meta.url
);

const deployment = JSON.parse(fs.readFileSync(deploymentUrl, 'utf8'));
const { YieldRouter, SMusdStrategy, DittoStrategy } = deployment.contracts;

const rawKey = (process.env.KEEPER_PRIVATE_KEY ?? '').trim();
const privateKey = (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) as `0x${string}`;

export const config = {
  rpc: process.env.MEZO_TESTNET_RPC!,
  privateKey,
  router: YieldRouter.address as `0x${string}`,
  routerAbi: YieldRouter.abi as Abi,
  strategies: [SMusdStrategy.address, DittoStrategy.address] as `0x${string}`[],
  apyDiffBps: Number(process.env.APY_DIFF_BPS ?? '50'), // 0.5%
  cooldownSec: Number(process.env.COOLDOWN_SEC ?? '60'),
  dryRun: process.env.DRY_RUN === '1',
  subgraphUrl: process.env.SUBGRAPH_URL ?? '',
};
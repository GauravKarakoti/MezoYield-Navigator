import { tick } from './rebalancer.js';
import { logger } from './logger.js';

const INTERVAL_MS = 60_000;

logger.info('MezoYield Keeper starting');
let lastRun = 0;

async function loop() {
  try {
    if (Date.now() - lastRun < 60_000) return;
    lastRun = Date.now();
    await tick();
  } catch (e) {
    logger.error({ err: e }, 'Tick failed');
  }
}

setInterval(loop, INTERVAL_MS);
loop();
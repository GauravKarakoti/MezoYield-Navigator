import fs from 'fs';
import path from 'path';
import "dotenv/config";

// Adjust path if necessary to match where your deployment script saves files
const chainId = process.env.CHAIN_ID;
const rootDir = process.cwd();
const deploymentPath = path.join(rootDir, `deployments/deployment-${chainId}.json`);

if (!fs.existsSync(deploymentPath)) {
  console.error(`❌ Deployment file not found at: ${deploymentPath}`);
  console.error('Run your Foundry deployment script first.');
  process.exit(1);
}

const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

// Map contract names to their respective artifact paths in Foundry's `out/` directory
const contractArtifactMap = {
  nyMUSD: 'nyMUSD.sol/nyMUSD.json',
  YieldRouter: 'YieldRouter.sol/YieldRouter.json',
  SMusdStrategy: 'SMusdStrategy.sol/SMusdStrategy.json',
  DittoStrategy: 'DittoStrategy.sol/DittoStrategy.json',
  BoostManager: 'BoostManager.sol/BoostManager.json',
  GaugeVoteModule: 'GaugeVoteModule.sol/GaugeVoteModule.json',
};

const combinedOutput = {
  chainId: Number(chainId),
  timestamp: new Date().toISOString(),
  contracts: {},
};

for (const [name, address] of Object.entries(deploymentData)) {
  if (name === 'data') continue; // Skip standard Foundry json root key if present
  
  const artifactSubPath = contractArtifactMap[name];
  if (!artifactSubPath) {
    console.warn(`⚠️ No artifact mapping found for contract: ${name}`);
    continue;
  }

  const artifactPath = path.join(rootDir, 'out', artifactSubPath);
  if (!fs.existsSync(artifactPath)) {
    console.warn(`⚠️ Compiled artifact not found at: ${artifactPath}. Did you run 'forge build'?`);
    continue;
  }

  const artifactJson = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  combinedOutput.contracts[name] = {
    address: address,
    abi: artifactJson.abi,
    bytecode: artifactJson.bytecode?.object,
  };
}

const outputPath = path.join(rootDir, `deployments/combined-deployment-${chainId}.json`);
fs.writeFileSync(outputPath, JSON.stringify(combinedOutput, null, 2));

console.log(`✅ Combined deployments with ABIs successfully saved to: ${outputPath}`);
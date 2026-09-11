/**
 * HoneyChain — Smart Contract Deployment Script (Hardhat 3, ESM)
 *
 * Usage:
 *   1. Start Hardhat local node:
 *      npx hardhat node
 *
 *   2. Deploy to localhost (in a separate terminal):
 *      npx hardhat run scripts/deploy.js --network localhost
 *
 *   3. Copy the printed values into server/.env
 */

import { network } from 'hardhat';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  // Hardhat 3: ethers is on the network connection, not hre directly
  const { ethers } = await network.connect();

  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log('\n🍯 HoneyChain — Smart Contract Deployment');
  console.log('==========================================');
  console.log('Deployer address:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'ETH');

  const net = await ethers.provider.getNetwork();
  console.log('Network chainId:', net.chainId.toString());
  console.log('');

  console.log('⏳ Deploying HoneyChainTraceability...');
  const Factory = await ethers.getContractFactory('HoneyChainTraceability');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  console.log('✅ Contract deployed!');
  console.log('   Address:  ', contractAddress);
  console.log('   Tx hash:  ', deployTx?.hash);
  console.log('   Owner:    ', deployer.address);
  console.log('');

  // Save deployment info
  const deploymentsDir = join(__dirname, '../deployments');
  if (!existsSync(deploymentsDir)) mkdirSync(deploymentsDir, { recursive: true });

  const networkName = net.name === 'unknown' ? 'localhost' : net.name;
  const info = {
    network: networkName,
    chainId: Number(net.chainId),
    contractAddress,
    deployerAddress: deployer.address,
    deployTxHash: deployTx?.hash,
    deployedAt: new Date().toISOString(),
  };

  writeFileSync(
    join(deploymentsDir, `${networkName}.json`),
    JSON.stringify(info, null, 2)
  );
  console.log(`📄 Deployment info saved: deployments/${networkName}.json`);

  console.log('\n📝 ADD THESE TO server/.env:');
  console.log('================================');
  console.log(`HONEYCHAIN_CONTRACT_ADDRESS=${contractAddress}`);
  console.log('BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545');
  console.log('BLOCKCHAIN_CHAIN_ID=31337');
  console.log('BLOCKCHAIN_PRIVATE_KEY=<account_#0_private_key_from_hardhat_node_output>');
  console.log('================================\n');
}

main().catch((err) => {
  console.error('❌ Deployment failed:', err.message || err);
  process.exit(1);
});

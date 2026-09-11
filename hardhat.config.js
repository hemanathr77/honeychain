import hardhatEthers from '@nomicfoundation/hardhat-ethers';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, 'server', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const rpcUrl     = process.env.BLOCKCHAIN_RPC_URL || '';
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '';

/** @type {import('hardhat/config').HardhatUserConfig} */
export default {
  plugins: [hardhatEthers],
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    localhost: {
      type: 'http',
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    ...(rpcUrl && privateKey
      ? {
          sepolia: {
            type: 'http',
            url: rpcUrl,
            accounts: [privateKey],
            chainId: 11155111,
          },
        }
      : {}),
  },
  paths: {
    sources:   './contracts',
    tests:     './test',
    cache:     './cache',
    artifacts: './artifacts',
  },
};

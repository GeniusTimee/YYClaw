const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────
const PRIVATE_KEY = process.env.SPENDER_PRIVATE_KEY;
if (!PRIVATE_KEY) { console.error('Set SPENDER_PRIVATE_KEY env var'); process.exit(1); }

const CHAINS = {
  bsc: {
    rpc: 'https://bsc-dataseed1.ninicoin.io/',
    chainId: 56,
    name: 'BSC',
    explorer: 'https://bscscan.com',
  },
  base: {
    rpc: 'https://mainnet.base.org',
    chainId: 8453,
    name: 'Base',
    explorer: 'https://basescan.org',
  },
};

// Compiled contract ABI + Bytecode (from solc)
// We'll use a minimal inline compilation approach
const SOLC_INPUT = {
  language: 'Solidity',
  sources: {
    'YYClawSpender.sol': {
      content: fs.readFileSync(path.join(__dirname, 'YYClawSpender.sol'), 'utf8'),
    },
  },
  settings: {
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    optimizer: { enabled: true, runs: 200 },
  },
};

async function compile() {
  let solc;
  try {
    solc = require('solc');
  } catch {
    console.error('Install solc: npm install solc');
    process.exit(1);
  }
  const output = JSON.parse(solc.compile(JSON.stringify(SOLC_INPUT)));
  if (output.errors) {
    const errs = output.errors.filter(e => e.severity === 'error');
    if (errs.length) {
      errs.forEach(e => console.error(e.formattedMessage));
      process.exit(1);
    }
  }
  const contract = output.contracts['YYClawSpender.sol']['YYClawSpender'];
  return {
    abi: contract.abi,
    bytecode: '0x' + contract.evm.bytecode.object,
  };
}

async function deploy(chainKey, operatorAddress, treasuryAddress) {
  const chain = CHAINS[chainKey];
  if (!chain) { console.error(`Unknown chain: ${chainKey}. Use: bsc, base`); process.exit(1); }

  console.log(`\n🚀 Deploying YYClawSpender to ${chain.name}...`);
  console.log(`   Operator: ${operatorAddress}`);
  console.log(`   Treasury: ${treasuryAddress}`);

  const { abi, bytecode } = await compile();
  console.log('   ✅ Compiled');

  const provider = new ethers.JsonRpcProvider(chain.rpc);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log(`   Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} ${chainKey === 'bsc' ? 'BNB' : 'ETH'}`);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(operatorAddress, treasuryAddress);
  console.log(`   Tx: ${contract.deploymentTransaction().hash}`);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`\n   ✅ Deployed!`);
  console.log(`   Contract: ${address}`);
  console.log(`   Explorer: ${chain.explorer}/address/${address}`);

  // Save deployment info
  const deployFile = path.join(__dirname, `deployment-${chainKey}.json`);
  const info = {
    chain: chainKey,
    chainId: chain.chainId,
    address,
    operator: operatorAddress,
    treasury: treasuryAddress,
    deployer: wallet.address,
    txHash: contract.deploymentTransaction().hash,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(deployFile, JSON.stringify(info, null, 2));
  console.log(`   Saved: ${deployFile}\n`);

  return info;
}

// ─── CLI ──────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage:');
    console.log('  node deploy.js <chain> <operator_address> <treasury_address>');
    console.log('');
    console.log('Examples:');
    console.log('  node deploy.js bsc 0xOperator... 0xTreasury...');
    console.log('  node deploy.js base 0xOperator... 0xTreasury...');
    console.log('  node deploy.js both 0xOperator... 0xTreasury...');
    console.log('');
    console.log('Env: SPENDER_PRIVATE_KEY=0x...');
    process.exit(0);
  }

  const [chainArg, operator, treasury] = args;

  if (chainArg === 'both') {
    const bsc = await deploy('bsc', operator, treasury);
    const base = await deploy('base', operator, treasury);
    console.log('\n📋 Summary:');
    console.log(`   BSC:  ${bsc.address}`);
    console.log(`   Base: ${base.address}`);
  } else {
    await deploy(chainArg, operator, treasury);
  }
}

main().catch(e => { console.error(e); process.exit(1); });

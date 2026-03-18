const OpenAI = require('openai');
const axios = require('axios');
const { ethers } = require('ethers');

const YYCLAW_API_KEY = process.env.YYCLAW_API_KEY || '';
const YYCLAW_BASE_URL = process.env.YYCLAW_BASE_URL || 'https://crypto.yyclaw.cc/v1';
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '';
const BSC_RPC = 'https://bsc-dataseed1.ninicoin.io/';

const client = new OpenAI({ apiKey: YYCLAW_API_KEY, baseURL: YYCLAW_BASE_URL });
const provider = new ethers.JsonRpcProvider(BSC_RPC);

// ─── Honeypot Detection ───────────────────────────────────
async function checkHoneypot(tokenAddress) {
  try {
    const res = await axios.get(`https://api.honeypot.is/v2/IsHoneypot?address=${tokenAddress}&chainID=56`, { timeout: 10000 });
    const d = res.data;
    return {
      isHoneypot: d.honeypotResult?.isHoneypot || false,
      honeypotReason: d.honeypotResult?.honeypotReason || '',
      buyTax: d.simulationResult?.buyTax || 0,
      sellTax: d.simulationResult?.sellTax || 0,
      transferTax: d.simulationResult?.transferTax || 0,
      holderCount: d.holderAnalysis?.holders || 'unknown',
      pairAddress: d.pair?.pairAddress || '',
      tokenName: d.token?.name || '',
      tokenSymbol: d.token?.symbol || '',
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ─── Contract Source from BscScan ─────────────────────────
async function getContractSource(address) {
  if (!BSCSCAN_API_KEY) return { error: 'BSCSCAN_API_KEY not set' };
  try {
    const res = await axios.get(`https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${address}&apikey=${BSCSCAN_API_KEY}`, { timeout: 10000 });
    const data = res.data.result?.[0];
    if (!data || !data.SourceCode) return { verified: false };
    return {
      verified: true,
      contractName: data.ContractName,
      compiler: data.CompilerVersion,
      sourceCode: data.SourceCode.slice(0, 8000), // truncate for AI analysis
      proxy: data.Proxy === '1',
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ─── Token Info ───────────────────────────────────────────
async function getTokenInfo(address) {
  try {
    const abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function totalSupply() view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function owner() view returns (address)',
    ];
    const contract = new ethers.Contract(address, abi, provider);
    const [name, symbol, totalSupply, decimals] = await Promise.all([
      contract.name().catch(() => 'unknown'),
      contract.symbol().catch(() => 'unknown'),
      contract.totalSupply().catch(() => 0n),
      contract.decimals().catch(() => 18),
    ]);
    let owner = 'unknown';
    try { owner = await contract.owner(); } catch {}
    return { name, symbol, totalSupply: ethers.formatUnits(totalSupply, decimals), decimals, owner };
  } catch (e) {
    return { error: e.message };
  }
}

// ─── Whale / Large Transfer Monitor ──────────────────────
async function getRecentLargeTransfers(tokenAddress, minUsd = 10000) {
  if (!BSCSCAN_API_KEY) return [];
  try {
    const res = await axios.get(`https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${tokenAddress}&page=1&offset=20&sort=desc&apikey=${BSCSCAN_API_KEY}`, { timeout: 10000 });
    return (res.data.result || []).map(tx => ({
      from: tx.from,
      to: tx.to,
      value: ethers.formatUnits(tx.value, parseInt(tx.tokenDecimal || '18')),
      hash: tx.hash,
      time: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    }));
  } catch { return []; }
}

// ─── AI Security Analysis ─────────────────────────────────
async function analyzeWithAI(data) {
  const prompt = `You are a BSC blockchain security expert. Analyze this token/contract and provide a security assessment.

Token Info:
${JSON.stringify(data.tokenInfo, null, 2)}

Honeypot Check:
${JSON.stringify(data.honeypot, null, 2)}

Contract Source (verified: ${data.source?.verified || false}):
${data.source?.verified ? `Name: ${data.source.contractName}\nCompiler: ${data.source.compiler}\nProxy: ${data.source.proxy}\n\nSource (truncated):\n${data.source.sourceCode?.slice(0, 4000)}` : 'Not verified on BscScan'}

Recent Transfers:
${JSON.stringify(data.transfers?.slice(0, 5), null, 2)}

Provide:
1. Security Score (0-100, where 100 is safest)
2. Risk Level (SAFE / LOW / MEDIUM / HIGH / CRITICAL)
3. Key Findings (bullet points)
4. Red Flags (if any)
5. Recommendation (buy/avoid/caution)

Be concise and direct.`;

  const response = await client.chat.completions.create({
    model: 'gemini-3-flash',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1024,
  });
  return response.choices[0].message.content;
}

// ─── Main: Full Security Scan ─────────────────────────────
async function securityScan(address) {
  console.log(`\n🔍 Scanning: ${address}\n`);

  const [tokenInfo, honeypot, source, transfers] = await Promise.all([
    getTokenInfo(address),
    checkHoneypot(address),
    getContractSource(address),
    getRecentLargeTransfers(address),
  ]);

  console.log('📋 Token:', tokenInfo.name, `(${tokenInfo.symbol})`);
  console.log('🍯 Honeypot:', honeypot.isHoneypot ? '⚠️ YES' : '✅ NO');
  if (honeypot.buyTax) console.log(`   Buy Tax: ${honeypot.buyTax}% | Sell Tax: ${honeypot.sellTax}%`);
  console.log('📝 Contract:', source.verified ? `✅ Verified (${source.contractName})` : '❌ Not verified');
  console.log('👤 Owner:', tokenInfo.owner);
  console.log(`📊 Recent transfers: ${transfers.length}`);

  console.log('\n🤖 AI Analysis...\n');
  const analysis = await analyzeWithAI({ tokenInfo, honeypot, source, transfers });
  console.log(analysis);

  return { tokenInfo, honeypot, source, transfers, analysis };
}

// ─── Interactive Chat Mode ────────────────────────────────
async function chat(userMessage, history = []) {
  const systemPrompt = `You are YYClaw SafeGuard, a BSC blockchain security AI agent.

You help users:
- Analyze token contracts for security risks (honeypot, rug pull, etc.)
- Monitor wallet addresses for suspicious activity
- Explain DeFi security concepts
- Check if a contract is safe to interact with

When a user provides a contract address (0x...), automatically run a security scan.
Be concise, direct, and security-focused. Use emojis for risk indicators.

Available chains: BSC (BNB Smart Chain)
Powered by YYClaw AI Gateway (pay-per-call, on-chain billing).`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  // Check if user sent a contract address
  const addressMatch = userMessage.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch) {
    const scanResult = await securityScan(addressMatch[0]);
    messages.push({
      role: 'user',
      content: `Here is the scan result for ${addressMatch[0]}:\n${JSON.stringify({
        tokenInfo: scanResult.tokenInfo,
        honeypot: scanResult.honeypot,
        contractVerified: scanResult.source?.verified,
        contractName: scanResult.source?.contractName,
        recentTransfers: scanResult.transfers?.length,
      }, null, 2)}\n\nPlease provide a clear security assessment based on this data.`
    });
  }

  const response = await client.chat.completions.create({
    model: 'gemini-3-flash',
    messages,
    temperature: 0.4,
    max_tokens: 1024,
  });

  return response.choices[0].message.content;
}

// ─── CLI Entry ────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'scan' && args[1]) {
    await securityScan(args[1]);
  } else if (args[0] === 'chat') {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const history = [];
    console.log('🛡️  YYClaw SafeGuard — BSC Security Agent');
    console.log('   Paste a contract address or ask a security question.');
    console.log('   Type "exit" to quit.\n');

    const ask = () => {
      rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit') { rl.close(); return; }
        try {
          const reply = await chat(input, history);
          console.log(`\n🛡️ SafeGuard: ${reply}\n`);
          history.push({ role: 'user', content: input });
          history.push({ role: 'assistant', content: reply });
        } catch (e) {
          console.error('Error:', e.message);
        }
        ask();
      });
    };
    ask();
  } else {
    console.log('Usage:');
    console.log('  node agent.js scan <contract_address>   — Full security scan');
    console.log('  node agent.js chat                      — Interactive chat mode');
  }
}

module.exports = { securityScan, chat, checkHoneypot, getContractSource, getTokenInfo };

if (require.main === module) main();

/**
 * Verifies contracts on BSCScan testnet directly via their API (no Hardhat plugin needed).
 * Uses the Standard JSON Input from the latest build-info artifact.
 */

require('dotenv').config();
const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.BSCSCAN_API_KEY;
// Etherscan API v2 — supports all EVM chains via chainid parameter
// BSC Testnet chain ID = 97
const API_HOST = 'api.etherscan.io';
const API_PATH = '/v2/api?chainid=97';
const COMPILER_VERSION = 'v0.8.21+commit.d9974bed';

// Deployed addresses (mocks: setup-testnet.js du 01/07/2026, SaturneLottery redéployé le 15/10/2026)
const CONTRACTS = [
  {
    name: 'MockCakeToken',
    address: '0x743fd890e173C12E6d3A4369cB4C8C326dd8FBe6',
    contractName: 'contracts/mocks/MockCakeToken.sol:MockCakeToken',
    constructorArgs: '',
    buildInfoFile: '917815d3450bfebc21150b3e3fbce22d.json',
  },
  {
    name: 'MockRandomNumberGenerator',
    address: '0x7172298F55A8Cc33912D7740bEC3bB91Ec23d350',
    contractName: 'contracts/mocks/MockRandomNumberGenerator.sol:MockRandomNumberGenerator',
    constructorArgs: '',
    buildInfoFile: '917815d3450bfebc21150b3e3fbce22d.json',
  },
  {
    name: 'SaturneLottery',
    address: '0x9Baa2fd2a6654Ea9D9e7255aa3aDEA807917f4d1',
    contractName: 'contracts/SaturneLottery.sol:SaturneLottery',
    // ABI-encoded: (address MockCakeToken, address MockRNG) — chacun paddé à 32 bytes
    constructorArgs:
      '000000000000000000000000743fd890e173C12E6d3A4369cB4C8C326dd8FBe6' +
      '0000000000000000000000007172298F55A8Cc33912D7740bEC3bB91Ec23d350',
    buildInfoFile: '1e27c3335d02edf609627636fa1a457e.json',
  },
];

function findBuildInfoWithSource(sourceFile) {
  const dir = path.join(__dirname, '..', 'artifacts', 'build-info');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const info = JSON.parse(fs.readFileSync(path.join(dir, f)));
    if (Object.keys(info.input.sources).includes(sourceFile)) {
      return info;
    }
  }
  return null;
}

function post(host, apiPath, payload) {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify(payload);
    const options = {
      hostname: host,
      path: apiPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function checkStatus(guid) {
  const result = await post(API_HOST, API_PATH, {
    module: 'contract',
    action: 'checkverifystatus',
    guid,
    apikey: API_KEY,
  });
  return result;
}

async function waitForVerification(guid, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const status = await checkStatus(guid);
    console.log(`   Status check ${i + 1}:`, status.result);
    if (status.result !== 'Pending in queue' && status.result !== 'In queue') {
      return status;
    }
  }
  return null;
}

async function verify(contract) {
  console.log(`\nVérification: ${contract.name} (${contract.address})`);

  const mainSource = contract.contractName.split(':')[0];
  const buildInfo = contract.buildInfoFile
    ? JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'build-info', contract.buildInfoFile)))
    : findBuildInfoWithSource(mainSource);

  if (!buildInfo) {
    console.log('  ❌ build-info introuvable');
    return;
  }

  const payload = {
    module: 'contract',
    action: 'verifysourcecode',
    apikey: API_KEY,
    contractaddress: contract.address,
    codeformat: 'solidity-standard-json-input',
    sourceCode: JSON.stringify(buildInfo.input),
    contractname: contract.contractName,
    compilerversion: COMPILER_VERSION,
    constructorArguements: contract.constructorArgs,
  };

  const result = await post(API_HOST, API_PATH, payload);
  console.log('  Réponse API:', result);

  if (result.status === '1' && result.result) {
    console.log('  GUID:', result.result);
    const finalStatus = await waitForVerification(result.result);
    if (finalStatus) {
      const ok = finalStatus.result && !finalStatus.result.toLowerCase().includes('fail');
      console.log(ok ? '  ✅ Vérifié !' : '  ❌ Échec:', finalStatus.result);
    }
  } else {
    console.log('  ❌ Erreur:', result.result || result.message || result.raw);
  }
}

async function main() {
  if (!API_KEY) {
    console.error('BSCSCAN_API_KEY manquant dans .env');
    process.exit(1);
  }

  for (const contract of CONTRACTS) {
    await verify(contract);
  }
}

main().catch(console.error);

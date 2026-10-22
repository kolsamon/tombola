/**
 * Simulation complète d'une loterie SaturneLottery sur BSC Testnet.
 *
 * UTILISATION :
 *   # Étape 1 — démarrer la loterie et acheter des tickets
 *   LOTTERY_PHASE=start npx hardhat run scripts/lottery-simulate.js --network bsc_testnet
 *
 *   # (attendre que endTime soit passé, minimum ~4h)
 *
 *   # Étape 2 — fermer la loterie, tirer le numéro gagnant
 *   LOTTERY_PHASE=draw npx hardhat run scripts/lottery-simulate.js --network bsc_testnet
 *
 *   # Étape 3 — réclamer les gains (gagnants + perdants si la consolation est active)
 *   LOTTERY_PHASE=claim npx hardhat run scripts/lottery-simulate.js --network bsc_testnet
 *
 * L'état (lotteryId, ticketIds, etc.) est sauvegardé dans scripts/lottery-state.json entre les étapes.
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ─── Adresses déployées (lues depuis lottery-state.json, écrit par setup-testnet.js) ──
// Valeurs par défaut — écrasées par le fichier d'état si présent
let LOTTERY_ADDRESS = "0x82C526C50122DfA57b86aC450b13819CAfd8BC42";
let RNG_ADDRESS     = "0x8Dec3797eC384FDF57E7FcC35F5397738F3a7e58";
let CAKE_ADDRESS    = "0xFa60D973F7642B748046464e165A65B7323b0DEE";

// ─── Paramètres de la simulation ─────────────────────────────────────────────
const TICKET_PRICE    = ethers.utils.parseEther("0.05"); // 0.05 CAKE par ticket
const DISCOUNT_DIV    = 2000;
const TREASURY_FEE    = 1000; // 10 %
// Répartition par palier (total = 10000) — seuls les paliers 4 et 5 paient ici
const REWARDS = [0, 0, 0, 0, 3000, 7000];

// Numéro final fixé à l'avance pour la simulation
const FINAL_NUMBER = 1234561;

// Tickets achetés — choisir des numéros qui produisent des résultats variés
// Avec FINAL_NUMBER = 1234561 (dernier chiffre = 1) :
const TICKET_NUMBERS = [
  1234561, // correspond exactement → jackpot palier 5
  1100001, // dernier chiffre = 1, mais autres différents → palier 0 (non payé ici car rewards[0]=0) → perdant
  1000002, // dernier chiffre = 2 ≠ 1 → perdant total
  1900003, // dernier chiffre = 3 ≠ 1 → perdant total
];

const STATE_FILE = path.join(__dirname, "lottery-state.json");

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE));
}

function saveState(state) {
  const existing = loadState();
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...existing, ...state }, null, 2));
}

function sep(label) {
  console.log(`\n${"─".repeat(55)}`);
  if (label) console.log(`  ${label}`);
  console.log("─".repeat(55));
}

async function getContracts(deployer) {
  const SaturneLottery = await ethers.getContractFactory("SaturneLottery");
  const lottery = SaturneLottery.attach(LOTTERY_ADDRESS).connect(deployer);

  const MockRNG = await ethers.getContractFactory("MockRandomNumberGenerator");
  const rng = MockRNG.attach(RNG_ADDRESS).connect(deployer);

  const MockCake = await ethers.getContractFactory("MockCakeToken");
  const cake = MockCake.attach(CAKE_ADDRESS).connect(deployer);

  return { lottery, rng, cake };
}

// ─── Phase 1 : Démarrer la loterie et acheter des tickets ────────────────────
async function phaseStart() {
  sep("PHASE 1 — Démarrage + achat de tickets");
  const [deployer] = await ethers.getSigners();
  const { lottery, cake } = await getContracts(deployer);

  // Vérifier le solde CAKE
  const cakeBalance = await cake.balanceOf(deployer.address);
  const totalNeeded = TICKET_PRICE.mul(TICKET_NUMBERS.length);
  console.log("Adresse deployer  :", deployer.address);
  console.log("Solde CAKE        :", ethers.utils.formatEther(cakeBalance), "CAKE");
  console.log("CAKE nécessaire   :", ethers.utils.formatEther(totalNeeded), "CAKE");

  if (cakeBalance.lt(totalNeeded)) {
    console.error(
      "\n❌ Solde CAKE insuffisant !\n" +
      "   Obtenez des CAKE testnet sur : https://testnet.pancakeswap.finance/faucet\n" +
      "   Ou via le faucet BSC : https://testnet.binance.org/faucet-smart"
    );
    process.exit(1);
  }

  // Désactiver les commissions achat pour simplifier la simulation
  console.log("\nDésactivation commissions d'achat (setCommissionRates 0,0)...");
  await (await lottery.setCommissionRates(0, 0)).wait();
  console.log("✅ Commissions = 0 %");

  // Approuver le contrat à dépenser nos CAKE
  const allowance = await cake.allowance(deployer.address, LOTTERY_ADDRESS);
  if (allowance.lt(totalNeeded)) {
    console.log("\nApprobation CAKE...");
    await (await cake.approve(LOTTERY_ADDRESS, ethers.constants.MaxUint256)).wait();
    console.log("✅ Approbation accordée");
  }

  // Démarrer la loterie (durée minimale 4h → on prend 4h15)
  const endTime = Math.floor(Date.now() / 1000) + 4 * 3600 + 15 * 60;
  const endDate = new Date(endTime * 1000).toLocaleString("fr-FR");
  console.log(`\nDémarrage de la loterie (fin prévue : ${endDate})...`);
  await (await lottery.connect(deployer).startLottery(
    endTime,
    TICKET_PRICE,
    DISCOUNT_DIV,
    REWARDS,
    TREASURY_FEE
  )).wait();

  const lotteryId = (await lottery.viewCurrentLotteryId()).toNumber();
  console.log(`✅ Loterie #${lotteryId} ouverte`);

  // Acheter tous les tickets d'un coup
  console.log("\nAchat des tickets :", TICKET_NUMBERS);
  const firstTicketId = (await lottery.viewLottery(lotteryId)).firstTicketId.toNumber();
  const tx = await lottery.buyTickets(lotteryId, TICKET_NUMBERS);
  await tx.wait();

  const ticketIds = TICKET_NUMBERS.map((_, i) => firstTicketId + i);
  console.log("✅ Tickets achetés, IDs :", ticketIds);

  // Classer chaque ticket (gagnant / perdant) en fonction du finalNumber prévu
  const tickets = TICKET_NUMBERS.map((num, i) => {
    const lastDigit = num % 10;
    const finalLastDigit = FINAL_NUMBER % 10;
    const fullMatch = num === FINAL_NUMBER;
    const type = fullMatch ? "winner_5"
                 : (lastDigit === finalLastDigit && REWARDS[0] > 0) ? "winner_0"
                 : "loser";
    return { id: ticketIds[i], number: num, type };
  });

  sep();
  console.log("Résumé des tickets :");
  tickets.forEach(t => console.log(`  ID ${t.id} | ${t.number} | ${t.type}`));

  saveState({ lotteryId, endTime, finalNumber: FINAL_NUMBER, tickets });
  console.log("\n💾 État sauvegardé dans lottery-state.json");
  sep();
  console.log(`⏳ Attend que ${endDate} soit passé, puis lance :`);
  console.log("   LOTTERY_PHASE=draw npx hardhat run scripts/lottery-simulate.js --network bsc_testnet");
}

// ─── Phase 2 : Fermer la loterie et tirer le numéro ──────────────────────────
async function phaseDraw() {
  sep("PHASE 2 — Fermeture + tirage");
  const state = loadState();
  if (!state.lotteryId) { console.error("Aucun état trouvé. Lancez d'abord LOTTERY_PHASE=start."); process.exit(1); }

  const [deployer] = await ethers.getSigners();
  const { lottery, rng } = await getContracts(deployer);

  const now = Math.floor(Date.now() / 1000);
  if (now < state.endTime) {
    const remaining = state.endTime - now;
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    console.error(`⏳ La loterie n'est pas encore terminée. Reste : ${h}h${m}m`);
    process.exit(1);
  }

  const { lotteryId, finalNumber } = state;
  console.log(`Loterie #${lotteryId} | numéro final choisi : ${finalNumber}`);

  // Fermer la loterie
  console.log("\nFermeture de la loterie...");
  await (await lottery.closeLottery(lotteryId)).wait();
  console.log("✅ Loterie fermée");

  // Configurer le mock RNG avec le numéro choisi
  console.log("Configuration du MockRNG...");
  await (await rng.setLatestLotteryId(lotteryId)).wait();
  await (await rng.setRandomResult(finalNumber)).wait();
  console.log(`✅ Numéro final : ${finalNumber}`);

  // Tirer le numéro et rendre la loterie claimable
  console.log("Tirage du numéro final...");
  await (await lottery.drawFinalNumberAndMakeLotteryClaimable(lotteryId, false)).wait();
  console.log("✅ Tirage effectué — loterie en statut Claimable");

  // Lire les résultats du contrat
  const info = await lottery.viewLottery(lotteryId);
  sep("Résultats du tirage");
  console.log("Numéro gagnant          :", info.finalNumber.toString());
  console.log("Consolation             :", info.consolationEnabled ? "active" : "désactivée");
  console.log("CAKE par ticket perdant :", ethers.utils.formatEther(info.cakePerLosingTicket), "CAKE");
  for (let b = 0; b < 6; b++) {
    if (info.cakePerBracket[b].gt(0)) {
      console.log(`cakePerBracket[${b}]       : ${ethers.utils.formatEther(info.cakePerBracket[b])} CAKE`);
    }
  }
  for (let b = 0; b < 6; b++) {
    if (info.countWinnersPerBracket[b].gt(0)) {
      console.log(`Gagnants palier ${b}        : ${info.countWinnersPerBracket[b]} ticket(s)`);
    }
  }

  // Mettre à jour l'état avec les brackets confirmés
  const updatedTickets = await Promise.all(
    state.tickets.map(async (t) => {
      let highestBracket = -1;
      for (let b = 5; b >= 0; b--) {
        const reward = await lottery.viewRewardsForTicketId(lotteryId, t.id, b);
        if (reward.gt(0)) { highestBracket = b; break; }
      }
      return { ...t, bracket: highestBracket };
    })
  );

  saveState({ ...state, tickets: updatedTickets });
  sep();
  console.log("Lance maintenant :");
  console.log("   LOTTERY_PHASE=claim npx hardhat run scripts/lottery-simulate.js --network bsc_testnet");
}

// ─── Phase 3 : Réclamer les gains (gagnants + perdants) ──────────────────────
async function phaseClaim() {
  sep("PHASE 3 — Réclamation des gains");
  const state = loadState();
  if (!state.lotteryId) { console.error("Aucun état trouvé. Lancez d'abord start puis draw."); process.exit(1); }

  const [deployer] = await ethers.getSigners();
  const { lottery, cake } = await getContracts(deployer);

  const { lotteryId, tickets } = state;
  const balanceBefore = await cake.balanceOf(deployer.address);
  console.log("Solde CAKE avant réclamation :", ethers.utils.formatEther(balanceBefore));

  const winnerTickets = tickets.filter(t => t.bracket >= 0);
  const loserTickets  = tickets.filter(t => t.bracket < 0);

  // Réclamer les tickets gagnants
  if (winnerTickets.length > 0) {
    console.log(`\n→ Réclamation tickets gagnants : ${winnerTickets.map(t => t.id)}`);
    for (const t of winnerTickets) {
      const reward = await lottery.viewRewardsForTicketId(lotteryId, t.id, t.bracket);
      console.log(`  Ticket #${t.id} (palier ${t.bracket}) → ${ethers.utils.formatEther(reward)} CAKE`);
      await (await lottery.claimTickets(lotteryId, [t.id], [t.bracket])).wait();
      console.log(`  ✅ Réclamé`);
    }
  }

  // Réclamer les tickets perdants, si la manche a un pool de consolation
  if (loserTickets.length > 0) {
    const consolation = await lottery.viewLottery(lotteryId).then(i => i.cakePerLosingTicket);
    if (consolation.gt(0)) {
      console.log(`\n→ Réclamation tickets perdants : ${loserTickets.map(t => t.id)}`);
      console.log(`  Consolation : ${ethers.utils.formatEther(consolation)} CAKE / ticket`);
      await (await lottery.claimLosingTickets(lotteryId, loserTickets.map(t => t.id))).wait();
      console.log(`  ✅ ${loserTickets.length} ticket(s) perdant(s) réclamé(s)`);
    } else {
      console.log(`\n→ Tickets perdants (pas de consolation sur cette manche) : ${loserTickets.map(t => t.id)}`);
    }
  }

  const balanceAfter = await cake.balanceOf(deployer.address);
  sep("Bilan final");
  console.log("Solde CAKE avant :", ethers.utils.formatEther(balanceBefore), "CAKE");
  console.log("Solde CAKE après :", ethers.utils.formatEther(balanceAfter), "CAKE");
  const diff = balanceAfter.sub(balanceBefore);
  const sign = diff.gte(0) ? "+" : "";
  console.log(`Variation         : ${sign}${ethers.utils.formatEther(diff)} CAKE`);
  console.log("\n✅ Simulation terminée !");
}

// ─── Point d'entrée ──────────────────────────────────────────────────────────
async function main() {
  // Écraser les adresses par celles du fichier d'état si disponibles
  const stateAddresses = loadState().addresses;
  if (stateAddresses) {
    LOTTERY_ADDRESS = stateAddresses.lottery;
    RNG_ADDRESS     = stateAddresses.rng;
    CAKE_ADDRESS    = stateAddresses.cake;
    console.log("Adresses chargées depuis lottery-state.json");
  }

  const phase = process.env.LOTTERY_PHASE || "start";
  if      (phase === "start") await phaseStart();
  else if (phase === "draw")  await phaseDraw();
  else if (phase === "claim") await phaseClaim();
  else {
    console.error(`Phase inconnue : "${phase}". Valeurs possibles : start | draw | claim`);
    process.exit(1);
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

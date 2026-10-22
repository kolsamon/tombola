import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import ADDRESSES from '../../contracts/addresses.json';
import SaturneLotteryABI from '../../contracts/SaturneLotteryABI.json';
import MockCakeTokenABI from '../../contracts/MockCakeTokenABI.json';
import MockRNGABI from '../../contracts/MockRandomNumberGeneratorABI.json';

const CHAIN = ADDRESSES.bscTestnet;
const STATUS_MAP = ['Pending', 'Open', 'Close', 'Claimable'];

function lottery(sp) { return new ethers.Contract(CHAIN.lottery, SaturneLotteryABI, sp); }
function cake(sp)    { return new ethers.Contract(CHAIN.cake,    MockCakeTokenABI,  sp); }
function rng(sp)     { return new ethers.Contract(CHAIN.rng,     MockRNGABI,        sp); }
const readProvider = new ethers.providers.JsonRpcProvider(CHAIN.rpc);

function fmt(raw) {
  return {
    statusCode: raw.status,
    status: STATUS_MAP[raw.status] ?? 'Unknown',
    startTime:  raw.startTime.toNumber(),
    endTime:    raw.endTime.toNumber(),
    priceTicketInCake: raw.priceTicketInCake,
    discountDivisor: raw.discountDivisor.toNumber(),
    rewardsBreakdown: raw.rewardsBreakdown.map(b => b.toNumber()),
    treasuryFee: raw.treasuryFee.toNumber(),
    cakePerBracket: raw.cakePerBracket,
    countWinnersPerBracket: raw.countWinnersPerBracket.map(b => b.toNumber()),
    firstTicketId: raw.firstTicketId.toNumber(),
    firstTicketIdNextLottery: raw.firstTicketIdNextLottery.toNumber(),
    amountCollectedInCake: raw.amountCollectedInCake,
    finalNumber: raw.finalNumber,
    consolationEnabled: raw.consolationEnabled,
    cakePerLosingTicket: raw.cakePerLosingTicket,
  };
}

export function useAdmin(signer, account) {
  const [lotteryId,      setLotteryId]      = useState(null);
  const [lotteryData,    setLotteryData]    = useState(null);
  const [contractInfo,   setContractInfo]   = useState(null); // owner, operator, treasury, injector, winnersShareBps, ...
  const [cakeBalance,    setCakeBalance]    = useState(ethers.BigNumber.from(0));
  const [cakeAllowance,  setCakeAllowance]  = useState(ethers.BigNumber.from(0));
  const [loading,        setLoading]        = useState(false);
  const [txPending,      setTxPending]      = useState(false);
  const [notification,   setNotification]   = useState(null);
  const [isOwner,        setIsOwner]        = useState(false);
  const [isOperator,     setIsOperator]     = useState(false);

  const notify = useCallback((msg, type = 'success') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 7000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const lc = lottery(readProvider);
      const ck = cake(readProvider);

      const [id, op, treasury, injector, owner, wbps, consolation, refComm, treComm, minPrice, maxPrice, maxTickets] = await Promise.all([
        lc.viewCurrentLotteryId(),
        lc.operatorAddress(),
        lc.treasuryAddress(),
        lc.injectorAddress(),
        lc.owner(),
        lc.winnersShareBps(),
        lc.consolationEnabled(),
        lc.referralCommission(),
        lc.treasuryCommission(),
        lc.minPriceTicketInCake(),
        lc.maxPriceTicketInCake(),
        lc.maxNumberTicketsPerBuyOrClaim(),
      ]);

      const lotteryIdNum = id.toNumber();
      setLotteryId(lotteryIdNum);

      if (lotteryIdNum > 0) {
        const raw = await lc.viewLottery(lotteryIdNum);
        setLotteryData({ id: lotteryIdNum, ...fmt(raw) });
      } else {
        setLotteryData(null);
      }

      setContractInfo({
        owner, operator: op, treasury, injector,
        winnersShareBps: wbps.toNumber(),
        consolationEnabled: consolation,
        referralCommission: refComm.toNumber(),
        treasuryCommission: treComm.toNumber(),
        minPriceTicketInCake: minPrice,
        maxPriceTicketInCake: maxPrice,
        maxNumberTicketsPerBuyOrClaim: maxTickets.toNumber(),
      });

      if (account) {
        const [bal, allow] = await Promise.all([
          ck.balanceOf(account),
          ck.allowance(account, CHAIN.lottery),
        ]);
        setCakeBalance(bal);
        setCakeAllowance(allow);
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
        setIsOperator(op.toLowerCase() === account.toLowerCase());
      }
    } catch (err) {
      console.error('fetchData:', err);
    }
    setLoading(false);
  }, [account]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  async function tx(fn, description) {
    if (!signer) { notify('Wallet non connecté', 'error'); return null; }
    setTxPending(true);
    try {
      const transaction = await fn();
      notify(`${description} — envoyée…`, 'info');
      const receipt = await transaction.wait();
      notify(`✅ ${description}`, 'success');
      await fetchData();
      return receipt;
    } catch (err) {
      const msg = err.reason || err.data?.message || err.message || 'Erreur inconnue';
      notify(`❌ ${msg}`, 'error');
      return null;
    } finally {
      setTxPending(false);
    }
  }

  // ─── Operator functions ──────────────────────────────────────────────────────
  const startLottery = useCallback(async (endTime, priceWei, discountDiv, rewards, treasuryFee) =>
    tx(() => lottery(signer).startLottery(endTime, priceWei, discountDiv, rewards, treasuryFee), 'Loterie démarrée'),
    [signer]);

  const closeLottery = useCallback(async (id) =>
    tx(() => lottery(signer).closeLottery(id), 'Loterie fermée'),
    [signer]);

  const drawFinalNumber = useCallback(async (id, autoInject) =>
    tx(() => lottery(signer).drawFinalNumberAndMakeLotteryClaimable(id, autoInject), 'Numéro tiré'),
    [signer]);

  // ─── Owner functions ─────────────────────────────────────────────────────────
  const setAddresses = useCallback(async (op, tre, inj) =>
    tx(() => lottery(signer).setOperatorAndTreasuryAndInjectorAddresses(op, tre, inj), 'Adresses mises à jour'),
    [signer]);

  const setWinnersShareBps = useCallback(async (bps) =>
    tx(() => lottery(signer).setWinnersShareBps(bps), `winnersShareBps → ${bps}`),
    [signer]);

  const setConsolationEnabled = useCallback(async (enabled) =>
    tx(() => lottery(signer).setConsolationEnabled(enabled), enabled ? 'Pool de consolation activé' : 'Pool de consolation désactivé'),
    [signer]);

  const setCommissionRates = useCallback(async (ref, tre) =>
    tx(() => lottery(signer).setCommissionRates(ref, tre), 'Commissions mises à jour'),
    [signer]);

  const setTicketPriceLimits = useCallback(async (min, max) =>
    tx(() => lottery(signer).setMinAndMaxTicketPriceInCake(min, max), 'Limites de prix mises à jour'),
    [signer]);

  const setMaxTicketsPerBuy = useCallback(async (max) =>
    tx(() => lottery(signer).setMaxNumberTicketsPerBuyOrClaim(max), `Max tickets → ${max}`),
    [signer]);

  // ─── Injector / Owner ────────────────────────────────────────────────────────
  const injectFunds = useCallback(async (id, amountWei) => {
    if (cakeAllowance.lt(amountWei)) {
      await tx(() => cake(signer).approve(CHAIN.lottery, ethers.constants.MaxUint256), 'CAKE approuvé');
    }
    return tx(() => lottery(signer).injectFunds(id, amountWei), `${ethers.utils.formatEther(amountWei)} CAKE injectés`);
  }, [signer, cakeAllowance]);

  // ─── MockRNG ─────────────────────────────────────────────────────────────────
  const rngSetLotteryId = useCallback(async (id) =>
    tx(() => rng(signer).setLatestLotteryId(id), `RNG lotteryId → ${id}`),
    [signer]);

  const rngSetResult = useCallback(async (result) =>
    tx(() => rng(signer).setRandomResult(result), `RNG result → ${result}`),
    [signer]);

  // ─── MockCakeToken ────────────────────────────────────────────────────────────
  const mintCake = useCallback(async (to, amountWei) =>
    tx(() => cake(signer).mint(to, amountWei), `Minted ${ethers.utils.formatEther(amountWei)} CAKE`),
    [signer]);

  const approveCake = useCallback(async () =>
    tx(() => cake(signer).approve(CHAIN.lottery, ethers.constants.MaxUint256), 'CAKE approuvé'),
    [signer]);

  return {
    lotteryId, lotteryData, contractInfo,
    cakeBalance, cakeAllowance,
    loading, txPending, notification,
    isOwner, isOperator,
    fetchData,
    // operator
    startLottery, closeLottery, drawFinalNumber,
    // owner
    setAddresses, setWinnersShareBps, setConsolationEnabled, setCommissionRates,
    setTicketPriceLimits, setMaxTicketsPerBuy,
    // injector/owner
    injectFunds,
    // mock
    rngSetLotteryId, rngSetResult,
    mintCake, approveCake,
  };
}

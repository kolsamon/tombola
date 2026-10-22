import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import ADDRESSES from '../contracts/addresses.json';
import SaturneLotteryABI from '../contracts/SaturneLotteryABI.json';
import MockCakeTokenABI from '../contracts/MockCakeTokenABI.json';

const CHAIN = ADDRESSES.bscTestnet;
const STATUS_MAP = ['Pending', 'Open', 'Close', 'Claimable'];

function getLotteryContract(signerOrProvider) {
  return new ethers.Contract(CHAIN.lottery, SaturneLotteryABI, signerOrProvider);
}

function getCakeContract(signerOrProvider) {
  return new ethers.Contract(CHAIN.cake, MockCakeTokenABI, signerOrProvider);
}

function formatLottery(raw) {
  return {
    status: STATUS_MAP[raw.status] ?? 'Unknown',
    statusCode: raw.status,
    startTime: raw.startTime.toNumber(),
    endTime: raw.endTime.toNumber(),
    priceTicketInCake: raw.priceTicketInCake,
    discountDivisor: raw.discountDivisor.toNumber(),
    rewardsBreakdown: raw.rewardsBreakdown.map(b => b.toNumber()),
    treasuryFee: raw.treasuryFee.toNumber(),
    cakePerBracket: raw.cakePerBracket.map(b => b),
    countWinnersPerBracket: raw.countWinnersPerBracket.map(b => b.toNumber()),
    firstTicketId: raw.firstTicketId.toNumber(),
    firstTicketIdNextLottery: raw.firstTicketIdNextLottery.toNumber(),
    amountCollectedInCake: raw.amountCollectedInCake,
    finalNumber: raw.finalNumber,
    consolationEnabled: raw.consolationEnabled,
    cakePerLosingTicket: raw.cakePerLosingTicket,
  };
}

export function useLottery(signer, account) {
  const [lotteryId, setLotteryId] = useState(null);
  const [lottery, setLottery] = useState(null);
  // Consolation rule the next round will start with (the current round carries its own copy)
  const [consolationEnabled, setConsolationEnabled] = useState(true);
  const [userTickets, setUserTickets] = useState([]);
  const [cakeBalance, setCakeBalance] = useState(ethers.BigNumber.from(0));
  const [cakeAllowance, setCakeAllowance] = useState(ethers.BigNumber.from(0));
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [notification, setNotification] = useState(null);
  const intervalRef = useRef(null);

  const readProvider = new ethers.providers.JsonRpcProvider(CHAIN.rpc);

  const notify = useCallback((msg, type = 'success') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 6000);
  }, []);

  const fetchLotteryData = useCallback(async () => {
    try {
      const contract = getLotteryContract(readProvider);
      const [rawId, consolation] = await Promise.all([
        contract.viewCurrentLotteryId(),
        contract.consolationEnabled(),
      ]);
      const id = rawId.toNumber();
      setLotteryId(id);
      setConsolationEnabled(consolation);
      if (id === 0) { setLottery(null); return; }
      const raw = await contract.viewLottery(id);
      setLottery({ id, ...formatLottery(raw) });
    } catch (err) {
      console.error('fetchLotteryData:', err);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!account || !lotteryId) return;
    try {
      const contract = getLotteryContract(readProvider);
      const cake = getCakeContract(readProvider);
      const [bal, allow] = await Promise.all([
        cake.balanceOf(account),
        cake.allowance(account, CHAIN.lottery),
      ]);
      setCakeBalance(bal);
      setCakeAllowance(allow);

      // The contract returns at most PAGE_SIZE tickets per call: page through all of them
      const PAGE_SIZE = 100;
      const tickets = [];
      for (let cursor = 0; ;) {
        const [ticketIds, ticketNumbers, ticketStatuses, nextCursor] =
          await contract.viewUserInfoForLotteryId(account, lotteryId, cursor, PAGE_SIZE);
        ticketIds.forEach((id, i) => tickets.push({
          id: id.toNumber(),
          number: ticketNumbers[i],
          claimed: ticketStatuses[i],
        }));
        if (ticketIds.length < PAGE_SIZE) break;
        cursor = nextCursor.toNumber();
      }
      setUserTickets(tickets);
    } catch (err) {
      console.error('fetchUserData:', err);
    }
  }, [account, lotteryId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchLotteryData();
    await fetchUserData();
    setLoading(false);
  }, [fetchLotteryData, fetchUserData]);

  // Poll every 30 seconds
  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const approveCake = useCallback(async () => {
    if (!signer) return;
    setTxPending(true);
    try {
      const cake = getCakeContract(signer);
      const tx = await cake.approve(CHAIN.lottery, ethers.constants.MaxUint256);
      notify('Approbation envoyée…', 'info');
      await tx.wait();
      notify('CAKE approuvé ✓');
      await fetchUserData();
    } catch (err) {
      notify(err.reason || err.message || 'Erreur approbation', 'error');
    } finally {
      setTxPending(false);
    }
  }, [signer, fetchUserData, notify]);

  const buyTickets = useCallback(async (numbers) => {
    if (!signer || !lotteryId) return;
    setTxPending(true);
    try {
      const contract = getLotteryContract(signer);
      const price = lottery.priceTicketInCake;
      const total = price.mul(numbers.length);

      if (cakeAllowance.lt(total)) {
        const cake = getCakeContract(signer);
        const approveTx = await cake.approve(CHAIN.lottery, ethers.constants.MaxUint256);
        notify('Approbation en cours…', 'info');
        await approveTx.wait();
      }

      const tx = await contract.buyTickets(lotteryId, numbers);
      notify(`Achat de ${numbers.length} ticket(s) en cours…`, 'info');
      const receipt = await tx.wait();
      notify(`${numbers.length} ticket(s) achetés ✓`, 'success');
      await refresh();
      return receipt;
    } catch (err) {
      notify(err.reason || err.message || 'Erreur achat', 'error');
    } finally {
      setTxPending(false);
    }
  }, [signer, lotteryId, lottery, cakeAllowance, refresh, notify]);

  const claimWinningTickets = useCallback(async (ticketIds, brackets) => {
    if (!signer) return;
    setTxPending(true);
    try {
      const contract = getLotteryContract(signer);
      const tx = await contract.claimTickets(lotteryId, ticketIds, brackets);
      notify('Réclamation gains en cours…', 'info');
      await tx.wait();
      notify('Gains réclamés ✓', 'success');
      await refresh();
    } catch (err) {
      notify(err.reason || err.message || 'Erreur réclamation', 'error');
    } finally {
      setTxPending(false);
    }
  }, [signer, lotteryId, refresh, notify]);

  const claimLosingTickets = useCallback(async (ticketIds) => {
    if (!signer) return;
    setTxPending(true);
    try {
      const contract = getLotteryContract(signer);
      const tx = await contract.claimLosingTickets(lotteryId, ticketIds);
      notify('Réclamation consolation en cours…', 'info');
      await tx.wait();
      notify('Consolation réclamée ✓', 'success');
      await refresh();
    } catch (err) {
      notify(err.reason || err.message || 'Erreur réclamation consolation', 'error');
    } finally {
      setTxPending(false);
    }
  }, [signer, lotteryId, refresh, notify]);

  // Highest prize bracket for a ticket number (used in claim flow), -1 for a loser.
  // Mirrors SaturneLottery._calculateRewardsForTicketId so no RPC call is needed per ticket.
  const getTicketBracket = useCallback((ticketNumber) => {
    if (!lottery || lottery.statusCode !== 3) return -1;
    for (let b = 5; b >= 0; b--) {
      const mod = 10 ** (b + 1);
      if (ticketNumber % mod === lottery.finalNumber % mod && lottery.cakePerBracket[b].gt(0)) return b;
    }
    return -1;
  }, [lottery]);

  return {
    lotteryId,
    lottery,
    userTickets,
    cakeBalance,
    cakeAllowance,
    loading,
    txPending,
    notification,
    refresh,
    approveCake,
    buyTickets,
    claimWinningTickets,
    claimLosingTickets,
    getTicketBracket,
    consolationEnabled,
  };
}

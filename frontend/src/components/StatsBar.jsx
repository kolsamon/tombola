import { ethers } from 'ethers';
import ADDRESSES from '../contracts/addresses.json';

const CHAIN = ADDRESSES.bscTestnet;

export default function StatsBar({ lottery, lotteryId }) {
  if (!lottery || !lotteryId) return null;

  const collected = parseFloat(ethers.utils.formatEther(lottery.amountCollectedInCake));
  const totalWinners = lottery.countWinnersPerBracket.reduce((a, b) => a + b, 0);

  const stats = [
    { icon: '💰', val: collected.toFixed(4) + ' CAKE', lbl: 'Cagnotte totale' },
    { icon: '🎟', val: parseFloat(ethers.utils.formatEther(lottery.priceTicketInCake)).toFixed(4) + ' CAKE', lbl: 'Prix / ticket' },
    { icon: '🏦', val: (lottery.treasuryFee / 100) + '%', lbl: 'Frais trésorerie' },
    ...(lottery.status === 'Claimable'
      ? [{ icon: '🏆', val: String(totalWinners), lbl: 'Gagnants total' }]
      : []
    ),
    ...(lottery.status === 'Claimable' && lottery.cakePerLosingTicket?.gt(0)
      ? [{ icon: '💎', val: parseFloat(ethers.utils.formatEther(lottery.cakePerLosingTicket)).toFixed(4) + ' CAKE', lbl: 'Consolation / ticket' }]
      : []
    ),
  ];

  return (
    <div style={s.wrap}>
      <div className="container">
        <div style={s.bar}>
          {stats.map((stat, i) => (
            <div key={i} style={s.item}>
              <span style={s.icon}>{stat.icon}</span>
              <span style={s.val}>{stat.val}</span>
              <span style={s.lbl}>{stat.lbl}</span>
            </div>
          ))}

          <a
            href={`${CHAIN.explorerAddress}${CHAIN.lottery}`}
            target="_blank"
            rel="noreferrer"
            style={s.link}
          >
            Voir sur BSCScan ↗
          </a>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    background: '#1C1543',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    padding: '12px 0',
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  icon: { fontSize: '1rem' },
  val: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#FFB237',
  },
  lbl: { fontSize: '0.78rem', color: '#736D8C' },
  link: {
    color: '#A881FC',
    fontSize: '0.8rem',
    textDecoration: 'none',
    fontWeight: 500,
    marginLeft: 'auto',
    whiteSpace: 'nowrap',
  },
};

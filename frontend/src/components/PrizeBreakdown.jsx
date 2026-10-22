import { ethers } from 'ethers';

const BRACKETS = [
  { label: '1 chiffre',  color: '#1A6EDB', bg: 'rgba(26,110,219,0.15)' },
  { label: '2 chiffres', color: '#7645D9', bg: 'rgba(118,69,217,0.15)' },
  { label: '3 chiffres', color: '#DD4AFF', bg: 'rgba(221,74,255,0.15)' },
  { label: '4 chiffres', color: '#ED4B9E', bg: 'rgba(237,75,158,0.15)' },
  { label: '5 chiffres', color: '#F0922C', bg: 'rgba(240,146,44,0.15)' },
  { label: '6 chiffres', color: '#FFB237', bg: 'rgba(255,178,55,0.18)' },
];

export default function PrizeBreakdown({ lottery }) {
  if (!lottery) return null;

  const collected = parseFloat(ethers.utils.formatEther(lottery.amountCollectedInCake));
  const treasuryRatio = lottery.treasuryFee / 10000;
  const postTreasury = collected * (1 - treasuryRatio);
  // Rule locked into this round: 50/25/25 with the consolation pool, 50/50 without
  const consolation  = lottery.consolationEnabled;
  const winnersPool  = postTreasury * 0.5;
  const consolPool   = consolation ? postTreasury * 0.25 : 0;
  const treasuryPool = postTreasury - winnersPool - consolPool + collected * treasuryRatio;

  return (
    <section style={s.section} id="breakdown">
      <div className="container">
        <h2 style={s.title}>Répartition des prix</h2>
        <p style={s.sub}>Comment la cagnotte est distribuée après chaque tirage</p>

        {/* Big split bar */}
        <div style={s.bigBarWrap}>
          <div style={s.bigBar}>
            <div style={{ ...s.bigBarSeg, flex: 2, background: 'linear-gradient(90deg, #d97706, #FFB237)' }}>
              <div style={s.bigBarLabel}>
                <span style={s.bigBarPct}>50%</span>
                <span style={s.bigBarName}>🏆 Gagnants</span>
              </div>
            </div>
            {consolation && (
              <div style={{ ...s.bigBarSeg, flex: 1, background: 'linear-gradient(90deg, #0e7490, #1FC7D4)' }}>
                <div style={s.bigBarLabel}>
                  <span style={s.bigBarPct}>25%</span>
                  <span style={s.bigBarName}>💎 Consolation</span>
                </div>
              </div>
            )}
            <div style={{ ...s.bigBarSeg, flex: consolation ? 1 : 2, background: 'linear-gradient(90deg, #5b21b6, #7645D9)', borderRadius: '0 14px 14px 0' }}>
              <div style={s.bigBarLabel}>
                <span style={s.bigBarPct}>{consolation ? '25%' : '50%'}</span>
                <span style={s.bigBarName}>🏛 Trésorerie</span>
              </div>
            </div>
          </div>

          {/* Amount labels, aligned with the bar segments */}
          <div style={s.amountRow}>
            <AmountLabel val={winnersPool}  unit="CAKE" color="#FFB237" flex={2} />
            {consolation && <AmountLabel val={consolPool} unit="CAKE" color="#1FC7D4" flex={1} />}
            <AmountLabel val={treasuryPool} unit="CAKE" color="#A881FC" flex={consolation ? 1 : 2} />
          </div>
        </div>

        {/* Winner brackets */}
        <div style={s.bracketSection}>
          <div style={s.bracketHeader}>
            <div style={s.bracketHeaderLeft}>
              <div style={s.bracketTitle}>Paliers des gagnants</div>
              <div style={s.bracketSub}>50% de la cagnotte partagée entre les paliers</div>
            </div>
          </div>

          <div style={s.bracketGrid}>
            {BRACKETS.map((b, i) => {
              const pct = lottery.rewardsBreakdown[i] / 100;
              const winners = lottery.status === 'Claimable' ? lottery.countWinnersPerBracket[i] : 0;
              const perWinner = lottery.status === 'Claimable' && lottery.cakePerBracket[i]?.gt(0)
                ? parseFloat(ethers.utils.formatEther(lottery.cakePerBracket[i]))
                : null;

              return (
                <div key={i} style={{ ...s.bracketCard, borderColor: b.color + '40', background: b.bg }}>
                  {/* Number bubbles showing how many digits match */}
                  <div style={s.bubbles}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j}
                        style={{
                          ...s.bubble,
                          background: j <= i ? b.color : 'rgba(255,255,255,0.06)',
                          boxShadow: j <= i ? `0 0 8px ${b.color}60` : 'none',
                        }}
                      />
                    ))}
                  </div>

                  <div style={s.bracketLabel}>{b.label}</div>

                  {/* % allocation */}
                  <div style={{ ...s.bracketPct, color: b.color }}>
                    {pct > 0 ? `${pct}%` : '—'}
                  </div>

                  {lottery.status === 'Claimable' && (
                    <div style={s.bracketWinners}>
                      <span style={{ color: '#736D8C', fontSize: '0.78rem' }}>{winners} gagnant{winners !== 1 ? 's' : ''}</span>
                      {perWinner !== null && winners > 0 && (
                        <span style={{ color: b.color, fontSize: '0.78rem', fontWeight: 700 }}>
                          {perWinner.toFixed(4)} CAKE
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bar */}
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${Math.min(100, pct / 0.4)}%`, background: b.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Consolation info, only when this round has the pool */}
          {consolation && (
            <div style={s.consolCard}>
              <div style={s.consolIcon}>💎</div>
              <div style={{ flex: 1 }}>
                <div style={s.consolTitle}>Pool de Consolation — 25% pour les tickets perdants</div>
                <div style={s.consolDesc}>
                  Si votre ticket ne gagne aucun palier, vous recevez une part du pool de consolation.
                  {lottery.status === 'Claimable' && lottery.cakePerLosingTicket?.gt(0) && (
                    <> Consolation cette ronde : <strong style={{ color: '#1FC7D4' }}>
                      {parseFloat(ethers.utils.formatEther(lottery.cakePerLosingTicket)).toFixed(4)} CAKE / ticket
                    </strong></>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AmountLabel({ val, unit, color, flex = 1 }) {
  return (
    <div style={{ flex, textAlign: 'center', padding: '6px 0' }}>
      <span style={{ color, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem' }}>
        {val.toFixed(3)}
      </span>
      <span style={{ color: '#736D8C', fontSize: '0.78rem', marginLeft: 4 }}>{unit}</span>
    </div>
  );
}

const s = {
  section: {
    padding: '48px 0',
    background: '#08060E',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
    fontWeight: 800,
    color: '#F4EEFF',
    marginBottom: 8,
  },
  sub: { color: '#736D8C', fontSize: '0.92rem', marginBottom: 32 },

  bigBarWrap: { marginBottom: 40 },
  bigBar: {
    display: 'flex',
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 2,
  },
  bigBarSeg: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 12px',
    transition: 'flex 0.4s ease',
  },
  bigBarLabel: { textAlign: 'center' },
  bigBarPct: {
    display: 'block',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 900,
    fontSize: '1.1rem',
    color: '#fff',
    lineHeight: 1,
  },
  bigBarName: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: 2 },
  amountRow: { display: 'flex', marginTop: 6 },

  bracketSection: {},
  bracketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  bracketHeaderLeft: {},
  bracketTitle: { fontSize: '1rem', fontWeight: 700, color: '#F4EEFF' },
  bracketSub: { color: '#736D8C', fontSize: '0.82rem', marginTop: 2 },

  bracketGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 10,
    marginBottom: 16,
  },
  bracketCard: {
    border: '1px solid',
    borderRadius: 14,
    padding: '14px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  bubbles: { display: 'flex', gap: 3 },
  bubble: { width: 10, height: 10, borderRadius: '50%' },
  bracketLabel: { fontSize: '0.72rem', color: '#736D8C', textAlign: 'center' },
  bracketPct: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 900,
    fontSize: '1.1rem',
  },
  bracketWinners: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    textAlign: 'center',
  },
  barTrack: {
    width: '100%',
    height: 4,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 99, transition: 'width 0.6s ease' },

  consolCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    padding: '18px 20px',
    background: 'rgba(31,199,212,0.08)',
    border: '1px solid rgba(31,199,212,0.25)',
    borderRadius: 16,
    marginTop: 8,
  },
  consolIcon: { fontSize: '1.8rem', flexShrink: 0 },
  consolTitle: { fontWeight: 700, fontSize: '0.95rem', color: '#F4EEFF', marginBottom: 4 },
  consolDesc: { color: '#736D8C', fontSize: '0.85rem', lineHeight: 1.55 },
};

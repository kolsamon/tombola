import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

// Same limit as maxNumberTicketsPerBuyOrClaim in the contract
const MAX_TICKETS_PER_BUY = 100;

function randomTicket() {
  return 1000000 + Math.floor(Math.random() * 1000000);
}

// n distinct random ticket numbers
function randomTickets(n) {
  const nums = new Set();
  while (nums.size < n) nums.add(randomTicket());
  return [...nums];
}

// Mirrors SaturneLottery._calculateTotalPriceForBulkTickets (bulk discount)
function bulkPrice(price, discountDivisor, n) {
  if (n === 0 || !discountDivisor) return ethers.BigNumber.from(0);
  return price.mul(n).mul(discountDivisor + 1 - n).div(discountDivisor);
}

// Display ticket number as colored digit bubbles
function TicketPreview({ number }) {
  const digits = String(number).slice(1).split('');
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {digits.map((d, i) => (
        <span key={i} className={`digit-bubble digit-bubble--${i}`} style={{ width: 28, height: 28, fontSize: '0.82rem' }}>
          {d}
        </span>
      ))}
    </div>
  );
}

export default function BuyTickets({ lottery, account, cakeBalance, cakeAllowance, txPending, onBuy, onApprove }) {
  const [count, setCount]       = useState(1);
  const [mode, setMode]         = useState('random');
  const [manual, setManual]     = useState('');
  // Every random number that will be bought; the preview shows the first 5
  const [randomNums, setRandomNums] = useState(() => randomTickets(1));

  const isOpen = lottery?.status === 'Open';
  const price  = lottery?.priceTicketInCake ?? ethers.BigNumber.from(0);
  const manualNums = validManual(manual);
  const ticketNums = mode === 'random' ? randomNums : manualNums;
  const effectiveCount = ticketNums.length;
  const tooMany = effectiveCount > MAX_TICKETS_PER_BUY;
  const total    = bulkPrice(price, lottery?.discountDivisor, effectiveCount);
  const discount = price.mul(effectiveCount).sub(total);
  const hasEnough  = cakeBalance.gte(total);
  const needApproval = cakeAllowance.lt(total);
  const canBuy = effectiveCount > 0 && !tooMany && hasEnough;

  const setCountAnd = (n) => {
    setCount(n);
    setRandomNums(randomTickets(n));
  };

  const handleBuy = useCallback(async () => {
    const receipt = await onBuy(ticketNums);
    if (receipt && mode === 'random') setRandomNums(randomTickets(count));
  }, [mode, count, ticketNums, onBuy]);

  if (!account) {
    return (
      <div style={s.wrap} id="buy">
        <div style={s.empty}>
          <div style={{ fontSize: '2.5rem' }}>🔒</div>
          <h3 style={s.emptyTitle}>Connectez votre portefeuille</h3>
          <p style={s.emptySub}>Vous devez connecter MetaMask pour acheter des tickets.</p>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div style={s.wrap} id="buy">
        <div style={s.empty}>
          <div style={{ fontSize: '2.5rem' }}>⏳</div>
          <h3 style={s.emptyTitle}>Vente fermée</h3>
          <p style={s.emptySub}>La prochaine loterie n'est pas encore ouverte.</p>
        </div>
      </div>
    );
  }

  return (
    <section id="buy" style={s.section}>
      <div className="container">
        <h2 style={s.sectionTitle}>🎟 Acheter des tickets</h2>
        <p style={s.sectionSub}>
          Prix unitaire :&nbsp;
          <strong style={{ color: '#FFB237' }}>
            {parseFloat(ethers.utils.formatEther(price)).toFixed(4)} CAKE
          </strong>
        </p>

        <div style={s.grid}>
          {/* Left: configurator */}
          <div className="card card--dark" style={s.configCard}>

            {/* Mode tabs */}
            <div style={s.tabs}>
              <button
                className={`btn btn--sm ${mode === 'random' ? 'btn--purple' : 'btn--ghost'}`}
                onClick={() => setMode('random')}
              >
                🎲 Aléatoire
              </button>
              <button
                className={`btn btn--sm ${mode === 'manual' ? 'btn--purple' : 'btn--ghost'}`}
                onClick={() => setMode('manual')}
              >
                ✏️ Manuel
              </button>
            </div>

            {mode === 'random' ? (
              <>
                <div style={s.label}>Nombre de tickets</div>
                <div style={s.counterRow}>
                  <button
                    className="btn btn--ghost btn--icon-only"
                    onClick={() => setCountAnd(Math.max(1, count - 1))}
                    disabled={count <= 1}
                  >−</button>
                  <div style={s.countVal}>{count}</div>
                  <button
                    className="btn btn--ghost btn--icon-only"
                    onClick={() => setCountAnd(Math.min(MAX_TICKETS_PER_BUY, count + 1))}
                    disabled={count >= MAX_TICKETS_PER_BUY}
                  >+</button>
                </div>
                <div style={s.quickBtns}>
                  {[1, 5, 10, 50, MAX_TICKETS_PER_BUY].map(n => (
                    <button
                      key={n}
                      className={`btn btn--sm ${count === n ? 'btn--gold' : 'btn--ghost'}`}
                      onClick={() => setCountAnd(n)}
                      style={{ padding: '6px 14px', minWidth: 50 }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={s.label}>Vos numéros (1 000 000 – 1 999 999)</div>
                <textarea
                  className="input"
                  rows={5}
                  style={{ fontFamily: 'monospace', fontSize: '0.88rem', marginTop: 6, resize: 'vertical' }}
                  placeholder={"1234561\n1500000\n1999999"}
                  value={manual}
                  onChange={e => setManual(e.target.value)}
                />
                <div style={{ color: tooMany ? '#ED4B9E' : '#736D8C', fontSize: '0.78rem', marginTop: 6 }}>
                  {manualNums.length} numéro(s) valide(s)
                  {tooMany && ` — maximum ${MAX_TICKETS_PER_BUY} par achat`}
                </div>
              </>
            )}

            <div className="divider" />

            {/* Total cost */}
            <div style={s.priceBlock}>
              {discount.gt(0) && (
                <div style={s.priceRow}>
                  <span style={{ color: '#736D8C', fontSize: '0.82rem' }}>Réduction groupée</span>
                  <span style={{ fontSize: '0.82rem', color: '#31D0AA' }}>
                    −{parseFloat(ethers.utils.formatEther(discount)).toFixed(4)} CAKE
                  </span>
                </div>
              )}
              <div style={s.priceRow}>
                <span style={{ color: '#736D8C' }}>Coût total</span>
                <span style={{ color: '#FFB237', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem' }}>
                  {parseFloat(ethers.utils.formatEther(total)).toFixed(4)} CAKE
                </span>
              </div>
              <div style={s.priceRow}>
                <span style={{ color: '#736D8C', fontSize: '0.82rem' }}>Solde disponible</span>
                <span style={{ fontSize: '0.82rem', color: hasEnough ? '#31D0AA' : '#ED4B9E' }}>
                  {parseFloat(ethers.utils.formatEther(cakeBalance)).toFixed(4)} CAKE
                </span>
              </div>
            </div>

            {!hasEnough && (
              <div style={s.errorMsg}>⚠ Solde CAKE insuffisant</div>
            )}

            {needApproval ? (
              <button
                className="btn btn--teal btn--full"
                style={{ marginTop: 14 }}
                onClick={onApprove}
                disabled={txPending || !hasEnough}
              >
                {txPending ? <><span className="spinner" /> En cours…</> : '✅ Approuver CAKE'}
              </button>
            ) : (
              <button
                className="btn btn--gold btn--full"
                style={{ marginTop: 14, fontSize: '1rem' }}
                onClick={handleBuy}
                disabled={txPending || !canBuy}
              >
                {txPending
                  ? <><span className="spinner" style={{ borderTopColor: '#280D5F' }} /> Transaction…</>
                  : `🎟 Acheter ${effectiveCount} ticket${effectiveCount > 1 ? 's' : ''}`
                }
              </button>
            )}
          </div>

          {/* Right: ticket preview */}
          {mode === 'random' && (
            <div style={s.previewCol}>
              <div style={s.previewTitle}>Aperçu des tickets</div>
              <div style={s.previewList}>
                {randomNums.slice(0, 5).map((num, i) => (
                  <div key={i} className="card" style={s.ticketCard}>
                    <div style={s.ticketTag}># {i + 1}</div>
                    <TicketPreview number={num} />
                  </div>
                ))}
                {count > 5 && (
                  <div style={s.morePill}>
                    + {count - 5} autre{count - 5 > 1 ? 's' : ''} ticket{count - 5 > 1 ? 's' : ''} aléatoires
                  </div>
                )}
              </div>
              <button
                className="btn btn--ghost btn--sm"
                style={{ marginTop: 12 }}
                onClick={() => setRandomNums(randomTickets(count))}
              >
                🔄 Régénérer les numéros
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function validManual(str) {
  return str.split(/[\n,;\s]+/)
    .map(v => parseInt(v.trim(), 10))
    .filter(n => !isNaN(n) && n >= 1000000 && n <= 1999999);
}

const s = {
  section: { padding: '48px 0', background: '#0D0A1F', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  sectionTitle: { fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 800, color: '#F4EEFF', marginBottom: 6 },
  sectionSub: { color: '#736D8C', fontSize: '0.92rem', marginBottom: 28 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  configCard: { padding: '24px' },

  tabs: { display: 'flex', gap: 8, marginBottom: 22 },
  label: { fontSize: '0.82rem', color: '#736D8C', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' },

  counterRow: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 },
  countVal: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '2.5rem',
    fontWeight: 900,
    color: '#FFB237',
    minWidth: 60,
    textAlign: 'center',
  },
  quickBtns: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 },

  priceBlock: { display: 'flex', flexDirection: 'column', gap: 8 },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },

  errorMsg: {
    marginTop: 10,
    padding: '10px 14px',
    background: 'rgba(237,75,158,0.12)',
    border: '1px solid rgba(237,75,158,0.3)',
    borderRadius: 10,
    color: '#FFB3D4',
    fontSize: '0.85rem',
  },

  previewCol: { display: 'flex', flexDirection: 'column' },
  previewTitle: {
    fontSize: '0.82rem',
    color: '#736D8C',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 14,
  },
  previewList: { display: 'flex', flexDirection: 'column', gap: 8 },
  ticketCard: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: '1px solid rgba(255,178,55,0.15)',
    background: 'rgba(255,178,55,0.05)',
  },
  ticketTag: { color: '#736D8C', fontSize: '0.78rem', minWidth: 28 },
  morePill: {
    textAlign: 'center',
    padding: '10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px dashed rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: '#736D8C',
    fontSize: '0.82rem',
  },

  wrap: { padding: '48px 0' },
  empty: {
    maxWidth: 400,
    margin: '0 auto',
    textAlign: 'center',
    padding: '48px 24px',
  },
  emptyTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#F4EEFF', marginTop: 16, marginBottom: 8 },
  emptySub: { color: '#736D8C', fontSize: '0.88rem', lineHeight: 1.6 },
};

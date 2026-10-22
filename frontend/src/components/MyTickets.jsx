import { useMemo, useCallback } from 'react';
import { ethers } from 'ethers';

const BRACKET_COLORS = ['#1A6EDB','#7645D9','#DD4AFF','#ED4B9E','#F0922C','#FFB237'];

// Same limit as maxNumberTicketsPerBuyOrClaim in the contract
const MAX_TICKETS_PER_CLAIM = 100;

function TicketCard({ ticket, status, bracket, cakePerLosingTicket, cakePerBracket }) {
  const digits = String(ticket.number).slice(1).split('');

  const statusConfig = {
    pending:   { border: 'rgba(115,109,140,0.25)', bg: 'rgba(115,109,140,0.06)', badge: 'badge--pending', label: 'En attente' },
    claimed:   { border: 'rgba(115,109,140,0.15)', bg: 'rgba(115,109,140,0.04)', badge: 'badge--pending', label: 'Réclamé ✓' },
    winner:    { border: `${BRACKET_COLORS[bracket] ?? '#FFB237'}55`, bg: `${BRACKET_COLORS[bracket] ?? '#FFB237'}0F`, badge: 'badge--winner', label: `🏆 Palier ${bracket + 1}` },
    consolation: { border: 'rgba(31,199,212,0.3)',  bg: 'rgba(31,199,212,0.06)',  badge: 'badge--loser',   label: '💎 Consolation' },
    loser:     { border: 'rgba(115,109,140,0.15)', bg: 'rgba(115,109,140,0.04)', badge: 'badge--pending', label: 'Perdant' },
  };

  const cfg = statusConfig[status] ?? statusConfig.pending;
  const color = status === 'winner' ? (BRACKET_COLORS[bracket] ?? '#FFB237') : status === 'consolation' ? '#1FC7D4' : '#736D8C';

  const reward =
    status === 'winner' && cakePerBracket?.[bracket]?.gt(0)
      ? parseFloat(ethers.utils.formatEther(cakePerBracket[bracket])).toFixed(4)
      : status === 'consolation' && cakePerLosingTicket?.gt(0)
      ? parseFloat(ethers.utils.formatEther(cakePerLosingTicket)).toFixed(4)
      : null;

  return (
    <div style={{ ...tc.card, borderColor: cfg.border, background: cfg.bg }}>
      {/* Ticket perforated left */}
      <div style={tc.perfLeft}>
        <div style={tc.perfCircle} />
        <div style={tc.perfLine} />
      </div>

      {/* Main content */}
      <div style={tc.content}>
        <div style={tc.idRow}>
          <span style={tc.idLabel}>#{ticket.id}</span>
          <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
        </div>
        <div style={tc.digits}>
          {digits.map((d, i) => (
            <div
              key={i}
              className={`digit-bubble digit-bubble--${i}`}
              style={{
                opacity: status === 'claimed' || status === 'loser' ? 0.4 : 1,
                boxShadow: (status === 'winner' && i <= (bracket ?? -1))
                  ? `0 0 10px ${BRACKET_COLORS[i] ?? '#FFB237'}80`
                  : 'none',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        {reward && (
          <div style={{ ...tc.reward, color }}>
            +{reward} CAKE
          </div>
        )}
      </div>

      {/* Perforated right */}
      <div style={{ ...tc.perfLeft, borderLeft: '1px dashed rgba(255,255,255,0.1)', borderRight: 'none' }}>
        <div style={tc.perfCircle} />
        <div style={tc.perfLine} />
      </div>
    </div>
  );
}

const tc = {
  card: {
    display: 'flex',
    alignItems: 'stretch',
    border: '1px solid',
    borderRadius: 14,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.03)',
  },
  perfLeft: {
    width: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px dashed rgba(255,255,255,0.1)',
    flexShrink: 0,
    gap: 4,
  },
  perfCircle: {
    width: 10, height: 10,
    borderRadius: '50%',
    background: '#08060E',
    border: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  perfLine: { flex: 1, width: 1, background: 'rgba(255,255,255,0.05)' },
  content: {
    flex: 1,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  idRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  idLabel: { color: '#736D8C', fontSize: '0.78rem' },
  digits: { display: 'flex', gap: 5 },
  reward: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '0.9rem',
  },
};

export default function MyTickets({
  lottery, lotteryId, account, userTickets, txPending,
  getTicketBracket, onClaimWinners, onClaimLosers,
}) {
  const isClaimable = lottery?.status === 'Claimable';
  // Losing tickets only have something to claim when the round was drawn with a consolation pool
  const hasConsolation = isClaimable && Boolean(lottery.cakePerLosingTicket?.gt(0));

  // Highest prize bracket per ticket id (-1 = loser), computed locally from the final number
  const brackets = useMemo(() => {
    const map = {};
    if (isClaimable) userTickets.forEach(t => { map[t.id] = getTicketBracket(t.number); });
    return map;
  }, [isClaimable, userTickets, getTicketBracket]);

  const getStatus = (t) => {
    if (t.claimed) return 'claimed';
    if (!isClaimable) return 'pending';
    if (brackets[t.id] >= 0) return 'winner';
    return hasConsolation ? 'consolation' : 'loser';
  };

  const claimableW = userTickets.filter(t => brackets[t.id] >= 0 && !t.claimed);
  const claimableL = hasConsolation ? userTickets.filter(t => brackets[t.id] === -1 && !t.claimed) : [];

  const handleClaimAll = useCallback(async () => {
    // The contract caps the number of tickets per claim: send them in batches
    for (let i = 0; i < claimableW.length; i += MAX_TICKETS_PER_CLAIM) {
      const batch = claimableW.slice(i, i + MAX_TICKETS_PER_CLAIM);
      await onClaimWinners(batch.map(t => t.id), batch.map(t => brackets[t.id]));
    }
    for (let i = 0; i < claimableL.length; i += MAX_TICKETS_PER_CLAIM) {
      const batch = claimableL.slice(i, i + MAX_TICKETS_PER_CLAIM);
      await onClaimLosers(batch.map(t => t.id));
    }
  }, [claimableW, claimableL, brackets, onClaimWinners, onClaimLosers]);

  if (!account) return null;

  return (
    <section id="tickets" style={s.section}>
      <div className="container">
        <div style={s.titleRow}>
          <h2 style={s.title}>🎫 Mes Tickets</h2>
          {userTickets.length > 0 && (
            <span style={s.count}>{userTickets.length} ticket{userTickets.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {userTickets.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: '3rem' }}>🎟</div>
            <p style={{ color: '#736D8C', marginTop: 12 }}>
              {lottery?.status === 'Open'
                ? 'Vous n\'avez pas encore acheté de ticket pour cette loterie.'
                : 'Aucun ticket trouvé pour la loterie actuelle.'}
            </p>
          </div>
        ) : (
          <>
            {/* Claim all CTA */}
            {isClaimable && (claimableW.length > 0 || claimableL.length > 0) && (
              <div style={s.claimBanner}>
                <div style={s.claimBannerContent}>
                  <span style={{ fontSize: '1.4rem' }}>🎁</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#F4EEFF' }}>Vous avez des gains à réclamer !</div>
                    <div style={{ color: '#736D8C', fontSize: '0.85rem' }}>
                      {claimableW.length > 0 && `${claimableW.length} ticket(s) gagnant(s)`}
                      {claimableW.length > 0 && claimableL.length > 0 && ' · '}
                      {claimableL.length > 0 && `${claimableL.length} consolation`}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn--gold"
                  onClick={handleClaimAll}
                  disabled={txPending}
                >
                  {txPending
                    ? <><span className="spinner" style={{ borderTopColor: '#280D5F' }} /> Réclamation…</>
                    : '🎁 Tout réclamer'}
                </button>
              </div>
            )}

            {/* Grid of ticket cards */}
            <div style={s.grid}>
              {userTickets.map(t => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  status={getStatus(t)}
                  bracket={brackets[t.id]}
                  cakePerLosingTicket={lottery?.cakePerLosingTicket}
                  cakePerBracket={lottery?.cakePerBracket}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

const s = {
  section: { padding: '48px 0', background: '#08060E', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800, color: '#F4EEFF' },
  count: {
    fontSize: '0.82rem',
    color: '#736D8C',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '3px 10px',
    borderRadius: 99,
  },
  empty: { textAlign: 'center', padding: '40px 0' },
  claimBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '18px 22px',
    background: 'linear-gradient(135deg, rgba(255,178,55,0.12), rgba(240,146,44,0.08))',
    border: '1px solid rgba(255,178,55,0.3)',
    borderRadius: 16,
    marginBottom: 22,
    flexWrap: 'wrap',
  },
  claimBannerContent: { display: 'flex', alignItems: 'center', gap: 14 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
  },
};

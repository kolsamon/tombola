import { ethers } from 'ethers';
import ADDRESSES from '../../contracts/addresses.json';

const CHAIN = ADDRESSES.bscTestnet;

const STATUS_STYLE = {
  Open:      { color: '#31D0AA', bg: 'rgba(49,208,170,0.12)', border: 'rgba(49,208,170,0.3)' },
  Close:     { color: '#FFB237', bg: 'rgba(255,178,55,0.12)', border: 'rgba(255,178,55,0.3)' },
  Claimable: { color: '#A881FC', bg: 'rgba(168,129,252,0.12)', border: 'rgba(168,129,252,0.3)' },
  Pending:   { color: '#736D8C', bg: 'rgba(115,109,140,0.1)',  border: 'rgba(115,109,140,0.2)' },
};

export default function DashboardPanel({ lotteryId, lotteryData, contractInfo, cakeBalance, account, isOwner, isOperator, loading, onNav }) {
  const st = lotteryData ? STATUS_STYLE[lotteryData.status] ?? STATUS_STYLE.Pending : null;

  return (
    <div style={s.wrap}>
      <div style={s.titleRow}>
        <h1 style={s.title}>Dashboard</h1>
        {loading && <span style={s.loading}><span className="spinner" /> Chargement…</span>}
      </div>

      {/* Role warning */}
      {account && !isOwner && !isOperator && (
        <div style={s.warnBanner}>
          ⚠ Votre adresse n'est ni <strong>owner</strong> ni <strong>operator</strong>. Certaines actions seront refusées.
        </div>
      )}

      {/* Status cards */}
      <div style={s.statGrid}>
        <StatCard icon="🎰" label="Loterie actuelle" value={lotteryId ? `#${lotteryId}` : 'Aucune'} />
        <StatCard icon="📊" label="Statut" value={lotteryData?.status ?? '—'}
          valueStyle={st ? { color: st.color } : {}}
        />
        <StatCard icon="💰" label="Cagnotte"
          value={lotteryData ? parseFloat(ethers.utils.formatEther(lotteryData.amountCollectedInCake)).toFixed(4) + ' CAKE' : '—'}
        />
        <StatCard icon="🍰" label="Votre solde CAKE"
          value={parseFloat(ethers.utils.formatEther(cakeBalance)).toFixed(4) + ' CAKE'}
        />
      </div>

      {/* Lottery details */}
      {lotteryData && (
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Loterie #{lotteryId}</h2>
          <div style={s.detailGrid}>
            <Detail label="Statut" value={
              <span style={{ ...s.statusBadge, color: st?.color, background: st?.bg, border: `1px solid ${st?.border}` }}>
                {lotteryData.status}
              </span>
            } />
            <Detail label="Début" value={new Date(lotteryData.startTime * 1000).toLocaleString('fr-FR')} />
            <Detail label="Fin" value={new Date(lotteryData.endTime * 1000).toLocaleString('fr-FR')} />
            <Detail label="Prix ticket" value={parseFloat(ethers.utils.formatEther(lotteryData.priceTicketInCake)).toFixed(4) + ' CAKE'} />
            <Detail label="Frais tréso." value={`${lotteryData.treasuryFee / 100}%`} />
            <Detail label="Discount div." value={lotteryData.discountDivisor} />
            <Detail label="1er ticket ID" value={lotteryData.firstTicketId} />
            <Detail label="Tickets vendus"
              value={lotteryData.status !== 'Open'
                ? lotteryData.firstTicketIdNextLottery - lotteryData.firstTicketId
                : '—'
              }
            />
            <Detail label="Consolation"
              value={<span style={{ color: lotteryData.consolationEnabled ? '#1FC7D4' : '#736D8C' }}>
                {lotteryData.consolationEnabled ? '💎 Active (25% aux perdants)' : 'Désactivée'}
              </span>}
            />
            {lotteryData.status === 'Claimable' && (
              <>
                <Detail label="Numéro final" value={lotteryData.finalNumber} />
                {lotteryData.consolationEnabled && (
                  <Detail label="CAKE/ticket perdant"
                    value={parseFloat(ethers.utils.formatEther(lotteryData.cakePerLosingTicket)).toFixed(6) + ' CAKE'}
                  />
                )}
              </>
            )}
          </div>

          {/* Rewards breakdown */}
          <div style={{ marginTop: 16 }}>
            <div style={s.subLabel}>Répartition paliers</div>
            <div style={s.rewardsRow}>
              {lotteryData.rewardsBreakdown.map((pct, i) => (
                <div key={i} style={s.rewardCell}>
                  <div style={{ color: '#736D8C', fontSize: '0.72rem' }}>P{i + 1}</div>
                  <div style={{ color: '#FFB237', fontWeight: 700 }}>{pct / 100}%</div>
                  {lotteryData.status === 'Claimable' && (
                    <div style={{ color: '#736D8C', fontSize: '0.72rem' }}>
                      {lotteryData.countWinnersPerBracket[i]}w
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contract config */}
      {contractInfo && (
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Configuration du contrat</h2>
          <div style={s.detailGrid}>
            <Detail label="Owner"    value={shortAddr(contractInfo.owner)}    link={`${CHAIN.explorerAddress}${contractInfo.owner}`} />
            <Detail label="Operator" value={shortAddr(contractInfo.operator)} link={`${CHAIN.explorerAddress}${contractInfo.operator}`} />
            <Detail label="Treasury" value={shortAddr(contractInfo.treasury)} link={`${CHAIN.explorerAddress}${contractInfo.treasury}`} />
            <Detail label="Injector" value={shortAddr(contractInfo.injector)} link={`${CHAIN.explorerAddress}${contractInfo.injector}`} />
            <Detail label="winnersShareBps"       value={`${contractInfo.winnersShareBps} (${contractInfo.winnersShareBps / 100}%)`} />
            <Detail label="consolationEnabled"    value={contractInfo.consolationEnabled ? 'true (prochaines manches)' : 'false (prochaines manches)'} />
            <Detail label="referralCommission"    value={`${contractInfo.referralCommission} (${contractInfo.referralCommission / 100}%)`} />
            <Detail label="treasuryCommission"    value={`${contractInfo.treasuryCommission} (${contractInfo.treasuryCommission / 100}%)`} />
            <Detail label="maxTickets/buy"        value={contractInfo.maxNumberTicketsPerBuyOrClaim} />
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Actions rapides</h2>
        <div style={s.quickGrid}>
          {lotteryData?.status === 'Claimable' || !lotteryId ? (
            <QuickAction icon="▶️" label="Démarrer une loterie" color="#31D0AA" onClick={() => onNav('lottery')} />
          ) : null}
          {lotteryData?.status === 'Open' && (
            <QuickAction icon="⏹️" label="Fermer la loterie" color="#FFB237" onClick={() => onNav('draw')} />
          )}
          {lotteryData?.status === 'Close' && (
            <QuickAction icon="🎲" label="Tirer le numéro" color="#A881FC" onClick={() => onNav('draw')} />
          )}
          <QuickAction icon="🔮" label="Configurer MockRNG" color="#1FC7D4" onClick={() => onNav('rng')} />
          <QuickAction icon="🍰" label="Minter des CAKE" color="#FFB237" onClick={() => onNav('token')} />
          <QuickAction icon="⚙️" label="Configuration" color="#A881FC" onClick={() => onNav('config')} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, valueStyle = {} }) {
  return (
    <div style={s.statCard}>
      <div style={s.statIcon}>{icon}</div>
      <div style={{ ...s.statValue, ...valueStyle }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function Detail({ label, value, link }) {
  return (
    <div style={s.detail}>
      <div style={s.detailLabel}>{label}</div>
      {link
        ? <a href={link} target="_blank" rel="noreferrer" style={{ ...s.detailValue, color: '#A881FC', textDecoration: 'none' }}>{value}</a>
        : <div style={s.detailValue}>{value}</div>
      }
    </div>
  );
}

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button style={{ ...s.quickBtn, borderColor: color + '40' }} onClick={onClick}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <span style={{ fontSize: '0.82rem', color: '#B8ADD2', fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function shortAddr(a) { return a ? `${a.slice(0, 8)}…${a.slice(-6)}` : '—'; }

const s = {
  wrap: { padding: '28px 32px', maxWidth: 900 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 },
  title: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#F4EEFF' },
  loading: { display: 'flex', alignItems: 'center', gap: 8, color: '#736D8C', fontSize: '0.85rem' },
  warnBanner: {
    padding: '12px 16px',
    background: 'rgba(237,75,158,0.1)',
    border: '1px solid rgba(237,75,158,0.3)',
    borderRadius: 12,
    color: '#FFB3D4',
    fontSize: '0.85rem',
    marginBottom: 20,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    padding: '16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    textAlign: 'center',
  },
  statIcon: { fontSize: '1.4rem', marginBottom: 6 },
  statValue: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    fontSize: '1rem',
    color: '#F4EEFF',
    marginBottom: 4,
  },
  statLabel: { color: '#736D8C', fontSize: '0.75rem' },
  section: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '20px',
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#B8ADD2',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12,
  },
  detail: {
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  detailLabel: { fontSize: '0.72rem', color: '#736D8C', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' },
  detailValue: { fontSize: '0.88rem', color: '#F4EEFF', fontWeight: 600, wordBreak: 'break-all' },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 99,
    fontSize: '0.82rem',
    fontWeight: 700,
  },
  subLabel: { fontSize: '0.75rem', color: '#736D8C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' },
  rewardsRow: { display: 'flex', gap: 8 },
  rewardCell: {
    flex: 1,
    textAlign: 'center',
    padding: '8px 4px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 10,
  },
  quickBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '16px 10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
    borderRadius: 14,
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.15s',
    fontFamily: 'inherit',
  },
};

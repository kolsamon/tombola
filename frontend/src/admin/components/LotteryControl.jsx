import { useState } from 'react';
import { ethers } from 'ethers';

const DEFAULT_REWARDS = [0, 0, 0, 0, 3000, 7000];
const DURATION_PRESETS = [
  { label: '4h15 (min)',  seconds: 4 * 3600 + 15 * 60 },
  { label: '8 heures',   seconds: 8 * 3600 },
  { label: '24 heures',  seconds: 24 * 3600 },
  { label: '48 heures',  seconds: 48 * 3600 },
];

export default function LotteryControl({ lotteryId, lotteryData, txPending, isOperator, onStart, onClose, onDraw }) {
  const [duration,      setDuration]     = useState(DURATION_PRESETS[0].seconds);
  const [customDur,     setCustomDur]    = useState('');
  const [price,         setPrice]        = useState('0.05');
  const [discountDiv,   setDiscountDiv]  = useState('2000');
  const [rewards,       setRewards]      = useState([...DEFAULT_REWARDS]);
  const [treasuryFee,   setTreasuryFee]  = useState('1000');
  const [autoInject,    setAutoInject]   = useState(false);

  const rewardSum = rewards.reduce((a, b) => a + b, 0);
  const canStart = (lotteryId === 0 || lotteryData?.status === 'Claimable') && isOperator;
  const canClose = lotteryData?.status === 'Open' && isOperator;
  const canDraw  = lotteryData?.status === 'Close' && isOperator;

  const effDuration = customDur ? parseInt(customDur) : duration;
  const endTime = Math.floor(Date.now() / 1000) + effDuration;

  const handleStart = async () => {
    if (rewardSum !== 10000) return alert('La somme des paliers doit être exactement 10 000.');
    const priceWei = ethers.utils.parseEther(price || '0.05');
    await onStart(endTime, priceWei, parseInt(discountDiv), rewards, parseInt(treasuryFee));
  };

  const setReward = (i, val) => {
    const next = [...rewards];
    next[i] = parseInt(val) || 0;
    setRewards(next);
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.pageTitle}>🎰 Gestion de Loterie</h1>

      {!isOperator && <PermWarn role="operator" />}

      {/* ── Démarrer ──────────────────────────────────────────────────────── */}
      <Panel title="▶ Démarrer une nouvelle loterie" disabled={!canStart}>
        {!canStart && lotteryData?.status === 'Open' && (
          <div style={s.note}>⚠ Impossible de démarrer : une loterie est déjà ouverte.</div>
        )}

        <div style={s.grid2}>
          {/* Duration */}
          <div style={s.field}>
            <label style={s.label}>Durée</label>
            <div style={s.presetRow}>
              {DURATION_PRESETS.map(p => (
                <button
                  key={p.seconds}
                  className={`btn btn--sm ${duration === p.seconds && !customDur ? 'btn--purple' : 'btn--ghost'}`}
                  onClick={() => { setDuration(p.seconds); setCustomDur(''); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              className="input"
              style={{ marginTop: 8 }}
              placeholder="Durée personnalisée (secondes)"
              value={customDur}
              onChange={e => setCustomDur(e.target.value)}
            />
            <div style={s.hint}>
              Fin prévue : {new Date(endTime * 1000).toLocaleString('fr-FR')}
            </div>
          </div>

          {/* Price */}
          <div style={s.field}>
            <label style={s.label}>Prix par ticket (CAKE)</label>
            <input className="input" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.05" />
          </div>

          {/* Discount divisor */}
          <div style={s.field}>
            <label style={s.label}>discountDivisor (min 300)</label>
            <input className="input" value={discountDiv} onChange={e => setDiscountDiv(e.target.value)} placeholder="2000" />
            <div style={s.hint}>Diviseur pour remise en bulk. Plus grand = moins de réduction.</div>
          </div>

          {/* Treasury fee */}
          <div style={s.field}>
            <label style={s.label}>treasuryFee (basis pts, max 3000)</label>
            <input className="input" value={treasuryFee} onChange={e => setTreasuryFee(e.target.value)} placeholder="1000" />
            <div style={s.hint}>{parseInt(treasuryFee) / 100 || 0}% prélevé pour la trésorerie</div>
          </div>
        </div>

        {/* Rewards breakdown */}
        <div style={{ marginTop: 16 }}>
          <label style={s.label}>
            Répartition des paliers (total = 10 000)
            <span style={{ color: rewardSum === 10000 ? '#31D0AA' : '#ED4B9E', marginLeft: 8 }}>
              {rewardSum} / 10 000
            </span>
          </label>
          <div style={s.rewardGrid}>
            {rewards.map((val, i) => (
              <div key={i} style={s.rewardField}>
                <div style={s.rewardLabel}>Palier {i + 1}</div>
                <input
                  className="input"
                  style={{ textAlign: 'center', padding: '8px' }}
                  type="number"
                  value={val}
                  min={0}
                  max={10000}
                  onChange={e => setReward(i, e.target.value)}
                />
                <div style={{ color: '#736D8C', fontSize: '0.72rem', textAlign: 'center' }}>{val / 100}%</div>
              </div>
            ))}
          </div>
          <div style={s.hint}>Chaque palier = tickets dont les N derniers chiffres correspondent. Palier 6 = jackpot.</div>
        </div>

        <button
          className="btn btn--gold btn--full"
          style={{ marginTop: 20 }}
          onClick={handleStart}
          disabled={txPending || !canStart || rewardSum !== 10000}
        >
          {txPending ? <><span className="spinner" style={{ borderTopColor: '#280D5F' }} /> En cours…</> : '▶ Démarrer la loterie'}
        </button>
      </Panel>

      {/* ── Fermer ────────────────────────────────────────────────────────── */}
      <Panel title="⏹ Fermer la loterie" disabled={!canClose}>
        <p style={s.desc}>
          Ferme la loterie actuelle et enregistre le nombre total de tickets. Lance la requête au RNG.
          La loterie doit être passée la date de fin.
        </p>
        {lotteryData && (
          <div style={s.infoBox}>
            Loterie <strong>#{lotteryId}</strong> — statut : <strong style={{ color: '#FFB237' }}>{lotteryData.status}</strong>
            {' '} — fin : {new Date(lotteryData.endTime * 1000).toLocaleString('fr-FR')}
          </div>
        )}
        <button
          className="btn btn--full"
          style={{ marginTop: 16, background: canClose ? 'linear-gradient(135deg, #d97706, #FFB237)' : undefined, color: '#280D5F', fontWeight: 700, borderRadius: 999, padding: '12px' }}
          onClick={() => onClose(lotteryId)}
          disabled={txPending || !canClose}
        >
          {txPending ? <><span className="spinner" /> En cours…</> : `⏹ Fermer la loterie #${lotteryId}`}
        </button>
      </Panel>

      {/* ── Tirer ─────────────────────────────────────────────────────────── */}
      <Panel title="🎲 Tirer le numéro final" disabled={!canDraw}>
        <p style={s.desc}>
          Lit le résultat du MockRNG, calcule la répartition (50/25/25), distribue les récompenses
          par palier, et rend la loterie claimable.
        </p>
        <div style={s.switchRow}>
          <label style={s.label}>Auto-injection dans la prochaine loterie</label>
          <button
            style={{
              ...s.toggle,
              background: autoInject ? '#7645D9' : 'rgba(255,255,255,0.08)',
            }}
            onClick={() => setAutoInject(v => !v)}
          >
            <div style={{ ...s.toggleDot, transform: autoInject ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>
        <div style={s.hint}>
          {autoInject
            ? '✅ Les fonds de trésorerie seront réinjectés dans la prochaine loterie'
            : '❌ Les fonds de trésorerie seront envoyés à l\'adresse trésorerie'}
        </div>
        <button
          className="btn btn--full"
          style={{ marginTop: 16, background: canDraw ? 'linear-gradient(135deg, #5b21b6, #7645D9)' : undefined, color: '#fff', fontWeight: 700, borderRadius: 999, padding: '12px' }}
          onClick={() => onDraw(lotteryId, autoInject)}
          disabled={txPending || !canDraw}
        >
          {txPending ? <><span className="spinner" /> En cours…</> : `🎲 Tirer le numéro — loterie #${lotteryId}`}
        </button>
      </Panel>
    </div>
  );
}

function Panel({ title, children, disabled }) {
  return (
    <div style={{ ...s.panel, opacity: disabled ? 0.6 : 1 }}>
      <h2 style={s.panelTitle}>{title}</h2>
      {children}
    </div>
  );
}

function PermWarn({ role }) {
  return (
    <div style={s.permWarn}>
      ⚠ Vous n'êtes pas <strong>{role}</strong>. Ces transactions seront rejetées par le contrat.
    </div>
  );
}

const s = {
  wrap: { padding: '28px 32px', maxWidth: 860 },
  pageTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#F4EEFF', marginBottom: 24 },
  panel: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: '22px 24px',
    marginBottom: 18,
    transition: 'opacity 0.2s',
  },
  panelTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1rem',
    fontWeight: 700,
    color: '#F4EEFF',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: {},
  label: { display: 'block', fontSize: '0.8rem', color: '#736D8C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 },
  presetRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  hint: { fontSize: '0.75rem', color: '#443F5A', marginTop: 6 },
  rewardGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginTop: 8 },
  rewardField: { display: 'flex', flexDirection: 'column', gap: 4 },
  rewardLabel: { fontSize: '0.72rem', color: '#736D8C', textAlign: 'center' },
  desc: { color: '#736D8C', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 12 },
  infoBox: {
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    fontSize: '0.85rem',
    color: '#B8ADD2',
  },
  note: {
    padding: '10px 14px',
    background: 'rgba(255,178,55,0.1)',
    border: '1px solid rgba(255,178,55,0.25)',
    borderRadius: 10,
    color: '#FFE4A0',
    fontSize: '0.85rem',
    marginBottom: 14,
  },
  permWarn: {
    padding: '12px 16px',
    background: 'rgba(237,75,158,0.1)',
    border: '1px solid rgba(237,75,158,0.3)',
    borderRadius: 12,
    color: '#FFB3D4',
    fontSize: '0.85rem',
    marginBottom: 20,
  },
  switchRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 99,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  toggleDot: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform 0.2s',
  },
};

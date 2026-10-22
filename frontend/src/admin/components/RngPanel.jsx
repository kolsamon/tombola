import { useState } from 'react';
import ADDRESSES from '../../contracts/addresses.json';

const CHAIN = ADDRESSES.bscTestnet;

export default function RngPanel({ lotteryId, txPending, onSetLotteryId, onSetResult }) {
  const [rngLotteryId, setRngLotteryId] = useState(String(lotteryId ?? ''));
  const [result,       setResult]       = useState('');

  const isValidNumber = (v) => {
    const n = parseInt(v);
    return !isNaN(n) && n >= 1000000 && n <= 1999999;
  };

  return (
    <div style={s.wrap}>
      <h1 style={s.pageTitle}>🔮 Contrôle MockRNG</h1>
      <p style={s.sub}>
        Le <strong>MockRandomNumberGenerator</strong> permet de fixer manuellement le numéro gagnant
        sur testnet, sans dépendre de ChainLink VRF.
      </p>

      <div style={s.infoBox}>
        <div style={s.infoRow}>
          <span style={{ color: '#736D8C', fontSize: '0.8rem' }}>Adresse MockRNG</span>
          <a
            href={`${CHAIN.explorerAddress}${CHAIN.rng}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#A881FC', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'monospace' }}
          >
            {CHAIN.rng}
          </a>
        </div>
      </div>

      {/* Set lottery ID */}
      <Panel title="setLatestLotteryId — Étape 1">
        <p style={s.desc}>
          Indique au MockRNG que le dernier tirage correspond à cette loterie.
          Le contrat SaturneLottery vérifie que <code style={s.code}>randomGenerator.viewLatestLotteryId() == _lotteryId</code>.
        </p>
        <div style={s.row}>
          <input
            className="input"
            type="number"
            placeholder="ID de la loterie"
            value={rngLotteryId}
            onChange={e => setRngLotteryId(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <button
            className="btn btn--teal"
            onClick={() => onSetLotteryId(parseInt(rngLotteryId))}
            disabled={txPending || !rngLotteryId}
          >
            {txPending ? <><span className="spinner" /> En cours…</> : 'Définir lotteryId'}
          </button>
        </div>
        {lotteryId && (
          <div style={s.suggestion}>
            💡 Loterie actuelle : <strong style={{ color: '#1FC7D4' }}>#{lotteryId}</strong>
            {' '}<button className="btn btn--ghost btn--sm" onClick={() => setRngLotteryId(String(lotteryId))}>Utiliser</button>
          </div>
        )}
      </Panel>

      {/* Set random result */}
      <Panel title="setRandomResult — Étape 2">
        <p style={s.desc}>
          Définit le numéro gagnant retourné par <code style={s.code}>viewRandomResult()</code>.
          Doit être entre <strong>1 000 000</strong> et <strong>1 999 999</strong>.
        </p>

        <div style={s.numberBox}>
          {[...Array(6)].map((_, i) => {
            const digits = result ? String(result).slice(1) : '______';
            const d = digits[i] ?? '_';
            const COLORS = ['#1A6EDB','#7645D9','#DD4AFF','#ED4B9E','#F0922C','#FFB237'];
            return (
              <div key={i} style={{ ...s.digitBox, background: result ? COLORS[i] + '30' : 'rgba(255,255,255,0.04)', borderColor: result ? COLORS[i] + '60' : 'rgba(255,255,255,0.1)', color: result ? COLORS[i] : '#443F5A' }}>
                {d}
              </div>
            );
          })}
        </div>

        <div style={s.row}>
          <input
            className="input"
            type="number"
            placeholder="ex: 1234561"
            value={result}
            onChange={e => setResult(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          {result && (
            <span style={{ color: isValidNumber(result) ? '#31D0AA' : '#ED4B9E', fontSize: '0.85rem' }}>
              {isValidNumber(result) ? '✓ Valide' : '✗ Invalide (1000000–1999999)'}
            </span>
          )}
        </div>

        <div style={s.presetRow}>
          <span style={{ color: '#736D8C', fontSize: '0.78rem' }}>Suggestions :</span>
          {[1234561, 1999999, 1500000, 1111111].map(n => (
            <button key={n} className="btn btn--ghost btn--sm" onClick={() => setResult(String(n))}>
              {n}
            </button>
          ))}
        </div>

        <button
          className="btn btn--purple"
          style={{ marginTop: 14 }}
          onClick={() => onSetResult(parseInt(result))}
          disabled={txPending || !isValidNumber(result)}
        >
          {txPending ? <><span className="spinner" /> En cours…</> : '🔮 Définir le numéro gagnant'}
        </button>
      </Panel>

      {/* Workflow reminder */}
      <div style={s.workflowCard}>
        <h3 style={s.workflowTitle}>📋 Workflow complet du tirage</h3>
        <div style={s.steps}>
          {[
            '1. closeLottery(lotteryId) — onglet "Loterie"',
            '2. setLatestLotteryId(lotteryId) — ci-dessus',
            '3. setRandomResult(finalNumber) — ci-dessus',
            '4. drawFinalNumberAndMakeLotteryClaimable(lotteryId, false) — onglet "Loterie"',
          ].map((step, i) => (
            <div key={i} style={s.step}>
              <div style={s.stepDot} />
              <span style={{ color: '#B8ADD2', fontSize: '0.88rem' }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={s.panel}>
      <h2 style={s.panelTitle}>{title}</h2>
      {children}
    </div>
  );
}

const s = {
  wrap: { padding: '28px 32px', maxWidth: 760 },
  pageTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#F4EEFF', marginBottom: 8 },
  sub: { color: '#736D8C', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 20 },
  infoBox: {
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginBottom: 20,
  },
  infoRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  panel: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: '22px 24px',
    marginBottom: 16,
  },
  panelTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#F4EEFF',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  desc: { color: '#736D8C', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 14 },
  code: {
    fontFamily: 'monospace',
    background: 'rgba(0,0,0,0.35)',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: '0.85em',
    color: '#9AFFF9',
  },
  row: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  suggestion: {
    marginTop: 10,
    fontSize: '0.82rem',
    color: '#736D8C',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  numberBox: {
    display: 'flex',
    gap: 6,
    marginBottom: 14,
  },
  digitBox: {
    width: 44,
    height: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    borderRadius: 10,
    fontFamily: "'Space Grotesk', monospace",
    fontWeight: 900,
    fontSize: '1.3rem',
    transition: 'all 0.2s',
  },
  presetRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  workflowCard: {
    background: 'rgba(118,69,217,0.1)',
    border: '1px solid rgba(118,69,217,0.3)',
    borderRadius: 16,
    padding: '20px 22px',
  },
  workflowTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '0.95rem',
    color: '#C8ADFF',
    marginBottom: 14,
  },
  steps: { display: 'flex', flexDirection: 'column', gap: 10 },
  step: { display: 'flex', alignItems: 'center', gap: 10 },
  stepDot: { width: 6, height: 6, borderRadius: '50%', background: '#7645D9', flexShrink: 0 },
};

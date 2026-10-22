import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SaturnIllustration from './SaturnIllustration';

const STATUS = {
  Open:      { label: 'En cours',   cls: 'badge--open',    dot: '#31D0AA' },
  Close:     { label: 'Clôturée',   cls: 'badge--close',   dot: '#FFB237' },
  Claimable: { label: 'Claimable',  cls: 'badge--claim',   dot: '#A881FC' },
  Pending:   { label: 'En attente', cls: 'badge--pending', dot: '#736D8C' },
};

function useCountdown(endTime) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const tick = () => setT(Math.max(0, endTime - Math.floor(Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}

function CDBox({ val, lbl }) {
  return (
    <div style={cd.box}>
      <div style={cd.num}>{String(val).padStart(2, '0')}</div>
      <div style={cd.lbl}>{lbl}</div>
    </div>
  );
}

function Colon() {
  return <div style={cd.colon}>:</div>;
}

const cd = {
  box: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '10px 14px',
    minWidth: 58,
  },
  num: {
    fontFamily: "'Space Grotesk', monospace",
    fontSize: '1.8rem',
    fontWeight: 900,
    color: '#FFB237',
    lineHeight: 1,
  },
  lbl: { fontSize: '0.65rem', color: '#736D8C', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 },
  colon: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.6rem', fontWeight: 900,
    color: '#FFB237', opacity: 0.5,
    paddingBottom: 14,
  },
};

export default function LotteryHero({ lottery, lotteryId, loading }) {
  const countdown = useCountdown(lottery?.endTime ?? 0);

  return (
    <section style={s.section}>
      {/* Background gradient layers */}
      <div style={s.bgGlow1} aria-hidden="true" />
      <div style={s.bgGlow2} aria-hidden="true" />

      <div className="container" style={s.container}>

        {/* Left column */}
        <div style={s.left}>
          {/* Eyebrow */}
          <div style={s.eyebrow}>
            {lottery
              ? <span className={`badge ${STATUS[lottery.status]?.cls ?? 'badge--pending'}`}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS[lottery.status]?.dot ?? '#736D8C', display: 'inline-block' }} />
                  {STATUS[lottery.status]?.label ?? 'Inconnu'}
                </span>
              : null
            }
            {lotteryId ? (
              <span style={s.roundLabel}>Tour #{lotteryId}</span>
            ) : null}
          </div>

          {/* Main headline */}
          <h1 style={s.headline}>
            La cagnotte du<br />
            <span style={s.headlineAccent}>prochain gagnant</span>
          </h1>

          {/* Jackpot amount */}
          <div style={s.jackpotWrap}>
            {loading && !lottery ? (
              <div style={s.jackpotSkeleton} />
            ) : lottery ? (
              <>
                <span style={s.jackpotVal}>
                  {parseFloat(ethers.utils.formatEther(lottery.amountCollectedInCake)).toFixed(3)}
                </span>
                <span style={s.jackpotCake}>CAKE</span>
              </>
            ) : (
              <span style={{ ...s.jackpotVal, fontSize: '2.5rem', color: '#736D8C' }}>
                Aucune loterie active
              </span>
            )}
          </div>

          {/* Countdown */}
          {lottery?.status === 'Open' && (
            <div style={s.cdSection}>
              <div style={s.cdLabel}>Fin dans</div>
              <div style={s.cdRow}>
                {countdown.d > 0 && <><CDBox val={countdown.d} lbl="jours" /><Colon /></>}
                <CDBox val={countdown.h} lbl="heures" />
                <Colon />
                <CDBox val={countdown.m} lbl="min" />
                <Colon />
                <CDBox val={countdown.s} lbl="sec" />
              </div>
            </div>
          )}

          {/* Winner number (claimable) */}
          {lottery?.status === 'Claimable' && lottery.finalNumber > 0 && (
            <div style={s.finalBox}>
              <div style={s.finalLabel}>Numéro gagnant</div>
              <div style={s.finalDigits}>
                {String(lottery.finalNumber).slice(1).split('').map((d, i) => (
                  <span key={i} className={`digit-bubble digit-bubble--${i}`}>{d}</span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={s.ctaRow}>
            <a href="#buy" className="btn btn--gold btn--lg" style={s.ctaBtn}>
              🎟 Acheter des tickets
            </a>
            <a href="#how" className="btn btn--ghost">
              Comment jouer
            </a>
          </div>

          {/* Prize split pill row: 50/25/25 with the consolation pool, 50/50 without */}
          {lottery && (
            <div style={s.splitPills}>
              <SplitPill icon="🏆" label="Gagnants" pct="50%" color="#FFB237" />
              <div style={s.splitDot} />
              {lottery.consolationEnabled && (
                <>
                  <SplitPill icon="💎" label="Consolation" pct="25%" color="#1FC7D4" />
                  <div style={s.splitDot} />
                </>
              )}
              <SplitPill icon="🏛" label="Trésorerie" pct={lottery.consolationEnabled ? '25%' : '50%'} color="#A881FC" />
            </div>
          )}
        </div>

        {/* Right column — illustration */}
        <div style={s.right} className="hide-mobile">
          <SaturnIllustration size={340} />
        </div>

      </div>
    </section>
  );
}

function SplitPill({ icon, label, pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
      <span>{icon}</span>
      <span style={{ color: '#B8ADD2' }}>{label}</span>
      <span style={{ color, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{pct}</span>
    </div>
  );
}

const s = {
  section: {
    position: 'relative',
    overflow: 'hidden',
    padding: '60px 0 48px',
    background: 'linear-gradient(180deg, #1C1543 0%, #08060E 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  bgGlow1: {
    position: 'absolute',
    top: -100,
    left: '15%',
    width: 500,
    height: 500,
    background: 'radial-gradient(circle, rgba(118,69,217,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: -80,
    right: '10%',
    width: 350,
    height: 350,
    background: 'radial-gradient(circle, rgba(31,199,212,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 40,
    position: 'relative',
    zIndex: 1,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  right: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'floatAnim 6s ease-in-out infinite',
  },
  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  roundLabel: {
    fontSize: '0.8rem',
    color: '#736D8C',
    fontWeight: 500,
  },
  headline: {
    fontSize: 'clamp(2rem, 4.5vw, 3rem)',
    fontWeight: 800,
    color: '#F4EEFF',
    lineHeight: 1.15,
    marginBottom: 16,
  },
  headlineAccent: {
    background: 'linear-gradient(90deg, #FFB237, #FF8C00)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  jackpotWrap: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 28,
  },
  jackpotVal: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(3rem, 7vw, 5rem)',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE4A0 50%, #FFB237 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1,
    textShadow: 'none',
    filter: 'drop-shadow(0 0 24px rgba(255,178,55,0.4))',
  },
  jackpotCake: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#FFB237',
    opacity: 0.85,
  },
  jackpotSkeleton: {
    width: 260,
    height: 80,
    borderRadius: 12,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  cdSection: { marginBottom: 28 },
  cdLabel: {
    fontSize: '0.78rem',
    color: '#736D8C',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  },
  cdRow: { display: 'flex', alignItems: 'flex-end', gap: 6, flexWrap: 'wrap' },
  finalBox: {
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: '16px 20px',
    marginBottom: 28,
    display: 'inline-block',
  },
  finalLabel: {
    fontSize: '0.72rem',
    color: '#736D8C',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  },
  finalDigits: { display: 'flex', gap: 6 },
  ctaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  ctaBtn: { fontSize: '1.05rem', padding: '14px 30px' },
  splitPills: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    padding: '10px 0',
  },
  splitDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#443F5A',
  },
};

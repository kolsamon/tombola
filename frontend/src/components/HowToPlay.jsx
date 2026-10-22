import ADDRESSES from '../contracts/addresses.json';

const CHAIN = ADDRESSES.bscTestnet;

// Step 4 depends on whether losing tickets share a consolation pool
const STEPS = (consolationEnabled) => [
  {
    num: '01',
    icon: '🔗',
    title: 'Connectez votre portefeuille',
    desc: 'Utilisez MetaMask sur BSC Testnet (chainId 97). Obtenez des BNB via le faucet BSC.',
    color: '#7645D9',
  },
  {
    num: '02',
    icon: '🎟',
    title: 'Achetez des tickets',
    desc: 'Choisissez un numéro à 6 chiffres (1 000 000 – 1 999 999) ou laissez le hasard décider.',
    color: '#1FC7D4',
  },
  {
    num: '03',
    icon: '🔢',
    title: 'Attendez le tirage',
    desc: 'Un numéro final aléatoire est tiré à la clôture. Les paliers correspondent aux derniers chiffres qui matchent.',
    color: '#FFB237',
  },
  {
    num: '04',
    icon: '💰',
    title: 'Réclamez vos gains',
    desc: consolationEnabled
      ? 'Gagnants ou pas — tout le monde peut réclamer. 25% de la cagnotte va aux tickets perdants.'
      : 'Si votre ticket atteint un palier, réclamez vos CAKE. Les tickets perdants ne reçoivent rien.',
    color: '#31D0AA',
  },
];

const BRACKET_EXAMPLE = [
  { match: 1, label: 'Palier 1', example: '_ _ _ _ _ 1', pct: null },
  { match: 2, label: 'Palier 2', example: '_ _ _ _ 6 1', pct: null },
  { match: 3, label: 'Palier 3', example: '_ _ _ 5 6 1', pct: null },
  { match: 4, label: 'Palier 4', example: '_ _ 4 5 6 1', pct: null },
  { match: 5, label: 'Palier 5', example: '_ 2 4 5 6 1', pct: null },
  { match: 6, label: 'Palier 6 🏆', example: '1 2 4 5 6 1', pct: null },
];

export default function HowToPlay({ consolationEnabled }) {
  return (
    <section id="how" style={s.section}>
      <div className="container">
        <h2 style={s.title}>Comment jouer ?</h2>
        <p style={s.sub}>4 étapes simples pour participer à Saturne Lottery</p>

        {/* Steps */}
        <div style={s.stepsGrid}>
          {STEPS(consolationEnabled).map((step, i) => (
            <div key={i} className="card card--dark" style={s.stepCard}>
              <div style={{ ...s.stepNum, color: step.color, borderColor: step.color + '40' }}>
                {step.num}
              </div>
              <div style={{ fontSize: '2rem', margin: '12px 0 8px' }}>{step.icon}</div>
              <div style={s.stepTitle}>{step.title}</div>
              <div style={s.stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>

        {/* Number matching explainer */}
        <div style={s.matchCard}>
          <div style={s.matchLeft}>
            <h3 style={s.matchTitle}>Comment les paliers fonctionnent</h3>
            <p style={s.matchDesc}>
              Avec le numéro gagnant <strong style={{ color: '#FFB237' }}>1 2 4 5 6 1</strong>, vos
              derniers chiffres sont comparés de droite à gauche. Plus vous en avez, plus votre palier est élevé.
            </p>
            <div style={s.matchTable}>
              {BRACKET_EXAMPLE.map((b, i) => (
                <div key={i} style={s.matchRow}>
                  <div style={{ ...s.matchBadge, background: BRACKET_COLORS[i] + '25', color: BRACKET_COLORS[i], borderColor: BRACKET_COLORS[i] + '60' }}>
                    {b.label}
                  </div>
                  <div style={{ fontFamily: 'monospace', color: '#B8ADD2', fontSize: '0.9rem', letterSpacing: 2 }}>
                    {b.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.matchRight}>
            {consolationEnabled ? (
              /* Consolation pool box */
              <div style={s.consolBox}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>💎</div>
                <div style={s.consolTitle}>Pool de Consolation</div>
                <div style={s.splitText}>
                  <strong style={{ color: '#1FC7D4' }}>25% de la cagnotte</strong>{' '}
                  est réservé aux tickets perdants. Personne ne repart les mains vides !
                </div>
                <div style={s.splitBar}>
                  <div style={{ ...s.splitSeg, flex: 2, background: 'linear-gradient(90deg,#d97706,#FFB237)' }}>50% Gagnants</div>
                  <div style={{ ...s.splitSeg, flex: 1, background: 'linear-gradient(90deg,#0e7490,#1FC7D4)', fontSize: '0.72rem' }}>25% Consolation</div>
                  <div style={{ ...s.splitSeg, flex: 1, background: 'linear-gradient(90deg,#5b21b6,#7645D9)', fontSize: '0.72rem', borderRadius: '0 8px 8px 0' }}>25% Tréso.</div>
                </div>
              </div>
            ) : (
              /* Prize pool split box, no consolation */
              <div style={s.splitBox}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🏆</div>
                <div style={s.splitTitle}>Répartition de la cagnotte</div>
                <div style={s.splitText}>
                  Après les frais, <strong style={{ color: '#FFB237' }}>50% de la cagnotte</strong>{' '}
                  est partagé entre les gagnants des paliers, les autres 50% vont à la trésorerie.
                </div>
                <div style={s.splitBar}>
                  <div style={{ ...s.splitSeg, flex: 1, background: 'linear-gradient(90deg,#d97706,#FFB237)' }}>50% Gagnants</div>
                  <div style={{ ...s.splitSeg, flex: 1, background: 'linear-gradient(90deg,#5b21b6,#7645D9)', borderRadius: '0 8px 8px 0' }}>50% Trésorerie</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contract links */}
        <div style={s.linksRow}>
          <a href={`${CHAIN.explorerAddress}${CHAIN.lottery}`} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
            📋 Contrat SaturneLottery
          </a>
          <a href={`${CHAIN.explorerAddress}${CHAIN.cake}`} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
            🍰 Token CAKE (Mock)
          </a>
          <a href="https://testnet.bscscan.com" target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
            🔍 BSCScan Testnet
          </a>
        </div>
      </div>
    </section>
  );
}

const BRACKET_COLORS = ['#1A6EDB','#7645D9','#DD4AFF','#ED4B9E','#F0922C','#FFB237'];

const s = {
  section: { padding: '56px 0 48px', background: '#0D0A1F', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  title: { fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, color: '#F4EEFF', marginBottom: 8 },
  sub: { color: '#736D8C', fontSize: '0.92rem', marginBottom: 36 },

  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    marginBottom: 36,
  },
  stepCard: { padding: '22px 18px', textAlign: 'center' },
  stepNum: {
    fontFamily: "'Space Grotesk', monospace",
    fontSize: '1rem',
    fontWeight: 900,
    border: '1.5px solid',
    width: 52,
    height: 52,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    letterSpacing: '0.05em',
  },
  stepTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '0.95rem',
    color: '#F4EEFF',
    marginBottom: 6,
  },
  stepDesc: { color: '#736D8C', fontSize: '0.82rem', lineHeight: 1.6 },

  matchCard: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    marginBottom: 32,
  },
  matchLeft: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '24px',
  },
  matchTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 700, color: '#F4EEFF', marginBottom: 10 },
  matchDesc: { color: '#736D8C', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 },
  matchTable: { display: 'flex', flexDirection: 'column', gap: 8 },
  matchRow: { display: 'flex', alignItems: 'center', gap: 12 },
  matchBadge: {
    padding: '3px 10px',
    borderRadius: 99,
    fontSize: '0.72rem',
    fontWeight: 700,
    border: '1px solid',
    minWidth: 80,
    textAlign: 'center',
    flexShrink: 0,
  },

  matchRight: { display: 'flex', flexDirection: 'column' },
  splitBox: {
    flex: 1,
    background: 'rgba(255,178,55,0.06)',
    border: '1px solid rgba(255,178,55,0.25)',
    borderRadius: 20,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  splitTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    fontSize: '1.2rem',
    color: '#FFB237',
    marginBottom: 10,
  },
  consolBox: {
    flex: 1,
    background: 'rgba(31,199,212,0.08)',
    border: '1px solid rgba(31,199,212,0.25)',
    borderRadius: 20,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  consolTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    fontSize: '1.2rem',
    color: '#1FC7D4',
    marginBottom: 10,
  },
  splitText: { color: '#736D8C', fontSize: '0.88rem', lineHeight: 1.65, marginBottom: 20, flex: 1 },
  splitBar: {
    display: 'flex',
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    gap: 2,
    width: '100%',
  },
  splitSeg: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0 8px',
  },

  linksRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
};

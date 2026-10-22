import { ethers } from 'ethers';

function shortAddr(a) { return `${a.slice(0, 6)}…${a.slice(-4)}`; }

export default function Header({ account, connecting, isCorrectChain, cakeBalance, onConnect, onDisconnect }) {
  return (
    <header style={s.wrap}>
      <div className="container" style={s.inner}>

        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoOrb}>🪐</div>
          <div>
            <span style={s.logoText}>Saturne</span>
            <span style={s.logoBadge}>LOTTERY</span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={s.nav} className="hide-mobile">
          {['#buy', '#tickets', '#how'].map((href, i) => (
            <a key={href} href={href} style={s.navLink}>
              {['Acheter', 'Mes tickets', 'Comment jouer'][i]}
            </a>
          ))}
        </nav>

        {/* Wallet section */}
        <div style={s.right}>
          {account && isCorrectChain && (
            <div style={s.balancePill} className="hide-mobile">
              <span style={s.cakeIcon}>🍰</span>
              <span style={s.balVal}>
                {parseFloat(ethers.utils.formatEther(cakeBalance)).toFixed(3)}
              </span>
              <span style={s.balUnit}>CAKE</span>
            </div>
          )}

          {!account ? (
            <button className="btn btn--gold" onClick={onConnect} disabled={connecting}>
              {connecting
                ? <><span className="spinner spinner--gold" style={{ borderTopColor: '#280D5F' }} /> Connexion…</>
                : '🔗 Connecter'}
            </button>
          ) : !isCorrectChain ? (
            <button className="btn btn--outline" onClick={onConnect} style={{ borderColor: '#ED4B9E', color: '#ED4B9E' }}>
              ⚠ Mauvais réseau
            </button>
          ) : (
            <button className="btn btn--ghost" onClick={onDisconnect} style={{ gap: 8 }}>
              <span style={s.dot} />
              {shortAddr(account)}
            </button>
          )}
        </div>
      </div>

      {/* Wrong network banner */}
      {account && !isCorrectChain && (
        <div style={s.banner}>
          ⚠ Veuillez basculer sur <strong>BSC Testnet</strong> (chainId 97) dans MetaMask.
        </div>
      )}
    </header>
  );
}

const s = {
  wrap: {
    background: 'rgba(8,6,14,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    position: 'sticky',
    top: 0,
    zIndex: 200,
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 68,
    gap: 16,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoOrb: {
    fontSize: '1.8rem',
    lineHeight: 1,
    filter: 'drop-shadow(0 0 10px rgba(118,69,217,0.6))',
  },
  logoText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#F4EEFF',
    letterSpacing: '-0.01em',
  },
  logoBadge: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '0.6rem',
    fontWeight: 700,
    color: '#FFB237',
    background: 'rgba(255,178,55,0.15)',
    padding: '2px 6px',
    borderRadius: 4,
    marginLeft: 6,
    letterSpacing: '0.08em',
    verticalAlign: 'middle',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  navLink: {
    color: '#B8ADD2',
    textDecoration: 'none',
    fontSize: '0.92rem',
    fontWeight: 500,
    padding: '6px 14px',
    borderRadius: 12,
    transition: 'color 0.15s, background 0.15s',
  },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  balancePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'rgba(255,178,55,0.12)',
    border: '1px solid rgba(255,178,55,0.25)',
    borderRadius: 999,
  },
  cakeIcon: { fontSize: '1rem' },
  balVal: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '0.95rem',
    color: '#FFB237',
  },
  balUnit: { fontSize: '0.78rem', color: '#B8ADD2' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#31D0AA',
    boxShadow: '0 0 6px #31D0AA',
    display: 'inline-block',
  },
  banner: {
    background: 'rgba(237,75,158,0.15)',
    borderTop: '1px solid rgba(237,75,158,0.3)',
    color: '#FFB3D4',
    padding: '10px 24px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
};

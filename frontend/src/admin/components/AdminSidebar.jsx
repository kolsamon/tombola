const NAV = [
  { id: 'dashboard',   icon: '📊', label: 'Dashboard' },
  { id: 'lottery',     icon: '🎰', label: 'Loterie' },
  { id: 'draw',        icon: '🎲', label: 'Tirage' },
  { id: 'config',      icon: '⚙️',  label: 'Configuration' },
  { id: 'rng',         icon: '🔮', label: 'MockRNG' },
  { id: 'token',       icon: '🍰', label: 'MockCAKE' },
  { id: 'inject',      icon: '💉', label: 'Injection' },
];

export default function AdminSidebar({ active, onNav, account, isOwner, isOperator }) {
  return (
    <aside style={s.sidebar}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>
          <span style={{ fontSize: '1.6rem' }}>🪐</span>
          <div>
            <div style={s.logoTitle}>Saturne</div>
            <div style={s.logoSub}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Roles */}
      {account && (
        <div style={s.rolesBox}>
          <RoleBadge label="Owner"    active={isOwner}    />
          <RoleBadge label="Operator" active={isOperator} />
        </div>
      )}

      {/* Navigation */}
      <nav style={s.nav}>
        {NAV.map(item => (
          <button
            key={item.id}
            style={{
              ...s.navItem,
              ...(active === item.id ? s.navItemActive : {}),
            }}
            onClick={() => onNav(item.id)}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Back to app */}
      <div style={s.footer}>
        <a href="/" style={s.backLink}>
          ← Retour à l'application
        </a>
      </div>
    </aside>
  );
}

function RoleBadge({ label, active }) {
  return (
    <div style={{
      ...s.roleBadge,
      background: active ? 'rgba(255,178,55,0.15)' : 'rgba(255,255,255,0.04)',
      borderColor: active ? 'rgba(255,178,55,0.4)' : 'rgba(255,255,255,0.1)',
      color: active ? '#FFB237' : '#736D8C',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#FFB237' : '#736D8C', display: 'inline-block' }} />
      {label}
    </div>
  );
}

const s = {
  sidebar: {
    width: 220,
    minHeight: '100vh',
    background: '#0D0A1F',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  header: {
    padding: '20px 16px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    fontSize: '1rem',
    color: '#F4EEFF',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: '0.65rem',
    color: '#FFB237',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  rolesBox: {
    display: 'flex',
    gap: 6,
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexWrap: 'wrap',
  },
  roleBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 8px',
    borderRadius: 99,
    fontSize: '0.72rem',
    fontWeight: 600,
    border: '1px solid',
    letterSpacing: '0.03em',
  },
  nav: {
    flex: 1,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: '#736D8C',
    fontSize: '0.88rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s, color 0.15s',
    fontFamily: 'inherit',
  },
  navItemActive: {
    background: 'rgba(118,69,217,0.2)',
    color: '#C8ADFF',
    fontWeight: 600,
  },
  navIcon: { fontSize: '1rem', width: 20, textAlign: 'center' },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  backLink: {
    color: '#736D8C',
    fontSize: '0.8rem',
    textDecoration: 'none',
    display: 'block',
    padding: '6px 0',
  },
};

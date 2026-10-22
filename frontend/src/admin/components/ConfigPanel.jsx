import { useState } from 'react';
import { ethers } from 'ethers';

export default function ConfigPanel({ contractInfo, txPending, isOwner, onSetAddresses, onSetWinnersShareBps, onSetConsolation, onSetCommissions, onSetTicketPriceLimits, onSetMaxTickets }) {
  const consolation = contractInfo?.consolationEnabled ?? true;
  const [op,      setOp]      = useState(contractInfo?.operator  ?? '');
  const [tre,     setTre]     = useState(contractInfo?.treasury  ?? '');
  const [inj,     setInj]     = useState(contractInfo?.injector  ?? '');
  const [wbps,    setWbps]    = useState(String(contractInfo?.winnersShareBps ?? 5000));
  const [refComm, setRefComm] = useState(String(contractInfo?.referralCommission ?? 500));
  const [treComm, setTreComm] = useState(String(contractInfo?.treasuryCommission ?? 1000));
  const [minP,    setMinP]    = useState(parseFloat(ethers.utils.formatEther(contractInfo?.minPriceTicketInCake ?? '5000000000000000')).toString());
  const [maxP,    setMaxP]    = useState(parseFloat(ethers.utils.formatEther(contractInfo?.maxPriceTicketInCake ?? ethers.utils.parseEther('50'))).toString());
  const [maxT,    setMaxT]    = useState(String(contractInfo?.maxNumberTicketsPerBuyOrClaim ?? 100));

  if (!isOwner) {
    return (
      <div style={s.wrap}>
        <h1 style={s.pageTitle}>⚙️ Configuration</h1>
        <div style={s.permWarn}>
          ⚠ Seul le <strong>owner</strong> du contrat peut modifier la configuration.
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <h1 style={s.pageTitle}>⚙️ Configuration du contrat</h1>
      <p style={s.sub}>Fonctions réservées au <strong style={{ color: '#FFB237' }}>owner</strong> du contrat.</p>

      {/* Addresses */}
      <Panel title="Adresses Opérateur / Trésorerie / Injecteur">
        <div style={s.fieldCol}>
          <Field label="Adresse Opérateur" value={op} onChange={setOp} placeholder="0x…" />
          <Field label="Adresse Trésorerie" value={tre} onChange={setTre} placeholder="0x…" />
          <Field label="Adresse Injecteur"  value={inj} onChange={setInj} placeholder="0x…" />
        </div>
        <button
          className="btn btn--purple btn--full"
          style={{ marginTop: 16 }}
          onClick={() => onSetAddresses(op, tre, inj)}
          disabled={txPending || !op || !tre || !inj}
        >
          {txPending ? <><span className="spinner" /> En cours…</> : '💾 Mettre à jour les adresses'}
        </button>
      </Panel>

      {/* Winners share BPS */}
      <Panel title="Part des gagnants (winnersShareBps)">
        <p style={s.desc}>
          Sur le pool net (après frais trésorerie), quelle fraction va aux gagnants des paliers.
          {consolation
            ? ' Le reste est partagé 50/50 entre le pool de consolation et la trésorerie.'
            : ' Le reste va à la trésorerie (pool de consolation désactivé).'}
        </p>
        <div style={s.row}>
          <input
            className="input"
            type="number"
            min={0}
            max={10000}
            value={wbps}
            onChange={e => setWbps(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <span style={{ color: '#FFB237', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.2rem' }}>
            = {parseInt(wbps) / 100}%
          </span>
        </div>
        <SplitPreview bps={parseInt(wbps) || 0} consolation={consolation} />
        <button
          className="btn btn--purple"
          style={{ marginTop: 14 }}
          onClick={() => onSetWinnersShareBps(parseInt(wbps))}
          disabled={txPending}
        >
          {txPending ? <><span className="spinner" /> En cours…</> : '💾 Mettre à jour'}
        </button>
      </Panel>

      {/* Consolation pool toggle */}
      <Panel title="Pool de consolation (tickets perdants)">
        <p style={s.desc}>
          Activé, la part non versée aux gagnants est partagée 50/50 entre les tickets perdants et la trésorerie.
          Désactivé, elle va entièrement à la trésorerie. Le changement s'applique aux manches démarrées
          ensuite : une manche déjà ouverte garde la règle avec laquelle elle a commencé.
        </p>
        <div style={s.row}>
          <span style={{ ...s.toggleState, color: consolation ? '#1FC7D4' : '#736D8C' }}>
            {consolation ? '💎 Activé' : '○ Désactivé'}
          </span>
          <button
            className={`btn ${consolation ? 'btn--ghost' : 'btn--teal'}`}
            onClick={() => onSetConsolation(!consolation)}
            disabled={txPending}
          >
            {txPending
              ? <><span className="spinner" /> En cours…</>
              : consolation ? '⏸ Désactiver la consolation' : '▶ Activer la consolation'}
          </button>
        </div>
      </Panel>

      {/* Commission rates */}
      <Panel title="Taux de commission (achat de tickets)">
        <p style={s.desc}>Commissions prélevées lors de l'achat de tickets (avant d'alimenter la cagnotte).</p>
        <div style={s.grid2}>
          <div>
            <label style={s.label}>Commission parrainage (basis pts)</label>
            <input className="input" type="number" value={refComm} onChange={e => setRefComm(e.target.value)} />
            <div style={s.hint}>{parseInt(refComm) / 100}% aux parrains</div>
          </div>
          <div>
            <label style={s.label}>Commission trésorerie (basis pts)</label>
            <input className="input" type="number" value={treComm} onChange={e => setTreComm(e.target.value)} />
            <div style={s.hint}>{parseInt(treComm) / 100}% à la trésorerie</div>
          </div>
        </div>
        <button
          className="btn btn--purple"
          style={{ marginTop: 14 }}
          onClick={() => onSetCommissions(parseInt(refComm), parseInt(treComm))}
          disabled={txPending}
        >
          {txPending ? <><span className="spinner" /> En cours…</> : '💾 Mettre à jour les commissions'}
        </button>
      </Panel>

      {/* Ticket price limits */}
      <Panel title="Limites de prix des tickets">
        <div style={s.grid2}>
          <div>
            <label style={s.label}>Prix minimum (CAKE)</label>
            <input className="input" type="number" step="0.001" value={minP} onChange={e => setMinP(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Prix maximum (CAKE)</label>
            <input className="input" type="number" value={maxP} onChange={e => setMaxP(e.target.value)} />
          </div>
        </div>
        <button
          className="btn btn--purple"
          style={{ marginTop: 14 }}
          onClick={() => onSetTicketPriceLimits(ethers.utils.parseEther(minP || '0.005'), ethers.utils.parseEther(maxP || '50'))}
          disabled={txPending}
        >
          {txPending ? <><span className="spinner" /> En cours…</> : '💾 Mettre à jour les limites'}
        </button>
      </Panel>

      {/* Max tickets per buy */}
      <Panel title="Max tickets par achat / réclamation">
        <div style={s.row}>
          <input
            className="input"
            type="number"
            min={1}
            max={500}
            value={maxT}
            onChange={e => setMaxT(e.target.value)}
            style={{ maxWidth: 180 }}
          />
          <span style={{ color: '#736D8C', fontSize: '0.88rem' }}>tickets maximum</span>
        </div>
        <button
          className="btn btn--purple"
          style={{ marginTop: 14 }}
          onClick={() => onSetMaxTickets(parseInt(maxT))}
          disabled={txPending}
        >
          {txPending ? <><span className="spinner" /> En cours…</> : '💾 Mettre à jour'}
        </button>
      </Panel>
    </div>
  );
}

function SplitPreview({ bps, consolation }) {
  const winnerPct   = bps / 100;
  const remaining   = 100 - winnerPct;
  const consolPct   = consolation ? remaining / 2 : 0;
  const treasuryPct = remaining - consolPct;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: '0.75rem', color: '#736D8C', marginBottom: 6 }}>Aperçu de la répartition nette :</div>
      <div style={{ display: 'flex', height: 32, borderRadius: 8, overflow: 'hidden', gap: 2 }}>
        <div style={{ flex: winnerPct,   background: 'linear-gradient(90deg,#d97706,#FFB237)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'#280D5F', minWidth:20 }}>
          {winnerPct}%
        </div>
        {consolation && (
          <div style={{ flex: consolPct, background: 'linear-gradient(90deg,#0e7490,#1FC7D4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'#08060E', minWidth:20 }}>
            {consolPct}%
          </div>
        )}
        <div style={{ flex: treasuryPct, background: 'linear-gradient(90deg,#5b21b6,#7645D9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'#fff', minWidth:20, borderRadius:'0 8px 8px 0' }}>
          {treasuryPct}%
        </div>
      </div>
      <div style={{ display:'flex', fontSize:'0.72rem', color:'#736D8C', marginTop:4, gap:16 }}>
        <span>🏆 Gagnants</span>{consolation && <span>💎 Consolation</span>}<span>🏛 Trésorerie</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
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
  wrap: { padding: '28px 32px', maxWidth: 860 },
  pageTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#F4EEFF', marginBottom: 8 },
  sub: { color: '#736D8C', fontSize: '0.9rem', marginBottom: 24 },
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
  fieldCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  label: { display: 'block', fontSize: '0.78rem', color: '#736D8C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 },
  hint: { fontSize: '0.75rem', color: '#443F5A', marginTop: 5 },
  desc: { color: '#736D8C', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 12 },
  row: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  toggleState: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.05rem', minWidth: 140 },
  permWarn: {
    padding: '14px 18px',
    background: 'rgba(237,75,158,0.1)',
    border: '1px solid rgba(237,75,158,0.3)',
    borderRadius: 12,
    color: '#FFB3D4',
    fontSize: '0.9rem',
  },
};

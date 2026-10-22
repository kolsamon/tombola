import { useState } from 'react';
import { ethers } from 'ethers';
import ADDRESSES from '../../contracts/addresses.json';

const CHAIN = ADDRESSES.bscTestnet;

export default function TokenPanel({ account, cakeBalance, lotteryId, lotteryData, txPending, onMint, onInject, onApprove }) {
  const [mintTo,     setMintTo]     = useState(account ?? '');
  const [mintAmount, setMintAmount] = useState('100');
  const [injectAmt,  setInjectAmt]  = useState('10');

  const canInject = lotteryData?.status === 'Open';

  return (
    <div style={s.wrap}>
      <h1 style={s.pageTitle}>🍰 MockCAKE Token</h1>
      <p style={s.sub}>
        Le <strong>MockCakeToken</strong> est un ERC20 mintable qui remplace CAKE sur testnet.
        Utilisez-le pour alimenter les tests sans faucet externe.
      </p>

      <div style={s.infoBox}>
        <div style={{ fontSize: '0.8rem', color: '#736D8C', marginBottom: 4 }}>Adresse MockCakeToken</div>
        <a href={`${CHAIN.explorerAddress}${CHAIN.cake}`} target="_blank" rel="noreferrer"
           style={{ color: '#A881FC', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {CHAIN.cake}
        </a>
        <div style={{ marginTop: 10, display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#736D8C' }}>Votre solde</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#FFB237', fontSize: '1.1rem' }}>
              {parseFloat(ethers.utils.formatEther(cakeBalance)).toFixed(4)} CAKE
            </div>
          </div>
        </div>
      </div>

      {/* Mint */}
      <Panel title="Mint de tokens CAKE">
        <p style={s.desc}>
          Crée des tokens CAKE testnet sur n'importe quelle adresse.
          Fonction <code style={s.code}>mint(address to, uint256 amount)</code>.
        </p>
        <div style={s.fieldCol}>
          <div>
            <label style={s.label}>Adresse destinataire</label>
            <div style={s.row}>
              <input
                className="input"
                value={mintTo}
                onChange={e => setMintTo(e.target.value)}
                placeholder="0x…"
              />
              {account && mintTo !== account && (
                <button className="btn btn--ghost btn--sm" onClick={() => setMintTo(account)}>
                  Moi
                </button>
              )}
            </div>
          </div>
          <div>
            <label style={s.label}>Montant (CAKE)</label>
            <div style={s.row}>
              <input
                className="input"
                type="number"
                value={mintAmount}
                onChange={e => setMintAmount(e.target.value)}
                style={{ maxWidth: 200 }}
              />
              <div style={s.presets}>
                {[10, 50, 100, 500].map(n => (
                  <button key={n} className={`btn btn--sm ${mintAmount === String(n) ? 'btn--gold' : 'btn--ghost'}`} onClick={() => setMintAmount(String(n))}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button
          className="btn btn--gold"
          style={{ marginTop: 16 }}
          onClick={() => onMint(mintTo, ethers.utils.parseEther(mintAmount || '0'))}
          disabled={txPending || !mintTo || !mintAmount || parseFloat(mintAmount) <= 0}
        >
          {txPending ? <><span className="spinner" style={{ borderTopColor: '#280D5F' }} /> En cours…</> : `🍰 Minter ${mintAmount} CAKE`}
        </button>
      </Panel>

      {/* Inject */}
      <Panel title="Injecter des fonds dans la loterie">
        <p style={s.desc}>
          Ajoute des CAKE directement à la cagnotte d'une loterie ouverte.
          Réservé au <strong>owner</strong> ou à l'<strong>injector</strong>.
        </p>
        {!canInject && (
          <div style={s.note}>⚠ Aucune loterie ouverte. L'injection n'est possible que sur une loterie avec statut Open.</div>
        )}
        <div style={s.row}>
          <input
            className="input"
            type="number"
            value={injectAmt}
            onChange={e => setInjectAmt(e.target.value)}
            placeholder="Montant CAKE"
            style={{ maxWidth: 200 }}
          />
          <span style={{ color: '#736D8C', fontSize: '0.88rem' }}>CAKE → loterie #{lotteryId}</span>
        </div>
        <div style={{ ...s.presets, marginTop: 10 }}>
          {[1, 5, 10, 50].map(n => (
            <button key={n} className="btn btn--ghost btn--sm" onClick={() => setInjectAmt(String(n))}>{n}</button>
          ))}
        </div>
        <button
          className="btn btn--teal"
          style={{ marginTop: 14 }}
          onClick={() => onInject(lotteryId, ethers.utils.parseEther(injectAmt || '0'))}
          disabled={txPending || !canInject || !injectAmt || parseFloat(injectAmt) <= 0}
        >
          {txPending ? <><span className="spinner" /> En cours…</> : `💉 Injecter ${injectAmt} CAKE`}
        </button>
      </Panel>

      {/* Approve */}
      <Panel title="Approuver CAKE pour la loterie">
        <p style={s.desc}>
          Approuve le contrat SaturneLottery à dépenser vos CAKE (nécessaire pour l'injection).
        </p>
        <button className="btn btn--ghost" onClick={onApprove} disabled={txPending}>
          {txPending ? <><span className="spinner" /> En cours…</> : '✅ Approuver MaxUint256'}
        </button>
      </Panel>
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
    padding: '16px 18px',
    background: 'rgba(255,178,55,0.07)',
    border: '1px solid rgba(255,178,55,0.2)',
    borderRadius: 14,
    marginBottom: 22,
  },
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
  desc: { color: '#736D8C', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 12 },
  code: {
    fontFamily: 'monospace',
    background: 'rgba(0,0,0,0.35)',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: '0.85em',
    color: '#9AFFF9',
  },
  fieldCol: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { display: 'block', fontSize: '0.78rem', color: '#736D8C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 },
  row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  presets: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  note: {
    padding: '10px 14px',
    background: 'rgba(255,178,55,0.1)',
    border: '1px solid rgba(255,178,55,0.25)',
    borderRadius: 10,
    color: '#FFE4A0',
    fontSize: '0.85rem',
    marginBottom: 12,
  },
};

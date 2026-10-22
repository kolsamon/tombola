import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useAdmin } from './hooks/useAdmin';
import AdminSidebar    from './components/AdminSidebar';
import DashboardPanel  from './components/DashboardPanel';
import LotteryControl  from './components/LotteryControl';
import ConfigPanel     from './components/ConfigPanel';
import RngPanel        from './components/RngPanel';
import TokenPanel      from './components/TokenPanel';
import Notification    from '../components/Notification';

export default function AdminApp() {
  const [panel, setPanel] = useState('dashboard');

  const {
    account, signer, isCorrectChain,
    connecting, error: walletError, connect, disconnect,
  } = useWallet();

  const {
    lotteryId, lotteryData, contractInfo,
    cakeBalance, cakeAllowance,
    loading, txPending, notification,
    isOwner, isOperator,
    fetchData,
    startLottery, closeLottery, drawFinalNumber,
    setAddresses, setWinnersShareBps, setConsolationEnabled, setCommissionRates,
    setTicketPriceLimits, setMaxTicketsPerBuy,
    injectFunds, rngSetLotteryId, rngSetResult,
    mintCake, approveCake,
  } = useAdmin(signer, account);

  const renderPanel = () => {
    switch (panel) {
      case 'dashboard':
        return (
          <DashboardPanel
            lotteryId={lotteryId}
            lotteryData={lotteryData}
            contractInfo={contractInfo}
            cakeBalance={cakeBalance}
            account={account}
            isOwner={isOwner}
            isOperator={isOperator}
            loading={loading}
            onNav={setPanel}
          />
        );
      case 'lottery':
      case 'draw':
        return (
          <LotteryControl
            lotteryId={lotteryId}
            lotteryData={lotteryData}
            txPending={txPending}
            isOperator={isOperator}
            onStart={startLottery}
            onClose={closeLottery}
            onDraw={drawFinalNumber}
          />
        );
      case 'config':
        return (
          <ConfigPanel
            contractInfo={contractInfo}
            txPending={txPending}
            isOwner={isOwner}
            onSetAddresses={setAddresses}
            onSetWinnersShareBps={setWinnersShareBps}
            onSetConsolation={setConsolationEnabled}
            onSetCommissions={setCommissionRates}
            onSetTicketPriceLimits={setTicketPriceLimits}
            onSetMaxTickets={setMaxTicketsPerBuy}
          />
        );
      case 'rng':
        return (
          <RngPanel
            lotteryId={lotteryId}
            txPending={txPending}
            onSetLotteryId={rngSetLotteryId}
            onSetResult={rngSetResult}
          />
        );
      case 'token':
      case 'inject':
        return (
          <TokenPanel
            account={account}
            cakeBalance={cakeBalance}
            lotteryId={lotteryId}
            lotteryData={lotteryData}
            txPending={txPending}
            onMint={mintCake}
            onInject={injectFunds}
            onApprove={approveCake}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={s.root}>
      <AdminSidebar
        active={panel}
        onNav={setPanel}
        account={account}
        isOwner={isOwner}
        isOperator={isOperator}
      />

      <div style={s.main}>
        {/* Top bar */}
        <div style={s.topbar}>
          <div style={{ color: '#736D8C', fontSize: '0.8rem' }}>
            Admin Panel · BSC Testnet
          </div>
          <div style={s.topRight}>
            {account && isCorrectChain && (
              <div style={s.balancePill}>
                <span style={{ color: '#736D8C', fontSize: '0.78rem' }}>CAKE</span>
                <span style={{ color: '#FFB237', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {parseFloat(ethers.utils.formatEther(cakeBalance)).toFixed(3)}
                </span>
              </div>
            )}
            {!account ? (
              <button className="btn btn--gold btn--sm" onClick={connect} disabled={connecting}>
                {connecting ? <><span className="spinner" style={{ borderTopColor: '#280D5F' }} /> Connexion…</> : '🔗 Connecter'}
              </button>
            ) : !isCorrectChain ? (
              <button className="btn btn--sm" style={{ background: '#ED4B9E', color: '#fff', borderRadius: 999 }} onClick={connect}>
                ⚠ Mauvais réseau
              </button>
            ) : (
              <button className="btn btn--ghost btn--sm" onClick={disconnect}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#31D0AA', display: 'inline-block' }} />
                {account.slice(0, 6)}…{account.slice(-4)}
              </button>
            )}
            <button className="btn btn--ghost btn--sm" onClick={fetchData} title="Rafraîchir">
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '↺'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={s.content}>
          {!account ? (
            <div style={s.connectPrompt}>
              <div style={{ fontSize: '3rem' }}>🔐</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, marginTop: 16, marginBottom: 8 }}>
                Accès restreint
              </h2>
              <p style={{ color: '#736D8C', fontSize: '0.9rem', marginBottom: 20 }}>
                Connectez votre portefeuille pour accéder au panel d'administration.
              </p>
              <button className="btn btn--gold" onClick={connect} disabled={connecting}>
                🔗 Connecter MetaMask
              </button>
            </div>
          ) : !isCorrectChain ? (
            <div style={s.connectPrompt}>
              <div style={{ fontSize: '3rem' }}>⛓</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 800, marginTop: 16, marginBottom: 8 }}>
                Mauvais réseau
              </h2>
              <p style={{ color: '#736D8C', fontSize: '0.9rem', marginBottom: 20 }}>
                Basculez sur <strong>BSC Testnet</strong> (chainId 97).
              </p>
              <button className="btn btn--gold" onClick={connect}>Changer de réseau</button>
            </div>
          ) : (
            renderPanel()
          )}
        </div>
      </div>

      {walletError && <Notification notification={{ msg: walletError, type: 'error', id: 'wallet' }} />}
      <Notification notification={notification} />
    </div>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#08060E' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 28px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(8,6,14,0.9)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    gap: 12,
  },
  topRight: { display: 'flex', alignItems: 'center', gap: 10 },
  balancePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    background: 'rgba(255,178,55,0.1)',
    border: '1px solid rgba(255,178,55,0.2)',
    borderRadius: 99,
    fontSize: '0.85rem',
  },
  content: { flex: 1, overflowY: 'auto' },
  connectPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    textAlign: 'center',
    padding: 40,
  },
};

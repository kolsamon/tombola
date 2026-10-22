import { useWallet } from './hooks/useWallet';
import { useLottery } from './hooks/useLottery';

import Header       from './components/Header';
import LotteryHero  from './components/LotteryHero';
import StatsBar     from './components/StatsBar';
import PrizeBreakdown from './components/PrizeBreakdown';
import BuyTickets   from './components/BuyTickets';
import MyTickets    from './components/MyTickets';
import HowToPlay    from './components/HowToPlay';
import Notification from './components/Notification';

export default function App() {
  const {
    account, signer, chainId, isCorrectChain,
    connecting, error: walletError, connect, disconnect,
  } = useWallet();

  const {
    lotteryId, lottery, userTickets,
    cakeBalance, cakeAllowance,
    loading, txPending, notification,
    refresh, approveCake, buyTickets,
    claimWinningTickets, claimLosingTickets, getTicketBracket,
    consolationEnabled,
  } = useLottery(signer, account);

  // Rule shown to players: the one locked into the current round, else the one the next round will use
  const consolationActive = lottery ? lottery.consolationEnabled : consolationEnabled;

  return (
    <div className="app">
      <Header
        account={account}
        connecting={connecting}
        isCorrectChain={isCorrectChain}
        chainId={chainId}
        cakeBalance={cakeBalance}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <LotteryHero lottery={lottery} lotteryId={lotteryId} loading={loading} />

      <StatsBar lottery={lottery} lotteryId={lotteryId} />

      <PrizeBreakdown lottery={lottery} />

      {/* Buy tickets — full width only shown if lottery open */}
      {lottery?.status === 'Open' && account && isCorrectChain ? (
        <BuyTickets
          lottery={lottery}
          account={account}
          cakeBalance={cakeBalance}
          cakeAllowance={cakeAllowance}
          txPending={txPending}
          onBuy={buyTickets}
          onApprove={approveCake}
        />
      ) : lottery?.status === 'Open' ? (
        <BuyTickets
          lottery={lottery}
          account={null}
          cakeBalance={cakeBalance}
          cakeAllowance={cakeAllowance}
          txPending={txPending}
          onBuy={buyTickets}
          onApprove={approveCake}
        />
      ) : null}

      <MyTickets
        lottery={lottery}
        lotteryId={lotteryId}
        account={account}
        userTickets={userTickets}
        txPending={txPending}
        getTicketBracket={getTicketBracket}
        onClaimWinners={claimWinningTickets}
        onClaimLosers={claimLosingTickets}
      />

      <HowToPlay consolationEnabled={consolationActive} />

      {/* Footer */}
      <footer style={footer}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>🪐</span>
            <span style={{ color: '#443F5A', fontSize: '0.82rem' }}>Saturne Lottery · BSC Testnet · Audit non réalisé</span>
          </div>
          <span style={{ color: '#443F5A', fontSize: '0.78rem' }}>
            Smart contract : {consolationActive
              ? '50% Gagnants · 25% Consolation · 25% Trésorerie'
              : '50% Gagnants · 50% Trésorerie'}
          </span>
        </div>
      </footer>

      {walletError && <Notification notification={{ msg: walletError, type: 'error', id: 'wallet' }} />}
      <Notification notification={notification} />
    </div>
  );
}

const footer = {
  borderTop: '1px solid rgba(255,255,255,0.06)',
  background: '#08060E',
  padding: '20px 0',
};

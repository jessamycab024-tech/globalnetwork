export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">GlobalNetwork</p>
        <h1>Wallet, trade, and AI arbitrage dashboard</h1>
        <p className="subtitle">
          A live-data crypto app with wallet login, market overview, direct support,
          trade flows, and AI arbitrage monitoring.
        </p>
        <div className="cta-row">
          <button type="button">Connect Wallet</button>
          <button type="button" className="secondary">Open Support</button>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Home</h2>
          <p>Real-time market prices, portfolio overview, and user account access.</p>
        </article>
        <article className="card">
          <h2>Trade</h2>
          <p>Multi-pair market data, execution review, and strategy-level configuration.</p>
        </article>
        <article className="card">
          <h2>AI Arbitrage</h2>
          <p>Opportunity scanning, net-return estimates, risks, and settlement verification.</p>
        </article>
        <article className="card">
          <h2>Wallet</h2>
          <p>Connected-wallet portfolio, approvals, and transaction history.</p>
        </article>
      </section>
    </main>
  );
}

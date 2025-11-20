import React from "react";
import "./HomePage.css";

const UPCOMING_EVENTS = [
  {
    title: "UFC 309 — Edwards vs. Muhammad 2",
    date: "Nov 12, 2024",
    location: "T-Mobile Arena, Las Vegas",
    status: "Main Event",
  },
  {
    title: "Fight Night — Moreno vs. Albazi",
    date: "Nov 23, 2024",
    location: "Arena CDMX, Mexico City",
    status: "Main Card",
  },
  {
    title: "Fight Night — Cannonier vs. Imavov",
    date: "Dec 07, 2024",
    location: "Accor Arena, Paris",
    status: "Feature Bout",
  },
  {
    title: "Fight Night — Dern vs. Andrade",
    date: "Dec 14, 2024",
    location: "Honda Center, Anaheim",
    status: "Coming Soon",
  },
];

const EDGE_PANELS = [
  {
    eyebrow: "Real-time intelligence",
    title: "AI models tuned for the Octagon",
    body: "Stream live odds, weather momentum swings, and unlock betting edges built from millions of data points.",
  },
  {
    eyebrow: "Analyst-approved",
    title: "Fight sheets trusted by sharps",
    body: "Every matchup is rated for striking tempo, grappling control, and finishing equity so you can react instantly.",
  },
  {
    eyebrow: "Predictor advantage",
    title: "Win the weekend before it starts",
    body: "Project performance, simulate outcomes, and export picks crafted for your staking strategy.",
  },
];

function HomePage({ onExploreUFC, onOpenVip, onOpenBookmakers, onOpenStreams }) {
  return (
    <section className="home-shell" id="home">
      <div className="home-backdrop" aria-hidden="true" />

      <section className="home-hero">
        <div className="home-hero-media">
          <div className="hero-glow" />
          <span className="hero-badge">PredictorLabs.io</span>
          <h1 className="hero-headline">
            Modern fight analytics <span>built for the main stage</span>
          </h1>
          <p className="hero-subhead">
            Precision models, premium streams, and smart betting flows — crafted for UFC fans who demand more.
          </p>
          <div className="hero-actions">
            <button type="button" className="hero-cta" onClick={onExploreUFC}>
              Launch UFC Predictor
            </button>
            <button type="button" className="hero-secondary" onClick={onOpenVip}>
              VIP Access
            </button>
          </div>
          <div className="hero-metrics">
            <div>
              <span className="metric-value">92%+</span>
              <span className="metric-label">Model confidence on featured bouts</span>
            </div>
            <div>
              <span className="metric-value">12K</span>
              <span className="metric-label">Daily bettors tracking Predictor Labs</span>
            </div>
            <div>
              <span className="metric-value">45</span>
              <span className="metric-label">Data signals per fight night</span>
            </div>
          </div>
        </div>

        <aside className="home-ads">
          <div className="ad-banner ad-banner-large" role="presentation" aria-label="Casino banner placeholder">
            <span className="ad-label">Premium Casino Partner</span>
            <strong>970 × 250</strong>
            <p>Reserve this marquee placement for your headline sponsor.</p>
            <button type="button" className="ad-cta" onClick={onOpenBookmakers}>
              View Offers
            </button>
          </div>

          <div className="ad-banner ad-banner-compact" role="presentation" aria-label="Casino banner placeholder">
            <span className="ad-label">Featured Promo</span>
            <strong>300 × 250</strong>
            <p>Perfect for high-converting casino boosts.</p>
            <button type="button" className="ad-cta" onClick={onOpenStreams}>
              Explore Streams
            </button>
          </div>
        </aside>
      </section>

      <section className="home-events" id="upcoming-events">
        <header className="section-header">
          <span className="section-eyebrow">Upcoming schedule</span>
          <h2>Fight nights on deck</h2>
          <p>
            Track the next wave of UFC cards. Save the date, prep your bets, and be the first to know when lines move.
          </p>
        </header>
        <div className="events-grid">
          {UPCOMING_EVENTS.map((event) => (
            <article className="event-card" key={event.title}>
              <span className="event-status">{event.status}</span>
              <h3>{event.title}</h3>
              <dl>
                <div>
                  <dt>Date</dt>
                  <dd>{event.date}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{event.location}</dd>
                </div>
              </dl>
              <button type="button" onClick={onExploreUFC}>
                Preview card
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="home-edge">
        <header className="section-header">
          <span className="section-eyebrow">Why Predictor Labs</span>
          <h2>A professional playbook — without the clutter</h2>
          <p>
            Built for traders, tipsters, and diehard fans that expect a polished, data-rich, and ultra-fast experience.
          </p>
        </header>
        <div className="edge-grid">
          {EDGE_PANELS.map((panel) => (
            <article className="edge-card" key={panel.title}>
              <span className="edge-eyebrow">{panel.eyebrow}</span>
              <h3>{panel.title}</h3>
              <p>{panel.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-final">
        <div className="final-inner">
          <div className="final-copy">
            <span className="section-eyebrow">Ready when you are</span>
            <h2>Lock in your edge before the octagon lights up</h2>
            <p>
              Sync your favorite sportsbook, mark your watchlist, and let Predictor Labs automate the pre-fight grind.
            </p>
          </div>
          <div className="final-actions">
            <button type="button" className="hero-cta" onClick={onExploreUFC}>
              Enter UFC Control Room
            </button>
            <button type="button" className="hero-secondary" onClick={onOpenBookmakers}>
              Compare Odds
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}

export default HomePage;
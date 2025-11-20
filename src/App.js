import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import HomePage from "./components/HomePage.js";
import UFCPage from "./components/UFCPage.js";
import "./App.css";

const SPORTS_GROUPS = [
  {
    label: "MMA",
    items: [
      { label: "UFC", action: "hero", status: "active" },
      { label: "Bellator", status: "soon" },
      { label: "PFL", status: "soon" },
    ],
  },
  {
    label: "Football",
    items: [
      { label: "NFL", status: "soon" },
      { label: "College", status: "soon" },
    ],
  },
  {
    label: "Basketball",
    items: [
      { label: "NBA", status: "soon" },
      { label: "EuroLeague", status: "soon" },
    ],
  },
  {
    label: "Esports",
    items: [
      { label: "CS2", status: "soon" },
      { label: "League of Legends", status: "soon" },
    ],
  },
  {
    label: "Boxing",
    items: [
      { label: "Championship", status: "soon" },
    ],
  },
  {
    label: "Tennis",
    items: [
      { label: "ATP", status: "soon" },
      { label: "WTA", status: "soon" },
    ],
  },
];

const VIEW_LABELS = {
  home: "Predictor Labs Home",
  ufc: "UFC Predictor",
};

function App() {
  const [showStreams, setShowStreams] = useState(false);
  const [showBookmakers, setShowBookmakers] = useState(false);
  const [showVip, setShowVip] = useState(false);
  const [vipError, setVipError] = useState("");
  const [sportsOpen, setSportsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState(null);
  const resolveViewFromLocation = () => {
    if (typeof window === "undefined") {
      return "home";
    }

    return window.location.pathname.startsWith("/ufc") ? "ufc" : "home";
  };

  const [activeView, setActiveView] = useState(resolveViewFromLocation);
  const [pendingSection, setPendingSection] = useState(null);
  const activeViewRef = useRef(activeView);
  const transitionTimer = useRef(null);
  const sportsMenuRef = useRef(null);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const closeSportsMenu = () => setSportsOpen(false);

  const beginViewTransition = (view) => {
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }

    if (view !== activeViewRef.current) {
      setTransitionTarget(view);
      setIsTransitioning(true);
      transitionTimer.current = setTimeout(() => {
        setIsTransitioning(false);
        setTransitionTarget(null);
        transitionTimer.current = null;
      }, 520);
    } else {
      setTransitionTarget(null);
      setIsTransitioning(false);
    }
  };

  const navigateToView = (view) => {
    if (typeof window !== "undefined") {
      const targetPath = view === "ufc" ? "/ufcpredictor" : "/";

      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, "", targetPath);
      }
    }

    beginViewTransition(view);
    setActiveView(view);
    activeViewRef.current = view;
  };

  const requestScroll = (view, sectionId) => {
    navigateToView(view);
    setPendingSection(sectionId || null);
    closeSportsMenu();
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handlePopState = () => {
      const nextView = resolveViewFromLocation();
      beginViewTransition(nextView);
      setActiveView(nextView);
      activeViewRef.current = nextView;
      setPendingSection(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!sportsOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSportsOpen(false);
      }
    };

    const handleClickAway = (event) => {
      if (sportsMenuRef.current && !sportsMenuRef.current.contains(event.target)) {
        setSportsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("touchstart", handleClickAway);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("touchstart", handleClickAway);
    };
  }, [sportsOpen]);

  useEffect(() => {
    if (!pendingSection) {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const scrollToPendingSection = () => {
      const element = document.getElementById(pendingSection);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setPendingSection(null);
      }
    };

    // Attempt immediately after render and retry shortly after if needed.
    scrollToPendingSection();
    const retry = setTimeout(scrollToPendingSection, 120);

    return () => clearTimeout(retry);
  }, [activeView, pendingSection]);

  const handleVipSubmit = (event) => {
    event.preventDefault();
    setVipError("Data incorrect. Please contact support.");
  };

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };
  }, []);

  return (
    <div className="app-shell">
      <nav className="site-nav">
        <div className="nav-inner">
          <a
            className="brand"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              requestScroll("home", "home");
            }}
          >
            <span className="brand-title">Predictor Labs</span>
            <span className="brand-sub">Intelligence for every fight night</span>
          </a>
          <div className="nav-primary">
            <button
              type="button"
              onClick={() => requestScroll("home", "home")}
              className={activeView === "home" ? "nav-link active" : "nav-link"}
            >
              Home
            </button>
            <div
              className={`nav-item has-dropdown ${sportsOpen ? "open" : ""}`}
              ref={sportsMenuRef}
              onMouseEnter={() => setSportsOpen(true)}
              onMouseLeave={() => setSportsOpen(false)}
              onFocusCapture={() => setSportsOpen(true)}
              onBlurCapture={(event) => {
                if (!sportsMenuRef.current?.contains(event.relatedTarget)) {
                  setSportsOpen(false);
                }
              }}
            >
              <button
                type="button"
                className={`nav-link nav-link--trigger${sportsOpen ? " active" : ""}`}
                aria-haspopup="true"
                aria-expanded={sportsOpen}
                aria-controls="nav-sports-menu"
                onClick={() => setSportsOpen((value) => !value)}
              >
                Sports
              </button>
              <div className="dropdown-panel" id="nav-sports-menu" role="menu">
                {SPORTS_GROUPS.map((group) => (
                  <div className="dropdown-group" key={group.label}>
                    <span className="group-title">{group.label}</span>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.label}>
                          {item.status === "active" ? (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                if (item.action === "hero") {
                                  requestScroll("ufc", "hero");
                                }
                              }}
                            >
                              {item.label}
                            </button>
                          ) : (
                            <span className="soon-item" role="menuitem" aria-disabled="true">
                              {item.label}
                              <small>Soon</small>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              className={`${activeView === "ufc" ? "nav-link active" : "nav-link"} nav-link--ufc`}
              onClick={() => requestScroll("ufc", "hero")}
              aria-label="UFC Predictor — new"
            >
              <span className="nav-link-label">UFC Predictor</span>
              <span className="nav-new-chip" aria-hidden="true">
                <span className="nav-new-chip__dot" />
                <span className="nav-new-chip__text">New</span>
              </span>
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => requestScroll("home", "upcoming-events")}
            >
              Upcoming Events
            </button>
          </div>

          <div className="nav-actions">
            <button type="button" className="vip-login" onClick={() => { setShowVip(true); setVipError(""); }}>
              VIP Login
            </button>
            <button type="button" className="nav-cta" onClick={() => setShowBookmakers(true)}>
              Get Odds
            </button>
          </div>
        </div>
      </nav>

      <main className="app-main">
        {activeView === "home" && (
          <HomePage
            onExploreUFC={() => requestScroll("ufc", "hero")}
            onOpenVip={() => {
              setShowVip(true);
              setVipError("");
            }}
            onOpenBookmakers={() => setShowBookmakers(true)}
            onOpenStreams={() => setShowStreams(true)}
          />
        )}
        {activeView === "ufc" && (
          <UFCPage onOpenStreams={() => setShowStreams(true)} onOpenBookmakers={() => setShowBookmakers(true)} />
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-column">
            <span className="footer-title">Product</span>
            <button type="button" onClick={() => requestScroll("home", "home")}>Homepage</button>
            <button type="button" onClick={() => requestScroll("home", "upcoming-events")}>Upcoming Events</button>
            <button type="button" onClick={() => requestScroll("ufc", "main-card")}>Main Card Insights</button>
          </div>

          <div className="footer-column">
            <span className="footer-title">Sports</span>
            <span className="footer-note">Bellator — Soon</span>
            <span className="footer-note">NFL — Soon</span>
            <span className="footer-note">NBA — Soon</span>
            <span className="footer-note">Esports — Soon</span>
          </div>

          <div className="footer-column">
            <span className="footer-title">Support</span>
            <span className="footer-note">help@predictorlabs.io</span>
            <span className="footer-note">Press kit — Soon</span>
            <span className="footer-note">Partner program — Soon</span>
          </div>
          <div className="footer-column donate">
            <span className="footer-title">Donate</span>
            <p className="footer-note">Fuel the next generation of fight analytics.</p>
            <div className="wallet-box">
              <span className="wallet-label">USDT (ERC-20)</span>
              <span className="wallet-value">0x3aF4cE812b0b5E1fC9b96E17Fa2A9d4F1B2eC913</span>
            </div>
            <div className="wallet-box">
              <span className="wallet-label">BTC (Lightning)</span>
              <span className="wallet-value">bc1q2l8zsa0n33gpexy7q0w8p4lk8sru4z9</span>
            </div>
          </div>
        </div>
        <div className="footer-base">
          <span>© {currentYear} Predictor Labs. All rights reserved.</span>
          <div className="footer-links-inline">
            <button type="button" onClick={() => requestScroll("home", "home")}>Home</button>
            <button type="button" onClick={() => requestScroll("ufc", "main-card")}>Main Card</button>
            <button type="button" onClick={() => requestScroll("ufc", "prelims")}>Prelims</button>
          </div>
        </div>
        <p className="footer-disclaimer">
          Predictions are for entertainment only. No guarantees are implied, wagering is 18+ and please bet responsibly.
        </p>
      </footer>

      {isTransitioning && (
        <div className="view-transition" role="status" aria-live="polite">
          <div className="view-transition__backdrop" />
          <div className="view-transition__content">
            <div className="view-transition__spinner">
              <span className="ring" />
              <span className="ring" />
            </div>
            <span className="view-transition__label">
              Loading {VIEW_LABELS[transitionTarget ?? activeView]}
            </span>
          </div>
        </div>
      )}

      {showStreams &&
        createPortal(
          <div className="popup-overlay" onClick={() => setShowStreams(false)}>
            <div className="popup-box" onClick={(event) => event.stopPropagation()}>
              <h3>Live Streams</h3>
              <p>Trusted partners streaming upcoming fight nights.</p>
              <ul className="popup-links">
                <li><a href="#" rel="noreferrer">Stream 1</a></li>
                <li><a href="#" rel="noreferrer">Stream 2</a></li>
                <li><a href="#" rel="noreferrer">Stream 3</a></li>
                <li><a href="#" rel="noreferrer">Stream 4</a></li>
                <li><a href="#" rel="noreferrer">Stream 5</a></li>
              </ul>
              <button type="button" className="close-popup" onClick={() => setShowStreams(false)}>
                Close
              </button>
            </div>
          </div>,
          document.body,
        )}

      {showBookmakers &&
        createPortal(
          <div className="popup-overlay" onClick={() => setShowBookmakers(false)}>
            <div className="popup-box" onClick={(event) => event.stopPropagation()}>
              <h3>Top Bookmakers</h3>
              <p>Compare live prices and snag the best available odds.</p>
              <ul className="bookmaker-list">
                <li className="top-bookmaker">🥇 Stake.com — 1.95x</li>
                <li>🥈 Roobet — 1.90x</li>
                <li>🥉 Duel — 1.88x</li>
                <li>Duelbits — 1.86x</li>
                <li>Fortunejack — 1.84x</li>
              </ul>
              <button type="button" className="close-popup" onClick={() => setShowBookmakers(false)}>
                Close
              </button>
            </div>
          </div>,
          document.body,
        )}

      {showVip &&
        createPortal(
          <div className="popup-overlay" onClick={() => setShowVip(false)}>
            <div className="popup-box vip" onClick={(event) => event.stopPropagation()}>
              <h3>VIP Access</h3>
              <p>Premium analytics are currently restricted. Request access below.</p>
              <form className="vip-form" onSubmit={handleVipSubmit}>
                <label htmlFor="vip-email">Email</label>
                <input id="vip-email" type="email" placeholder="name@domain.com" required />
                <label htmlFor="vip-pass">Passcode</label>
                <input id="vip-pass" type="password" placeholder="Enter passcode" required />
                <button type="submit" className="nav-cta">Request Access</button>
              </form>
              {vipError && <p className="vip-error">{vipError}</p>}
              <button type="button" className="close-popup" onClick={() => setShowVip(false)}>
                Close
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default App;

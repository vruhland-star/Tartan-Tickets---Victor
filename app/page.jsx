import { getUpcomingEvents } from "../src/lib/events.mjs";
import EventsExplorer from "./ui/events-explorer";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const events = getUpcomingEvents();

  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Tartan Tickets home">
          <span className="wordmark-mark" aria-hidden="true">T</span>
          <span>TARTAN<span className="wordmark-light">TICKETS</span></span>
        </a>
        <a className="topbar-link" href="#events">Explore events <span aria-hidden="true">↘</span></a>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> YOUR CAMPUS, OUT THERE</p>
          <h1 id="hero-title">Make a night<br />of <span>something.</span></h1>
          <p className="hero-description">
            The people, places, and little moments that make CMU feel like yours.
            Find your next thing.
          </p>
          <a className="hero-cta" href="#events">Find an event <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-label="Illustration of a lively campus event">
          <div className="art-sun" />
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-stairs"><i /><i /><i /><i /><i /></div>
          <div className="art-people"><i /><i /><i /><i /><i /></div>
          <div className="art-label">PITTSBURGH, PA<br />40°26&apos; N · 79°57&apos; W</div>
          <span className="art-spark spark-one">✳</span>
          <span className="art-spark spark-two">✳</span>
        </div>
        <div className="hero-footer">
          <span>GOOD THINGS HAPPEN HERE</span>
          <span>FALL / WINTER 2026 <span aria-hidden="true">✳</span></span>
        </div>
      </section>

      <section id="events" className="events-section" aria-labelledby="events-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE WHAT’S ON</p>
            <h2 id="events-heading">Coming up<span className="heading-period">.</span></h2>
          </div>
          <p className="section-note">Good plans are closer than you think.<br />Pick one and make it yours.</p>
        </div>
        {events.length ? (
          <EventsExplorer initialEvents={events} />
        ) : (
          <div className="empty-state">No upcoming events yet.</div>
        )}
      </section>

      <footer className="footer">
        <a className="wordmark footer-wordmark" href="/" aria-label="Tartan Tickets home">
          <span className="wordmark-mark" aria-hidden="true">T</span>
          <span>TARTAN<span className="wordmark-light">TICKETS</span></span>
        </a>
        <span>MADE FOR THE MOMENTS BETWEEN CLASSES.</span>
        <span>© 2026 TARTAN TICKETS</span>
      </footer>
    </main>
  );
}

import { Check, CircleDot, Crown, GitCompareArrows, Hammer, ShieldCheck, Sparkles } from "lucide-react";

const systems = [
  { name: "Conquest rules", detail: "32 territories, adjacency, collections and reinforcements", status: "playable", completion: 92 },
  { name: "Royal Commands", detail: "Three balanced commitments: muster now, attack rally or defence rally", status: "playable", completion: 98 },
  { name: "Army command", detail: "Infantry, archers and cavalry adapt to regional field rules", status: "playable", completion: 90 },
  { name: "Battle theatre", detail: "Simulated capture odds, occupation orders, unit formations, casualties and layered sound", status: "playable", completion: 98 },
  { name: "Strategic map", detail: "Twelve distinct strategic shapes, routes, barriers, collections and chokepoints", status: "playable", completion: 98 },
  { name: "Enemy houses", detail: "Three doctrine-led AIs with visible intentions and chronological scout reports", status: "playable", completion: 97 },
  { name: "Royal campaign", detail: "Focused opening objective, twelve regional identities, rewards and campaign legacy", status: "playable", completion: 98 },
  { name: "Adversarial review", detail: "Five blind waves complete; final map verdict strong and near-premium", status: "review", completion: 90 },
];

export default function ProgressPage() {
  return (
    <main className="progress-page">
      <div className="progress-noise" />
      <header className="progress-hero">
        {/* Native navigation avoids a Vinext dynamic-import failure on this route. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="progress-back">← Return to the war table</a>
        <div className="progress-mark"><Crown /></div>
        <p className="eyebrow">Live forge ledger</p>
        <h1>Building Banners of Caldris</h1>
        <p>A playable campaign is in the forge. Every system is tested on its own, then judged again as part of the full game.</p>
        <div className="release-status"><span className="pulse-dot"/> Strategic tension and battle atmosphere · validating</div>
      </header>

      <section className="progress-principles">
        <article><Hammer/><div><b>Build narrowly</b><span>One independently judgeable system at a time.</span></div></article>
        <article><GitCompareArrows/><div><b>Critique harshly</b><span>Fresh eyes inspect the running game, not summaries.</span></div></article>
        <article><ShieldCheck/><div><b>Unify ruthlessly</b><span>Whole-game passes remove seams between systems.</span></div></article>
      </section>

      <section className="progress-ledger">
        <div className="ledger-heading"><div><p className="eyebrow">Current systems</p><h2>The campaign, piece by piece</h2></div><span>Updated 31 Aug 2026 · Strategic tension pass</span></div>
        <div className="ledger-grid">
          {systems.map((system, index) => (
            <article className="ledger-item" key={system.name}>
              <div className="ledger-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="ledger-copy"><div><h3>{system.name}</h3><span className={`status ${system.status}`}>{system.status === "playable" ? <Check/> : system.status === "active" ? <CircleDot/> : <Sparkles/>}{system.status}</span></div><p>{system.detail}</p><div className="quality-track"><i style={{ width: `${system.completion}%` }}/></div></div>
              <strong>{system.completion}<small>% built</small></strong>
            </article>
          ))}
        </div>
      </section>

      <section className="progress-now">
        <div><p className="eyebrow">Current pass · meaningful decisions</p><h2>Every turn now reveals a risk worth taking</h2><p>The first campaign ends when the heartland is secured, not after a full-map grind. Before battle, the real combat engine now forecasts capture odds and likely losses; after victory, the general chooses how many troops occupy the new territory. Scouts expose each rival house&apos;s likely move while twelve regions carry distinct strategic geography.</p></div>
        <ol><li><b>01</b> Post-capture occupation creates an immediate push-or-protect decision</li><li><b>02</b> Visible enemy intentions make rival doctrines readable and counterable</li><li><b>03</b> Layered clashes, arrows, hooves and distant battle ambience drive combat</li></ol>
      </section>
    </main>
  );
}

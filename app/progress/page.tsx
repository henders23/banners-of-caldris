import { Check, CircleDot, Crown, GitCompareArrows, Hammer, ShieldCheck, Sparkles } from "lucide-react";

const systems = [
  { name: "Conquest rules", detail: "32 territories, adjacency, collections and reinforcements", status: "playable", completion: 92 },
  { name: "King's Orders", detail: "One mutually exclusive strategic commitment every turn", status: "active", completion: 82 },
  { name: "Army command", detail: "Infantry, archers and cavalry adapt to regional field rules", status: "playable", completion: 90 },
  { name: "Battle theatre", detail: "ThreeJS diorama, dynamic rival heraldry and persistent casualties", status: "review", completion: 85 },
  { name: "Strategic map", detail: "Twelve bordered political maps with persistent names, routes and chokepoints", status: "playable", completion: 95 },
  { name: "Enemy houses", detail: "Three rival AIs with chronological dice-and-casualty scout reports", status: "polish", completion: 82 },
  { name: "Royal campaign", detail: "Twelve playable chapters, unique topologies, field rules, legacy and safe scouting", status: "playable", completion: 92 },
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
        <div className="release-status"><span className="pulse-dot"/> Wave five · release candidate live</div>
      </header>

      <section className="progress-principles">
        <article><Hammer/><div><b>Build narrowly</b><span>One independently judgeable system at a time.</span></div></article>
        <article><GitCompareArrows/><div><b>Critique harshly</b><span>Fresh eyes inspect the running game, not summaries.</span></div></article>
        <article><ShieldCheck/><div><b>Unify ruthlessly</b><span>Whole-game passes remove seams between systems.</span></div></article>
      </section>

      <section className="progress-ledger">
        <div className="ledger-heading"><div><p className="eyebrow">Current systems</p><h2>The campaign, piece by piece</h2></div><span>Updated 30 Aug 2026 · Wave 3</span></div>
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
        <div><p className="eyebrow">Audit five · near-premium map verdict</p><h2>The geography now teaches the strategy</h2><p>The final blind review passed province borders, collection colour, terrain, barriers, routes, chokepoints, targeting, battle clarity and save safety. Its last defect—names hidden until selection—has been removed; all territory names now remain visible on regional maps.</p></div>
        <ol><li><b>01</b> Fourteen deterministic and production tests pass</li><li><b>02</b> ESLint passes with zero warnings</li><li><b>03</b> Release candidate deployed from the audited tree</li></ol>
      </section>
    </main>
  );
}

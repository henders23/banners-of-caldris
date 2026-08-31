import { Check, CircleDot, Crown, GitCompareArrows, Hammer, ShieldCheck, Sparkles } from "lucide-react";

const systems = [
  { name: "Conquest rules", detail: "32 territories, adjacency, collections and reinforcements", status: "playable", completion: 92 },
  { name: "Royal Commands", detail: "One mutually exclusive strategic commitment every turn", status: "playable", completion: 94 },
  { name: "Army command", detail: "Infantry, archers and cavalry adapt to regional field rules", status: "playable", completion: 90 },
  { name: "Battle theatre", detail: "ThreeJS diorama, odds guidance, round control and persistent casualties", status: "playable", completion: 93 },
  { name: "Strategic map", detail: "Twelve bordered political maps with stable markers, overlays, routes and chokepoints", status: "playable", completion: 97 },
  { name: "Enemy houses", detail: "Three doctrine-led AIs with focused, chronological scout reports", status: "playable", completion: 92 },
  { name: "Royal campaign", detail: "Twelve distinct objectives, visible rewards, field rules, legacy and safe scouting", status: "playable", completion: 96 },
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
        <div className="release-status"><span className="pulse-dot"/> Opening clarity and command feedback · validating</div>
      </header>

      <section className="progress-principles">
        <article><Hammer/><div><b>Build narrowly</b><span>One independently judgeable system at a time.</span></div></article>
        <article><GitCompareArrows/><div><b>Critique harshly</b><span>Fresh eyes inspect the running game, not summaries.</span></div></article>
        <article><ShieldCheck/><div><b>Unify ruthlessly</b><span>Whole-game passes remove seams between systems.</span></div></article>
      </section>

      <section className="progress-ledger">
        <div className="ledger-heading"><div><p className="eyebrow">Current systems</p><h2>The campaign, piece by piece</h2></div><span>Updated 31 Aug 2026 · Command clarity pass</span></div>
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
        <div><p className="eyebrow">Current pass · the first command</p><h2>Your army and next action are unmistakable</h2><p>The opening tutorial now points directly to a labelled Royal Lions army. Choosing a command leads into a prominent reinforcement prompt, with larger unit counts and explicit action labels in the army panel. Secondary battlefield text has been cut so the objective and next decision dominate.</p></div>
        <ol><li><b>01</b> Graver title typography gives the campaign a stronger identity</li><li><b>02</b> Labelled starting army and guided reinforcement flow</li><li><b>03</b> Weightier command sound and larger essential battlefield text</li></ol>
      </section>
    </main>
  );
}

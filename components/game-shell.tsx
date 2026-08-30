"use client";

/* The game ships pre-sized, locally optimized art assets; framework image wrappers would break the layered war-table composition. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronRight, Crown, Flag, LockKeyhole, Map, Menu, Move, RotateCcw, Shield, Swords, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThreeBoard } from "@/components/three-board";
import { BattleDialog } from "@/components/battle-dialog";
import {
  BattleResult,
  CampaignStage,
  CampaignRule,
  FactionId,
  GameState,
  KingsOrder,
  Territory,
  UnitType,
  campaignStages,
  chooseKingsOrder,
  collections,
  controlledCollections,
  connectedFriendly,
  createGame,
  endPlayerTurn,
  factionTerritoryCount,
  factions,
  fortify,
  reinforce,
  resolveBattleRound,
  startAttackPhase,
  startFortifyPhase,
  totalUnits,
  unitCost,
} from "@/lib/game";

type Screen = "title" | "campaign" | "briefing" | "board";
type AudioCue = "select" | "phase" | "battle" | "victory";

const SAVE_KEY = "banners-of-caldris-save-v1";
const PROGRESS_KEY = "banners-of-caldris-progress-v1";

function playCue(cue: AudioCue, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const notes = cue === "battle" ? [110, 146, 196] : cue === "victory" ? [196, 247, 294, 392] : cue === "phase" ? [146, 196] : [220];
  notes.forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = cue === "battle" ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(frequency, now + index * .08);
    gain.gain.setValueAtTime(.0001, now + index * .08);
    gain.gain.exponentialRampToValueAtTime(cue === "battle" ? .06 : .035, now + index * .08 + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, now + index * .08 + .26);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + index * .08);
    osc.stop(now + index * .08 + .3);
  });
  window.setTimeout(() => ctx.close(), 900);
}

function FactionShield({ faction, active = false }: { faction: FactionId; active?: boolean }) {
  const item = factions[faction];
  return <span className={`faction-shield ${active ? "active" : ""}`} style={{ "--faction": item.color, "--metal": item.metal } as React.CSSProperties}>{item.sigil}</span>;
}

function TitleScreen({ canContinue, hasProgress, onNew, onContinue, onAtlas, sound, setSound }: { canContinue: boolean; hasProgress: boolean; onNew: () => void; onContinue: () => void; onAtlas: () => void; sound: boolean; setSound: (value: boolean) => void }) {
  const [confirmNew, setConfirmNew] = useState(false);
  const hasChronicle = canContinue || hasProgress;
  return (
    <main className="title-screen">
      <div className="title-vignette" />
      <div className="title-standard" aria-hidden="true"><span>♞</span></div>
      <section className="title-copy">
        <p className="eyebrow">A campaign of conquest, loyalty and broken oaths</p>
        <h1>Banners <small>of</small> Caldris</h1>
        <p className="title-subtitle">War for the Realm</p>
        <p className="title-lede">King Aldren has returned from exile. Lead the Royal Lions through twelve war-torn regions and reclaim Crownspire—one territory, one battle and one difficult victory at a time.</p>
        <div className="title-actions">
          {canContinue ? <button className="button gold large" onClick={onContinue}>Continue campaign <ChevronRight size={19}/></button> : hasProgress ? <button className="button gold large" onClick={onAtlas}>Continue campaign <ChevronRight size={19}/></button> : <button className="button gold large" onClick={onNew}>Begin new campaign <ChevronRight size={19}/></button>}
          {hasChronicle ? <button className="button steel" onClick={() => setConfirmNew(true)}>New campaign</button> : null}
        </div>
        <div className="title-links">
          <a href="/progress">Live build progress</a>
          <button aria-label={sound ? "Mute sound" : "Enable sound"} onClick={() => setSound(!sound)}>{sound ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
        </div>
      </section>
      <div className="title-atmosphere"><i/><i/><i/><i/><i/></div>
      <Dialog open={confirmNew} onOpenChange={setConfirmNew}>
        <DialogContent className="new-campaign-dialog parchment-panel text-[#231a10]">
          <DialogHeader><DialogTitle>Begin a new chronicle?</DialogTitle><DialogDescription>This permanently replaces the active battle and resets all twelve chapter victories on this device.</DialogDescription></DialogHeader>
          <div className="new-campaign-actions"><button className="button steel" onClick={() => setConfirmNew(false)}>Keep current campaign</button><button className="button gold" onClick={() => { setConfirmNew(false); onNew(); }}>Erase and begin again</button></div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CampaignScreen({ wins, selectedStage, activeStage, onSelect, onBegin, onPreview, onResume, onBack }: { wins: number; selectedStage: number; activeStage: number | null; onSelect: (id: number) => void; onBegin: () => void; onPreview: () => void; onResume: () => void; onBack: () => void }) {
  const selected = campaignStages[selectedStage - 1];
  const canResume = activeStage === selected.id;
  return (
    <main className="campaign-screen">
      <img src="/art/campaign-overview.webp" alt="The twelve regions of Caldris from Stoneford to Crownspire" className="campaign-art" />
      <div className="campaign-scrim" />
      <header className="campaign-header"><button className="icon-button" onClick={onBack} aria-label="Back"><X/></button><div><span className="eyebrow">Royal campaign</span><h1>War for the Realm</h1></div><div className="campaign-progress"><b>{wins}</b><span>of 12 secured</span></div></header>
      <section className="campaign-stage-strip" aria-label="Campaign regions">
        {campaignStages.map(stage => {
          const locked = stage.id > wins + 1;
          const complete = stage.id <= wins;
          return <button key={stage.id} className={`stage-seal ${locked ? "locked" : ""} ${selectedStage === stage.id ? "selected" : ""} ${complete ? "complete" : ""}`} onClick={() => onSelect(stage.id)} aria-label={`${stage.name}${locked ? ", locked; intelligence available" : ""}`}><span>{complete ? <Crown size={15}/> : locked ? <LockKeyhole size={14}/> : stage.id}</span><small>{stage.name.replace("The ", "")}</small></button>;
        })}
      </section>
      <aside className="campaign-detail parchment-panel">
        <p className="eyebrow">Chapter {selected.id} of 12</p>
        <h2>{selected.name}</h2>
        <p className="act-label">{selected.act}</p>
        <p>{selected.briefing}</p>
        <dl><div><dt>King&apos;s order</dt><dd>{selected.objective}</dd></div><div><dt>Field rule</dt><dd>{selected.ruleName} — {selected.ruleDetail}</dd></div><div><dt>Reward</dt><dd>{selected.reward}</dd></div><div><dt>Legacy</dt><dd>{wins ? `${Math.floor(wins / 2)} veteran units · +${Math.floor(wins / 4)} muster` : "No prior victories"}</dd></div><div><dt>Threat</dt><dd>{"◆".repeat(Math.ceil(selected.difficulty))}{"◇".repeat(Math.max(0,3-Math.ceil(selected.difficulty)))}</dd></div></dl>
        {canResume ? <div className="campaign-actions"><button className="button gold wide" onClick={onResume}>Resume current battle<ChevronRight size={18}/></button><button className="restart-chapter" onClick={onBegin}>Restart this chapter from the war council</button></div> : selected.id > wins + 1 ? <div className="campaign-actions"><button className="button steel wide" onClick={onPreview}>Scout battlefield<ChevronRight size={18}/></button><small className="preview-note">Skirmish intelligence · campaign progress is unchanged</small></div> : <button className="button gold wide" onClick={onBegin}>{selected.id <= wins ? "Replay campaign" : "Enter war council"}<ChevronRight size={18}/></button>}
      </aside>
    </main>
  );
}

function BriefingScreen({ stage, onBegin, onBack }: { stage: CampaignStage; onBegin: () => void; onBack: () => void }) {
  return (
    <main className="briefing-screen">
      <div className="council-fire" />
      <header><button className="icon-button" onClick={onBack} aria-label="Back"><X/></button><span>Royal War Council</span><small>{stage.name}</small></header>
      <section className="council-table">
        <div className="council-map"><img src="/art/vale-of-stoneford.webp" alt=""/><div className="map-lines"/><span className="wax-marker royal">♞</span><span className="wax-marker wolf">◆</span><span className="wax-marker boar">⬢</span><span className="wax-marker serpent">S</span></div>
        <article className="king-order parchment-panel">
          <p className="eyebrow">King Aldren Caerlyn</p>
          <h1>“General, bring this land beneath one banner.”</h1>
          <p>{stage.briefing}</p>
          <div className="order-grid"><div><Shield/><span><b>Objective</b>{stage.objective}</span></div><div><Trophy/><span><b>Reward</b>{stage.reward}</span></div><div><Map/><span><b>Field</b>32 territories · 6 collections</span></div><div><Swords/><span><b>{stage.ruleName}</b>{stage.ruleDetail}</span></div></div>
          <blockquote>“Win their castles if you must. Win their trust if you can. But open the road north.”</blockquote>
          <button className="button gold large wide" onClick={onBegin}>Raise the royal banners <Flag size={18}/></button>
        </article>
      </section>
    </main>
  );
}

function UnitRow({ unit, count, fieldRule, active, onClick, disabled }: { unit: UnitType; count: number; fieldRule: CampaignRule; active?: boolean; onClick?: () => void; disabled?: boolean }) {
  const archerBonus = fieldRule === "high-ground" ? 2 : 1;
  const cavalryBonus = fieldRule === "forest" ? 0 : fieldRule === "wolf-charge" ? 2 : 1;
  const copy = { infantry: ["⚔", "Infantry", "Cost 1"], archers: ["➶", "Archers", `Cost 2 · +${archerBonus} defence`], cavalry: ["♞", "Cavalry", cavalryBonus ? `Cost 2 · +${cavalryBonus} attack` : "Cost 2 · no forest attack bonus"] }[unit];
  return <button className={`unit-row ${active ? "active" : ""}`} onClick={onClick} disabled={disabled}><span>{copy[0]}</span><div><b>{copy[1]}</b><small>{copy[2]}</small></div><strong>{count}</strong></button>;
}

function BoardScreen({ game, setGame, sound, setSound, reducedMotion, setReducedMotion, onCampaign }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState>>; sound: boolean; setSound: (v: boolean) => void; reducedMotion: boolean; setReducedMotion: (v: boolean) => void; onCampaign: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(() => game.territories.find(territory => territory.owner === "royal")?.id ?? null);
  const [attackFromId, setAttackFromId] = useState<string | null>(null);
  const [attackToId, setAttackToId] = useState<string | null>(null);
  const [battleOpen, setBattleOpen] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [fortifyFromId, setFortifyFromId] = useState<string | null>(null);
  const [fortifyUnits, setFortifyUnits] = useState({ infantry: 0, archers: 0, cavalry: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [enemyOverlay, setEnemyOverlay] = useState(false);
  const [enemyReport, setEnemyReport] = useState<string[] | null>(null);
  const selected = game.territories.find(t => t.id === selectedId) ?? null;
  const attackFrom = game.territories.find(t => t.id === attackFromId) ?? null;
  const attackTo = game.territories.find(t => t.id === attackToId) ?? null;
  const fortifyFrom = game.territories.find(t => t.id === fortifyFromId) ?? null;
  const royalCollections = controlledCollections(game, "royal");
  const stage = campaignStages[game.stage - 1];
  const movementLimit = stage.rule === "causeways" ? 3 : Number.POSITIVE_INFINITY;
  const targetIds = useMemo(() => {
    if (game.phase === "attack" && attackFrom) return attackFrom.neighbors.filter(id => game.territories.find(t => t.id === id)?.owner !== "royal");
    if (game.phase === "fortify" && fortifyFromId && !game.fortifiedThisTurn) return game.territories.filter(t => t.owner === "royal" && t.id !== fortifyFromId && connectedFriendly(game, fortifyFromId, t.id, "royal")).map(t => t.id);
    return [];
  }, [game, attackFrom, fortifyFromId]);

  useEffect(() => {
    if (game.preview) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    if (game.phase === "victory") {
      const wins = Math.max(Number(localStorage.getItem(PROGRESS_KEY) ?? 0), game.stage);
      localStorage.setItem(PROGRESS_KEY, String(wins));
      playCue("victory", sound);
    }
  }, [game, sound]);

  const selectTerritory = (territory: Territory) => {
    playCue("select", sound);
    setSelectedId(territory.id);
    if (game.phase === "attack") {
      if (territory.owner === "royal" && totalUnits(territory.units) > 1) {
        setAttackFromId(territory.id); setAttackToId(null); setBattleResult(null);
      } else if (attackFrom && attackFrom.neighbors.includes(territory.id) && territory.owner !== "royal") {
        setAttackToId(territory.id); setBattleResult(null); setBattleOpen(true); playCue("battle", sound);
      }
    }
    if (game.phase === "fortify" && territory.owner === "royal" && !game.fortifiedThisTurn) {
      if (!fortifyFromId) { setFortifyFromId(territory.id); setFortifyUnits({ infantry: 0, archers: 0, cavalry: 0 }); }
      else if (territory.id === fortifyFromId) setFortifyFromId(null);
    }
  };

  const doBattle = (attackers: UnitType[]) => {
    if (!attackFromId || !attackToId) return;
    const resolved = resolveBattleRound(game, attackFromId, attackToId, attackers);
    if (!resolved) return;
    setGame(resolved.state);
    setBattleResult(resolved.result);
    playCue("battle", sound);
  };

  const nextPhase = () => {
    playCue("phase", sound);
    if (game.phase === "reinforce") {
      setGame(startAttackPhase(game)); setAttackFromId(null); setSelectedId(null);
    } else if (game.phase === "attack") {
      setGame(startFortifyPhase(game)); setAttackFromId(null); setAttackToId(null); setFortifyFromId(null); setSelectedId(null);
    } else if (game.phase === "fortify") {
      setEnemyOverlay(true);
      const snapshot = game;
      setGame({ ...game, phase: "enemy", activeFaction: "wolves" });
      window.setTimeout(() => {
        const resolved = endPlayerTurn(snapshot);
        const newEntries = resolved.log.filter(entry => !snapshot.log.includes(entry)).filter(entry => !entry.startsWith("Turn ")).slice(0, 6).reverse();
        setGame(resolved); setEnemyOverlay(false); setEnemyReport(newEntries); setSelectedId(null); setFortifyFromId(null);
      }, reducedMotion ? 250 : 1200);
    }
  };

  const changeFortifyUnit = (unit: UnitType, delta: number) => {
    if (!fortifyFrom) return;
    setFortifyUnits(current => {
      const next = { ...current, [unit]: Math.max(0, Math.min(fortifyFrom.units[unit], current[unit] + delta)) };
      return totalUnits(next) < totalUnits(fortifyFrom.units) && totalUnits(next) <= movementLimit ? next : current;
    });
  };

  const confirmFortify = () => {
    if (!fortifyFromId || !selected || selected.id === fortifyFromId || totalUnits(fortifyUnits) < 1) return;
    setGame(fortify(game, fortifyFromId, selected.id, fortifyUnits));
    setFortifyFromId(null);
    setFortifyUnits({ infantry: 0, archers: 0, cavalry: 0 });
  };

  return (
    <main className="board-screen">
      <ThreeBoard game={game} selectedId={selectedId} targetIds={targetIds} onSelect={selectTerritory} reducedMotion={reducedMotion}/>
      {game.preview ? <div className="preview-ribbon">Battlefield intelligence · chapter {game.stage} skirmish</div> : null}
      <header className="board-topbar">
        <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Menu"><Menu/></button>
        <div className="turn-block"><span>Turn</span><b>{game.turn}</b></div>
        <div className="active-faction"><FactionShield faction={game.activeFaction} active/><div><small>{game.phase === "enemy" ? "Enemy turn" : "Your command"}</small><b>{factions[game.activeFaction].shortName}</b></div></div>
        <div className="phase-name">{game.phase === "reinforce" ? "Muster" : game.phase === "attack" ? "Conquer" : game.phase === "fortify" ? "Final movement" : "Enemy movement"}</div>
        <div className="reinforcement-counter"><span>Reinforcements</span><b>{game.reinforcements}</b></div>
        <div className="faction-order">{(["royal","wolves","boars","serpents"] as FactionId[]).map(f => <FactionShield key={f} faction={f} active={game.activeFaction === f}/>)}</div>
      </header>

      {game.phase === "reinforce" && !game.kingsOrder ? <section className="kings-order-choice" aria-labelledby="kings-order-title"><p className="eyebrow">Seal one command · the others are lost this turn</p><h2 id="kings-order-title">Choose the King&apos;s Order</h2><div>{([
        ["levy", "⚑", "Call the Banners", "+2 muster points now"],
        ["vanguard", "♞", "Ride at Dawn", "Cavalry gain +1 extra in your first battle"],
        ["bastion", "♜", "Hold the Line", "Archers gain +1 extra in the first enemy assault"],
      ] as [KingsOrder,string,string,string][]).map(([id,glyph,name,detail]) => <button key={id} onClick={() => { setGame(chooseKingsOrder(game,id)); playCue("phase",sound); }}><span>{glyph}</span><b>{name}</b><small>{detail}</small></button>)}</div><p>Every order is powerful. Only one survives the wax seal.</p></section> : null}

      <aside className="objective-card parchment-panel"><p className="eyebrow">King&apos;s order</p><h2>{stage.objective}</h2><p><strong>{stage.ruleName}:</strong> {stage.ruleDetail}</p>{game.campaignWins ? <small className="legacy-bonus">Legacy · {Math.floor(game.campaignWins / 2)} veterans · +{Math.floor(game.campaignWins / 4)} muster</small> : null}<div className="objective-progress"><span>{factionTerritoryCount(game,"royal")} / 32 territories</span><b>{royalCollections.length} / 6 collections</b></div></aside>

      <aside className="territory-panel">
        {selected ? <>
          <div className="territory-heading" style={{ "--owner": factions[selected.owner].color } as React.CSSProperties}><FactionShield faction={selected.owner}/><div><small>{collections.find(c => c.id === selected.collection)?.name}</small><h2>{selected.name}</h2></div></div>
          <div className="territory-summary"><span>Army strength</span><b>{totalUnits(selected.units)}</b></div>
          <div className="unit-list">
            {(["infantry","archers","cavalry"] as UnitType[]).map(unit => <UnitRow key={unit} unit={unit} count={selected.units[unit]} fieldRule={stage.rule} disabled={game.phase !== "reinforce" || selected.owner !== "royal" || game.reinforcements < unitCost(unit)} onClick={() => setGame(reinforce(game, selected.id, unit))}/>) }
          </div>
          <div className="connections"><span>Connected territories</span><div>{selected.neighbors.map(id => <button key={id} onClick={() => selectTerritory(game.territories.find(t => t.id === id)!)}>{game.territories.find(t => t.id === id)?.name}</button>)}</div></div>
          {game.phase === "attack" && selected.owner === "royal" && totalUnits(selected.units) > 1 ? <div className="panel-callout"><Swords/><span>Select a red-linked enemy territory to attack from {selected.name}.</span></div> : null}
          {game.phase === "fortify" && game.fortifiedThisTurn ? <div className="panel-callout movement-done"><Shield/><span>Final movement complete. End the turn when your borders are ready.</span></div> : null}
          {game.phase === "fortify" && fortifyFrom && selected.owner === "royal" && selected.id !== fortifyFrom.id ? <div className="fortify-picker"><div><span>Move from {fortifyFrom.name}</span><b>{totalUnits(fortifyUnits)} selected</b></div>{(["infantry","archers","cavalry"] as UnitType[]).map(unit => <div className="fortify-unit" key={unit}><span>{unit}</span><button onClick={() => changeFortifyUnit(unit,-1)}>−</button><b>{fortifyUnits[unit]}</b><button onClick={() => changeFortifyUnit(unit,1)}>+</button></div>)}<button className="button gold wide" disabled={totalUnits(fortifyUnits) < 1} onClick={confirmFortify}><Move size={17}/> Confirm final movement</button></div> : null}
          {game.phase === "fortify" && fortifyFrom && selected.id === fortifyFrom.id ? <div className="panel-callout"><Move/><span>Choose any gold-linked royal territory, then decide exactly which units march there{Number.isFinite(movementLimit) ? ` (maximum ${movementLimit})` : ""}.</span></div> : null}
        </> : <div className="empty-selection"><Shield/><h2>Select a territory</h2><p>Inspect its army, routes and collection.</p></div>}
        <div className="war-log"><span>Dispatches</span>{game.log.slice(0,4).map((entry,i) => <p key={i}>{entry}</p>)}</div>
      </aside>

      <nav className="phase-bar" aria-label="Turn phases">
        <button className={game.phase === "reinforce" ? "active" : game.phase !== "enemy" ? "complete" : ""} disabled={game.phase === "enemy"}><span>1</span><div><small>Muster</small><b>Reinforce</b></div></button>
        <button className={game.phase === "attack" ? "active" : game.phase === "fortify" ? "complete" : ""} disabled={game.phase !== "attack"}><span>2</span><div><small>Conquer</small><b>Attack</b></div></button>
        <button className={game.phase === "fortify" ? "active" : ""} disabled={game.phase !== "fortify"}><span>3</span><div><small>Reposition</small><b>Move</b></div></button>
        <button className="end-phase" disabled={game.phase === "enemy" || (game.phase === "reinforce" && !game.kingsOrder)} onClick={nextPhase}>{game.phase === "reinforce" ? "Begin attacks" : game.phase === "attack" ? "Finish attacks" : "End turn"}<ChevronRight/></button>
      </nav>

      {enemyOverlay ? <div className="enemy-turn-overlay"><FactionShield faction="wolves" active/><div><small>Enemy turn</small><h2>The rival houses are moving</h2><p>Scouts report marching banners across the Vale.</p></div><span className="loading-rune">◆</span></div> : null}
      {enemyReport ? <div className="enemy-report parchment-panel"><p className="eyebrow">Scouts&apos; report</p><h2>The enemy turn is resolved</h2><div>{enemyReport.length ? enemyReport.map((entry,index) => <p key={index}>{entry}</p>) : <p>The rival houses hold their ground.</p>}</div><button className="button gold wide" onClick={() => setEnemyReport(null)}>Begin turn {game.turn}<ChevronRight/></button></div> : null}

      <BattleDialog open={battleOpen} from={attackFrom} to={attackTo} result={battleResult} kingsOrder={game.kingsOrder} kingsOrderUsed={game.kingsOrderUsed} fieldRule={stage.rule} reducedMotion={reducedMotion} onOpenChange={open => { setBattleOpen(open); if (!open) setBattleResult(null); }} onRoll={doBattle} onReset={() => setBattleResult(null)} onCaptured={() => { setBattleOpen(false); setBattleResult(null); setSelectedId(attackToId); setAttackFromId(null); setAttackToId(null); }}/>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="settings-dialog parchment-panel text-[#231a10]">
          <DialogHeader><DialogTitle>Campaign menu</DialogTitle><DialogDescription>Preferences are stored on this device.</DialogDescription></DialogHeader>
          <button className="setting-row" onClick={() => setSound(!sound)}>{sound ? <Volume2/> : <VolumeX/>}<span><b>Sound</b><small>{sound ? "Battle cues enabled" : "Muted"}</small></span><strong>{sound ? "On" : "Off"}</strong></button>
          <button className="setting-row" onClick={() => setReducedMotion(!reducedMotion)}><RotateCcw/><span><b>Reduced motion</b><small>Limits camera and ambient movement</small></span><strong>{reducedMotion ? "On" : "Off"}</strong></button>
          <a className="setting-row" href="/progress"><BookOpen/><span><b>Live build progress</b><small>See completed systems and current work</small></span><ChevronRight/></a>
          <button className="setting-row" onClick={() => { setSettingsOpen(false); setRulesOpen(true); }}><Shield/><span><b>Rules of command</b><small>Turn flow, unit costs and battle odds</small></span><ChevronRight/></button>
          <button className="button steel wide" onClick={onCampaign}>Return to campaign map</button>
        </DialogContent>
      </Dialog>

      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="rules-dialog parchment-panel text-[#231a10]">
          <DialogHeader><DialogTitle>Rules of command</DialogTitle><DialogDescription>Everything needed to lead the Royal Lions.</DialogDescription></DialogHeader>
          <div className="rule-list"><article><b>0 · King&apos;s Order</b><p>Seal one command each turn: extra levies, +1 extra to the first cavalry assault, or +1 extra to the first archer defence. The other two are lost until next turn.</p></article><article><b>1 · Muster</b><p>Gain at least 3 points: <strong>territories ÷ 3</strong>, rounded down, plus every complete collection. Infantry cost 1; archers and cavalry cost 2.</p></article><article><b>2 · Conquer</b><p>Attack an adjacent enemy with up to 3 units, leaving one behind. Defenders roll up to 2 dice and win ties.</p></article><article><b>Unit mastery</b><p>Cavalry normally add +1 to their attacking die. Archers normally add +1 to their defending die. The current field rule is reflected in every unit row and roll.</p></article><article><b>3 · Final movement</b><p>Once per turn, move any number of units between connected royal territories, always leaving one guard behind.</p></article><article><b>Current field · {stage.ruleName}</b><p>{stage.ruleDetail}</p></article><article><b>Victory</b><p>Control all 32 territories. Complete collections to accelerate the campaign, but defend their narrow entrances.</p></article></div>
        </DialogContent>
      </Dialog>

      {game.phase === "victory" ? <div className="outcome-overlay victory"><Trophy/><p className="eyebrow">{game.preview ? "Skirmish complete" : "Region secured"}</p><h1>{stage.name} is yours</h1><p>{game.preview ? "The scouts seal their report. Campaign progress remains unchanged." : "The royal road opens. Veterans carry their honours into the next campaign."}</p><button className="button gold large" onClick={onCampaign}>{game.preview ? "Return to the campaign atlas" : game.stage === 12 ? "View the restored realm" : "Continue the march"}<ChevronRight/></button></div> : null}
      {game.phase === "defeat" ? <div className="outcome-overlay defeat"><Flag/><p className="eyebrow">The royal host is broken</p><h1>The campaign has failed</h1><p>{stage.name} remains beneath rival banners.</p><button className="button gold large" onClick={() => setGame(createGame(game.stage, game.campaignWins, game.preview))}>Retry {game.preview ? "skirmish" : "campaign"} <RotateCcw/></button></div> : null}
    </main>
  );
}

export default function GameShell() {
  const [screen, setScreen] = useState<Screen>("title");
  const [game, setGame] = useState<GameState>(() => createGame());
  const [wins, setWins] = useState(0);
  const [selectedStage, setSelectedStage] = useState(1);
  const [canContinue, setCanContinue] = useState(false);
  const [savedStage, setSavedStage] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    const progress = Number(localStorage.getItem(PROGRESS_KEY) ?? 0);
    const raw = localStorage.getItem(SAVE_KEY);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stageFromSave: number | null = null;
    if (raw) try { stageFromSave = Number((JSON.parse(raw) as GameState).stage) || null; } catch { stageFromSave = null; }
    queueMicrotask(() => {
      setWins(progress);
      setCanContinue(Boolean(raw));
      setSavedStage(stageFromSave);
      setReducedMotion(media.matches);
    });
  }, []);

  const loadSaved = () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try { const saved = JSON.parse(raw) as GameState; setGame({ ...saved, preview: false, fortifiedThisTurn: Boolean(saved.fortifiedThisTurn), kingsOrder: saved.kingsOrder ?? null, kingsOrderUsed: Boolean(saved.kingsOrderUsed) }); setSavedStage(saved.stage); setScreen("board"); } catch { localStorage.removeItem(SAVE_KEY); setCanContinue(false); setSavedStage(null); }
  };
  const enterCampaign = () => { const currentWins = Number(localStorage.getItem(PROGRESS_KEY) ?? wins); setWins(currentWins); setSelectedStage(Math.min(12, currentWins + 1)); setScreen("campaign"); };
  const startFreshCampaign = () => { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(PROGRESS_KEY); setWins(0); setSelectedStage(1); setCanContinue(false); setSavedStage(null); setGame(createGame()); setScreen("campaign"); };
  const beginStage = () => { const next = createGame(selectedStage, wins); localStorage.setItem(SAVE_KEY, JSON.stringify(next)); setCanContinue(true); setSavedStage(selectedStage); setGame(next); setScreen("board"); playCue("phase", sound); };
  const previewStage = () => { setGame(createGame(selectedStage, wins, true)); setScreen("board"); playCue("phase", sound); };

  if (screen === "title") return <TitleScreen canContinue={canContinue} hasProgress={wins > 0} onNew={startFreshCampaign} onContinue={loadSaved} onAtlas={enterCampaign} sound={sound} setSound={setSound}/>;
  const activeStage = canContinue ? savedStage : null;
  if (screen === "campaign") return <CampaignScreen wins={wins} selectedStage={selectedStage} activeStage={activeStage} onSelect={setSelectedStage} onBegin={() => setScreen("briefing")} onPreview={previewStage} onResume={loadSaved} onBack={() => setScreen("title")}/>;
  if (screen === "briefing") return <BriefingScreen stage={campaignStages[selectedStage - 1]} onBegin={beginStage} onBack={() => setScreen("campaign")}/>;
  return <BoardScreen game={game} setGame={setGame} sound={sound} setSound={setSound} reducedMotion={reducedMotion} setReducedMotion={setReducedMotion} onCampaign={enterCampaign}/>;
}

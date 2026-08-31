"use client";

/* The game ships pre-sized, locally optimized art assets; framework image wrappers would break the layered war-table composition. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookOpen, ChevronRight, Crown, Eye, Flag, Layers3, LockKeyhole, Map, Menu, Move, Route, RotateCcw, Shield, SkipForward, Swords, Target, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapOverlay, ThreeBoard } from "@/components/three-board";
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
  campaignLegacySummary,
  campaignObjectiveProgress,
  chooseKingsOrder,
  collections,
  controlledCollections,
  connectedFriendly,
  createGame,
  endPlayerTurn,
  factions,
  fortify,
  reinforce,
  resolveBattleRound,
  resolveFullAssault,
  startAttackPhase,
  startFortifyPhase,
  totalUnits,
  unitCost,
} from "@/lib/game";

type Screen = "title" | "prologue" | "campaign" | "briefing" | "board";
type AudioCue = "select" | "phase" | "battle" | "victory";

const SAVE_KEY = "banners-of-caldris-save-v1";
const PROGRESS_KEY = "banners-of-caldris-progress-v1";
const TUTORIAL_KEY = "banners-of-caldris-tutorial-v1";

function playCue(cue: AudioCue, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  if (cue === "select") {
    const strike = (type: OscillatorType, start: number, end: number, volume: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(start, now);
      osc.frequency.exponentialRampToValueAtTime(end, now + duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + .03);
    };
    strike("sine", 104, 48, .095, .24);
    strike("triangle", 186, 92, .038, .15);
    window.setTimeout(() => ctx.close(), 650);
    return;
  }
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
        <p className="eyebrow">A single-player strategy campaign</p>
        <h1>Banners <small>of</small> Caldris</h1>
        <p className="title-subtitle">War for the Realm</p>
        <p className="title-lede">The crown has fallen. Lead the Royal Lions across twelve war-torn regions and reclaim Crownspire.</p>
        <div className="title-actions">
          {canContinue ? <button className="button blue large" onClick={onContinue}>Continue campaign <ChevronRight size={19}/></button> : hasProgress ? <button className="button blue large" onClick={onAtlas}>Continue campaign <ChevronRight size={19}/></button> : <button className="button blue large" onClick={onNew}>Begin new campaign <ChevronRight size={19}/></button>}
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

function StoryScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return (
    <main className="story-screen">
      <div className="story-images" aria-hidden="true">
        <img src="/art/campaign-overview.webp" alt="" />
        <img src="/art/battle-reference.webp" alt="" />
        <img src="/art/vale-of-stoneford.webp" alt="" />
      </div>
      <div className="story-scrim" />
      <button className="icon-button story-back" onClick={onBack} aria-label="Back"><X/></button>
      <section className="story-copy">
        <p className="eyebrow">The realm, in the year of the broken crown</p>
        <h1>Caldris has no king.<br/><span>Not yet.</span></h1>
        <p>King Aldren returns from fifteen years of exile to find his country divided. Three rival houses hold its roads, grain and fortresses. Crownspire belongs to the usurper Cassian Vane.</p>
        <div className="story-houses">
          {(["wolves", "boars", "serpents"] as FactionId[]).map(factionId => {
            const faction = factions[factionId];
            return <article key={factionId}><FactionShield faction={factionId}/><div><b>{faction.shortName}</b><span>{faction.doctrine}</span></div></article>;
          })}
        </div>
        <div className="story-order"><Target/><div><b>Your command</b><span>Secure Stoneford, rebuild the Royal Lions and open the twelve-region road to the capital.</span></div></div>
        <button className="button blue large" onClick={onContinue}>Enter the royal war council <ChevronRight size={19}/></button>
      </section>
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
        <dl><div><dt>Campaign objective</dt><dd><b>{selected.objective}</b><small>{selected.objectiveDetail}</small></dd></div><div><dt>Field rule</dt><dd>{selected.ruleName} — {selected.ruleDetail}</dd></div><div><dt>Reward</dt><dd><b>{selected.reward}</b><small>{selected.rewardDetail}</small></dd></div><div><dt>Campaign legacy</dt><dd>{campaignLegacySummary(wins)}</dd></div><div><dt>Threat</dt><dd>{"◆".repeat(Math.ceil(selected.difficulty))}{"◇".repeat(Math.max(0,3-Math.ceil(selected.difficulty)))}</dd></div></dl>
        {canResume ? <div className="campaign-actions"><button className="button gold wide" onClick={onResume}>Resume current battle<ChevronRight size={18}/></button><button className="restart-chapter" onClick={onBegin}>Restart this chapter from the war council</button></div> : selected.id > wins + 1 ? <div className="campaign-actions"><button className="button steel wide" onClick={onPreview}>Reconnoitre chapter<ChevronRight size={18}/></button><small className="preview-note">Practice skirmish · campaign progress is unchanged</small></div> : <button className="button gold wide" onClick={onBegin}>{selected.id <= wins ? "Replay campaign" : "Enter war council"}<ChevronRight size={18}/></button>}
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
          <div className="order-grid"><div><Shield/><span><b>Objective · {stage.objective}</b>{stage.objectiveDetail}</span></div><div><Trophy/><span><b>Reward · {stage.reward}</b>{stage.rewardDetail}</span></div><div><Map/><span><b>Field</b>32 territories · 6 collections</span></div><div><Swords/><span><b>{stage.ruleName}</b>{stage.ruleDetail}</span></div></div>
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
  return <button className={`unit-row ${active ? "active" : ""}`} onClick={onClick} disabled={disabled}><span>{copy[0]}</span><div><b>{copy[1]}</b><small>{copy[2]}</small></div><span className="unit-action"><strong>{count}</strong>{!disabled ? <em>+ Reinforce</em> : null}</span></button>;
}

function reportPresentation(entry: string) {
  const factionId = (["wolves", "boars", "serpents"] as FactionId[]).find(id => entry.includes(factions[id].shortName)) ?? "wolves";
  const [action, rollText] = entry.split(" · rolls ");
  const captured = /capture/i.test(action);
  const target = action.match(/(?:strike|capture) (.+?) (?:from|from the)/i)?.[1] ?? action.match(/and capture (.+?) from/i)?.[1];
  return {
    factionId,
    targetName: target,
    title: captured ? `${factions[factionId].shortName} seize ${target ?? "a territory"}` : `${factions[factionId].shortName} attack ${target ?? "the border"}`,
    action,
    rolls: rollText ? `Dice: ${rollText}` : "No battle was joined.",
  };
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
  const [enemyReportIndex, setEnemyReportIndex] = useState(0);
  const [mapOverlay, setMapOverlay] = useState<MapOverlay>("none");
  const [tutorialStep, setTutorialStep] = useState(() => game.stage === 1 && game.turn === 1 && !game.preview && typeof window !== "undefined" && localStorage.getItem(TUTORIAL_KEY) !== "complete" ? 0 : -1);
  const selected = game.territories.find(t => t.id === selectedId) ?? null;
  const attackFrom = game.territories.find(t => t.id === attackFromId) ?? null;
  const attackTo = game.territories.find(t => t.id === attackToId) ?? null;
  const fortifyFrom = game.territories.find(t => t.id === fortifyFromId) ?? null;
  const royalCollections = controlledCollections(game, "royal");
  const stage = campaignStages[game.stage - 1];
  const objectiveProgress = useMemo(() => campaignObjectiveProgress(game), [game]);
  const movementLimit = stage.rule === "causeways" ? 3 : Number.POSITIVE_INFINITY;
  const selectedCollection = selected ? collections.find(collection => collection.id === selected.collection) : null;
  const selectedCollectionMembers = selected ? game.territories.filter(territory => territory.collection === selected.collection) : [];
  const selectedCollectionHeld = selectedCollectionMembers.filter(territory => territory.owner === "royal").length;
  const selectedCollectionMissing = selectedCollectionMembers.filter(territory => territory.owner !== "royal");
  const tutorialSteps = [
    { icon: <Eye/>, label: "Find your army", title: "Blue and gold are yours", copy: "Your armies are blue shields with gold edges. The army marked YOUR ARMY is already selected; its total strength is shown on the right.", cue: "Choose a Royal Command, then click + Reinforce beside Infantry, Archers or Cavalry." },
    { icon: <Crown/>, label: "Your turn", title: "Three phases. One clear order.", copy: "Muster your army, attack an adjacent rival, then make one final movement before the enemy houses act.", cue: "The phase bar at the bottom always shows the next action." },
    { icon: <Swords/>, label: "Attack", title: "Strike from strength", copy: "In Conquer, select a blue army with at least two units. Legal enemy targets gain red rings. Choose one to open the battle.", cue: "One unit must remain behind to hold the territory." },
    { icon: <Target/>, label: "Victory", title: stage.objective, copy: stage.objectiveDetail, cue: `Secure coloured collections to earn more reinforcements.` },
  ];
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

  const doFullBattle = (attackers: UnitType[]) => {
    if (!attackFromId || !attackToId) return;
    const resolved = resolveFullAssault(game, attackFromId, attackToId, attackers);
    if (!resolved) return;
    setGame(resolved.state);
    setBattleResult(resolved.result);
    playCue("battle", sound);
  };

  const focusEnemyReport = (entries: string[], index: number, state: GameState) => {
    const entry = entries[index];
    const targetName = entry ? reportPresentation(entry).targetName : null;
    const territory = state.territories.find(item => item.name === targetName) ?? [...state.territories].sort((a,b) => b.name.length - a.name.length).find(item => entry?.includes(item.name));
    setEnemyReportIndex(index);
    setSelectedId(territory?.id ?? null);
  };

  const finishTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, "complete");
    setTutorialStep(-1);
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
        setGame(resolved); setEnemyOverlay(false); setEnemyReport(newEntries); setFortifyFromId(null);
        if (newEntries.length) focusEnemyReport(newEntries, 0, resolved); else setSelectedId(null);
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
      <ThreeBoard game={game} selectedId={selectedId} targetIds={targetIds} objectiveIds={objectiveProgress.targetIds} overlay={mapOverlay} onSelect={selectTerritory} reducedMotion={reducedMotion}/>
      {game.preview ? <div className="preview-ribbon">Battlefield intelligence · chapter {game.stage} skirmish</div> : null}
      <header className="board-topbar">
        <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Menu"><Menu/></button>
        <div className="turn-block"><span>Turn</span><b>{game.turn}</b></div>
        <div className="active-faction"><FactionShield faction={game.activeFaction} active/><div><small>{game.phase === "enemy" ? "Enemy turn" : "Your command"}</small><b>{factions[game.activeFaction].shortName}</b></div></div>
        <div className="phase-name">{game.phase === "reinforce" ? "Muster" : game.phase === "attack" ? "Conquer" : game.phase === "fortify" ? "Final movement" : "Enemy movement"}</div>
        <div className="reinforcement-counter"><span>Reinforcements</span><b>{game.reinforcements}</b></div>
        <div className="faction-order">{(["royal","wolves","boars","serpents"] as FactionId[]).map(f => <FactionShield key={f} faction={f} active={game.activeFaction === f}/>)}</div>
      </header>

      <div className="board-key" aria-label="Map key"><span><i className="key-shield"/>Blue = your army</span><span><b>5</b>Number = units</span><span><Route/>Road = move or attack</span></div>
      <div className="map-tools" aria-label="Map overlays">
        {([
          ["routes", <Route key="route"/>, "Routes"],
          ["collections", <Layers3 key="layers"/>, "Collections"],
          ["threats", <AlertTriangle key="alert"/>, "Threats"],
        ] as [MapOverlay, React.ReactNode, string][]).map(([id,icon,label]) => <button key={id} aria-pressed={mapOverlay === id} onClick={() => setMapOverlay(current => current === id ? "none" : id)}>{icon}<span>{label}</span></button>)}
      </div>

      {game.phase === "reinforce" && !game.kingsOrder && tutorialStep < 0 && !enemyReport ? <section className="kings-order-choice" aria-labelledby="kings-order-title"><p className="eyebrow">Step 1 · choose one command</p><h2 id="kings-order-title">Choose a Royal Command</h2><div>{([
        ["levy", "⚑", "Call the Banners", "+2 muster points now"],
        ["vanguard", "♞", "Ride at Dawn", "Cavalry gain +1 extra in your first battle"],
        ["bastion", "♜", "Hold the Line", "Archers gain +1 extra in the first enemy assault"],
      ] as [KingsOrder,string,string,string][]).map(([id,glyph,name,detail]) => <button key={id} onClick={() => { setGame(chooseKingsOrder(game,id)); setSelectedId(game.territories.find(territory => territory.owner === "royal")?.id ?? null); playCue("phase",sound); }}><span>{glyph}</span><b>{name}</b><small>{detail}</small></button>)}</div><p>Next: reinforce the selected blue army.</p></section> : null}

      {game.phase === "reinforce" && game.kingsOrder && game.reinforcements > 0 && !enemyReport ? <div className="muster-guide"><Shield/><div><b>2 · Reinforce your army</b><span>Use <strong>+ Reinforce</strong> in the panel on the right.</span></div></div> : null}

      <aside className="objective-card parchment-panel"><p className="eyebrow">Objective</p><h2>{stage.objective}</h2><p>{stage.objectiveDetail}</p><div className="objective-progress"><span>{objectiveProgress.label}</span><b>{royalCollections.length} / 6 collections</b></div></aside>

      <aside className="territory-panel">
        {selected ? <>
          <div className="territory-heading" style={{ "--owner": factions[selected.owner].color } as React.CSSProperties}><FactionShield faction={selected.owner}/><div><small>{selected.owner === "royal" ? "Your army" : factions[selected.owner].shortName}</small><h2>{selected.name}</h2></div></div>
          <div className="territory-summary"><span>Army strength</span><b>{totalUnits(selected.units)}</b></div>
          {selected.owner === "royal" && game.phase === "reinforce" ? <div className="reinforce-heading"><b>Reinforce here</b><span>{game.reinforcements} points left</span></div> : null}
          <div className="unit-list">
            {(["infantry","archers","cavalry"] as UnitType[]).map(unit => <UnitRow key={unit} unit={unit} count={selected.units[unit]} fieldRule={stage.rule} disabled={game.phase !== "reinforce" || !game.kingsOrder || selected.owner !== "royal" || game.reinforcements < unitCost(unit)} onClick={() => { setGame(reinforce(game, selected.id, unit)); playCue("select", sound); }}/>) }
          </div>
          {selectedCollection ? <div className="collection-progress"><div><span>{selectedCollection.name}</span><b>{selectedCollectionHeld}/{selectedCollectionMembers.length} held · +{selectedCollection.bonus} muster</b></div><div className="collection-track"><i style={{ width: `${selectedCollectionHeld / selectedCollectionMembers.length * 100}%` }}/></div>{selectedCollectionMissing.length ? <small>Still needed: {selectedCollectionMissing.slice(0,3).map(item => item.name).join(", ")}{selectedCollectionMissing.length > 3 ? ` +${selectedCollectionMissing.length - 3} more` : ""}</small> : <small>Collection secured. Defend it to keep the bonus.</small>}</div> : null}
          <div className="connections"><span>Connected territories</span><div>{selected.neighbors.map(id => <button key={id} onClick={() => selectTerritory(game.territories.find(t => t.id === id)!)}>{game.territories.find(t => t.id === id)?.name}</button>)}</div></div>
          {game.phase === "attack" && selected.owner === "royal" && totalUnits(selected.units) > 1 ? <div className="panel-callout"><Swords/><span>Red rings are legal targets from {selected.name}. The number on each shield is its total army; one unit must remain here.</span></div> : null}
          {game.phase === "fortify" && game.fortifiedThisTurn ? <div className="panel-callout movement-done"><Shield/><span>Final movement complete. End the turn when your borders are ready.</span></div> : null}
          {game.phase === "fortify" && fortifyFrom && selected.owner === "royal" && selected.id !== fortifyFrom.id ? <div className="fortify-picker"><div><span>Move from {fortifyFrom.name}</span><b>{totalUnits(fortifyUnits)} selected</b></div>{(["infantry","archers","cavalry"] as UnitType[]).map(unit => <div className="fortify-unit" key={unit}><span>{unit}</span><button aria-label={`Remove ${unit} from movement`} onClick={() => changeFortifyUnit(unit,-1)}>−</button><b>{fortifyUnits[unit]}</b><button aria-label={`Add ${unit} to movement`} onClick={() => changeFortifyUnit(unit,1)}>+</button></div>)}<button className="button gold wide" disabled={totalUnits(fortifyUnits) < 1} onClick={confirmFortify}><Move size={17}/> Confirm final movement</button></div> : null}
          {game.phase === "fortify" && fortifyFrom && selected.id === fortifyFrom.id ? <div className="panel-callout"><Move/><span>Choose any gold-linked royal territory, then decide exactly which units march there{Number.isFinite(movementLimit) ? ` (maximum ${movementLimit})` : ""}.</span></div> : null}
        </> : <div className="empty-selection"><Shield/><h2>Select a territory</h2><p>Choose a shield on the map.</p></div>}
      </aside>

      <nav className="phase-bar" aria-label="Turn phases">
        <button className={game.phase === "reinforce" ? "active" : game.phase !== "enemy" ? "complete" : ""} disabled={game.phase === "enemy"}><span>1</span><div><small>Muster</small><b>Reinforce</b></div></button>
        <button className={game.phase === "attack" ? "active" : game.phase === "fortify" ? "complete" : ""} disabled={game.phase !== "attack"}><span>2</span><div><small>Conquer</small><b>Attack</b></div></button>
        <button className={game.phase === "fortify" ? "active" : ""} disabled={game.phase !== "fortify"}><span>3</span><div><small>Reposition</small><b>Move</b></div></button>
        <button className="end-phase" disabled={game.phase === "enemy" || (game.phase === "reinforce" && !game.kingsOrder)} onClick={nextPhase}>{game.phase === "reinforce" ? "Begin attacks" : game.phase === "attack" ? "Finish attacks" : "End turn"}<ChevronRight/></button>
      </nav>

      {enemyOverlay ? <div className="enemy-turn-overlay"><FactionShield faction="wolves" active/><div><small>Enemy turn</small><h2>The rival houses are moving</h2><p>Scouts report marching banners across the Vale.</p></div><span className="loading-rune">◆</span></div> : null}
      {enemyReport ? (() => {
        const report = enemyReport.length ? reportPresentation(enemyReport[enemyReportIndex]) : null;
        const isLast = enemyReportIndex >= enemyReport.length - 1;
        return <div className="enemy-report">
          <div className="enemy-report-head"><FactionShield faction={report?.factionId ?? "wolves"} active/><div><p className="eyebrow">Scouts&apos; report · {enemyReport.length ? `${enemyReportIndex + 1} of ${enemyReport.length}` : "all quiet"}</p><h2>{report?.title ?? "The rival houses hold their ground"}</h2></div></div>
          <div className="enemy-report-body"><b>{report ? factions[report.factionId].doctrine : "No border changed hands."}</b><p>{report?.action ?? "No enemy army found a worthwhile attack."}</p><span>{report?.rolls ?? "Your lines remain secure."}</span></div>
          <button className="button blue wide" onClick={() => {
            if (!isLast) focusEnemyReport(enemyReport, enemyReportIndex + 1, game);
            else { setEnemyReport(null); setSelectedId(null); }
          }}>{isLast ? `Begin turn ${game.turn}` : "Next enemy action"}<SkipForward/></button>
        </div>;
      })() : null}

      <BattleDialog open={battleOpen} from={attackFrom} to={attackTo} result={battleResult} kingsOrder={game.kingsOrder} kingsOrderUsed={game.kingsOrderUsed} fieldRule={stage.rule} reducedMotion={reducedMotion} onOpenChange={open => { setBattleOpen(open); if (!open) setBattleResult(null); }} onRoll={doBattle} onResolve={doFullBattle} onReset={() => setBattleResult(null)} onCaptured={() => { setBattleOpen(false); setBattleResult(null); setSelectedId(attackToId); setAttackFromId(null); setAttackToId(null); }}/>

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
          <div className="rule-list"><article><b>0 · Royal Command</b><p>Seal one command each turn: extra levies, +1 extra to the first cavalry assault, or +1 extra to the first archer defence. The other two return next turn.</p></article><article><b>1 · Muster</b><p>Gain at least 3 points: <strong>territories ÷ 3</strong>, rounded down, plus every complete collection. Infantry cost 1; archers and cavalry cost 2.</p></article><article><b>2 · Conquer</b><p>Attack an adjacent enemy with up to 3 units, leaving one behind. Defenders roll up to 2 dice and win ties.</p></article><article><b>Unit mastery</b><p>Cavalry normally add +1 to their attacking die. Archers normally add +1 to their defending die. The current field rule is reflected in every unit row and roll.</p></article><article><b>3 · Final movement</b><p>Once per turn, move any number of units between connected royal territories, always leaving one guard behind.</p></article><article><b>Current field · {stage.ruleName}</b><p>{stage.ruleDetail}</p></article><article><b>Victory · {stage.objective}</b><p>{stage.objectiveDetail} Reward: {stage.rewardDetail}</p></article></div>
        </DialogContent>
      </Dialog>

      {tutorialStep >= 0 ? <section className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <div className="tutorial-progress">{tutorialSteps.map((_,index) => <i key={index} className={index <= tutorialStep ? "active" : ""}/>)}</div>
        <div className="tutorial-icon">{tutorialSteps[tutorialStep].icon}</div>
        <p className="eyebrow">Field tutorial · {tutorialSteps[tutorialStep].label}</p>
        <h2 id="tutorial-title">{tutorialSteps[tutorialStep].title}</h2>
        <p>{tutorialSteps[tutorialStep].copy}</p>
        <div className="tutorial-cue"><Target/>{tutorialSteps[tutorialStep].cue}</div>
        <div className="tutorial-actions"><button onClick={finishTutorial}>Skip tutorial</button><button className="button blue" onClick={() => tutorialStep === tutorialSteps.length - 1 ? finishTutorial() : setTutorialStep(step => step + 1)}>{tutorialStep === tutorialSteps.length - 1 ? "Choose first command" : "Next"}<ChevronRight/></button></div>
      </section> : null}

      {game.phase === "victory" ? <div className="outcome-overlay victory"><Trophy/><p className="eyebrow">{game.preview ? "Skirmish complete" : "Campaign objective achieved"}</p><h1>{stage.name} is yours</h1><p>{game.preview ? "The scouts seal their report. Campaign progress remains unchanged." : `${stage.objective} is complete. ${stage.rewardDetail}`}</p><button className="button gold large" onClick={onCampaign}>{game.preview ? "Return to the campaign atlas" : game.stage === 12 ? "View the restored realm" : "Continue the march"}<ChevronRight/></button></div> : null}
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
  const startFreshCampaign = () => { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(PROGRESS_KEY); localStorage.removeItem(TUTORIAL_KEY); setWins(0); setSelectedStage(1); setCanContinue(false); setSavedStage(null); setGame(createGame()); setScreen("prologue"); };
  const beginStage = () => { const next = createGame(selectedStage, wins); localStorage.setItem(SAVE_KEY, JSON.stringify(next)); setCanContinue(true); setSavedStage(selectedStage); setGame(next); setScreen("board"); playCue("phase", sound); };
  const previewStage = () => { setGame(createGame(selectedStage, wins, true)); setScreen("board"); playCue("phase", sound); };

  if (screen === "title") return <TitleScreen canContinue={canContinue} hasProgress={wins > 0} onNew={startFreshCampaign} onContinue={loadSaved} onAtlas={enterCampaign} sound={sound} setSound={setSound}/>;
  if (screen === "prologue") return <StoryScreen onContinue={enterCampaign} onBack={() => setScreen("title")}/>;
  const activeStage = canContinue ? savedStage : null;
  if (screen === "campaign") return <CampaignScreen wins={wins} selectedStage={selectedStage} activeStage={activeStage} onSelect={setSelectedStage} onBegin={() => setScreen("briefing")} onPreview={previewStage} onResume={loadSaved} onBack={() => setScreen("title")}/>;
  if (screen === "briefing") return <BriefingScreen stage={campaignStages[selectedStage - 1]} onBegin={beginStage} onBack={() => setScreen("campaign")}/>;
  return <BoardScreen game={game} setGame={setGame} sound={sound} setSound={setSound} reducedMotion={reducedMotion} setReducedMotion={setReducedMotion} onCampaign={enterCampaign}/>;
}

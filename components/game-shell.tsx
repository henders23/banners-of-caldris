"use client";

/* The game ships pre-sized, locally optimized art assets; framework image wrappers would break the layered war-table composition. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookOpen, ChevronRight, Crown, Eye, Flag, Layers3, LockKeyhole, Map, Menu, Move, Route, RotateCcw, Shield, SkipForward, Swords, Target, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapOverlay, ThreeBoard } from "@/components/three-board";
import { BattleDialog } from "@/components/battle-dialog";
import { playGameCue } from "@/lib/audio";
import {
  BattleResult,
  CampaignStage,
  FactionId,
  GameState,
  KingsOrder,
  Territory,
  UnitType,
  Units,
  campaignStages,
  campaignLegacySummary,
  campaignObjectiveProgress,
  chooseKingsOrder,
  collections,
  controlledCollections,
  connectedFriendly,
  createGame,
  deployRemaining,
  endPlayerTurn,
  enemyIntelligence,
  factions,
  fortify,
  occupyAfterCapture,
  omenForTurn,
  omens,
  reinforce,
  resolveBattleRound,
  resolveFullAssault,
  startAttackPhase,
  startFortifyPhase,
  totalUnits,
  unitCost,
} from "@/lib/game";

type Screen = "title" | "prologue" | "campaign" | "briefing" | "board";

const SAVE_KEY = "banners-of-caldris-save-v1";
const PROGRESS_KEY = "banners-of-caldris-progress-v1";
const TUTORIAL_KEY = "banners-of-caldris-tutorial-v1";

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
        <dl><div><dt>Campaign objective</dt><dd><b>{selected.objective}</b><small>{selected.objectiveDetail}</small></dd></div><div><dt>Battlefield shape</dt><dd>{selected.terrainProfile}</dd></div><div><dt>Field rule</dt><dd>{selected.ruleName} — {selected.ruleDetail}</dd></div><div><dt>Reward</dt><dd><b>{selected.reward}</b><small>{selected.rewardDetail}</small></dd></div><div><dt>Campaign legacy</dt><dd>{campaignLegacySummary(wins)}</dd></div><div><dt>Threat</dt><dd>{"◆".repeat(Math.ceil(selected.difficulty))}{"◇".repeat(Math.max(0,3-Math.ceil(selected.difficulty)))}</dd></div></dl>
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
          <div className="order-grid"><div><Shield/><span><b>Objective · {stage.objective}</b>{stage.objectiveDetail}</span></div><div><Trophy/><span><b>Reward · {stage.reward}</b>{stage.rewardDetail}</span></div><div><Map/><span><b>Battlefield shape</b>{stage.terrainProfile}</span></div><div><Swords/><span><b>{stage.ruleName}</b>{stage.ruleDetail}</span></div></div>
          <blockquote>“Win their castles if you must. Win their trust if you can. But open the road north.”</blockquote>
          <button className="button gold large wide" onClick={onBegin}>Raise the royal banners <Flag size={18}/></button>
        </article>
      </section>
    </main>
  );
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
  const [armedUnit, setArmedUnit] = useState<UnitType>("infantry");
  const [musterHistory, setMusterHistory] = useState<GameState[]>([]);
  const [attackFromId, setAttackFromId] = useState<string | null>(null);
  const [attackToId, setAttackToId] = useState<string | null>(null);
  const [battleOpen, setBattleOpen] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [fortifyFromId, setFortifyFromId] = useState<string | null>(null);
  const [fortifyUnits, setFortifyUnits] = useState({ infantry: 0, archers: 0, cavalry: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dismissedOmenTurn, setDismissedOmenTurn] = useState(0);
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
  const omen = omens[game.omen] ?? omens.muster;
  const objectiveProgress = useMemo(() => campaignObjectiveProgress(game), [game]);
  const enemyIntents = useMemo(() => enemyIntelligence(game), [game]);
  const movementLimit = stage.rule === "causeways" ? 3 : Number.POSITIVE_INFINITY;
  const selectedCollection = selected ? collections.find(collection => collection.id === selected.collection) : null;
  const selectedCollectionMembers = selected ? game.territories.filter(territory => territory.collection === selected.collection) : [];
  const selectedCollectionHeld = selectedCollectionMembers.filter(territory => territory.owner === "royal").length;
  const selectedCollectionMissing = selectedCollectionMembers.filter(territory => territory.owner !== "royal");
  const musteringOpen = game.phase === "reinforce" && game.reinforcements > 0;
  const quiet = tutorialStep < 0 && !enemyReport && !enemyOverlay && game.phase !== "victory" && game.phase !== "defeat";
  const omenVisible = quiet && game.phase === "reinforce" && dismissedOmenTurn !== game.turn;
  const tutorialSteps = [
    { icon: <Shield/>, label: "Your lands", title: "Blue is yours", copy: "Every blue shield on the table is one of your armies. The number on it is how many companies it holds.", cue: "The bar along the bottom always names the one thing to do next." },
    { icon: <Crown/>, label: "Place armies", title: "Click your own land to place an army", copy: "You start each turn with muster points. Pick a unit in the bottom bar, then click any blue land that is ringed and marked with a +.", cue: "Infantry cost 1 point. Archers and cavalry cost 2." },
    { icon: <Swords/>, label: "Attack", title: "Then take ground", copy: "Click one of your armies, then a red-ringed neighbour to attack it. Chained captures build momentum, which strengthens your next assault.", cue: stage.objective + " — " + stage.objectiveDetail },
  ];
  // Marker props are memoised: a fresh array identity rebuilds all 32 map markers.
  const deployIds = useMemo(() => musteringOpen ? game.territories.filter(territory => territory.owner === "royal").map(territory => territory.id) : [], [game, musteringOpen]);
  const objectiveIds = useMemo(() => detailsOpen ? objectiveProgress.targetIds : [], [detailsOpen, objectiveProgress]);
  const intentIds = useMemo(() => enemyIntents.filter(intent => intent.risk !== "Low").map(intent => intent.toId), [enemyIntents]);
  const targetIds = useMemo(() => {
    // An army worn down to a single company cannot attack: it must leave a guard behind.
    if (game.phase === "attack" && attackFrom && totalUnits(attackFrom.units) > 1) return attackFrom.neighbors.filter(id => game.territories.find(t => t.id === id)?.owner !== "royal");
    if (game.phase === "fortify" && fortifyFromId && !game.fortifiedThisTurn) return game.territories.filter(t => t.owner === "royal" && t.id !== fortifyFromId && connectedFriendly(game, fortifyFromId, t.id, "royal")).map(t => t.id);
    return [];
  }, [game, attackFrom, fortifyFromId]);

  useEffect(() => {
    if (game.preview) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    if (game.phase === "victory") {
      const wins = Math.max(Number(localStorage.getItem(PROGRESS_KEY) ?? 0), game.stage);
      localStorage.setItem(PROGRESS_KEY, String(wins));
      playGameCue("victory", sound);
    }
  }, [game, sound]);

  const placeArmy = (territory: Territory, unit: UnitType) => {
    const next = reinforce(game, territory.id, unit);
    if (next === game) return;
    setMusterHistory(history => [...history.slice(-31), game]);
    setGame(next);
    playGameCue("select", sound);
  };

  const undoPlacement = () => {
    setMusterHistory(history => {
      const previous = history[history.length - 1];
      if (previous) setGame(previous);
      return history.slice(0, -1);
    });
  };

  const selectTerritory = (territory: Territory) => {
    setSelectedId(territory.id);
    setDismissedOmenTurn(game.turn);
    if (game.phase === "reinforce") {
      if (territory.owner === "royal" && game.reinforcements >= unitCost(armedUnit)) placeArmy(territory, armedUnit);
      else playGameCue("select", sound);
      return;
    }
    playGameCue("select", sound);
    if (game.phase === "attack") {
      if (territory.owner === "royal" && totalUnits(territory.units) > 1) {
        setAttackFromId(territory.id); setAttackToId(null); setBattleResult(null);
      } else if (attackFrom && totalUnits(attackFrom.units) > 1 && attackFrom.neighbors.includes(territory.id) && territory.owner !== "royal") {
        setAttackToId(territory.id); setBattleResult(null); setBattleOpen(true);
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
  };

  const doFullBattle = (attackers: UnitType[]) => {
    if (!attackFromId || !attackToId) return;
    const resolved = resolveFullAssault(game, attackFromId, attackToId, attackers);
    if (!resolved) return;
    setGame(resolved.state);
    setBattleResult(resolved.result);
  };

  const confirmOccupation = (units: Units) => {
    setBattleOpen(false);
    setBattleResult(null);
    setAttackToId(null);
    if (!attackFromId || !attackToId) return;
    const occupied = occupyAfterCapture(game, attackFromId, attackToId, units);
    setGame(occupied);
    // Keep a usable spearhead armed: press on from the new holding when it can still
    // attack, otherwise fall back to the territory the assault came from.
    const captured = occupied.territories.find(territory => territory.id === attackToId);
    const source = occupied.territories.find(territory => territory.id === attackFromId);
    const next = captured && totalUnits(captured.units) > 1 ? captured : source && totalUnits(source.units) > 1 ? source : null;
    setAttackFromId(next?.id ?? null);
    setSelectedId(next?.id ?? attackToId);
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
    playGameCue("phase", sound);
    setMusterHistory([]);
    if (game.phase === "reinforce") {
      const spearhead = [...game.territories]
        .filter(territory => territory.owner === "royal" && totalUnits(territory.units) > 1 && territory.neighbors.some(id => game.territories.find(item => item.id === id)?.owner !== "royal"))
        .sort((a, b) => totalUnits(b.units) - totalUnits(a.units))[0];
      setGame(startAttackPhase(game)); setAttackFromId(spearhead?.id ?? null); setSelectedId(spearhead?.id ?? null);
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

  const unitCopy: Record<UnitType, [string, string, string]> = {
    infantry: ["⚔", "Infantry", "1 point"],
    archers: ["➶", "Archers", "2 points"],
    cavalry: ["♞", "Cavalry", "2 points"],
  };

  return (
    <main className="board-screen">
      <ThreeBoard game={game} selectedId={selectedId} targetIds={targetIds} deployIds={deployIds} objectiveIds={objectiveIds} intentIds={intentIds} overlay={mapOverlay} onSelect={selectTerritory} reducedMotion={reducedMotion}/>
      {game.preview ? <div className="preview-ribbon">Practice skirmish · chapter {game.stage}</div> : null}

      <header className="board-topbar">
        <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Menu"><Menu/></button>
        <div className="chapter-block"><small>Chapter {game.stage} · Turn {game.turn}</small><b>{stage.name}</b></div>
        <div className="topbar-spacer"/>
        {game.phase === "reinforce" ? <div className="topbar-stat points"><b>{game.reinforcements}</b><span>muster points</span></div> : null}
        {game.phase === "attack" && game.momentum > 0 ? <div className="topbar-stat momentum"><b>×{game.momentum}</b><span>momentum</span></div> : null}
        <div className="topbar-stat"><b>{game.territories.filter(territory => territory.owner === "royal").length}</b><span>of {game.territories.length} lands</span></div>
        <button className={`details-toggle ${detailsOpen ? "open" : ""}`} aria-pressed={detailsOpen} onClick={() => setDetailsOpen(open => !open)}><Eye size={18}/><span>{detailsOpen ? "Hide detail" : "War room"}</span></button>
      </header>

      {omenVisible ? <aside className={`omen-banner ${omen.tone}`} role="status">
        <span className="omen-glyph">{omen.tone === "good" ? "✦" : "☄"}</span>
        <div><small>Turn {game.turn} omen</small><b>{omen.name}</b><p>{omen.detail}</p></div>
        <button aria-label="Dismiss omen" onClick={() => setDismissedOmenTurn(game.turn)}><X size={18}/></button>
      </aside> : null}

      {detailsOpen ? <aside className="war-room parchment-panel" aria-label="War room detail">
        <header><h2>War room</h2><button className="icon-button" onClick={() => setDetailsOpen(false)} aria-label="Close war room"><X/></button></header>
        <section><h3>Objective</h3><b>{stage.objective}</b><p>{stage.objectiveDetail}</p><div className="war-room-progress"><span>{objectiveProgress.label}</span><span>{royalCollections.length} of 6 regions held</span></div><small>Objective lands are ringed in blue on the table.</small></section>
        <section><h3>Field rule · {stage.ruleName}</h3><p>{stage.ruleDetail}</p></section>
        <section><h3>Scouts predict</h3>{enemyIntents.slice(0, 3).map(intent => {
          const target = game.territories.find(territory => territory.id === intent.toId);
          return <button key={intent.faction} className="scout-line" onClick={() => { setSelectedId(intent.toId); setMapOverlay("threats"); }}><FactionShield faction={intent.faction}/><span><b>{target?.name}</b><small>{intent.reason}</small></span><em className={intent.risk.toLowerCase()}>{intent.risk}</em></button>;
        })}</section>
        <section><h3>Map layers</h3><div className="war-room-layers">{([
          ["routes", <Route key="route"/>, "Roads"],
          ["collections", <Layers3 key="layers"/>, "Regions"],
          ["threats", <AlertTriangle key="alert"/>, "Threats"],
        ] as [MapOverlay, React.ReactNode, string][]).map(([id,icon,label]) => <button key={id} aria-pressed={mapOverlay === id} onClick={() => setMapOverlay(current => current === id ? "none" : id)}>{icon}<span>{label}</span></button>)}</div></section>
        <button className="button steel wide" onClick={() => setRulesOpen(true)}><BookOpen size={16}/> Rules of command</button>
      </aside> : null}

      <aside className="territory-panel">
        {selected ? <>
          <div className="territory-heading" style={{ "--owner": factions[selected.owner].color } as React.CSSProperties}><FactionShield faction={selected.owner}/><div><small>{selected.owner === "royal" ? "Your land" : factions[selected.owner].shortName}</small><h2>{selected.name}</h2></div></div>
          <div className="territory-summary"><span>Army</span><b>{totalUnits(selected.units)}</b></div>
          <div className="unit-tally">
            {(["infantry","archers","cavalry"] as UnitType[]).map(unit => <div key={unit} className="unit-tally-row"><span>{unitCopy[unit][0]}</span><b>{unitCopy[unit][1]}</b><strong>{selected.units[unit]}</strong></div>)}
          </div>
          {game.phase === "reinforce" && selected.owner === "royal" && game.reinforcements > 0 ? <div className="panel-callout deploy"><Crown/><span>Click this land again to station another {unitCopy[armedUnit][1].toLowerCase()} company here.</span></div> : null}
          {selectedCollection ? <div className="collection-progress"><div><span>{selectedCollection.name}</span><b>{selectedCollectionHeld}/{selectedCollectionMembers.length} held · +{selectedCollection.bonus} muster</b></div><div className="collection-track"><i style={{ width: `${selectedCollectionHeld / selectedCollectionMembers.length * 100}%` }}/></div>{selectedCollectionMissing.length ? <small>Still needed: {selectedCollectionMissing.slice(0,3).map(item => item.name).join(", ")}{selectedCollectionMissing.length > 3 ? ` +${selectedCollectionMissing.length - 3} more` : ""}</small> : <small>Region secured. Hold it to keep the bonus.</small>}</div> : null}
          {game.phase === "attack" && selected.owner === "royal" && totalUnits(selected.units) > 1 ? <div className="panel-callout"><Swords/><span>Red rings are legal targets from {selected.name}. One company must stay behind.</span></div> : null}
          {game.phase === "attack" && selected.owner === "royal" && totalUnits(selected.units) === 1 ? <div className="panel-callout"><Shield/><span>A lone company can only hold ground. Attack from a land with two or more.</span></div> : null}
          {game.phase === "fortify" && game.fortifiedThisTurn ? <div className="panel-callout movement-done"><Shield/><span>Movement spent for this turn.</span></div> : null}
          {game.phase === "fortify" && fortifyFrom && selected.owner === "royal" && selected.id !== fortifyFrom.id ? <div className="fortify-picker"><div><span>Move from {fortifyFrom.name}</span><b>{totalUnits(fortifyUnits)} selected</b></div>{(["infantry","archers","cavalry"] as UnitType[]).map(unit => <div className="fortify-unit" key={unit}><span>{unitCopy[unit][1]}</span><button aria-label={`Remove ${unit} from movement`} onClick={() => changeFortifyUnit(unit,-1)}>−</button><b>{fortifyUnits[unit]}</b><button aria-label={`Add ${unit} to movement`} onClick={() => changeFortifyUnit(unit,1)}>+</button></div>)}<button className="button gold wide" disabled={totalUnits(fortifyUnits) < 1} onClick={confirmFortify}><Move size={17}/> Confirm movement</button></div> : null}
          {game.phase === "fortify" && fortifyFrom && selected.id === fortifyFrom.id ? <div className="panel-callout"><Move/><span>Now click a gold-ringed land of yours{Number.isFinite(movementLimit) ? ` (up to ${movementLimit} units)` : ""}.</span></div> : null}
          <div className="connections"><span>Roads from here</span><div>{selected.neighbors.map(id => <button key={id} onClick={() => { const neighbour = game.territories.find(t => t.id === id); if (neighbour) { if (game.phase === "reinforce") setSelectedId(neighbour.id); else selectTerritory(neighbour); } }}>{game.territories.find(t => t.id === id)?.name}</button>)}</div></div>
        </> : <div className="empty-selection"><Shield/><h2>Nothing selected</h2><p>Click a shield on the war table.</p></div>}
      </aside>

      {quiet && game.phase === "reinforce" ? <section className="command-bar muster-bar" aria-label="Muster your armies">
        <div className="command-headline"><small>Step 1 of 3 · Muster</small><b>{musteringOpen ? "Place your armies" : "Every company is placed"}</b><p>{musteringOpen ? <>Click any <em>+</em> marked blue land on the table.</> : "Nothing left to muster. March when the borders look right."}</p></div>
        <div className="muster-units" role="group" aria-label="Unit to place">
          {(["infantry","archers","cavalry"] as UnitType[]).map(unit => <button key={unit} className={`muster-unit ${armedUnit === unit ? "armed" : ""}`} aria-pressed={armedUnit === unit} disabled={game.reinforcements < unitCost(unit)} onClick={() => setArmedUnit(unit)}><span>{unitCopy[unit][0]}</span><b>{unitCopy[unit][1]}</b><small>{unitCopy[unit][2]}</small></button>)}
        </div>
        <div className="muster-points"><b>{game.reinforcements}</b><small>points<br/>left</small></div>
        <div className="muster-actions">
          <button className="minor-action" disabled={!musterHistory.length} onClick={undoPlacement}><RotateCcw size={15}/> Undo</button>
          <button className="minor-action" disabled={game.reinforcements < 1} onClick={() => { setMusterHistory(history => [...history.slice(-31), game]); setGame(deployRemaining(game)); playGameCue("select", sound); }}><Layers3 size={15}/> Place the rest</button>
          <button className={`command-next ${game.reinforcements > 0 ? "deferred" : ""}`} onClick={nextPhase}>{game.reinforcements > 0 ? "Skip to attacks" : "Begin attacks"}<ChevronRight/></button>
        </div>
        {!game.kingsOrder ? <div className="royal-command-strip"><span><Crown size={16}/> Optional royal command</span>{([
          ["levy", "Call the Banners", "+2 points"],
          ["vanguard", "Ride at Dawn", "Reroll your weakest attack die"],
          ["bastion", "Hold the Line", "Reroll your weakest defence die"],
        ] as [KingsOrder,string,string][]).map(([id,name,detail]) => <button key={id} onClick={() => { setGame(chooseKingsOrder(game,id)); playGameCue("phase",sound); }}><b>{name}</b><small>{detail}</small></button>)}</div>
        : <div className="royal-command-strip sealed"><span><Crown size={16}/> Royal command sealed</span><b>{game.kingsOrder === "levy" ? "Call the Banners" : game.kingsOrder === "vanguard" ? "Ride at Dawn" : "Hold the Line"}</b></div>}
      </section> : null}

      {quiet && game.phase === "attack" ? <section className="command-bar attack-bar" aria-label="Attack">
        <div className="command-headline"><small>Step 2 of 3 · Conquer</small><b>{attackFrom && totalUnits(attackFrom.units) > 1 ? `Attacking from ${attackFrom.name}` : attackFrom ? `${attackFrom.name} is spent` : "Choose an army to attack with"}</b><p>{attackFrom && totalUnits(attackFrom.units) > 1 ? "Now click a red-ringed enemy land." : attackFrom ? "Its last company must hold the ground. Click another blue land to attack from." : "Click one of your blue lands holding two or more companies."}</p></div>
        <div className="momentum-meter"><small>Momentum</small><div>{[0,1,2].map(step => <i key={step} className={game.momentum > step ? "lit" : ""}/>)}</div><small>{game.momentum ? "+1 to your best attack die" : "Capture a land to build it"}</small></div>
        <div className="muster-actions"><button className="command-next" onClick={nextPhase}>Finish attacks<ChevronRight/></button></div>
      </section> : null}

      {quiet && game.phase === "fortify" ? <section className="command-bar move-bar" aria-label="Final movement">
        <div className="command-headline"><small>Step 3 of 3 · Move</small><b>{game.fortifiedThisTurn ? "Movement spent" : fortifyFrom ? `Moving out of ${fortifyFrom.name}` : "Move one force, once"}</b><p>{game.fortifiedThisTurn ? "Nothing left to move this turn." : fortifyFrom ? "Click a gold-ringed land to receive them." : "Optional. Click a land to move companies out of it."}</p></div>
        <div className="muster-actions"><button className="command-next" onClick={nextPhase}>End turn<ChevronRight/></button></div>
      </section> : null}

      {enemyOverlay ? <div className="enemy-turn-overlay"><FactionShield faction="wolves" active/><div><small>Enemy turn</small><h2>The rival houses are moving</h2><p>Scouts report marching banners across the realm.</p></div><span className="loading-rune">◆</span></div> : null}
      {enemyReport ? (() => {
        const report = enemyReport.length ? reportPresentation(enemyReport[enemyReportIndex]) : null;
        const isLast = enemyReportIndex >= enemyReport.length - 1;
        return <div className="enemy-report">
          <div className="enemy-report-head"><FactionShield faction={report?.factionId ?? "wolves"} active/><div><p className="eyebrow">Scouts&apos; report · {enemyReport.length ? `${enemyReportIndex + 1} of ${enemyReport.length}` : "all quiet"}</p><h2>{report?.title ?? "The rival houses hold their ground"}</h2></div></div>
          <div className="enemy-report-body"><b>{report ? factions[report.factionId].doctrine : "No border changed hands."}</b><p>{report?.action ?? "No enemy army found a worthwhile attack."}</p><span>{report?.rolls ?? "Your lines remain secure."}</span></div>
          <button className="button blue wide" onClick={() => {
            if (!isLast) focusEnemyReport(enemyReport, enemyReportIndex + 1, game);
            else { setEnemyReport(null); setSelectedId(game.territories.find(territory => territory.owner === "royal")?.id ?? null); }
          }}>{isLast ? `Begin turn ${game.turn}` : "Next enemy action"}<SkipForward/></button>
        </div>;
      })() : null}

      <BattleDialog open={battleOpen} game={game} from={attackFrom} to={attackTo} result={battleResult} kingsOrder={game.kingsOrder} kingsOrderUsed={game.kingsOrderUsed} fieldRule={stage.rule} sound={sound} reducedMotion={reducedMotion} onOpenChange={open => { setBattleOpen(open); if (!open) setBattleResult(null); }} onRoll={doBattle} onResolve={doFullBattle} onReset={() => setBattleResult(null)} onCaptured={confirmOccupation}/>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="settings-dialog parchment-panel text-[#231a10]">
          <DialogHeader><DialogTitle>Campaign menu</DialogTitle><DialogDescription>Preferences are stored on this device.</DialogDescription></DialogHeader>
          <button className="setting-row" onClick={() => setSound(!sound)}>{sound ? <Volume2/> : <VolumeX/>}<span><b>Sound</b><small>{sound ? "Battle cues enabled" : "Muted"}</small></span><strong>{sound ? "On" : "Off"}</strong></button>
          <button className="setting-row" onClick={() => setReducedMotion(!reducedMotion)}><RotateCcw/><span><b>Reduced motion</b><small>Limits camera and ambient movement</small></span><strong>{reducedMotion ? "On" : "Off"}</strong></button>
          <button className="setting-row" onClick={() => { localStorage.removeItem(TUTORIAL_KEY); setSettingsOpen(false); setTutorialStep(0); }}><Target/><span><b>Replay the tutorial</b><small>Three cards covering the whole turn</small></span><ChevronRight/></button>
          <a className="setting-row" href="/progress"><BookOpen/><span><b>Live build progress</b><small>See completed systems and current work</small></span><ChevronRight/></a>
          <button className="setting-row" onClick={() => { setSettingsOpen(false); setRulesOpen(true); }}><Shield/><span><b>Rules of command</b><small>Turn flow, unit costs and battle odds</small></span><ChevronRight/></button>
          <button className="button steel wide" onClick={onCampaign}>Return to campaign map</button>
        </DialogContent>
      </Dialog>

      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="rules-dialog parchment-panel text-[#231a10]">
          <DialogHeader><DialogTitle>Rules of command</DialogTitle><DialogDescription>Everything needed to lead the Royal Lions.</DialogDescription></DialogHeader>
          <div className="rule-list"><article><b>1 · Muster</b><p>Gain at least 3 points each turn: <strong>lands ÷ 3</strong>, rounded down, plus every complete region. Infantry cost 1; archers and cavalry cost 2. Click your own land to place a company there.</p></article><article><b>2 · Conquer</b><p>Attack an adjacent enemy with up to 3 companies, leaving one behind. Defenders roll up to 2 dice and win ties. After a capture, choose how heavily to occupy.</p></article><article><b>3 · Move</b><p>Once per turn, move companies between connected lands of yours, always leaving one guard behind.</p></article><article><b>Momentum</b><p>Every land captured in a turn adds momentum. While it is lit, your strongest attacking die gains +1, and up to 3 points carry into next turn&apos;s muster.</p></article><article><b>Omens</b><p>Each turn opens with an omen that changes the terms of that turn alone — extra points, free sellswords, blessed attacks, or rivals recruiting harder.</p></article><article><b>Royal command</b><p>Optional, once per turn: two extra muster points, a rally of your weakest opening attack die, or a rally of your weakest first defence die.</p></article><article><b>Unit mastery</b><p>Cavalry normally add +1 to their attacking die. Archers normally add +1 to their defending die. The field rule can change both.</p></article><article><b>Current field · {stage.ruleName}</b><p>{stage.ruleDetail}</p></article><article><b>Victory · {stage.objective}</b><p>{stage.objectiveDetail} Reward: {stage.rewardDetail}</p></article></div>
        </DialogContent>
      </Dialog>

      {tutorialStep >= 0 ? <section className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <div className="tutorial-progress">{tutorialSteps.map((_,index) => <i key={index} className={index <= tutorialStep ? "active" : ""}/>)}</div>
        <div className="tutorial-icon">{tutorialSteps[tutorialStep].icon}</div>
        <p className="eyebrow">Field tutorial · {tutorialSteps[tutorialStep].label}</p>
        <h2 id="tutorial-title">{tutorialSteps[tutorialStep].title}</h2>
        <p>{tutorialSteps[tutorialStep].copy}</p>
        <div className="tutorial-cue"><Target/>{tutorialSteps[tutorialStep].cue}</div>
        <div className="tutorial-actions"><button onClick={finishTutorial}>Skip</button><button className="button blue" onClick={() => tutorialStep === tutorialSteps.length - 1 ? finishTutorial() : setTutorialStep(step => step + 1)}>{tutorialStep === tutorialSteps.length - 1 ? "Place my first army" : "Next"}<ChevronRight/></button></div>
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
    try { const saved = JSON.parse(raw) as GameState; setGame({ ...saved, preview: false, fortifiedThisTurn: Boolean(saved.fortifiedThisTurn), kingsOrder: saved.kingsOrder ?? null, kingsOrderUsed: Boolean(saved.kingsOrderUsed), momentum: saved.momentum ?? 0, momentumBonus: saved.momentumBonus ?? 0, omen: saved.omen ?? omenForTurn(saved.stage, saved.turn) }); setSavedStage(saved.stage); setScreen("board"); } catch { localStorage.removeItem(SAVE_KEY); setCanContinue(false); setSavedStage(null); }
  };
  const enterCampaign = () => { const currentWins = Number(localStorage.getItem(PROGRESS_KEY) ?? wins); setWins(currentWins); setSelectedStage(Math.min(12, currentWins + 1)); setScreen("campaign"); };
  const startFreshCampaign = () => { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(PROGRESS_KEY); localStorage.removeItem(TUTORIAL_KEY); setWins(0); setSelectedStage(1); setCanContinue(false); setSavedStage(null); setGame(createGame()); setScreen("prologue"); };
  const beginStage = () => { const next = createGame(selectedStage, wins); localStorage.setItem(SAVE_KEY, JSON.stringify(next)); setCanContinue(true); setSavedStage(selectedStage); setGame(next); setScreen("board"); playGameCue("phase", sound); };
  const previewStage = () => { setGame(createGame(selectedStage, wins, true)); setScreen("board"); playGameCue("phase", sound); };

  if (screen === "title") return <TitleScreen canContinue={canContinue} hasProgress={wins > 0} onNew={startFreshCampaign} onContinue={loadSaved} onAtlas={enterCampaign} sound={sound} setSound={setSound}/>;
  if (screen === "prologue") return <StoryScreen onContinue={enterCampaign} onBack={() => setScreen("title")}/>;
  const activeStage = canContinue ? savedStage : null;
  if (screen === "campaign") return <CampaignScreen wins={wins} selectedStage={selectedStage} activeStage={activeStage} onSelect={setSelectedStage} onBegin={() => setScreen("briefing")} onPreview={previewStage} onResume={loadSaved} onBack={() => setScreen("title")}/>;
  if (screen === "briefing") return <BriefingScreen stage={campaignStages[selectedStage - 1]} onBegin={beginStage} onBack={() => setScreen("campaign")}/>;
  return <BoardScreen game={game} setGame={setGame} sound={sound} setSound={setSound} reducedMotion={reducedMotion} setReducedMotion={setReducedMotion} onCampaign={enterCampaign}/>;
}

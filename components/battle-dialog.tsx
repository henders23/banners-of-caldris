"use client";

/* Battle selection intentionally resets when a new from/to engagement is opened. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Shield, Swords, Flag, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BattleDiorama } from "@/components/battle-diorama";
import type { BattleResult, CampaignRule, FactionId, KingsOrder, Territory, UnitType, Units } from "@/lib/game";
import { factions, totalUnits } from "@/lib/game";

type Props = {
  open: boolean;
  from: Territory | null;
  to: Territory | null;
  result: BattleResult | null;
  reducedMotion?: boolean;
  onOpenChange: (open: boolean) => void;
  onRoll: (attackers: UnitType[]) => void;
  onCaptured: () => void;
  onReset: () => void;
  kingsOrder: KingsOrder | null;
  kingsOrderUsed: boolean;
  fieldRule: CampaignRule;
};

const labels: Record<UnitType, string> = { infantry: "Infantry", archers: "Archers", cavalry: "Cavalry" };
const glyphs: Record<UnitType, string> = { infantry: "⚔", archers: "➶", cavalry: "♞" };

function initialSelection(from: Territory | null): Units {
  if (!from) return { infantry: 0, archers: 0, cavalry: 0 };
  let remaining = Math.min(3, totalUnits(from.units) - 1);
  const next: Units = { infantry: 0, archers: 0, cavalry: 0 };
  for (const unit of ["cavalry", "infantry", "archers"] as UnitType[]) {
    const count = Math.min(from.units[unit], remaining);
    next[unit] = count;
    remaining -= count;
  }
  return next;
}

export function BattleDialog({ open, from, to, result, reducedMotion, onOpenChange, onRoll, onCaptured, onReset, kingsOrder, kingsOrderUsed, fieldRule }: Props) {
  const [selection, setSelection] = useState<Units>(() => initialSelection(from));
  const [rolling, setRolling] = useState(false);
  const [defenderId, setDefenderId] = useState<FactionId>(to?.owner ?? "serpents");
  const [defenderStrength, setDefenderStrength] = useState(to ? totalUnits(to.units) : 0);
  useEffect(() => {
    if (open && !result) {
      setSelection(initialSelection(from));
      setRolling(false);
      if (to) {
        setDefenderId(to.owner);
        setDefenderStrength(totalUnits(to.units));
      }
    }
  }, [open, result, from, to]);
  useEffect(() => { if (result) setRolling(false); }, [result]);
  const selectedCount = totalUnits(selection);
  const attackers = useMemo(() => (Object.keys(selection) as UnitType[]).flatMap(unit => Array.from({ length: selection[unit] }, () => unit)), [selection]);

  if (!from || !to) return null;
  const defender = factions[defenderId];
  const cavalryBonus = fieldRule === "forest" ? 0 : fieldRule === "wolf-charge" ? 2 : 1;
  const archerBonus = fieldRule === "high-ground" ? 2 : 1;
  const change = (unit: UnitType, delta: number) => {
    if (result) return;
    setSelection(current => {
      const next = { ...current };
      const maxForUnit = from.units[unit];
      const nextValue = Math.max(0, Math.min(maxForUnit, next[unit] + delta));
      const nextTotal = totalUnits(next) - next[unit] + nextValue;
      if (nextTotal > 3 || nextTotal >= totalUnits(from.units)) return current;
      next[unit] = nextValue;
      return next;
    });
  };
  const doRoll = () => { if (!selectedCount) return; setRolling(true); window.setTimeout(() => onRoll(attackers), reducedMotion ? 80 : 650); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="battle-dialog max-w-[min(1180px,96vw)] overflow-hidden border-0 bg-[#090b0b] p-0 text-[#f4e7ca] shadow-[0_24px_90px_#000]">
        <DialogHeader className="sr-only">
          <DialogTitle>Battle for {to.name}</DialogTitle>
          <DialogDescription>Choose attacking units and resolve the battle round.</DialogDescription>
        </DialogHeader>
        <div className="battle-stage">
          <BattleDiorama rolling={rolling} result={result} reducedMotion={reducedMotion} enemyColor={defender.color} enemySigil={defender.sigil} enemyName={defender.shortName} />
          <div className="battle-titlebar">
            <div className="battle-side royal-side"><b>{factions.royal.shortName}</b><span>{totalUnits(from.units)} in {from.name}</span></div>
            <div><span className="eyebrow">Battle for</span><h2>{to.name}</h2></div>
            <div className="battle-side enemy-side"><b>{defender.shortName}</b><span>{defenderStrength} defending</span></div>
          </div>
          <div className="battle-controls parchment-panel">
            {!result ? (
              <>
                <div className="battle-ruleline"><Swords size={17} /> Choose up to three attackers <span>{kingsOrder === "vanguard" && !kingsOrderUsed ? "Ride at Dawn · cavalry gain +1 extra" : "Defender wins ties"}</span></div>
                <div className="unit-selectors">
                  {(Object.keys(selection) as UnitType[]).map(unit => (
                    <div className={`unit-selector ${selection[unit] ? "selected" : ""}`} key={unit}>
                      <span className="unit-glyph">{glyphs[unit]}</span>
                      <div><b>{labels[unit]}</b><small>{unit === "cavalry" ? cavalryBonus ? `+${cavalryBonus} attacking here` : "No attack bonus here" : unit === "archers" ? `+${archerBonus} defending here` : "No combat modifier"}</small></div>
                      <button aria-label={`Remove ${labels[unit]}`} onClick={() => change(unit, -1)}><Minus size={15}/></button>
                      <strong>{selection[unit]}</strong>
                      <button aria-label={`Add ${labels[unit]}`} onClick={() => change(unit, 1)}><Plus size={15}/></button>
                    </div>
                  ))}
                </div>
                <div className="battle-actions">
                  <button className="button ghost" onClick={() => onOpenChange(false)}>Retreat</button>
                  <div className="must-leave"><Shield size={15}/> One unit must remain in {from.name}</div>
                  <button className="button gold" disabled={!selectedCount || rolling} onClick={doRoll}>{rolling ? "Rolling…" : `Roll ${selectedCount} ${selectedCount === 1 ? "die" : "dice"}`}</button>
                </div>
              </>
            ) : (
              <>
                <div className="dice-comparisons">
                  {result.comparisons.map((comparison, index) => (
                    <div className="comparison" key={index}>
                      <div className="die attacker-die"><span>{glyphs[comparison.attacker.unit]}</span><b>{comparison.attacker.roll}</b>{comparison.attacker.bonus ? <em>+{comparison.attacker.bonus}</em> : null}</div>
                      <strong className={comparison.loser === "defender" ? "win" : "loss"}>{comparison.attacker.total > comparison.defender.total ? ">" : "≤"}</strong>
                      <div className="die defender-die"><span>{glyphs[comparison.defender.unit]}</span><b>{comparison.defender.roll}</b>{comparison.defender.bonus ? <em>+{comparison.defender.bonus}</em> : null}</div>
                      <p>{comparison.loser === "defender" ? `${defender.shortName} lose ${labels[comparison.defender.unit]}` : `Royal Lions lose ${labels[comparison.attacker.unit]}`}</p>
                    </div>
                  ))}
                </div>
                <div className="battle-outcome">
                  <span>Royal losses <b>{result.attackerLosses.length}</b></span>
                  <strong>{result.captured ? `${to.name} captured` : "The battle continues"}</strong>
                  <span>Enemy losses <b>{result.defenderLosses.length}</b></span>
                </div>
                <div className="battle-actions">
                  {result.captured ? (
                    <button className="button gold wide" onClick={onCaptured}><Flag size={17}/> Return to the war table</button>
                  ) : (
                    <>
                      <button className="button ghost" onClick={() => onOpenChange(false)}>Retreat</button>
                      <button className="button steel" onClick={() => { setSelection(initialSelection(from)); onReset(); }}><RotateCcw size={16}/> Change units</button>
                      <button className="button gold" onClick={() => { setSelection(initialSelection(from)); onReset(); }}>Attack again</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

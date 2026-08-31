import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());
const rules = await vite.ssrLoadModule("/lib/game.ts");

test("creates a connected and symmetric 32-territory campaign", () => {
  const game = rules.createGame(1, 0);
  assert.equal(game.territories.length, 32);
  for (const territory of game.territories) {
    assert.ok(territory.neighbors.length > 0);
    for (const neighbor of territory.neighbors) assert.ok(game.territories.find(item => item.id === neighbor)?.neighbors.includes(territory.id));
  }
});

test("locks one consequential Royal Command per turn", () => {
  const game = rules.createGame(1, 0);
  assert.equal(rules.reinforce(game, "stoneford", "infantry"), game);
  const levy = rules.chooseKingsOrder(game, "levy");
  assert.equal(levy.reinforcements, game.reinforcements + 2);
  assert.equal(rules.chooseKingsOrder(levy, "vanguard"), levy);
});

test("preserves deterministic battle transcripts", () => {
  const ordered = rules.chooseKingsOrder(rules.createGame(1, 0), "vanguard");
  const state = rules.startAttackPhase(ordered);
  const first = rules.resolveBattleRound(state, "stoneford", "crownmarket", ["infantry", "archers"]);
  const second = rules.resolveBattleRound(state, "stoneford", "crownmarket", ["infantry", "archers"]);
  assert.deepEqual(first, second);
  assert.equal(first?.state.kingsOrderUsed, true);
});

test("allows one connected multi-unit final movement", () => {
  const ordered = rules.chooseKingsOrder(rules.createGame(1, 0), "levy");
  const moving = rules.startFortifyPhase(rules.startAttackPhase(ordered));
  const once = rules.fortify(moving, "oldbridge", "high-crag", { infantry: 1, archers: 1, cavalry: 0 });
  assert.equal(once.fortifiedThisTurn, true);
  assert.equal(once.territories.find(item => item.id === "high-crag").units.infantry, moving.territories.find(item => item.id === "high-crag").units.infantry + 1);
  assert.equal(rules.fortify(once, "high-crag", "stoneford", { infantry: 1, archers: 0, cavalry: 0 }), once);
});

test("runs a complete enemy turn and returns a truthful report", () => {
  const ordered = rules.chooseKingsOrder(rules.createGame(1, 0), "bastion");
  const fortify = rules.startFortifyPhase(rules.startAttackPhase(ordered));
  const next = rules.endPlayerTurn(fortify);
  assert.equal(next.turn, 2);
  assert.equal(next.phase, "reinforce");
  assert.equal(next.kingsOrder, null);
  assert.ok(next.log.some(entry => /lost|capture/.test(entry)));
});

test("builds twelve distinct regional deployments", () => {
  const signatures = [];
  const topologySignatures = [];
  for (const stage of rules.campaignStages) {
    const game = rules.createGame(stage.id, Math.max(0, stage.id - 1), true);
    assert.equal(game.territories.length, 32);
    assert.equal(game.preview, true);
    for (const territory of game.territories) for (const neighbor of territory.neighbors) assert.ok(game.territories.find(item => item.id === neighbor)?.neighbors.includes(territory.id));
    const visited = new Set();
    const queue = [game.territories[0].id];
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      game.territories.find(item => item.id === id).neighbors.forEach(neighbor => queue.push(neighbor));
    }
    assert.equal(visited.size, 32);
    signatures.push(game.territories.map(item => `${item.name}:${item.x.toFixed(3)}:${item.y.toFixed(3)}:${item.owner}`).join("|"));
    topologySignatures.push(game.territories.flatMap(item => item.neighbors.filter(neighbor => item.id < neighbor).map(neighbor => `${item.id}:${neighbor}`)).sort().join("|"));
  }
  assert.equal(new Set(signatures).size, 12);
  assert.equal(new Set(topologySignatures).size, 12);
});

test("applies regional field rules to real engine decisions", () => {
  const standard = rules.createGame(1, 0);
  const coast = { ...standard, stage: 2 };
  assert.equal(rules.reinforcementIncome(coast, "royal"), rules.reinforcementIncome(standard, "royal") + 1);

  const causeway = { ...standard, stage: 3, phase: "fortify", fortifiedThisTurn: false };
  const blocked = rules.fortify(causeway, "oldbridge", "high-crag", { infantry: 2, archers: 2, cavalry: 0 });
  assert.equal(blocked, causeway);
});

test("keeps intelligence skirmishes outside campaign progression", () => {
  const preview = rules.createGame(12, 4, true);
  const conquered = { ...preview, territories: preview.territories.map(item => ({ ...item, owner: "royal" })) };
  const outcome = rules.checkOutcome(conquered);
  assert.equal(outcome.phase, "victory");
  assert.equal(outcome.campaignWins, 4);
});

test("carries named chapter rewards into later campaigns", () => {
  const untested = rules.createGame(9, 0, true);
  const veteran = rules.createGame(9, 8, false);
  assert.equal(rules.reinforcementIncome(veteran, "royal"), rules.reinforcementIncome(untested, "royal") + 1);
  const untestedRoyal = untested.territories.filter(item => item.owner === "royal").reduce((sum, item) => sum + rules.totalUnits(item.units), 0);
  const veteranRoyal = veteran.territories.filter(item => item.owner === "royal").reduce((sum, item) => sum + rules.totalUnits(item.units), 0);
  assert.equal(veteranRoyal, untestedRoyal + 7);
});

test("uses distinct campaign objectives instead of conquest every chapter", () => {
  const coast = rules.createGame(2, 1);
  const targets = new Set(rules.campaignStages[1].objectiveTerritories);
  const objectiveState = { ...coast, territories: coast.territories.map(item => targets.has(item.id) ? { ...item, owner: "royal" } : item) };
  assert.ok(objectiveState.territories.some(item => item.owner !== "royal"));
  assert.equal(rules.campaignObjectiveProgress(objectiveState).met, true);
  assert.equal(rules.checkOutcome(objectiveState).phase, "victory");
});

test("resolves a full assault deterministically and reports its rounds", () => {
  const ordered = rules.startAttackPhase(rules.chooseKingsOrder(rules.createGame(1, 0), "vanguard"));
  const first = rules.resolveFullAssault(ordered, "stoneford", "crownmarket", ["cavalry", "infantry"]);
  const second = rules.resolveFullAssault(ordered, "stoneford", "crownmarket", ["cavalry", "infantry"]);
  assert.deepEqual(first, second);
  assert.ok(first?.result.rounds >= 1);
});

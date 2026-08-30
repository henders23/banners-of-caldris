export type FactionId = "royal" | "wolves" | "boars" | "serpents";
export type UnitType = "infantry" | "archers" | "cavalry";
export type Phase = "reinforce" | "attack" | "fortify" | "enemy" | "victory" | "defeat";
export type KingsOrder = "levy" | "vanguard" | "bastion";
export type CampaignRule = "standard" | "riches" | "causeways" | "high-ground" | "forest" | "wolf-charge" | "bridge-tolls" | "frontier" | "winter" | "fractured" | "royal-road" | "citadel";

export type Units = Record<UnitType, number>;

export interface Faction {
  id: FactionId;
  name: string;
  shortName: string;
  color: string;
  metal: string;
  sigil: string;
  motto: string;
  doctrine: string;
}

export interface Collection {
  id: string;
  name: string;
  bonus: number;
  color: string;
}

export interface Territory {
  id: string;
  name: string;
  x: number;
  y: number;
  collection: string;
  neighbors: string[];
  owner: FactionId;
  units: Units;
}

export interface CampaignStage {
  id: number;
  name: string;
  act: string;
  objective: string;
  reward: string;
  briefing: string;
  palette: [string, string];
  difficulty: number;
  rule: CampaignRule;
  ruleName: string;
  ruleDetail: string;
}

export interface BattleDie {
  unit: UnitType;
  roll: number;
  bonus: number;
  total: number;
}

export interface BattleComparison {
  attacker: BattleDie;
  defender: BattleDie;
  loser: "attacker" | "defender";
}

export interface BattleResult {
  attackerDice: BattleDie[];
  defenderDice: BattleDie[];
  comparisons: BattleComparison[];
  attackerLosses: UnitType[];
  defenderLosses: UnitType[];
  captured: boolean;
}

export interface GameState {
  stage: number;
  turn: number;
  phase: Phase;
  activeFaction: FactionId;
  reinforcements: number;
  fortifiedThisTurn: boolean;
  kingsOrder: KingsOrder | null;
  kingsOrderUsed: boolean;
  territories: Territory[];
  campaignWins: number;
  preview: boolean;
  seed: number;
  log: string[];
}

export const factions: Record<FactionId, Faction> = {
  royal: {
    id: "royal",
    name: "House Caerlyn",
    shortName: "Royal Lions",
    color: "#164a84",
    metal: "#e9b84b",
    sigil: "♞",
    motto: "One realm beneath one crown",
    doctrine: "Balanced and adaptable",
  },
  wolves: {
    id: "wolves",
    name: "House Veyr",
    shortName: "Red Wolves",
    color: "#8e231d",
    metal: "#f1ddbd",
    sigil: "◆",
    motto: "The north remembers its blood",
    doctrine: "Aggressive cavalry offensives",
  },
  boars: {
    id: "boars",
    name: "House Brannoc",
    shortName: "Iron Boars",
    color: "#24282b",
    metal: "#c8ced1",
    sigil: "⬢",
    motto: "Iron bends for no king",
    doctrine: "Dense infantry and stubborn defence",
  },
  serpents: {
    id: "serpents",
    name: "House Serevin",
    shortName: "White Serpents",
    color: "#e7dcc5",
    metal: "#9e2d26",
    sigil: "S",
    motto: "Patience claims what steel cannot",
    doctrine: "Archers and opportunistic attacks",
  },
};

export const collections: Collection[] = [
  { id: "north", name: "The Northern March", bonus: 3, color: "#2e79bd" },
  { id: "west", name: "The Western Vale", bonus: 3, color: "#6d9d43" },
  { id: "crown", name: "The Crownlands", bonus: 5, color: "#d2a42f" },
  { id: "east", name: "The Eastern Holds", bonus: 3, color: "#ad4d36" },
  { id: "fens", name: "The Fenlands", bonus: 3, color: "#2b9e9c" },
  { id: "south", name: "The Southern Reach", bonus: 4, color: "#7650a5" },
];

export const campaignStages: CampaignStage[] = [
  { id: 1, name: "The Vale of Stoneford", act: "Act I — Secure the Heartlands", objective: "Unite the Vale", reward: "The King's Favour", briefing: "The royal standard has returned to Stoneford. Break the three rival hosts before they divide the Vale beyond repair.", palette: ["#365a36", "#bc8b46"], difficulty: 1, rule: "standard", ruleName: "Open heartlands", ruleDetail: "No field modifier. Learn the roads, collections and rival doctrines." },
  { id: 2, name: "The Amber Coast", act: "Act I — Secure the Heartlands", objective: "Seize the western ports", reward: "Coastal Muster", briefing: "The Amber League controls the grain fleet. Capture its ports before Crownspire buys their loyalty.", palette: ["#a8782c", "#1d6172"], difficulty: 1.15, rule: "riches", ruleName: "Merchant granaries", ruleDetail: "Every faction gains +1 muster point while the coast remains contested." },
  { id: 3, name: "The Fenward", act: "Act I — Secure the Heartlands", objective: "Open the causeways", reward: "Fen Scouts", briefing: "Marsh wardens hold every dry road. Advance carefully: a narrow victory can leave the army stranded.", palette: ["#315f58", "#73845c"], difficulty: 1.25, rule: "causeways", ruleName: "Narrow causeways", ruleDetail: "Final movement is limited to three units, even across a connected realm." },
  { id: 4, name: "The Ironspine", act: "Act I — Secure the Heartlands", objective: "Break the mountain gates", reward: "Iron Levy", briefing: "House Brannoc and the Cairnborn guard the passes. No road north is open while Ironspine stands.", palette: ["#52585b", "#8a6545"], difficulty: 1.35, rule: "high-ground", ruleName: "High ground", ruleDetail: "Archers gain a second defence bonus in every mountain assault." },
  { id: 5, name: "The Greenwood", act: "Act II — Break the Rival Crowns", objective: "Cross the ancient forest", reward: "Alder Bows", briefing: "The Briar Court has closed the old king's road. Their quarrel is older than Aldren's crown.", palette: ["#214f32", "#758544"], difficulty: 1.45, rule: "forest", ruleName: "Briar canopy", ruleDetail: "Dense forest suppresses cavalry's normal attack bonus." },
  { id: 6, name: "The Red Plains", act: "Act II — Break the Rival Crowns", objective: "Defeat the Red Wolf", reward: "Veteran Cavalry", briefing: "Lady Mara Veyr waits on open ground. She intends to end the march in one decisive charge.", palette: ["#873928", "#aa7c3e"], difficulty: 1.55, rule: "wolf-charge", ruleName: "Open country", ruleDetail: "All cavalry gain a second attack bonus on the open plain." },
  { id: 7, name: "The Lakelands", act: "Act II — Break the Rival Crowns", objective: "Control every crossing", reward: "River Engineers", briefing: "White Serpent banners rise on the islands. Each bridge taken exposes another flank.", palette: ["#2a6981", "#6d7652"], difficulty: 1.65, rule: "bridge-tolls", ruleName: "Bridge tolls", ruleDetail: "Each complete territorial collection is worth +1 additional muster point." },
  { id: 8, name: "The Border March", act: "Act II — Break the Rival Crowns", objective: "Hold the frontier wall", reward: "Marcher Guard", briefing: "Vane's agents have opened the frontier. Take the forts before the northern host arrives.", palette: ["#4f4a3d", "#9b6a35"], difficulty: 1.75, rule: "frontier", ruleName: "Frontier alarm", ruleDetail: "Every rival house receives +1 muster point each enemy turn." },
  { id: 9, name: "The Frostlands", act: "Act III — Reclaim the Kingdom", objective: "Survive the winter war", reward: "Winter Supply", briefing: "Snow closes behind the army. Victory must come before the last stores are gone.", palette: ["#a9bdc6", "#3c5665"], difficulty: 1.9, rule: "winter", ruleName: "Last stores", ruleDetail: "Every faction loses 1 muster point, though the minimum remains three." },
  { id: 10, name: "The Broken Duchies", act: "Act III — Reclaim the Kingdom", objective: "Unseat the rival dukes", reward: "Ducal Levies", briefing: "Five ruined courts claim the same inheritance. Their war has no front and no rules.", palette: ["#51463d", "#7e332b"], difficulty: 2.05, rule: "fractured", ruleName: "Endless claimants", ruleDetail: "The minimum muster rises to four for every surviving house." },
  { id: 11, name: "The King's Road", act: "Act III — Reclaim the Kingdom", objective: "Open the road to Crownspire", reward: "Royal Vanguard", briefing: "The capital is visible beyond the forts. Vane has placed his finest army across the road.", palette: ["#5d5142", "#b28b3e"], difficulty: 2.2, rule: "royal-road", ruleName: "The royal road", ruleDetail: "The Royal Lions gain +1 muster point while their roadward banners survive." },
  { id: 12, name: "Crownspire", act: "Act III — Reclaim the Kingdom", objective: "Take the Black Crown", reward: "The Realm Restored", briefing: "Cassian Vane waits within the royal citadel. Every oath and casualty has led to this final field.", palette: ["#25252d", "#8b332b"], difficulty: 2.4, rule: "citadel", ruleName: "The Black Citadel", ruleDetail: "Rival garrisons begin reinforced and receive +2 muster points each turn." },
];

const nodes: Array<[string, string, number, number, string]> = [
  ["northwatch", "Northwatch", .11, .12, "north"], ["frostgate", "Frostgate", .25, .19, "north"], ["elderwood", "Elderwood", .36, .13, "north"], ["high-crag", "High Crag", .50, .17, "north"], ["greyfen", "Greyfen", .64, .14, "north"], ["iron-pass", "Iron Pass", .82, .13, "east"],
  ["high-meadow", "High Meadow", .11, .27, "west"], ["oakridge", "Oakridge", .26, .33, "west"], ["kings-crossing", "King's Crossing", .59, .29, "crown"], ["ravens-gate", "Raven's Gate", .76, .29, "east"], ["wolfcrag", "Wolfcrag", .89, .30, "east"],
  ["abbey-fields", "Abbey Fields", .12, .45, "west"], ["stoneford", "Stoneford", .47, .42, "crown"], ["redwater", "Redwater", .62, .43, "crown"], ["thornkeep", "Thornkeep", .76, .41, "east"], ["eastmere", "Eastmere", .89, .43, "east"],
  ["millhaven", "Millhaven", .26, .52, "west"], ["willowbank", "Willowbank", .38, .59, "west"], ["crownmarket", "Crownmarket", .57, .54, "crown"], ["willow-marsh", "Willow Marsh", .71, .55, "fens"], ["blackfen", "Blackfen", .89, .57, "fens"],
  ["seawatch", "Seawatch", .12, .70, "south"], ["bellmoor", "Bellmoor", .44, .68, "crown"], ["oldbridge", "Oldbridge", .61, .68, "crown"], ["mirewatch", "Mirewatch", .78, .69, "fens"], ["reedwater", "Reedwater", .91, .73, "fens"],
  ["crows-rest", "Crow's Rest", .31, .80, "south"], ["southgate", "Southgate", .51, .82, "south"], ["ashbridge", "Ashbridge", .69, .82, "south"], ["whitecliff", "Whitecliff", .27, .92, "south"], ["lowmarket", "Lowmarket", .56, .94, "south"], ["mereham", "Mereham", .88, .92, "fens"],
];

const edges: Array<[string, string]> = [
  ["northwatch","frostgate"],["northwatch","high-meadow"],["frostgate","elderwood"],["frostgate","high-meadow"],["frostgate","oakridge"],["elderwood","high-crag"],["elderwood","oakridge"],["elderwood","stoneford"],["high-crag","greyfen"],["high-crag","stoneford"],["high-crag","kings-crossing"],["greyfen","iron-pass"],["greyfen","kings-crossing"],["greyfen","ravens-gate"],["iron-pass","ravens-gate"],["iron-pass","wolfcrag"],
  ["high-meadow","oakridge"],["high-meadow","abbey-fields"],["oakridge","abbey-fields"],["oakridge","millhaven"],["abbey-fields","millhaven"],["abbey-fields","seawatch"],["millhaven","willowbank"],["millhaven","seawatch"],["millhaven","crows-rest"],
  ["kings-crossing","stoneford"],["kings-crossing","redwater"],["kings-crossing","ravens-gate"],["ravens-gate","wolfcrag"],["ravens-gate","thornkeep"],["wolfcrag","eastmere"],
  ["stoneford","redwater"],["stoneford","crownmarket"],["stoneford","willowbank"],["redwater","thornkeep"],["redwater","crownmarket"],["redwater","willow-marsh"],["thornkeep","eastmere"],["thornkeep","willow-marsh"],["eastmere","blackfen"],
  ["willowbank","crownmarket"],["willowbank","bellmoor"],["willowbank","crows-rest"],["crownmarket","willow-marsh"],["crownmarket","bellmoor"],["crownmarket","oldbridge"],["willow-marsh","blackfen"],["willow-marsh","mirewatch"],["willow-marsh","oldbridge"],["blackfen","reedwater"],
  ["seawatch","crows-rest"],["bellmoor","oldbridge"],["bellmoor","southgate"],["bellmoor","crows-rest"],["oldbridge","mirewatch"],["oldbridge","southgate"],["oldbridge","ashbridge"],["mirewatch","reedwater"],["mirewatch","mereham"],["mirewatch","ashbridge"],["reedwater","mereham"],
  ["crows-rest","whitecliff"],["crows-rest","southgate"],["southgate","lowmarket"],["southgate","ashbridge"],["ashbridge","lowmarket"],["ashbridge","mereham"],["whitecliff","lowmarket"],["lowmarket","mereham"],
];

const ownership: Record<FactionId, string[]> = {
  royal: ["stoneford","kings-crossing","redwater","bellmoor","oldbridge","high-crag","willowbank","southgate"],
  wolves: ["iron-pass","ravens-gate","wolfcrag","thornkeep","greyfen","willow-marsh","blackfen","mirewatch"],
  boars: ["northwatch","frostgate","elderwood","high-meadow","oakridge","abbey-fields","millhaven","seawatch"],
  serpents: ["eastmere","crownmarket","reedwater","mereham","crows-rest","whitecliff","lowmarket","ashbridge"],
};

const regionalEpithets: Record<number, string[]> = {
  2: ["Amber", "Saltwind", "Gull", "Tide", "Saffron", "Mariner", "Sunken", "Goldwater"],
  3: ["Reed", "Mire", "Heron", "Drowned", "Fen", "Rush", "Blackwater", "Eel"],
  4: ["Iron", "Cairn", "Granite", "Anvil", "High", "Slate", "Deep", "Hammer"],
  5: ["Alder", "Briar", "Green", "Oak", "Hart", "Thorn", "Moss", "Wych"],
  6: ["Red", "Wolf", "Blood", "Rider", "Ember", "Spear", "Dust", "Mara's"],
  7: ["Lake", "Heron", "Blue", "Island", "Ferry", "Silver", "Reed", "Swan"],
  8: ["Marcher", "Vigil", "Beacon", "Wall", "Border", "Sentinel", "Outer", "Vane's"],
  9: ["Frost", "Snow", "Rime", "Winter", "Ice", "White", "Pine", "Cold"],
  10: ["Broken", "Ducal", "Ruin", "Ash", "Orphan", "Fivecourt", "Shattered", "Hollow"],
  11: ["Royal", "Lion", "Crownward", "Banner", "King's", "Aldren's", "Last", "Golden"],
  12: ["Black", "Vane", "Crown", "Citadel", "Traitor's", "Gallows", "Obsidian", "Final"],
};

const regionalFeatures = [
  "Watch", "Gate", "Hollow", "Crag", "Fen", "Pass", "Meadow", "Ridge",
  "Crossing", "Roost", "Tor", "Fields", "Ford", "Water", "Keep", "Mere",
  "Haven", "Bank", "Market", "Marsh", "Mire", "Beacon", "Moor", "Bridge",
  "Weir", "Reach", "Rest", "Stairs", "Causeway", "Cliff", "Yard", "Hamlet",
];

function regionalName(stage: number, index: number, baseName: string): string {
  if (stage === 1) return baseName;
  const epithets = regionalEpithets[stage] ?? regionalEpithets[12];
  return `${epithets[(index * 3 + Math.floor(index / 8)) % epithets.length]} ${regionalFeatures[index]}`;
}

function regionalPosition(stage: number, index: number, x: number, y: number): [number, number] {
  if (stage === 1) return [x, y];
  const stretchX = .9 + (stage % 3) * .045;
  const stretchY = .9 + ((stage + 1) % 3) * .04;
  const nextX = .5 + (x - .5) * stretchX + Math.sin(index * 1.73 + stage * .91) * .022;
  const nextY = .5 + (y - .5) * stretchY + Math.cos(index * 1.37 + stage * .77) * .02;
  return [Math.max(.07, Math.min(.93, nextX)), Math.max(.08, Math.min(.94, nextY))];
}

function buildRegionalEdges(stage: number, points: Array<{ id: string; x: number; y: number }>): Array<[string, string]> {
  if (stage === 1) return edges;
  const riverY = .4 + (stage % 5) * .035;
  const passages = [(.13 * stage) % .72 + .12, (.31 * stage) % .72 + .14];
  const key = (a: string, b: string) => a < b ? `${a}|${b}` : `${b}|${a}`;
  const weight = (a: typeof points[number], b: typeof points[number]) => {
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    const crossesRiver = (a.y < riverY && b.y > riverY) || (b.y < riverY && a.y > riverY);
    const crossingX = (a.x + b.x) / 2;
    const nearPassage = passages.some(passage => Math.abs(passage - crossingX) < .09);
    const barrier = crossesRiver && !nearPassage ? .28 : 0;
    const mountainBand = stage % 3 === 1 && ((a.x < .54 && b.x > .54) || (b.x < .54 && a.x > .54)) ? .09 : 0;
    return distance + barrier + mountainBand;
  };
  const candidates: Array<{ a: typeof points[number]; b: typeof points[number]; weight: number }> = [];
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) candidates.push({ a: points[i], b: points[j], weight: weight(points[i], points[j]) });
  candidates.sort((left, right) => left.weight - right.weight || key(left.a.id, left.b.id).localeCompare(key(right.a.id, right.b.id)));

  const chosen = new Map<string, [string, string]>();
  const connected = new Set([points[0].id]);
  while (connected.size < points.length) {
    const bridge = candidates.find(edge => connected.has(edge.a.id) !== connected.has(edge.b.id));
    if (!bridge) break;
    chosen.set(key(bridge.a.id, bridge.b.id), [bridge.a.id, bridge.b.id]);
    connected.add(bridge.a.id); connected.add(bridge.b.id);
  }
  const degree = (id: string) => [...chosen.values()].filter(([a, b]) => a === id || b === id).length;
  const targetEdges = 50 + (stage % 6) * 2;
  for (const edge of candidates) {
    if (chosen.size >= targetEdges) break;
    if (chosen.has(key(edge.a.id, edge.b.id)) || degree(edge.a.id) >= 5 || degree(edge.b.id) >= 5) continue;
    if (edge.weight > .31 + (stage % 3) * .018 && degree(edge.a.id) >= 2 && degree(edge.b.id) >= 2) continue;
    chosen.set(key(edge.a.id, edge.b.id), [edge.a.id, edge.b.id]);
  }
  for (const point of points) {
    if (degree(point.id) >= 2) continue;
    const neighbor = candidates.find(edge => (edge.a.id === point.id || edge.b.id === point.id) && !chosen.has(key(edge.a.id, edge.b.id)));
    if (neighbor) chosen.set(key(neighbor.a.id, neighbor.b.id), [neighbor.a.id, neighbor.b.id]);
  }
  return [...chosen.values()];
}

const unitTypeOrder: UnitType[] = ["infantry", "archers", "cavalry"];

function startingUnits(index: number, faction: FactionId, difficulty: number, stage: number): Units {
  const base = 3 + (index % 3);
  const enemyBoost = faction === "royal" ? 0 : Math.floor((difficulty - 1) * 2) + (stage === 12 ? 1 : 0);
  return { infantry: Math.max(1, base - 2 + enemyBoost), archers: 1 + (index % 2), cavalry: index % 4 === 0 ? 1 : 0 };
}

export function createGame(stage = 1, campaignWins = 0, preview = false): GameState {
  const difficulty = campaignStages[stage - 1]?.difficulty ?? 1;
  const baseOwners = nodes.map(([id]) => (Object.entries(ownership).find(([, ids]) => ids.includes(id))?.[0] ?? "royal") as FactionId);
  const ownerShift = stage === 1 ? 0 : ((stage - 1) * 5) % nodes.length;
  const regionalNodes = nodes.map(([id, name, x, y, collection], index) => {
    const owner = baseOwners[(index + ownerShift) % baseOwners.length];
    const [regionalX, regionalY] = regionalPosition(stage, index, x, y);
    return { id, name: regionalName(stage, index, name), x: regionalX, y: regionalY, collection, owner, units: startingUnits(index, owner, difficulty, stage) };
  });
  const royalStronghold = regionalNodes.find(node => node.owner === "royal");
  if (royalStronghold) {
    const veteranUnits = Math.floor(campaignWins / 2);
    for (let index = 0; index < veteranUnits; index++) royalStronghold.units[unitTypeOrder[index % unitTypeOrder.length]] += 1;
  }
  const regionalEdges = buildRegionalEdges(stage, regionalNodes);
  const territories: Territory[] = regionalNodes.map(node => ({ ...node, neighbors: regionalEdges.filter(([a,b]) => a === node.id || b === node.id).map(([a,b]) => a === node.id ? b : a) }));
  const legacy = campaignWins ? ` ${Math.floor(campaignWins / 2)} veteran units and +${Math.floor(campaignWins / 4)} muster arrive from earlier victories.` : "";
  const state: GameState = { stage, turn: 1, phase: "reinforce", activeFaction: "royal", reinforcements: 0, fortifiedThisTurn: false, kingsOrder: null, kingsOrderUsed: false, territories, campaignWins, preview, seed: 1069 + stage * 97, log: [`${campaignStages[stage - 1]?.ruleName ?? "Royal banners"}: ${campaignStages[stage - 1]?.ruleDetail ?? "The campaign begins."}${legacy}`] };
  state.reinforcements = reinforcementIncome(state, "royal");
  return state;
}

export function totalUnits(units: Units): number {
  return units.infantry + units.archers + units.cavalry;
}

export function cloneGame(state: GameState): GameState {
  return { ...state, territories: state.territories.map(t => ({ ...t, neighbors: [...t.neighbors], units: { ...t.units } })), log: [...state.log] };
}

export function controlledCollections(state: GameState, faction: FactionId): Collection[] {
  return collections.filter(c => {
    const members = state.territories.filter(t => t.collection === c.id);
    return members.length > 0 && members.every(t => t.owner === faction);
  });
}

export function reinforcementIncome(state: GameState, faction: FactionId): number {
  const territories = state.territories.filter(t => t.owner === faction).length;
  const stage = campaignStages[state.stage - 1];
  const minimum = stage?.rule === "fractured" ? 4 : 3;
  const base = Math.max(minimum, Math.floor(territories / 3));
  const held = controlledCollections(state, faction);
  let income = base + held.reduce((sum, c) => sum + c.bonus, 0);
  if (stage?.rule === "riches") income += 1;
  if (stage?.rule === "bridge-tolls") income += held.length;
  if (stage?.rule === "frontier" && faction !== "royal") income += 1;
  if (stage?.rule === "winter") income = Math.max(3, income - 1);
  if (stage?.rule === "royal-road" && faction === "royal") income += 1;
  if (stage?.rule === "citadel" && faction !== "royal") income += 2;
  if (faction === "royal") income += Math.floor(state.campaignWins / 4);
  return income;
}

export function unitCost(unit: UnitType): number {
  return unit === "infantry" ? 1 : 2;
}

export function chooseKingsOrder(state: GameState, order: KingsOrder): GameState {
  if (state.phase !== "reinforce" || state.kingsOrder) return state;
  const names: Record<KingsOrder, string> = { levy: "Call the Banners", vanguard: "Ride at Dawn", bastion: "Hold the Line" };
  return {
    ...state,
    kingsOrder: order,
    kingsOrderUsed: order === "levy",
    reinforcements: state.reinforcements + (order === "levy" ? 2 : 0),
    log: [`King's Order — ${names[order]}${order === "levy" ? ": 2 additional muster points." : "."}`, ...state.log],
  };
}

export function reinforce(state: GameState, territoryId: string, unit: UnitType): GameState {
  const next = cloneGame(state);
  const territory = next.territories.find(t => t.id === territoryId);
  const cost = unitCost(unit);
  if (!territory || territory.owner !== "royal" || next.phase !== "reinforce" || !next.kingsOrder || next.reinforcements < cost) return state;
  territory.units[unit] += 1;
  next.reinforcements -= cost;
  next.log.unshift(`${unit[0].toUpperCase() + unit.slice(1)} mustered at ${territory.name}.`);
  return next;
}

function nextRandom(state: GameState): [number, number] {
  let x = state.seed | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return [Math.abs(x % 100000) / 100000, x];
}

function diceFor(state: GameState, units: UnitType[], side: "attack" | "defend", royalOrderApplies = false): [BattleDie[], number] {
  let seed = state.seed;
  const fieldRule = campaignStages[state.stage - 1]?.rule;
  const dice = units.map(unit => {
    const [r, nextSeed] = nextRandom({ ...state, seed });
    seed = nextSeed;
    const roll = 1 + Math.floor(r * 6);
    let roleBonus = side === "attack" && unit === "cavalry" ? 1 : side === "defend" && unit === "archers" ? 1 : 0;
    if (fieldRule === "forest" && side === "attack" && unit === "cavalry") roleBonus = 0;
    if (fieldRule === "wolf-charge" && side === "attack" && unit === "cavalry") roleBonus += 1;
    if (fieldRule === "high-ground" && side === "defend" && unit === "archers") roleBonus += 1;
    const bonus = roleBonus + (royalOrderApplies && side === "attack" && unit === "cavalry" && state.kingsOrder === "vanguard" && !state.kingsOrderUsed ? 1 : 0);
    return { unit, roll, bonus, total: roll + bonus };
  }).sort((a,b) => b.total - a.total);
  return [dice, seed];
}

function chooseDefenders(units: Units): UnitType[] {
  const result: UnitType[] = [];
  const priority: UnitType[] = ["archers", "infantry", "cavalry"];
  for (const unit of priority) for (let i = 0; i < units[unit] && result.length < 2; i++) result.push(unit);
  return result;
}

export function resolveBattleRound(state: GameState, fromId: string, toId: string, attackers: UnitType[]): { state: GameState; result: BattleResult } | null {
  const next = cloneGame(state);
  const from = next.territories.find(t => t.id === fromId);
  const to = next.territories.find(t => t.id === toId);
  if (!from || !to || from.owner !== "royal" || to.owner === "royal" || !from.neighbors.includes(toId) || attackers.length < 1 || attackers.length > 3 || totalUnits(from.units) <= attackers.length) return null;
  const counts: Units = { infantry: 0, archers: 0, cavalry: 0 };
  attackers.forEach(unit => counts[unit]++);
  if (unitTypeOrder.some(unit => counts[unit] > from.units[unit])) return null;
  const defenders = chooseDefenders(to.units);
  const [attackerDice, seedA] = diceFor(next, attackers, "attack", true);
  const [defenderDice, seedB] = diceFor({ ...next, seed: seedA }, defenders, "defend");
  next.seed = seedB;
  if (next.kingsOrder === "vanguard" && !next.kingsOrderUsed) {
    next.kingsOrderUsed = true;
    next.log.unshift("Ride at Dawn is spent in the opening clash.");
  }
  const comparisons: BattleComparison[] = [];
  const attackerLosses: UnitType[] = [];
  const defenderLosses: UnitType[] = [];
  for (let i = 0; i < Math.min(attackerDice.length, defenderDice.length); i++) {
    const loser = attackerDice[i].total > defenderDice[i].total ? "defender" : "attacker";
    comparisons.push({ attacker: attackerDice[i], defender: defenderDice[i], loser });
    if (loser === "attacker") attackerLosses.push(attackerDice[i].unit); else defenderLosses.push(defenderDice[i].unit);
  }
  attackerLosses.forEach(unit => from.units[unit]--);
  defenderLosses.forEach(unit => to.units[unit]--);
  const captured = totalUnits(to.units) === 0;
  if (captured) {
    const survivors: Units = { infantry: 0, archers: 0, cavalry: 0 };
    attackers.forEach(unit => survivors[unit]++);
    attackerLosses.forEach(unit => survivors[unit]--);
    let moved = 0;
    unitTypeOrder.forEach(unit => {
      const move = Math.min(survivors[unit], Math.max(0, from.units[unit] - (moved === 0 ? 0 : 0)));
      if (move > 0) { from.units[unit] -= move; to.units[unit] += move; moved += move; }
    });
    if (moved === 0) {
      const fallback = unitTypeOrder.find(unit => from.units[unit] > 1) ?? unitTypeOrder.find(unit => from.units[unit] > 0);
      if (fallback) { from.units[fallback]--; to.units[fallback]++; }
    }
    to.owner = "royal";
    next.log.unshift(`${to.name} has fallen to the Royal Lions.`);
  } else {
    next.log.unshift(`${from.name} attacks ${to.name}: ${attackerLosses.length} royal and ${defenderLosses.length} enemy losses.`);
  }
  const result = { attackerDice, defenderDice, comparisons, attackerLosses, defenderLosses, captured };
  return { state: checkOutcome(next), result };
}

export function startAttackPhase(state: GameState): GameState {
  if (state.phase !== "reinforce" || !state.kingsOrder) return state;
  return { ...state, phase: "attack", reinforcements: 0, log: ["The Royal Army advances.", ...state.log] };
}

export function startFortifyPhase(state: GameState): GameState {
  if (state.phase !== "attack") return state;
  return { ...state, phase: "fortify", log: ["The army prepares its final movement.", ...state.log] };
}

export function fortify(state: GameState, fromId: string, toId: string, units: Units): GameState {
  const next = cloneGame(state);
  const from = next.territories.find(t => t.id === fromId);
  const to = next.territories.find(t => t.id === toId);
  if (next.phase !== "fortify" || next.fortifiedThisTurn || !from || !to || from.owner !== "royal" || to.owner !== "royal" || !connectedFriendly(next, fromId, toId, "royal")) return state;
  const moving = totalUnits(units);
  const movementLimit = campaignStages[next.stage - 1]?.rule === "causeways" ? 3 : Number.POSITIVE_INFINITY;
  if (moving < 1 || moving > movementLimit || moving >= totalUnits(from.units) || unitTypeOrder.some(u => units[u] > from.units[u])) return state;
  unitTypeOrder.forEach(u => { from.units[u] -= units[u]; to.units[u] += units[u]; });
  next.fortifiedThisTurn = true;
  next.log.unshift(`${moving} ${moving === 1 ? "unit moves" : "units move"} from ${from.name} to ${to.name}.`);
  return next;
}

export function connectedFriendly(state: GameState, fromId: string, toId: string, faction: FactionId): boolean {
  const visited = new Set<string>();
  const queue = [fromId];
  while (queue.length) {
    const id = queue.shift()!;
    if (id === toId) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    const territory = state.territories.find(t => t.id === id);
    territory?.neighbors.forEach(n => {
      const next = state.territories.find(t => t.id === n);
      if (next?.owner === faction && !visited.has(n)) queue.push(n);
    });
  }
  return false;
}

function addUnitToStronghold(state: GameState, faction: FactionId, points: number): void {
  const borders = state.territories.filter(t => t.owner === faction && t.neighbors.some(n => state.territories.find(x => x.id === n)?.owner !== faction));
  const target = [...borders].sort((a,b) => totalUnits(b.units) - totalUnits(a.units))[0] ?? state.territories.find(t => t.owner === faction);
  if (!target) return;
  while (points > 0) {
    if (points >= 2 && target.units.cavalry < 2) { target.units.cavalry++; points -= 2; }
    else { target.units.infantry++; points--; }
  }
}

function aiAttackOnce(state: GameState, faction: FactionId): GameState {
  const next = cloneGame(state);
  const options = next.territories.flatMap(from => {
    if (from.owner !== faction || totalUnits(from.units) < 3) return [];
    return from.neighbors.map(id => next.territories.find(t => t.id === id)!).filter(Boolean).filter(to => to.owner !== faction).map(to => ({ from, to, edge: totalUnits(from.units) - totalUnits(to.units) }));
  }).sort((a,b) => b.edge - a.edge);
  const option = options[0];
  if (!option || option.edge < 0) return next;
  const attackers = chooseAttackers(option.from.units);
  const defenders = chooseDefenders(option.to.units);
  const [ad, sa] = diceFor(next, attackers, "attack");
  const defenseRoll = diceFor({ ...next, seed: sa }, defenders, "defend");
  let dd = defenseRoll[0];
  const sb = defenseRoll[1];
  if (option.to.owner === "royal" && next.kingsOrder === "bastion" && !next.kingsOrderUsed) {
    dd = dd.map(die => die.unit === "archers" ? { ...die, bonus: die.bonus + 1, total: die.total + 1 } : die).sort((a,b) => b.total - a.total);
    next.kingsOrderUsed = true;
    next.log.unshift("Hold the Line is spent against the first enemy assault.");
  }
  next.seed = sb;
  let attackerLosses = 0;
  let defenderLosses = 0;
  for (let i=0;i<Math.min(ad.length,dd.length);i++) {
    if (ad[i].total > dd[i].total) { option.to.units[dd[i].unit]--; defenderLosses++; }
    else { option.from.units[ad[i].unit]--; attackerLosses++; }
  }
  const defenderName = factions[option.to.owner].shortName;
  const showRoll = (die: BattleDie) => die.bonus ? `${die.roll}+${die.bonus}` : String(die.roll);
  const rollSummary = `${ad.map(showRoll).join(" · ")} vs ${dd.map(showRoll).join(" · ")}`;
  if (totalUnits(option.to.units) === 0) {
    const unit = attackers.find(u => option.from.units[u] > 1) ?? unitTypeOrder.find(u => option.from.units[u] > 1);
    if (unit) { option.from.units[unit]--; option.to.units[unit]++; option.to.owner = faction; }
    next.log.unshift(`${factions[faction].shortName} march from ${option.from.name} and capture ${option.to.name} from ${defenderName} · rolls ${rollSummary} · ${attackerLosses} lost, ${defenderLosses} defeated.`);
  } else next.log.unshift(`${factions[faction].shortName} strike ${option.to.name} from ${option.from.name} · rolls ${rollSummary} · ${attackerLosses} lost, ${defenderName} lose ${defenderLosses}.`);
  return checkOutcome(next);
}

function chooseAttackers(units: Units): UnitType[] {
  const result: UnitType[] = [];
  const priority: UnitType[] = ["cavalry", "infantry", "archers"];
  for (const unit of priority) for (let i=0;i<units[unit] && result.length<Math.min(3,totalUnits(units)-1);i++) result.push(unit);
  return result;
}

export function runEnemyTurn(state: GameState): GameState {
  let next = cloneGame({ ...state, phase: "enemy" });
  for (const faction of ["wolves","boars","serpents"] as FactionId[]) {
    if (!next.territories.some(t => t.owner === faction)) continue;
    addUnitToStronghold(next, faction, reinforcementIncome(next, faction));
    const attacks = Math.min(3, 1 + Math.floor(campaignStages[next.stage - 1].difficulty));
    for (let i=0;i<attacks;i++) next = aiAttackOnce(next, faction);
    next = checkOutcome(next);
    if (next.phase === "defeat") return next;
  }
  next.turn++;
  next.activeFaction = "royal";
  next.phase = "reinforce";
  next.fortifiedThisTurn = false;
  next.kingsOrder = null;
  next.kingsOrderUsed = false;
  next.reinforcements = reinforcementIncome(next, "royal");
  next.log.unshift(`Turn ${next.turn}: ${next.reinforcements} reinforcement points available.`);
  return checkOutcome(next);
}

export function endPlayerTurn(state: GameState): GameState {
  if (state.phase !== "fortify") return state;
  return runEnemyTurn(state);
}

export function checkOutcome(state: GameState): GameState {
  const royal = state.territories.filter(t => t.owner === "royal").length;
  if (royal === state.territories.length) return { ...state, phase: "victory", campaignWins: state.preview ? state.campaignWins : Math.max(state.campaignWins, state.stage) };
  if (royal === 0) return { ...state, phase: "defeat" };
  return state;
}

export function factionTerritoryCount(state: GameState, faction: FactionId): number {
  return state.territories.filter(t => t.owner === faction).length;
}

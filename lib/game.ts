export type FactionId = "royal" | "wolves" | "boars" | "serpents";
export type UnitType = "infantry" | "archers" | "cavalry";
export type Phase = "reinforce" | "attack" | "fortify" | "enemy" | "victory" | "defeat";
export type KingsOrder = "levy" | "vanguard" | "bastion";
export type CampaignRule = "standard" | "riches" | "causeways" | "high-ground" | "forest" | "wolf-charge" | "bridge-tolls" | "frontier" | "winter" | "fractured" | "royal-road" | "citadel";
export type VictoryKind = "conquest" | "territories" | "collections" | "eliminate-wolves" | "survive" | "eliminate-two";
export type OmenId = "muster" | "harvest" | "mercenaries" | "zeal" | "vigil" | "storm" | "unrest";

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
  objectiveDetail: string;
  victoryKind: VictoryKind;
  objectiveTerritories?: string[];
  objectiveCollections?: string[];
  targetTurn?: number;
  reward: string;
  rewardDetail: string;
  briefing: string;
  palette: [string, string];
  difficulty: number;
  rule: CampaignRule;
  ruleName: string;
  ruleDetail: string;
  terrainProfile: string;
}

export interface BattleDie {
  unit: UnitType;
  roll: number;
  bonus: number;
  total: number;
  rerolledFrom?: number;
}

export interface BattleForecast {
  captureChance: number;
  expectedAttackerLosses: number;
  expectedDefenderLosses: number;
  verdict: "Favoured" | "Contested" | "Desperate";
}

export interface EnemyIntent {
  faction: FactionId;
  fromId: string;
  toId: string;
  score: number;
  risk: "High" | "Watch" | "Low";
  reason: string;
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
  rounds?: number;
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
  momentum: number;
  momentumBonus: number;
  omen: OmenId;
  log: string[];
}

export interface Omen {
  id: OmenId;
  name: string;
  detail: string;
  tone: "good" | "hard";
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

export const omens: Record<OmenId, Omen> = {
  muster: { id: "muster", name: "The Realm Answers", detail: "Word of the returning king spreads: 2 extra muster points to raise the opening army.", tone: "good" },
  harvest: { id: "harvest", name: "A Full Harvest", detail: "Granaries are full across the realm: 2 extra muster points this turn.", tone: "good" },
  mercenaries: { id: "mercenaries", name: "Sellswords at the Gate", detail: "A free company rides in: 1 cavalry joins your most exposed border.", tone: "good" },
  zeal: { id: "zeal", name: "Fervour of the Faithful", detail: "The host marches under blessed banners: every royal attacking die gains +1 this turn.", tone: "good" },
  vigil: { id: "vigil", name: "The Long Vigil", detail: "Your watchmen never sleep: every royal defending die gains +1 this turn.", tone: "good" },
  storm: { id: "storm", name: "Storms on the Roads", detail: "Rival supply trains are mired: every rival house musters 1 fewer point this turn.", tone: "good" },
  unrest: { id: "unrest", name: "Whispers of Sedition", detail: "Rival lords are recruiting in your shadow: every rival house musters 1 extra point this turn.", tone: "hard" },
};

const omenRotation: OmenId[] = ["harvest", "zeal", "mercenaries", "unrest", "vigil", "storm"];

export function omenForTurn(stage: number, turn: number): OmenId {
  if (turn <= 1) return "muster";
  return omenRotation[(stage * 5 + turn * 3 + Math.floor((stage + turn) / 5)) % omenRotation.length];
}

export const campaignStages: CampaignStage[] = [
  { id: 1, name: "The Vale of Stoneford", act: "Act I — Secure the Heartlands", objective: "Secure the royal heartland", objectiveDetail: "Control the Northern March and Crownlands.", victoryKind: "collections", objectiveCollections: ["north", "crown"], reward: "The King's Favour", rewardDetail: "+1 infantry joins the opening stronghold in every later chapter.", briefing: "The royal standard has returned to Stoneford. Reclaim the northern forts and the Crownlands before the rival houses close around them.", palette: ["#365a36", "#bc8b46"], difficulty: 1, rule: "standard", ruleName: "Open heartlands", ruleDetail: "No field modifier. Learn the roads, collections and rival doctrines.", terrainProfile: "A broad central river splits fertile Crownlands from the five northern forts." },
  { id: 2, name: "The Amber Coast", act: "Act I — Secure the Heartlands", objective: "Seize the western ports", objectiveDetail: "Control Amber Watch, Saltwind Beacon and Amber Market.", victoryKind: "territories", objectiveTerritories: ["northwatch", "seawatch", "crownmarket"], reward: "Coastal Muster", rewardDetail: "+1 muster point on every later turn.", briefing: "The Amber League controls the grain fleet. Capture its ports before Crownspire buys their loyalty.", palette: ["#a8782c", "#1d6172"], difficulty: 1.15, rule: "riches", ruleName: "Merchant granaries", ruleDetail: "Every faction gains +1 muster point while the coast remains contested.", terrainProfile: "A hooked coastline funnels armies through three wealthy, exposed ports." },
  { id: 3, name: "The Fenward", act: "Act I — Secure the Heartlands", objective: "Open the causeways", objectiveDetail: "Control the three marked causeways through the marsh.", victoryKind: "territories", objectiveTerritories: ["kings-crossing", "oldbridge", "ashbridge"], reward: "Fen Scouts", rewardDetail: "+1 archer joins the opening stronghold in later chapters.", briefing: "Marsh wardens hold every dry road. Advance carefully: a narrow victory can leave the army stranded.", palette: ["#315f58", "#73845c"], difficulty: 1.25, rule: "causeways", ruleName: "Narrow causeways", ruleDetail: "Final movement is limited to three units, even across a connected realm.", terrainProfile: "Black marsh water leaves only three narrow causeways fit for an army." },
  { id: 4, name: "The Ironspine", act: "Act I — Secure the Heartlands", objective: "Break the mountain gates", objectiveDetail: "Capture Iron Pass, Raven's Gate and Southgate.", victoryKind: "territories", objectiveTerritories: ["iron-pass", "ravens-gate", "southgate"], reward: "Iron Levy", rewardDetail: "+2 infantry join the opening stronghold in later chapters.", briefing: "House Brannoc and the Cairnborn guard the passes. No road north is open while Ironspine stands.", palette: ["#52585b", "#8a6545"], difficulty: 1.35, rule: "high-ground", ruleName: "High ground", ruleDetail: "Archers gain a second defence bonus in every mountain assault.", terrainProfile: "An impassable granite spine divides the field; three gates decide every advance." },
  { id: 5, name: "The Greenwood", act: "Act II — Break the Rival Crowns", objective: "Cross the ancient forest", objectiveDetail: "Take the three forest seats controlling the old king's road.", victoryKind: "territories", objectiveTerritories: ["elderwood", "oakridge", "thornkeep"], reward: "Alder Bows", rewardDetail: "+1 archer joins the opening stronghold in later chapters.", briefing: "The Briar Court has closed the old king's road. Their quarrel is older than Aldren's crown.", palette: ["#214f32", "#758544"], difficulty: 1.45, rule: "forest", ruleName: "Briar canopy", ruleDetail: "Dense forest suppresses cavalry's normal attack bonus.", terrainProfile: "Old forest closes around a single king's road and a maze of hidden tracks." },
  { id: 6, name: "The Red Plains", act: "Act II — Break the Rival Crowns", objective: "Defeat the Red Wolf", objectiveDetail: "Remove every Red Wolf banner from the plain.", victoryKind: "eliminate-wolves", reward: "Veteran Cavalry", rewardDetail: "+1 cavalry joins the opening stronghold in later chapters.", briefing: "Lady Mara Veyr waits on open ground. She intends to end the march in one decisive charge.", palette: ["#873928", "#aa7c3e"], difficulty: 1.55, rule: "wolf-charge", ruleName: "Open country", ruleDetail: "All cavalry gain a second attack bonus on the open plain.", terrainProfile: "Wide grassland and long sightlines make cavalry the decisive weapon." },
  { id: 7, name: "The Lakelands", act: "Act II — Break the Rival Crowns", objective: "Control every crossing", objectiveDetail: "Control King's Crossing, Oldbridge and Ashbridge.", victoryKind: "territories", objectiveTerritories: ["kings-crossing", "oldbridge", "ashbridge"], reward: "River Engineers", rewardDetail: "Every complete collection grants +1 additional muster in later chapters.", briefing: "White Serpent banners rise on the islands. Each bridge taken exposes another flank.", palette: ["#2a6981", "#6d7652"], difficulty: 1.65, rule: "bridge-tolls", ruleName: "Bridge tolls", ruleDetail: "Each complete territorial collection is worth +1 additional muster point.", terrainProfile: "Deep lakes break the realm into islands linked by lucrative bridges." },
  { id: 8, name: "The Border March", act: "Act II — Break the Rival Crowns", objective: "Hold the frontier wall", objectiveDetail: "Capture Northwatch, Iron Pass and Southgate before the frontier host gathers.", victoryKind: "territories", objectiveTerritories: ["northwatch", "iron-pass", "southgate"], reward: "Marcher Guard", rewardDetail: "+1 infantry joins the opening stronghold in later chapters.", briefing: "Vane's agents have opened the frontier. Take the forts before the northern host arrives.", palette: ["#4f4a3d", "#9b6a35"], difficulty: 1.75, rule: "frontier", ruleName: "Frontier alarm", ruleDetail: "Every rival house receives +1 muster point each enemy turn.", terrainProfile: "A chain of frontier forts forms a wall whose breaches invite constant raids." },
  { id: 9, name: "The Frostlands", act: "Act III — Reclaim the Kingdom", objective: "Survive the winter war", objectiveDetail: "Hold at least 16 territories when turn 5 begins.", victoryKind: "survive", targetTurn: 5, reward: "Winter Supply", rewardDetail: "The Royal Lions' minimum muster rises to 4 in later chapters.", briefing: "Snow closes behind the army. Victory must come before the last stores are gone.", palette: ["#a9bdc6", "#3c5665"], difficulty: 1.9, rule: "winter", ruleName: "Last stores", ruleDetail: "Every faction loses 1 muster point, though the minimum remains three.", terrainProfile: "Frozen rivers open new routes while supply lines shrink with every turn." },
  { id: 10, name: "The Broken Duchies", act: "Act III — Reclaim the Kingdom", objective: "Unseat the rival dukes", objectiveDetail: "Eliminate any two rival houses from the map.", victoryKind: "eliminate-two", reward: "Ducal Levies", rewardDetail: "+1 muster point on every later turn.", briefing: "Five ruined courts claim the same inheritance. Their war has no front and no rules.", palette: ["#51463d", "#7e332b"], difficulty: 2.05, rule: "fractured", ruleName: "Endless claimants", ruleDetail: "The minimum muster rises to four for every surviving house.", terrainProfile: "Ruined borders splinter the duchies into isolated pockets and sudden flanks." },
  { id: 11, name: "The King's Road", act: "Act III — Reclaim the Kingdom", objective: "Open the road to Crownspire", objectiveDetail: "Control the five marked roadward territories from Stoneford to Southgate.", victoryKind: "territories", objectiveTerritories: ["stoneford", "kings-crossing", "crownmarket", "oldbridge", "southgate"], reward: "Royal Vanguard", rewardDetail: "+1 cavalry joins the opening stronghold in Crownspire.", briefing: "The capital is visible beyond the forts. Vane has placed his finest army across the road.", palette: ["#5d5142", "#b28b3e"], difficulty: 2.2, rule: "royal-road", ruleName: "The royal road", ruleDetail: "The Royal Lions gain +1 muster point while their roadward banners survive.", terrainProfile: "One ancient road runs like a blade toward the capital through five defended wards." },
  { id: 12, name: "Crownspire", act: "Act III — Reclaim the Kingdom", objective: "Take the Black Crown", objectiveDetail: "Capture the three citadel districts: Black Pass, Vane Market and Final Mere.", victoryKind: "territories", objectiveTerritories: ["iron-pass", "crownmarket", "mereham"], reward: "The Realm Restored", rewardDetail: "Caldris is reunited beneath the Royal Lion.", briefing: "Cassian Vane waits within the royal citadel. Every oath and casualty has led to this final field.", palette: ["#25252d", "#8b332b"], difficulty: 2.4, rule: "citadel", ruleName: "The Black Citadel", ruleDetail: "Rival garrisons begin reinforced and receive +2 muster points each turn.", terrainProfile: "Concentric walls and three citadel gates turn the final map into a tightening siege." },
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

export function campaignRewardBonuses(campaignWins: number) {
  const openingUnits: Units = { infantry: 0, archers: 0, cavalry: 0 };
  if (campaignWins >= 1) openingUnits.infantry += 1;
  if (campaignWins >= 3) openingUnits.archers += 1;
  if (campaignWins >= 4) openingUnits.infantry += 2;
  if (campaignWins >= 5) openingUnits.archers += 1;
  if (campaignWins >= 6) openingUnits.cavalry += 1;
  if (campaignWins >= 8) openingUnits.infantry += 1;
  if (campaignWins >= 11) openingUnits.cavalry += 1;
  return {
    openingUnits,
    musterBonus: (campaignWins >= 2 ? 1 : 0) + (campaignWins >= 10 ? 1 : 0),
    collectionBonus: campaignWins >= 7 ? 1 : 0,
    minimumMuster: campaignWins >= 9 ? 4 : 3,
  };
}

export function campaignLegacySummary(campaignWins: number): string {
  if (!campaignWins) return "No campaign rewards unlocked";
  const bonuses = campaignRewardBonuses(campaignWins);
  const units = unitTypeOrder.filter(unit => bonuses.openingUnits[unit]).map(unit => `+${bonuses.openingUnits[unit]} ${unit}`);
  const income = bonuses.musterBonus ? `+${bonuses.musterBonus} muster` : null;
  return [...units, income].filter(Boolean).join(" · ");
}

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
    const rewards = campaignRewardBonuses(campaignWins);
    unitTypeOrder.forEach(unit => { royalStronghold.units[unit] += rewards.openingUnits[unit]; });
  }
  const regionalEdges = buildRegionalEdges(stage, regionalNodes);
  const territories: Territory[] = regionalNodes.map(node => ({ ...node, neighbors: regionalEdges.filter(([a,b]) => a === node.id || b === node.id).map(([a,b]) => a === node.id ? b : a) }));
  const legacy = campaignWins ? ` Campaign rewards: ${campaignLegacySummary(campaignWins)}.` : "";
  const state: GameState = { stage, turn: 1, phase: "reinforce", activeFaction: "royal", reinforcements: 0, fortifiedThisTurn: false, kingsOrder: null, kingsOrderUsed: false, territories, campaignWins, preview, seed: 1069 + stage * 97, momentum: 0, momentumBonus: 0, omen: omenForTurn(stage, 1), log: [`${campaignStages[stage - 1]?.ruleName ?? "Royal banners"}: ${campaignStages[stage - 1]?.ruleDetail ?? "The campaign begins."}${legacy}`] };
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
  const rewardBonuses = campaignRewardBonuses(state.campaignWins);
  const minimum = Math.max(stage?.rule === "fractured" ? 4 : 3, faction === "royal" ? rewardBonuses.minimumMuster : 3);
  const base = Math.max(minimum, Math.floor(territories / 3));
  const held = controlledCollections(state, faction);
  let income = base + held.reduce((sum, c) => sum + c.bonus, 0);
  if (stage?.rule === "riches") income += 1;
  if (stage?.rule === "bridge-tolls") income += held.length;
  if (stage?.rule === "frontier" && faction !== "royal") income += 1;
  if (stage?.rule === "winter") income = Math.max(3, income - 1);
  if (stage?.rule === "royal-road" && faction === "royal") income += 1;
  if (stage?.rule === "citadel" && faction !== "royal") income += 2;
  if (faction === "royal") {
    income += rewardBonuses.musterBonus;
    income += held.length * rewardBonuses.collectionBonus;
    if (state.omen === "muster" || state.omen === "harvest") income += 2;
    income += state.momentumBonus;
  } else {
    if (state.omen === "unrest") income += 1;
    if (state.omen === "storm") income = Math.max(3, income - 1);
  }
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
    log: [`Royal Command — ${names[order]}${order === "levy" ? ": 2 additional muster points." : "."}`, ...state.log],
  };
}

export function reinforce(state: GameState, territoryId: string, unit: UnitType): GameState {
  const next = cloneGame(state);
  const territory = next.territories.find(t => t.id === territoryId);
  const cost = unitCost(unit);
  if (!territory || territory.owner !== "royal" || next.phase !== "reinforce" || next.reinforcements < cost) return state;
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

function diceFor(state: GameState, units: UnitType[], side: "attack" | "defend", faction: FactionId = "royal"): [BattleDie[], number] {
  let seed = state.seed;
  const fieldRule = campaignStages[state.stage - 1]?.rule;
  const royal = faction === "royal";
  const dice = units.map(unit => {
    const [r, nextSeed] = nextRandom({ ...state, seed });
    seed = nextSeed;
    const roll = 1 + Math.floor(r * 6);
    let roleBonus = side === "attack" && unit === "cavalry" ? 1 : side === "defend" && unit === "archers" ? 1 : 0;
    if (fieldRule === "forest" && side === "attack" && unit === "cavalry") roleBonus = 0;
    if (fieldRule === "wolf-charge" && side === "attack" && unit === "cavalry") roleBonus += 1;
    if (fieldRule === "high-ground" && side === "defend" && unit === "archers") roleBonus += 1;
    if (royal && side === "attack" && state.omen === "zeal") roleBonus += 1;
    if (royal && side === "defend" && state.omen === "vigil") roleBonus += 1;
    const bonus = roleBonus;
    return { unit, roll, bonus, total: roll + bonus };
  }).sort((a,b) => b.total - a.total);
  if (royal && side === "attack" && state.momentum > 0 && dice.length) {
    dice[0] = { ...dice[0], bonus: dice[0].bonus + 1, total: dice[0].total + 1 };
    dice.sort((a,b) => b.total - a.total);
  }
  return [dice, seed];
}

function rerollWeakest(state: GameState, dice: BattleDie[]): [BattleDie[], number] {
  if (!dice.length) return [dice, state.seed];
  const weakestIndex = dice.reduce((lowest, die, index) => die.total < dice[lowest].total ? index : lowest, 0);
  const [random, seed] = nextRandom(state);
  const reroll = 1 + Math.floor(random * 6);
  const weakest = dice[weakestIndex];
  const next = [...dice];
  next[weakestIndex] = reroll > weakest.roll ? { ...weakest, roll: reroll, total: reroll + weakest.bonus, rerolledFrom: weakest.roll } : { ...weakest, rerolledFrom: reroll };
  return [next.sort((a,b) => b.total - a.total), seed];
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
  let attackerDice: BattleDie[];
  let seedB: number;
  [attackerDice, seedB] = diceFor(next, attackers, "attack", "royal");
  const defenderRoll = diceFor({ ...next, seed: seedB }, defenders, "defend", to.owner);
  const defenderDice = defenderRoll[0];
  seedB = defenderRoll[1];
  if (next.kingsOrder === "vanguard" && !next.kingsOrderUsed) {
    [attackerDice, seedB] = rerollWeakest({ ...next, seed: seedB }, attackerDice);
    next.kingsOrderUsed = true;
    next.log.unshift("Ride at Dawn rallies the weakest attacking die.");
  }
  next.seed = seedB;
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
    const vanguardPriority: UnitType[] = ["cavalry", "infantry", "archers"];
    const occupyingUnit = vanguardPriority.find(unit => survivors[unit] > 0 && from.units[unit] > 0)
      ?? vanguardPriority.find(unit => from.units[unit] > 1)
      ?? vanguardPriority.find(unit => from.units[unit] > 0);
    if (occupyingUnit) { from.units[occupyingUnit]--; to.units[occupyingUnit]++; }
    to.owner = "royal";
    next.momentum += 1;
    next.log.unshift(`${to.name} has fallen. Momentum ${next.momentum} — the royal host is in full cry.`);
  } else {
    next.log.unshift(`${from.name} attacks ${to.name}: ${attackerLosses.length} royal and ${defenderLosses.length} enemy losses.`);
  }
  const result = { attackerDice, defenderDice, comparisons, attackerLosses, defenderLosses, captured };
  return { state: checkOutcome(next), result };
}

export function occupyAfterCapture(state: GameState, fromId: string, toId: string, units: Units): GameState {
  const next = cloneGame(state);
  const from = next.territories.find(territory => territory.id === fromId);
  const to = next.territories.find(territory => territory.id === toId);
  if (!from || !to || from.owner !== "royal" || to.owner !== "royal" || !from.neighbors.includes(toId)) return state;
  const moving = totalUnits(units);
  if (moving >= totalUnits(from.units) || unitTypeOrder.some(unit => units[unit] < 0 || units[unit] > from.units[unit])) return state;
  unitTypeOrder.forEach(unit => { from.units[unit] -= units[unit]; to.units[unit] += units[unit]; });
  if (moving) next.log.unshift(`${moving} additional ${moving === 1 ? "unit occupies" : "units occupy"} ${to.name}.`);
  else next.log.unshift(`${to.name} holds with a light occupation.`);
  return next;
}

export function battleForecast(state: GameState, fromId: string, toId: string, preferred: UnitType[]): BattleForecast {
  const trials = 96;
  let captures = 0;
  let attackerLosses = 0;
  let defenderLosses = 0;
  for (let trial = 0; trial < trials; trial++) {
    const simulated = cloneGame({ ...state, seed: state.seed + (trial + 1) * 7919 });
    const resolved = resolveFullAssault(simulated, fromId, toId, preferred);
    if (!resolved) continue;
    if (resolved.result.captured) captures++;
    attackerLosses += resolved.result.attackerLosses.length;
    defenderLosses += resolved.result.defenderLosses.length;
  }
  const captureChance = Math.round(captures / trials * 100);
  return {
    captureChance,
    expectedAttackerLosses: Math.round(attackerLosses / trials * 10) / 10,
    expectedDefenderLosses: Math.round(defenderLosses / trials * 10) / 10,
    verdict: captureChance >= 65 ? "Favoured" : captureChance >= 40 ? "Contested" : "Desperate",
  };
}

export function resolveFullAssault(state: GameState, fromId: string, toId: string, preferred: UnitType[]): { state: GameState; result: BattleResult } | null {
  let current = state;
  let rounds = 0;
  let finalResult: BattleResult | null = null;
  const attackerLosses: UnitType[] = [];
  const defenderLosses: UnitType[] = [];
  const priority = [...new Set([...preferred, ...unitTypeOrder])] as UnitType[];
  while (rounds < 12) {
    const from = current.territories.find(territory => territory.id === fromId);
    const to = current.territories.find(territory => territory.id === toId);
    if (!from || !to || to.owner === "royal" || totalUnits(from.units) <= 1) break;
    const attackers: UnitType[] = [];
    for (const unit of priority) {
      for (let index = 0; index < from.units[unit] && attackers.length < Math.min(3, totalUnits(from.units) - 1); index++) attackers.push(unit);
    }
    const resolved = resolveBattleRound(current, fromId, toId, attackers);
    if (!resolved) break;
    rounds++;
    current = resolved.state;
    finalResult = resolved.result;
    attackerLosses.push(...resolved.result.attackerLosses);
    defenderLosses.push(...resolved.result.defenderLosses);
    if (resolved.result.captured || current.phase === "victory" || current.phase === "defeat") break;
  }
  if (!finalResult) return null;
  return { state: current, result: { ...finalResult, attackerLosses, defenderLosses, rounds } };
}

export function deployRemaining(state: GameState): GameState {
  if (state.phase !== "reinforce" || state.reinforcements < 1) return state;
  const next = cloneGame(state);
  const openBorders = (territory: Territory) => territory.neighbors.filter(id => next.territories.find(item => item.id === id)?.owner !== "royal").length;
  const frontline = next.territories
    .filter(territory => territory.owner === "royal" && openBorders(territory) > 0)
    .sort((a, b) => openBorders(b) - openBorders(a) || totalUnits(a.units) - totalUnits(b.units) || a.id.localeCompare(b.id));
  const line = frontline.length ? frontline : next.territories.filter(territory => territory.owner === "royal");
  if (!line.length) return state;
  let placed = 0;
  let index = 0;
  while (next.reinforcements >= 1) {
    const territory = line[index % line.length];
    if (next.reinforcements >= 2 && index % 3 === 2) { territory.units.cavalry += 1; next.reinforcements -= 2; }
    else { territory.units.infantry += 1; next.reinforcements -= 1; }
    placed += 1;
    index += 1;
  }
  next.log.unshift(`${placed} ${placed === 1 ? "company musters" : "companies muster"} along the threatened border.`);
  return next;
}

export function startAttackPhase(state: GameState): GameState {
  if (state.phase !== "reinforce") return state;
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

export function mostExposedTerritory(state: GameState, faction: FactionId): Territory | undefined {
  const openBorders = (territory: Territory) => territory.neighbors.filter(id => state.territories.find(item => item.id === id)?.owner !== faction).length;
  return state.territories
    .filter(territory => territory.owner === faction)
    .sort((a, b) => openBorders(b) - openBorders(a) || totalUnits(b.units) - totalUnits(a.units) || a.id.localeCompare(b.id))[0];
}

function addUnitToStronghold(state: GameState, faction: FactionId, points: number): void {
  const borders = state.territories.filter(t => t.owner === faction && t.neighbors.some(n => state.territories.find(x => x.id === n)?.owner !== faction));
  const target = [...borders].sort((a,b) => {
    if (faction === "wolves") return totalUnits(b.units) - totalUnits(a.units);
    if (faction === "boars") return totalUnits(a.units) - totalUnits(b.units);
    const aOpen = a.neighbors.filter(id => state.territories.find(item => item.id === id)?.owner !== faction).length;
    const bOpen = b.neighbors.filter(id => state.territories.find(item => item.id === id)?.owner !== faction).length;
    return bOpen - aOpen || totalUnits(b.units) - totalUnits(a.units);
  })[0] ?? state.territories.find(t => t.owner === faction);
  if (!target) return;
  while (points > 0) {
    if (faction === "wolves" && points >= 2) { target.units.cavalry++; points -= 2; }
    else if (faction === "serpents" && points >= 2) { target.units.archers++; points -= 2; }
    else if (faction === "boars") { target.units.infantry++; points--; }
    else if (points >= 2 && target.units.cavalry < 2) { target.units.cavalry++; points -= 2; }
    else { target.units.infantry++; points--; }
  }
}

function rankedAttackOptions(state: GameState, faction: FactionId) {
  return state.territories.flatMap(from => {
    if (from.owner !== faction || totalUnits(from.units) < 3) return [];
    return from.neighbors.map(id => state.territories.find(territory => territory.id === id)!).filter(Boolean).filter(to => to.owner !== faction).map(to => {
      const edge = totalUnits(from.units) - totalUnits(to.units);
      const collectionMembers = state.territories.filter(item => item.collection === to.collection && item.id !== to.id);
      const completesCollection = collectionMembers.every(item => item.owner === faction) ? 1 : 0;
      const royalTarget = to.owner === "royal" ? 1 : 0;
      const doctrine = faction === "wolves"
        ? from.units.cavalry * .32 + royalTarget * .55
        : faction === "boars"
          ? completesCollection * 1.5 + (totalUnits(to.units) <= 2 ? .35 : 0)
          : royalTarget * .45 + (to.units.archers ? -.18 : .2);
      const reason = faction === "wolves"
        ? "Cavalry massing for a direct border charge"
        : faction === "boars"
          ? completesCollection ? "Infantry closing a territorial collection" : "Infantry pressing the weakest adjacent hold"
          : "Archers probing an exposed royal border";
      return { from, to, edge, score: edge + doctrine, reason };
    });
  }).sort((a,b) => b.score - a.score || b.edge - a.edge);
}

export function enemyIntelligence(state: GameState): EnemyIntent[] {
  return (["wolves", "boars", "serpents"] as FactionId[]).flatMap(faction => {
    const option = rankedAttackOptions(state, faction).find(candidate => candidate.to.owner === "royal") ?? rankedAttackOptions(state, faction)[0];
    if (!option) return [];
    return [{
      faction,
      fromId: option.from.id,
      toId: option.to.id,
      score: Math.round(option.score * 10) / 10,
      risk: option.score >= 2 ? "High" as const : option.score >= 0 ? "Watch" as const : "Low" as const,
      reason: option.reason,
    }];
  }).sort((a,b) => b.score - a.score);
}

function aiAttackOnce(state: GameState, faction: FactionId): GameState {
  const next = cloneGame(state);
  const options = rankedAttackOptions(next, faction);
  const option = options[0];
  const attackThreshold = faction === "wolves" ? -1 : faction === "serpents" ? -.25 : 0;
  if (!option || option.score < attackThreshold) return next;
  const attackers = chooseAttackers(option.from.units);
  const defenders = chooseDefenders(option.to.units);
  const [ad, sa] = diceFor(next, attackers, "attack", faction);
  const defenseRoll = diceFor({ ...next, seed: sa }, defenders, "defend", option.to.owner);
  let dd = defenseRoll[0];
  let sb = defenseRoll[1];
  if (option.to.owner === "royal" && next.kingsOrder === "bastion" && !next.kingsOrderUsed) {
    [dd, sb] = rerollWeakest({ ...next, seed: sb }, dd);
    next.kingsOrderUsed = true;
    next.log.unshift("Hold the Line rallies the weakest die in the first royal defence.");
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
  next.momentumBonus = Math.min(3, next.momentum);
  next.momentum = 0;
  next.omen = omenForTurn(next.stage, next.turn);
  if (next.omen === "mercenaries") {
    const hired = mostExposedTerritory(next, "royal");
    if (hired) {
      hired.units.cavalry += 1;
      next.log.unshift(`Sellswords at the Gate: a free company of cavalry rides into ${hired.name}.`);
    }
  }
  next.reinforcements = reinforcementIncome(next, "royal");
  const carried = next.momentumBonus ? `, ${next.momentumBonus} carried by momentum` : "";
  next.log.unshift(`Turn ${next.turn} — ${omens[next.omen].name}: ${next.reinforcements} muster points${carried}.`);
  return checkOutcome(next);
}

export function endPlayerTurn(state: GameState): GameState {
  if (state.phase !== "fortify") return state;
  return runEnemyTurn(state);
}

export function campaignObjectiveProgress(state: GameState) {
  const stage = campaignStages[state.stage - 1];
  const royalCount = factionTerritoryCount(state, "royal");
  if (stage.victoryKind === "conquest") return { current: royalCount, total: state.territories.length, met: royalCount === state.territories.length, targetIds: state.territories.filter(territory => territory.owner !== "royal").map(territory => territory.id), label: `${royalCount} / ${state.territories.length} territories` };
  if (stage.victoryKind === "territories") {
    const ids = stage.objectiveTerritories ?? [];
    const current = ids.filter(id => state.territories.find(territory => territory.id === id)?.owner === "royal").length;
    return { current, total: ids.length, met: current === ids.length, targetIds: ids.filter(id => state.territories.find(territory => territory.id === id)?.owner !== "royal"), label: `${current} / ${ids.length} objectives held` };
  }
  if (stage.victoryKind === "collections") {
    const collectionIds = stage.objectiveCollections ?? [];
    const secured = collectionIds.filter(collectionId => state.territories.filter(territory => territory.collection === collectionId).every(territory => territory.owner === "royal"));
    const targetIds = state.territories.filter(territory => collectionIds.includes(territory.collection) && territory.owner !== "royal").map(territory => territory.id);
    return { current: secured.length, total: collectionIds.length, met: secured.length === collectionIds.length, targetIds, label: `${secured.length} / ${collectionIds.length} regions secured` };
  }
  if (stage.victoryKind === "eliminate-wolves") {
    const wolves = factionTerritoryCount(state, "wolves");
    return { current: wolves ? 0 : 1, total: 1, met: wolves === 0, targetIds: state.territories.filter(territory => territory.owner === "wolves").map(territory => territory.id), label: wolves ? `${wolves} Red Wolf territories remain` : "Red Wolves defeated" };
  }
  if (stage.victoryKind === "survive") {
    const targetTurn = stage.targetTurn ?? 5;
    const met = state.turn >= targetTurn && royalCount >= 16;
    return { current: Math.min(state.turn, targetTurn), total: targetTurn, met, targetIds: state.territories.filter(territory => territory.owner === "royal").map(territory => territory.id), label: `Turn ${state.turn} / ${targetTurn} · ${royalCount} / 16 territories` };
  }
  const eliminated = (["wolves", "boars", "serpents"] as FactionId[]).filter(faction => factionTerritoryCount(state, faction) === 0).length;
  return { current: eliminated, total: 2, met: eliminated >= 2, targetIds: state.territories.filter(territory => territory.owner !== "royal").map(territory => territory.id), label: `${eliminated} / 2 rival houses defeated` };
}

export function checkOutcome(state: GameState): GameState {
  const royal = state.territories.filter(t => t.owner === "royal").length;
  if (royal === 0) return { ...state, phase: "defeat" };
  if (campaignObjectiveProgress(state).met) return { ...state, phase: "victory", campaignWins: state.preview ? state.campaignWins : Math.max(state.campaignWins, state.stage) };
  return state;
}

export function factionTerritoryCount(state: GameState, faction: FactionId): number {
  return state.territories.filter(t => t.owner === faction).length;
}

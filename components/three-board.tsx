"use client";

/* WebGL capability is only knowable after mount; failure activates the complete illustrated map. */
/* eslint-disable react-hooks/set-state-in-effect, @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { GameState, Territory } from "@/lib/game";
import { campaignStages, collections, factions, totalUnits } from "@/lib/game";

type Props = {
  game: GameState;
  selectedId: string | null;
  targetIds: string[];
  objectiveIds?: string[];
  overlay?: MapOverlay;
  onSelect: (territory: Territory) => void;
  reducedMotion?: boolean;
};

export type MapOverlay = "none" | "routes" | "collections" | "threats";

const WORLD_W = 15;
const WORLD_H = 10;

type MapPoint = { x: number; y: number };

function clipToTerritory(polygon: MapPoint[], site: MapPoint, rival: MapPoint) {
  const value = (point: MapPoint) => 2 * (rival.x - site.x) * point.x + 2 * (rival.y - site.y) * point.y - (rival.x ** 2 + rival.y ** 2 - site.x ** 2 - site.y ** 2);
  const result: MapPoint[] = [];
  for (let index = 0; index < polygon.length; index++) {
    const current = polygon[index];
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentValue = value(current);
    const previousValue = value(previous);
    const currentInside = currentValue <= 0;
    const previousInside = previousValue <= 0;
    if (currentInside !== previousInside) {
      const ratio = previousValue / (previousValue - currentValue);
      result.push({ x: previous.x + (current.x - previous.x) * ratio, y: previous.y + (current.y - previous.y) * ratio });
    }
    if (currentInside) result.push(current);
  }
  return result;
}

function territoryCells(territories: Territory[]) {
  return territories.map(territory => {
    let polygon: MapPoint[] = [{ x: .015, y: .015 }, { x: .985, y: .015 }, { x: .985, y: .985 }, { x: .015, y: .985 }];
    for (const rival of territories) if (rival.id !== territory.id) polygon = clipToTerritory(polygon, territory, rival);
    return { territory, polygon };
  });
}

const terrainGlyphs: Record<string, string> = { riches: "⚓", causeways: "≈", "high-ground": "▲", forest: "♠", "wolf-charge": "⋮", "bridge-tolls": "≋", frontier: "♜", winter: "✦", fractured: "◇", "royal-road": "⚑", citadel: "♜", standard: "♟" };

function worldPosition(territory: Territory) {
  return new THREE.Vector3((territory.x - 0.5) * WORLD_W, 0.28, (territory.y - 0.5) * WORLD_H);
}

function numberSprite(value: number, foreground: string, stroke: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(8,8,8,.82)";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.font = "700 54px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = foreground;
  ctx.fillText(String(value), 64, 67);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(.58, .58, .58);
  return sprite;
}

function addRoute(group: THREE.Group, a: Territory, b: Territory, color: number, opacity = .7) {
  const pa = worldPosition(a);
  const pb = worldPosition(b);
  pa.y = .1;
  pb.y = .1;
  const mid = pa.clone().lerp(pb, .5);
  mid.y = .35;
  const curve = new THREE.QuadraticBezierCurve3(pa, mid, pb);
  const points = curve.getPoints(24);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false });
  group.add(new THREE.Line(geometry, material));
}

function proceduralMapTexture(game: GameState, palette: [string, string]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(1, palette[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = .17;
  for (let i = 0; i < 48; i++) {
    ctx.fillStyle = i % 2 ? "#ead49b" : "#071016";
    ctx.beginPath();
    ctx.ellipse((i * 397 + game.stage * 83) % canvas.width, (i * 233 + game.stage * 131) % canvas.height, 80 + (i % 5) * 36, 45 + (i % 4) * 28, i * .31, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = .52;
  territoryCells(game.territories).forEach(({ territory, polygon }) => {
    const collection = collections.find(item => item.id === territory.collection);
    ctx.beginPath();
    polygon.forEach((point, index) => index ? ctx.lineTo(point.x * canvas.width, point.y * canvas.height) : ctx.moveTo(point.x * canvas.width, point.y * canvas.height));
    ctx.closePath();
    ctx.fillStyle = collection?.color ?? "#cfb477";
    ctx.globalAlpha = .2;
    ctx.fill();
    ctx.strokeStyle = "#f2d79c";
    ctx.lineWidth = 2;
    ctx.globalAlpha = .42;
    ctx.stroke();
  });
  ctx.globalAlpha = .52;
  ctx.strokeStyle = "#f3dca4";
  ctx.lineWidth = 4;
  ctx.setLineDash([11, 13]);
  const byId = new Map(game.territories.map(territory => [territory.id, territory]));
  game.territories.forEach(territory => territory.neighbors.forEach(neighborId => {
    if (territory.id > neighborId) return;
    const neighbor = byId.get(neighborId);
    if (!neighbor) return;
    ctx.beginPath();
    ctx.moveTo(territory.x * canvas.width, territory.y * canvas.height);
    ctx.lineTo(neighbor.x * canvas.width, neighbor.y * canvas.height);
    ctx.stroke();
  }));
  ctx.setLineDash([]);
  ctx.globalAlpha = .72;
  ctx.strokeStyle = "#173d53";
  ctx.lineWidth = 18;
  ctx.beginPath();
  for (let x = -40; x <= canvas.width + 40; x += 40) {
    const y = canvas.height * (.43 + Math.sin(x / 165 + game.stage) * .09);
    if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = .4;
  ctx.fillStyle = "#f4dda4";
  ctx.font = "34px Georgia";
  const glyph = terrainGlyphs[campaignStages[game.stage - 1].rule];
  game.territories.forEach((territory, index) => { if (index % 4 === game.stage % 4) ctx.fillText(glyph, territory.x * canvas.width + 24, territory.y * canvas.height - 24); });
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(9,14,16,.72)";
  ctx.fillRect(0, 0, canvas.width, 94);
  ctx.fillStyle = "#f5dfaa";
  ctx.font = "700 44px Georgia";
  ctx.textAlign = "center";
  ctx.fillText(campaignStages[game.stage - 1].name.toUpperCase(), canvas.width / 2, 61);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function ThreeBoard({ game, selectedId, targetIds, objectiveIds = [], overlay = "none", onSelect, reducedMotion = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const markerLayerRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const onSelectRef = useRef(onSelect);
  const gameRef = useRef(game);
  const stage = campaignStages[game.stage - 1];
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { gameRef.current = game; }, [game]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071016);
    scene.fog = new THREE.FogExp2(0x071016, .018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / host.clientHeight, .1, 100);
    camera.position.set(0, 10.8, 8.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.HemisphereLight(0xd9c7a0, 0x08131a, 1.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffd49a, 2.8);
    sun.position.set(-6, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x6c8eb6, 1.1);
    rim.position.set(8, 5, -8);
    scene.add(rim);

    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 15),
      new THREE.MeshStandardMaterial({ color: 0x0d3a4b, roughness: .28, metalness: .18 })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -.13;
    scene.add(ocean);

    const addBoard = (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(WORLD_W, .18, WORLD_H),
        [
          new THREE.MeshStandardMaterial({ color: 0x513d28 }),
          new THREE.MeshStandardMaterial({ color: 0x513d28 }),
          new THREE.MeshStandardMaterial({ map: texture, roughness: .82, metalness: .02 }),
          new THREE.MeshStandardMaterial({ color: 0x241a12 }),
          new THREE.MeshStandardMaterial({ color: 0x513d28 }),
          new THREE.MeshStandardMaterial({ color: 0x513d28 }),
        ]
      );
      board.receiveShadow = true;
      scene.add(board);
    };
    if (game.stage === 1) {
      const loader = new THREE.TextureLoader();
      loader.load("/art/vale-of-stoneford.webp", addBoard);
    } else addBoard(proceduralMapTexture(game, stage.palette));

    const dustCount = reducedMotion ? 0 : 170;
    if (dustCount) {
      const positions = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        positions[i * 3] = (Math.random() - .5) * 18;
        positions[i * 3 + 1] = .5 + Math.random() * 5;
        positions[i * 3 + 2] = (Math.random() - .5) * 12;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffdfac, size: .025, transparent: true, opacity: .42 }));
      points.name = "dust";
      scene.add(points);
    }

    const markerLayer = new THREE.Group();
    markerLayerRef.current = markerLayer;
    scene.add(markerLayer);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = { x: 0, y: 0 };
    let dragging = false;
    const target = new THREE.Vector3(0, 0, 0);

    const setPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const onPointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; dragging = false; renderer.domElement.setPointerCapture(event.pointerId); };
    const onPointerMove = (event: PointerEvent) => {
      if (!renderer.domElement.hasPointerCapture(event.pointerId)) return;
      const dx = event.clientX - down.x;
      const dy = event.clientY - down.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) dragging = true;
      if (dragging) {
        target.x = THREE.MathUtils.clamp(target.x - dx * .008, -2.8, 2.8);
        target.z = THREE.MathUtils.clamp(target.z - dy * .008, -2.2, 2.2);
        camera.position.x = target.x;
        camera.position.z = 8.2 + target.z;
        camera.lookAt(target.x, 0, target.z);
        down = { x: event.clientX, y: event.clientY };
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      renderer.domElement.releasePointerCapture(event.pointerId);
      if (dragging) return;
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(markerLayerRef.current?.children ?? [], true);
      const id = hits.find(hit => hit.object.userData.territoryId)?.object.userData.territoryId as string | undefined;
      if (id) {
        const territory = gameRef.current.territories.find(t => t.id === id);
        if (territory) onSelectRef.current(territory);
      }
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const scale = THREE.MathUtils.clamp(camera.position.y + event.deltaY * .006, 7.2, 14);
      camera.position.y = scale;
      camera.position.z = 8.2 + target.z + (scale - 10.8) * .72;
      camera.lookAt(target.x, 0, target.z);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dust = scene.getObjectByName("dust") as THREE.Points | undefined;
      if (dust) dust.rotation.y = t * .014;
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(m => m?.dispose());
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  // The board is remounted for every chapter; turn updates only rebuild marker layers below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  useEffect(() => {
    const scene = sceneRef.current;
    const previousLayer = markerLayerRef.current;
    if (!scene || !previousLayer) return;
    const layer = new THREE.Group();
    markerLayerRef.current = layer;
    scene.add(layer);
    if (overlay === "routes") {
      game.territories.forEach(territory => territory.neighbors.forEach(id => {
        if (territory.id >= id) return;
        const neighbor = game.territories.find(item => item.id === id);
        if (neighbor) addRoute(layer, territory, neighbor, 0x9ec7da, .42);
      }));
    }
    const selected = game.territories.find(t => t.id === selectedId);
    if (selected) {
      selected.neighbors.forEach(id => {
        const neighbor = game.territories.find(t => t.id === id);
        if (neighbor) addRoute(layer, selected, neighbor, neighbor.owner === selected.owner ? 0xd6bd77 : 0xc34132, .95);
      });
    }
    game.territories.forEach((territory, index) => {
      const marker = new THREE.Group();
      marker.userData.marker = true;
      marker.position.copy(worldPosition(territory));
      const faction = factions[territory.owner];
      const isSerpent = territory.owner === "serpents";
      const baseMaterial = new THREE.MeshStandardMaterial({ color: faction.color, roughness: .45, metalness: .35, emissive: selectedId === territory.id ? 0x4b3510 : 0x000000, emissiveIntensity: selectedId === territory.id ? .9 : 0 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.22, .27, .16, 12), baseMaterial);
      base.castShadow = true;
      base.userData.territoryId = territory.id;
      marker.add(base);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.245, .025, 8, 24), new THREE.MeshStandardMaterial({ color: faction.metal, metalness: .75, roughness: .25 }));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = .09;
      rim.userData.territoryId = territory.id;
      marker.add(rim);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .55, 8), new THREE.MeshStandardMaterial({ color: 0x8e6b3b, roughness: .5 }));
      pole.position.set(.1, .32, 0);
      marker.add(pole);
      const banner = new THREE.Mesh(new THREE.BoxGeometry(.27, .28, .028), new THREE.MeshStandardMaterial({ color: faction.color, roughness: .62, emissive: isSerpent ? 0x33211c : 0x000000 }));
      banner.position.set(.22, .49, 0);
      banner.userData.territoryId = territory.id;
      marker.add(banner);
      const sprite = numberSprite(totalUnits(territory.units), faction.metal, faction.color);
      sprite.position.set(-.08, .52, 0);
      sprite.userData.territoryId = territory.id;
      marker.add(sprite);
      const threatened = territory.owner === "royal" && territory.neighbors.some(id => game.territories.find(item => item.id === id)?.owner !== "royal");
      const collection = collections.find(item => item.id === territory.collection);
      const ringColor = targetIds.includes(territory.id) ? (game.phase === "fortify" ? 0xf6cf70 : 0xf04c3f) : objectiveIds.includes(territory.id) ? 0x66d9ff : overlay === "threats" && threatened ? 0xff6a58 : overlay === "collections" ? Number.parseInt((collection?.color ?? "#d6bd77").slice(1), 16) : selectedId === territory.id ? 0xf6cf70 : null;
      if (ringColor !== null) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(objectiveIds.includes(territory.id) ? .42 : .36, .045, 8, 40), new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: .95, depthTest: false }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -.15;
        marker.add(ring);
      }
      marker.rotation.y = (index % 3 - 1) * .08;
      layer.add(marker);
    });
    scene.remove(previousLayer);
    previousLayer.children.forEach(child => {
      child.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => {
            if (material instanceof THREE.SpriteMaterial) material.map?.dispose();
            material?.dispose();
          });
        }
      });
    });
  }, [game, selectedId, targetIds, objectiveIds, overlay]);

  if (fallback) {
    const cells = territoryCells(game.territories);
    const terrainGlyph = terrainGlyphs[stage.rule];
    return (
      <div className={`three-board fallback-board ${game.phase} stage-${game.stage} overlay-${overlay}`} aria-label={`Interactive illustrated map of ${stage.name}`}>
        <div className={`fallback-map-layer ${game.stage === 1 ? "" : "procedural-stage"}`} style={{ "--stage-a": stage.palette[0], "--stage-b": stage.palette[1] } as React.CSSProperties}>
          {game.stage === 1 ? <img src="/art/vale-of-stoneford.webp" alt="" /> : <div className="procedural-map-art" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><filter id={`rough-${game.stage}`}><feTurbulence baseFrequency=".025" numOctaves="3" seed={game.stage}/><feBlend mode="soft-light" in="SourceGraphic"/></filter></defs><rect width="100" height="100" filter={`url(#rough-${game.stage})`}/><g className="stage-provinces">{cells.map(({ territory, polygon }) => <polygon key={territory.id} points={polygon.map(point => `${point.x * 100},${point.y * 100}`).join(" ")} style={{ "--province": collections.find(item => item.id === territory.collection)?.color } as React.CSSProperties}/>)}</g><path className="stage-river" d={`M -5 ${38 + game.stage % 9} C 20 ${25 + game.stage % 6}, 34 ${66 - game.stage % 7}, 55 ${47 + game.stage % 5} S 82 ${28 + game.stage % 8}, 105 ${52 - game.stage % 6}`}/><g className="stage-routes">{game.territories.flatMap(territory => territory.neighbors.filter(id => territory.id < id).map(id => { const neighbor = game.territories.find(item => item.id === id)!; return <line key={`${territory.id}-${id}`} x1={territory.x * 100} y1={territory.y * 100} x2={neighbor.x * 100} y2={neighbor.y * 100}/>; }))}</g><g className="terrain-glyphs">{game.territories.map((territory,index) => index % 4 === game.stage % 4 ? <text key={territory.id} x={territory.x * 100 + 1.8} y={territory.y * 100 - 1.8}>{terrainGlyph}</text> : null)}</g></svg><strong>{stage.name}</strong><span>{stage.ruleName}</span></div>}
          <div className="fallback-scrim" />
          {game.territories.map(territory => {
            const faction = factions[territory.owner];
            const army = totalUnits(territory.units);
            return (
              <button
                aria-label={`${territory.name}, ${army} ${army === 1 ? "unit" : "units"}, ${faction.shortName}`}
                className={`${selectedId === territory.id ? "selected" : ""} ${targetIds.includes(territory.id) ? "target" : ""} ${objectiveIds.includes(territory.id) ? "objective" : ""} ${territory.neighbors.length <= 2 ? "chokepoint" : ""} ${territory.owner === "royal" && territory.neighbors.some(id => game.territories.find(item => item.id === id)?.owner !== "royal") ? "threatened" : ""}`}
                key={territory.id}
                onClick={() => onSelect(territory)}
                style={{ left: `${territory.x * 100}%`, top: `${territory.y * 100}%`, "--faction": faction.color, "--metal": faction.metal } as React.CSSProperties}
                title={territory.name}
              >
                <i>{faction.sigil}</i><b>{army}</b><span>{territory.name}</span>
              </button>
            );
          })}
        </div>
        <p className="fallback-note">{stage.name} · illustrated command map · 3D terrain unavailable on this device</p>
      </div>
    );
  }
  return <div ref={hostRef} className="three-board" aria-label={`Interactive three-dimensional map of ${stage.name}`} />;
}

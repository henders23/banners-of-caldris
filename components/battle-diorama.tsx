"use client";

/* WebGL capability is only knowable after the host mounts; failure activates the complete fallback theatre. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { BattleResult, CampaignRule, UnitType, Units } from "@/lib/game";

type Props = {
  rolling: boolean;
  result: BattleResult | null;
  attackers: Units;
  defenders: Units;
  fieldRule: CampaignRule;
  reducedMotion?: boolean;
  enemyColor?: string;
  enemySigil?: string;
  enemyName?: string;
};

const unitOrder: UnitType[] = ["cavalry", "infantry", "archers"];

function roster(units: Units, limit: number) {
  return unitOrder.flatMap(unit => Array.from({ length: units[unit] }, () => unit)).slice(0, limit);
}

function soldier(color: number, metal: number, unit: UnitType, x: number, z: number, facing: 1 | -1) {
  const group = new THREE.Group();
  const cavalry = unit === "cavalry";
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, .38, 8), new THREE.MeshStandardMaterial({ color, roughness: .65 }));
  body.position.y = cavalry ? .48 : .28;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 8), new THREE.MeshStandardMaterial({ color: metal, metalness: .72, roughness: .25 }));
  head.position.y = cavalry ? .73 : .54;
  group.add(head);
  if (cavalry) {
    const horse = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .42, 5, 10), new THREE.MeshStandardMaterial({ color: 0x34251c, roughness: .88 }));
    horse.rotation.z = Math.PI / 2;
    horse.position.y = .25;
    group.add(horse);
    const lance = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .9, 6), new THREE.MeshStandardMaterial({ color: 0x9b7547 }));
    lance.rotation.z = Math.PI / 2;
    lance.position.set(.34 * facing, .61, 0);
    group.add(lance);
  } else if (unit === "archers") {
    const bow = new THREE.Mesh(new THREE.TorusGeometry(.16, .012, 5, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0xa77b43 }));
    bow.rotation.y = Math.PI / 2;
    bow.rotation.z = facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    bow.position.set(.14 * facing, .36, 0);
    group.add(bow);
  } else {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .025, 10), new THREE.MeshStandardMaterial({ color, metalness: .25, roughness: .45 }));
    shield.rotation.x = Math.PI / 2;
    shield.rotation.z = Math.PI / 2;
    shield.position.set(.13 * facing, .34, 0);
    group.add(shield);
    const sword = new THREE.Mesh(new THREE.BoxGeometry(.02, .46, .025), new THREE.MeshStandardMaterial({ color: 0xc9c4b5, metalness: .85, roughness: .2 }));
    sword.rotation.z = -.55 * facing;
    sword.position.set(.2 * facing, .45, -.08);
    group.add(sword);
  }
  group.position.set(x, 0, z);
  group.userData.unit = unit;
  return group;
}

function fillFormation(group: THREE.Group, units: Units, limit: number, color: number, metal: number, facing: 1 | -1) {
  group.children.forEach(child => child.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => material.dispose());
    }
  }));
  group.clear();
  roster(units, limit).forEach((unit, index) => group.add(soldier(color, metal, unit, facing * -(index % 3) * .28, (index % 4 - 1.5) * .58, facing)));
}

function addTerrain(scene: THREE.Scene, rule: CampaignRule) {
  const groundColor = rule === "winter" ? 0x87959a : rule === "forest" ? 0x293d27 : rule === "causeways" || rule === "bridge-tolls" ? 0x4f4a32 : 0x54432d;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(18, 10, 24, 16), new THREE.MeshStandardMaterial({ color: groundColor, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  if (rule === "causeways" || rule === "bridge-tolls") {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(18, 2.2), new THREE.MeshStandardMaterial({ color: 0x173d4d, roughness: .35, metalness: .1 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = .018;
    scene.add(water);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(18, .72), new THREE.MeshStandardMaterial({ color: 0x786447, roughness: 1 }));
    road.rotation.x = -Math.PI / 2;
    road.position.y = .03;
    scene.add(road);
  }
  if (rule === "forest") {
    for (let index = 0; index < 18; index++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, .65, 7), new THREE.MeshStandardMaterial({ color: 0x4b321f }));
      trunk.position.y = .32;
      const crown = new THREE.Mesh(new THREE.ConeGeometry(.34, .9, 8), new THREE.MeshStandardMaterial({ color: 0x17331e, roughness: 1 }));
      crown.position.y = .92;
      tree.add(trunk, crown);
      tree.position.set(-7 + index * .82, 0, index % 2 ? -3.2 : 3.2);
      scene.add(tree);
    }
  }
  if (["high-ground", "frontier", "citadel"].includes(rule)) {
    const wallMat = new THREE.MeshStandardMaterial({ color: rule === "citadel" ? 0x302f35 : 0x50483c, roughness: .92 });
    for (let index = -4; index <= 4; index++) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.15 + (index % 2) * .12, .7), wallMat);
      wall.position.set(index * 1.05, .58, -3.1);
      wall.castShadow = true;
      scene.add(wall);
    }
  }
}

export function BattleDiorama({ rolling, result, attackers, defenders, fieldRule, reducedMotion = false, enemyColor = "#e3d7bd", enemySigil = "◆", enemyName = "rival army" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rollingRef = useRef(rolling);
  const resultRef = useRef(result);
  const attackersRef = useRef(attackers);
  const defendersRef = useRef(defenders);
  const formationsRef = useRef<{ royal: THREE.Group; enemy: THREE.Group } | null>(null);
  const [fallback, setFallback] = useState(false);
  useEffect(() => { rollingRef.current = rolling; }, [rolling]);
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => {
    attackersRef.current = attackers;
    defendersRef.current = defenders;
    if (!formationsRef.current || resultRef.current) return;
    fillFormation(formationsRef.current.royal, attackers, 3, 0x174e88, 0xe2b955, 1);
    fillFormation(formationsRef.current.enemy, defenders, 8, Number.parseInt(enemyColor.replace("#", ""), 16), 0xd1c2a6, -1);
  }, [attackers, defenders, enemyColor]);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(fieldRule === "winter" ? 0x27333a : 0x17130e);
    scene.fog = new THREE.Fog(fieldRule === "winter" ? 0x6e7b80 : 0x6a4b32, 7, 18);
    const camera = new THREE.PerspectiveCamera(36, host.clientWidth / host.clientHeight, .1, 60);
    camera.position.set(0, 4.5, 8.6);
    camera.lookAt(0, .4, 0);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(fieldRule === "winter" ? 0xdcefff : 0xffd7a1, 0x25190f, 1.8));
    const sun = new THREE.DirectionalLight(fieldRule === "winter" ? 0xc9e4ff : 0xffbd76, 3.8);
    sun.position.set(-3, 8, 4);
    sun.castShadow = true;
    scene.add(sun);
    addTerrain(scene, fieldRule);
    const royal = new THREE.Group();
    const enemy = new THREE.Group();
    fillFormation(royal, attackersRef.current, 3, 0x174e88, 0xe2b955, 1);
    fillFormation(enemy, defendersRef.current, 8, Number.parseInt(enemyColor.replace("#", ""), 16), 0xd1c2a6, -1);
    royal.position.x = -3.2;
    enemy.position.x = 3.1;
    scene.add(royal, enemy);
    formationsRef.current = { royal, enemy };
    const banner = (color: number, x: number) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x8c6739 }));
      pole.position.set(x, 1.1, -1.8);
      scene.add(pole);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(.8, .9), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: .75 }));
      cloth.position.set(x + (x < 0 ? .4 : -.4), 1.65, -1.8);
      scene.add(cloth);
    };
    banner(0x174e88, -4.7);
    banner(Number.parseInt(enemyColor.replace("#", ""), 16), 4.7);
    const arrows = new THREE.Group();
    if (attackersRef.current.archers > 0 || defendersRef.current.archers > 0) for (let index = 0; index < 12; index++) {
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(.025, .18, 6), new THREE.MeshStandardMaterial({ color: 0xe6c28a, metalness: .3 }));
      arrow.rotation.z = Math.PI / 2;
      arrow.position.set(2.5 + Math.random(), 1 + Math.random() * 1.8, -1.8 + Math.random() * 3.8);
      arrow.userData.speed = .015 + Math.random() * .015;
      arrows.add(arrow);
    }
    scene.add(arrows);
    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const charge = rollingRef.current && !resultRef.current;
      const royalTarget = charge ? -1.05 : -3.2;
      const enemyTarget = charge ? 1.05 : resultRef.current?.captured ? 4.3 : 3.1;
      if (!reducedMotion) {
        royal.position.x += (royalTarget - royal.position.x) * .055;
        enemy.position.x += (enemyTarget - enemy.position.x) * .05;
        const resultNow = resultRef.current;
        royal.children.forEach((unit, index) => {
          const fallen = resultNow && index >= royal.children.length - resultNow.attackerLosses.length;
          unit.rotation.z += ((fallen ? -1.35 : 0) - unit.rotation.z) * .08;
          unit.position.y += ((fallen ? -.08 : Math.sin(time * 3 + index) * .015) - unit.position.y) * .08;
        });
        enemy.children.forEach((unit, index) => {
          const fallen = resultNow && index >= enemy.children.length - resultNow.defenderLosses.length;
          unit.rotation.z += ((fallen ? 1.35 : 0) - unit.rotation.z) * .08;
          unit.position.y += ((fallen ? -.08 : Math.sin(time * 2.6 + index) * .012) - unit.position.y) * .08;
        });
        arrows.children.forEach(arrow => {
          arrow.position.x -= arrow.userData.speed * (charge ? 3.4 : .35);
          arrow.position.y -= arrow.userData.speed * .3;
          if (arrow.position.x < -4) arrow.position.set(3.5, 1.6 + Math.random(), -1.8 + Math.random() * 3.8);
        });
        camera.position.x = Math.sin(time * .22) * .16;
        camera.lookAt(0, .4, 0);
      }
      renderer.render(scene, camera);
    };
    animate();
    const observer = new ResizeObserver(() => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    });
    observer.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      renderer.dispose();
      formationsRef.current = null;
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [reducedMotion, enemyColor, fieldRule]);
  if (fallback) return <div className={`battle-diorama fallback-battle ${rolling ? "rolling" : ""} ${result ? "resolved" : ""}`} style={{ "--enemy-army": enemyColor } as React.CSSProperties} role="img" aria-label={`Illustrated medieval field battle against ${enemyName}`}><div className="fallback-army royal">♞<i/><i/><i/></div><div className="fallback-army enemy">{enemySigil}<i/><i/><i/><i/></div><div className="fallback-arrows">➵ ➵ ➵</div></div>;
  return <div className="battle-diorama" ref={hostRef} aria-label="Three-dimensional medieval field battle with infantry, archers and cavalry" />;
}

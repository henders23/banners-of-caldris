"use client";

/* WebGL capability is only knowable after the host mounts; failure activates the complete fallback theatre. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { BattleResult } from "@/lib/game";

type Props = { rolling: boolean; result: BattleResult | null; reducedMotion?: boolean; enemyColor?: string; enemySigil?: string; enemyName?: string };

function soldier(color: number, metal: number, x: number, z: number, cavalry = false) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, .38, 8), new THREE.MeshStandardMaterial({ color, roughness: .65 }));
  body.position.y = cavalry ? .46 : .28;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 8), new THREE.MeshStandardMaterial({ color: metal, metalness: .72, roughness: .25 }));
  head.position.y = cavalry ? .72 : .54;
  group.add(head);
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .025, 10), new THREE.MeshStandardMaterial({ color, metalness: .25, roughness: .45 }));
  shield.rotation.x = Math.PI / 2;
  shield.rotation.z = Math.PI / 2;
  shield.position.set(.13, cavalry ? .49 : .34, 0);
  group.add(shield);
  if (cavalry) {
    const horse = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .42, 5, 10), new THREE.MeshStandardMaterial({ color: 0x3a281c, roughness: .86 }));
    horse.rotation.z = Math.PI / 2;
    horse.position.y = .25;
    group.add(horse);
  }
  group.position.set(x, 0, z);
  return group;
}

export function BattleDiorama({ rolling, result, reducedMotion = false, enemyColor = "#e3d7bd", enemySigil = "◆", enemyName = "rival army" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rollingRef = useRef(rolling);
  const [fallback, setFallback] = useState(false);
  useEffect(() => { rollingRef.current = rolling; }, [rolling]);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x17130e);
    scene.fog = new THREE.Fog(0x6a4b32, 7, 18);
    const camera = new THREE.PerspectiveCamera(36, host.clientWidth / host.clientHeight, .1, 60);
    camera.position.set(0, 4.5, 8.6);
    camera.lookAt(0, .4, 0);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffd7a1, 0x25190f, 1.8));
    const sun = new THREE.DirectionalLight(0xffbd76, 3.8);
    sun.position.set(-3, 8, 4);
    sun.castShadow = true;
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(18, 10, 24, 16), new THREE.MeshStandardMaterial({ color: 0x54432d, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x50483c, roughness: .92 });
    for (let i = -4; i <= 4; i++) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3 + (i % 2) * .12, .7), wallMat);
      wall.position.set(i * 1.05, .65, -3.1);
      wall.castShadow = true;
      scene.add(wall);
    }
    const gate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, .76), new THREE.MeshStandardMaterial({ color: 0x211a14, roughness: .9 }));
    gate.position.set(0, .48, -2.75);
    scene.add(gate);

    const royal = new THREE.Group();
    const enemy = new THREE.Group();
    for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
      royal.add(soldier(0x174e88, 0xe2b955, -3.7 - row * .2, -1.2 + col * .52, row === 0 && col < 3));
      enemy.add(soldier(Number.parseInt(enemyColor.replace("#", ""), 16), 0x9b2b24, 3.7 + row * .2, -1.2 + col * .52, false));
    }
    royal.name = "royal";
    enemy.name = "enemy";
    scene.add(royal, enemy);

    const banner = (color: number, x: number) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x8c6739 }));
      pole.position.set(x, 1.1, -1.8);
      scene.add(pole);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(.8, .9), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: .75 }));
      cloth.position.set(x + (x < 0 ? .4 : -.4), 1.65, -1.8);
      scene.add(cloth);
    };
    banner(0x174e88, -4.7); banner(Number.parseInt(enemyColor.replace("#", ""), 16), 4.7);

    const arrowGeometry = new THREE.ConeGeometry(.025, .18, 6);
    const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0xe6c28a, metalness: .3 });
    const arrows = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
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
      const t = clock.getElapsedTime();
      if (!reducedMotion) {
        royal.position.x = Math.min(1.5, -Math.max(0, 2.6 - t * .48));
        enemy.position.x = Math.max(-1.5, Math.max(0, 2.6 - t * .44));
        arrows.children.forEach(arrow => {
          arrow.position.x -= arrow.userData.speed * (rollingRef.current ? 3.4 : 1);
          arrow.position.y -= arrow.userData.speed * .3;
          if (arrow.position.x < -4) arrow.position.set(3.5, 1.6 + Math.random(), -1.8 + Math.random() * 3.8);
        });
        camera.position.x = Math.sin(t * .22) * .16;
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
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach(m => m.dispose());
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [reducedMotion, enemyColor]);
  if (fallback) return <div className={`battle-diorama fallback-battle ${rolling ? "rolling" : ""} ${result ? "resolved" : ""}`} style={{ "--enemy-army": enemyColor } as React.CSSProperties} role="img" aria-label={`Illustrated medieval field battle against ${enemyName}`}><div className="fallback-army royal">♞<i/><i/><i/><i/></div><div className="fallback-army enemy">{enemySigil}<i/><i/><i/><i/></div><div className="fallback-arrows">➵ ➵ ➵</div></div>;
  return <div className="battle-diorama" ref={hostRef} aria-label="Three-dimensional medieval field battle" />;
}

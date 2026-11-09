"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { AvatarKind } from "@/lib/profile";

export type Mood = "idle" | "happy" | "sad" | "think" | "wave";

const LOOKS: Record<AvatarKind, { skin: string; hair: string; top: string; trim: string; legs: string; shoes: string }> = {
  male: { skin: "#c98d6b", hair: "#2a1d17", top: "#3f6ff2", trim: "#ffffff", legs: "#263149", shoes: "#f2f2f2" },
  female: { skin: "#e2b08f", hair: "#4a2a1c", top: "#ff7a59", trim: "#ffe2d6", legs: "#2f2a4a", shoes: "#ffffff" },
};

/** Transient moods play once, then the character returns to idle. */
const DURATION: Record<Mood, number> = { idle: Infinity, happy: 1.8, sad: 2.0, think: Infinity, wave: 2.4 };

function Character({ kind, mood, moodKey }: { kind: AvatarKind; mood: Mood; moodKey: number }) {
  const look = LOOKS[kind];
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const started = useRef(0);
  const clock = useThree((s) => s.clock);

  useEffect(() => {
    started.current = clock.getElapsedTime();
  }, [moodKey, mood, clock]);

  const mat = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: look.skin, roughness: 0.6 }),
      hair: new THREE.MeshStandardMaterial({ color: look.hair, roughness: 0.8 }),
      top: new THREE.MeshStandardMaterial({ color: look.top, roughness: 0.55 }),
      trim: new THREE.MeshStandardMaterial({ color: look.trim, roughness: 0.6 }),
      legs: new THREE.MeshStandardMaterial({ color: look.legs, roughness: 0.7 }),
      shoes: new THREE.MeshStandardMaterial({ color: look.shoes, roughness: 0.4 }),
      eye: new THREE.MeshStandardMaterial({ color: "#14121f", roughness: 0.2 }),
      shine: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      cheek: new THREE.MeshStandardMaterial({ color: "#ff8f8f", transparent: true, opacity: 0.55 }),
      laptop: new THREE.MeshStandardMaterial({ color: "#c9cfe3", metalness: 0.4, roughness: 0.35 }),
      screen: new THREE.MeshBasicMaterial({ color: "#72a7ff" }),
    }),
    [look],
  );

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    const since = t - started.current;
    const active: Mood = since < DURATION[mood] ? mood : "idle";
    const k = 1 - Math.pow(0.001, dt); // smooth damping

    let y = Math.sin(t * 2) * 0.025;
    let bodyX = 0;
    let headX = Math.sin(t * 1.3) * 0.03;
    let headZ = 0;
    let aL = 0.18,
      aR = -0.18,
      aLx = 0,
      aRx = 0;
    let spin = state.pointer.x * 0.45;

    if (active === "happy") {
      const p = Math.min(since / 0.7, 1);
      y += Math.abs(Math.sin(since * 7)) * 0.32 * (1 - p * 0.6);
      aL = 2.6;
      aR = -2.6;
      spin += Math.sin(since * 4) * 0.25;
      headX = -0.15;
    } else if (active === "sad") {
      y -= 0.06;
      bodyX = 0.12;
      headX = 0.42;
      aL = 0.05;
      aR = -0.05;
      headZ = Math.sin(since * 6) * 0.12 * Math.max(0, 1 - since); // head shake
    } else if (active === "think") {
      headZ = 0.18;
      headX = -0.08;
      aR = -0.4;
      aRx = -2.1;
    } else if (active === "wave") {
      aR = -2.5 + Math.sin(since * 10) * 0.35;
    }

    if (root.current) {
      root.current.position.y += (y - root.current.position.y) * k * 3;
      root.current.rotation.y += (spin - root.current.rotation.y) * k;
    }
    if (body.current) body.current.rotation.x += (bodyX - body.current.rotation.x) * k;
    if (head.current) {
      head.current.rotation.x += (headX - head.current.rotation.x) * k;
      head.current.rotation.z += (headZ - head.current.rotation.z) * k;
    }
    if (armL.current) {
      armL.current.rotation.z += (aL - armL.current.rotation.z) * k;
      armL.current.rotation.x += (aLx - armL.current.rotation.x) * k;
    }
    if (armR.current) {
      armR.current.rotation.z += (aR - armR.current.rotation.z) * k;
      armR.current.rotation.x += (aRx - armR.current.rotation.x) * k;
    }
    if (mouth.current) {
      const smile = active === "sad" ? Math.PI : 0;
      mouth.current.rotation.z += (smile - mouth.current.rotation.z) * k;
      const s = active === "happy" ? 1.35 : 1;
      mouth.current.scale.setScalar(mouth.current.scale.x + (s - mouth.current.scale.x) * k);
    }
  });

  const female = kind === "female";

  return (
    <group ref={root}>
      {/* shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.55, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>

      {/* legs + shoes */}
      {[-0.13, 0.13].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.38, 0]} material={mat.legs}>
            <capsuleGeometry args={[0.1, 0.42, 6, 14]} />
          </mesh>
          <mesh position={[0, 0.07, 0.05]} material={mat.shoes}>
            <boxGeometry args={[0.2, 0.12, 0.3]} />
          </mesh>
        </group>
      ))}

      <group ref={body} position={[0, 0.7, 0]}>
        {/* torso (hoodie) */}
        <mesh position={[0, 0.34, 0]} material={mat.top}>
          <capsuleGeometry args={[0.3, 0.38, 8, 20]} />
        </mesh>
        <mesh position={[0, 0.36, 0.27]} material={mat.trim}>
          <boxGeometry args={[0.22, 0.12, 0.04]} />
        </mesh>
        {female && (
          <mesh position={[0, 0.06, 0]} material={mat.top}>
            <cylinderGeometry args={[0.32, 0.4, 0.22, 24]} />
          </mesh>
        )}

        {/* arms: pivot at the shoulder */}
        <group ref={armL} position={[0.36, 0.6, 0]}>
          <mesh position={[0, -0.22, 0]} material={mat.top}>
            <capsuleGeometry args={[0.085, 0.3, 6, 12]} />
          </mesh>
          <mesh position={[0, -0.44, 0]} material={mat.skin}>
            <sphereGeometry args={[0.08, 16, 16]} />
          </mesh>
        </group>
        <group ref={armR} position={[-0.36, 0.6, 0]}>
          <mesh position={[0, -0.22, 0]} material={mat.top}>
            <capsuleGeometry args={[0.085, 0.3, 6, 12]} />
          </mesh>
          <mesh position={[0, -0.44, 0]} material={mat.skin}>
            <sphereGeometry args={[0.08, 16, 16]} />
          </mesh>
        </group>

        {/* head */}
        <group ref={head} position={[0, 0.98, 0]}>
          <mesh material={mat.skin}>
            <sphereGeometry args={[0.36, 32, 32]} />
          </mesh>
          {/* ears */}
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} position={[x, -0.02, 0]} material={mat.skin}>
              <sphereGeometry args={[0.07, 12, 12]} />
            </mesh>
          ))}
          {/* hair cap */}
          <mesh position={[0, 0.05, -0.02]} rotation-x={-0.25} material={mat.hair}>
            <sphereGeometry args={[0.385, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          </mesh>
          {!female && (
            <mesh position={[0.08, 0.27, 0.22]} rotation={[0.6, 0, -0.3]} material={mat.hair}>
              <boxGeometry args={[0.36, 0.1, 0.16]} />
            </mesh>
          )}
          {female && (
            <>
              <mesh position={[0, -0.18, -0.2]} material={mat.hair}>
                <capsuleGeometry args={[0.3, 0.42, 8, 20]} />
              </mesh>
              {[-0.3, 0.3].map((x) => (
                <mesh key={x} position={[x, -0.16, 0.06]} material={mat.hair}>
                  <capsuleGeometry args={[0.08, 0.38, 6, 12]} />
                </mesh>
              ))}
              <mesh position={[-0.18, 0.3, 0.18]} material={mat.trim}>
                <sphereGeometry args={[0.05, 12, 12]} />
              </mesh>
            </>
          )}
          {/* eyes */}
          {[-0.12, 0.12].map((x) => (
            <group key={x} position={[x, 0.03, 0.315]}>
              <mesh material={mat.eye}>
                <sphereGeometry args={[0.055, 16, 16]} />
              </mesh>
              <mesh position={[0.018, 0.02, 0.045]} material={mat.shine}>
                <sphereGeometry args={[0.015, 8, 8]} />
              </mesh>
            </group>
          ))}
          {[-0.2, 0.2].map((x) => (
            <mesh key={x} position={[x, -0.07, 0.29]} material={mat.cheek}>
              <sphereGeometry args={[0.045, 12, 12]} />
            </mesh>
          ))}
          {/* mouth: half torus, flips for sad */}
          <mesh ref={mouth} position={[0, -0.11, 0.33]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.06, 0.014, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#5a2a2a" />
          </mesh>
        </group>
      </group>

      {/* laptop floating beside the character */}
      <group position={[0.75, 0.75, 0.2]} rotation={[0, -0.6, 0]}>
        <mesh material={mat.laptop}>
          <boxGeometry args={[0.42, 0.02, 0.3]} />
        </mesh>
        <mesh position={[0, 0.15, -0.15]} rotation-x={-0.25} material={mat.laptop}>
          <boxGeometry args={[0.42, 0.3, 0.02]} />
        </mesh>
        <mesh position={[0, 0.15, -0.138]} rotation-x={-0.25} material={mat.screen}>
          <planeGeometry args={[0.37, 0.25]} />
        </mesh>
      </group>
    </group>
  );
}

function Rig() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.lookAt(0, 1.0, 0);
  }, [camera]);
  return null;
}

export default function Avatar3D({ kind, mood = "idle", moodKey = 0, className = "" }: { kind: AvatarKind; mood?: Mood; moodKey?: number; className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 1.3, 4.1], fov: 34 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Rig />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.6} />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#72a7ff" />
        <Character kind={kind} mood={mood} moodKey={moodKey} />
      </Canvas>
    </div>
  );
}

'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Pieza 3D del hero y momento de firma del sitio: nueve nodos (uno por universidad) que al
 * cargar están dispersos y "se sientan a la mesa" — convergen a sus asientos con una curva
 * cinemática mientras las aristas se dibujan entre ellos. Después orbitan despacio y se
 * inclinan siguiendo al puntero. En móvil baja dpr y partículas; con prefers-reduced-motion
 * aparecen ya sentados y no rotan.
 */

const INK = '#101511';
const JADE = '#0b6b5a';
const AMBER = '#d9a93a';

/** Posiciones fijas (no aleatorias) para que la figura sea reconocible entre visitas. */
const NODES: [number, number, number][] = [
  [0, 0, 0],
  [1.6, 0.9, -0.4],
  [-1.5, 1.1, 0.3],
  [1.2, -1.3, 0.6],
  [-1.3, -1.0, -0.7],
  [0.3, 1.9, 0.9],
  [-0.4, -1.9, -0.2],
  [2.1, -0.2, -1.1],
  [-2.0, 0.1, 1.0],
];

/** Posiciones de partida (dispersas) desde las que cada nodo llega a su asiento. */
const SCATTERED: [number, number, number][] = [
  [0.4, -3.2, 2.5],
  [4.2, 2.6, -2.8],
  [-4.4, 3.1, 1.6],
  [3.6, -3.4, 2.2],
  [-3.8, -2.9, -2.6],
  [1.2, 4.4, 2.4],
  [-1.4, -4.6, -1.2],
  [5.1, -0.8, -3.2],
  [-5.2, 0.6, 2.8],
];

/** Aristas: hub + anillo + un par de cruces, como una red y no un grafo completo. */
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [1, 5],
  [1, 7],
  [2, 5],
  [2, 8],
  [3, 6],
  [3, 7],
  [4, 6],
  [4, 8],
  [7, 3],
];

function Dust({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const r = 3.2 + rnd() * 4;
      const t = rnd() * Math.PI * 2;
      const p = Math.acos(2 * rnd() - 1);
      arr[i * 3] = r * Math.sin(p) * Math.cos(t);
      arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      arr[i * 3 + 2] = r * Math.cos(p) - 2;
    }
    return arr;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={INK} size={0.028} sizeAttenuation transparent opacity={0.35} />
    </points>
  );
}

const ASSEMBLY_MS = 2200;
const DELAY_MS = 350;
/** cubic-bezier(0.83, 0, 0.17, 1) aproximado: lento al inicio, llega con decisión. */
const cinematic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Graph({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const lines = useRef<(THREE.Object3D | null)[]>([]);
  const pointer = useThree((s) => s.pointer);
  const target = useRef({ x: 0, y: 0 });
  const start = useRef<number | null>(null);
  const done = useRef(reduced);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;

    // Firma: cada nodo viaja de su posición dispersa a su asiento, con un retardo irregular
    if (!done.current) {
      if (start.current === null) start.current = state.clock.elapsedTime * 1000;
      const elapsed = state.clock.elapsedTime * 1000 - start.current - DELAY_MS;
      let allDone = true;
      NODES.forEach((seat, i) => {
        const m = nodes.current[i];
        if (!m) return;
        const local = Math.max(0, elapsed - ((i * 137) % 9) * 60);
        const t = Math.min(1, local / ASSEMBLY_MS);
        if (t < 1) allDone = false;
        const e = cinematic(t);
        m.position.set(
          THREE.MathUtils.lerp(SCATTERED[i][0], seat[0], e),
          THREE.MathUtils.lerp(SCATTERED[i][1], seat[1], e),
          THREE.MathUtils.lerp(SCATTERED[i][2], seat[2], e)
        );
        m.scale.setScalar(0.2 + 0.8 * e);
      });
      // Las aristas aparecen cuando ambos extremos están casi sentados
      EDGES.forEach(([a, b], i) => {
        const l = lines.current[i];
        if (!l) return;
        const ta = Math.min(1, Math.max(0, elapsed - ((a * 137) % 9) * 60) / ASSEMBLY_MS);
        const tb = Math.min(1, Math.max(0, elapsed - ((b * 137) % 9) * 60) / ASSEMBLY_MS);
        const v = Math.max(0, Math.min(ta, tb) - 0.75) / 0.25;
        l.visible = v > 0;
        l.scale.setScalar(v > 0 ? v : 0.0001);
      });
      if (allDone) done.current = true;
    }

    if (reduced) return;
    // Rotación base lenta + inclinación hacia el puntero con interpolación suave
    target.current.x = THREE.MathUtils.lerp(target.current.x, pointer.y * 0.35, 0.04);
    target.current.y = THREE.MathUtils.lerp(target.current.y, pointer.x * 0.5, 0.04);
    g.rotation.y += dt * 0.12;
    g.rotation.x = -target.current.x;
    g.rotation.z = target.current.y * 0.25;
  });

  return (
    <group ref={group} rotation={[0.2, 0.4, 0]}>
      {EDGES.map(([a, b], i) => (
        <group
          key={`${a}-${b}`}
          ref={(n) => {
            lines.current[i] = n;
          }}
          visible={reduced}
        >
          <Line
            points={[NODES[a], NODES[b]]}
            color={INK}
            lineWidth={1}
            transparent
            opacity={0.32}
          />
        </group>
      ))}
      {NODES.map((p, i) => (
        <mesh
          key={i}
          position={reduced ? p : SCATTERED[i]}
          ref={(n) => {
            nodes.current[i] = n;
          }}
        >
          <sphereGeometry args={[i === 0 ? 0.16 : 0.09, 24, 24]} />
          <meshStandardMaterial
            color={i === 0 ? AMBER : i % 3 === 0 ? JADE : INK}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
      ))}
      {/* Anillo orbital fino alrededor del hub: la "mesa" común */}
      <mesh rotation={[Math.PI / 2.4, 0, 0.4]}>
        <torusGeometry args={[2.55, 0.006, 8, 160]} />
        <meshBasicMaterial color={JADE} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function Constellation({ mobile = false }: { mobile?: boolean }) {
  const reduced = prefersReducedMotion();
  return (
    <Canvas
      dpr={mobile ? 1 : [1, 1.75]}
      camera={{ position: [0, 0, 9.5], fov: 36 }}
      gl={{ alpha: true, antialias: !mobile, powerPreference: 'high-performance' }}
      frameloop={reduced ? 'demand' : 'always'}
      className="!pointer-events-none"
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <Graph reduced={reduced} />
      <Dust count={mobile ? 220 : 520} />
    </Canvas>
  );
}

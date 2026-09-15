'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Pieza 3D del hero: una constelación de 9 nodos (una por universidad) unidos por aristas,
 * más un polvo de partículas al fondo. Orbita lentamente y se inclina siguiendo al puntero.
 * En móvil baja dpr y partículas; con prefers-reduced-motion no rota ni sigue al puntero.
 */

const INK = '#16150f';
const JADE = '#0f6e5a';
const AMBER = '#c9782a';

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

function Graph({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useThree((s) => s.pointer);
  const target = useRef({ x: 0, y: 0 });

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
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
      {EDGES.map(([a, b]) => (
        <Line
          key={`${a}-${b}`}
          points={[NODES[a], NODES[b]]}
          color={INK}
          lineWidth={1}
          transparent
          opacity={0.32}
        />
      ))}
      {NODES.map((p, i) => (
        <mesh key={i} position={p}>
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

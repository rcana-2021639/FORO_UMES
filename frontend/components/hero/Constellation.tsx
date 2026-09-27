'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Pieza 3D del hero: la mesa redonda. Nueve asientos (uno por universidad) sobre un anillo,
 * vistos desde arriba y en diagonal; al cargar llegan dispersos y "se sientan", y entre ellos
 * se dibuja la estrella de nueve puntas {9/4}: todas hablan con todas, nadie preside. Después
 * la mesa gira despacio y se inclina siguiendo al puntero. En móvil baja dpr y partículas;
 * con prefers-reduced-motion aparecen ya sentados y no gira.
 */

const INK = '#1e1830';
const JADE = '#6443c4';
const JADE_2 = '#ebcff2';
const AMBER = '#f3d9f0';
const VIOLET = '#7c5ae0';
const SKY = '#d7daff';
const PAPER = '#fdfcff';

const N = 9;
const R = 2.35;

/** Asientos: equidistantes sobre el anillo, en el plano XZ (la mesa). */
const SEATS: [number, number, number][] = Array.from({ length: N }, (_, i) => {
  const a = (i / N) * Math.PI * 2 - Math.PI / 2;
  return [R * Math.cos(a), 0, R * Math.sin(a)];
});

/** Posiciones de partida (dispersas, arriba y lejos) desde las que cada silla llega a la mesa. */
const SCATTERED: [number, number, number][] = [
  [0.4, 4.2, 2.5],
  [4.2, 3.6, -2.8],
  [-4.4, 5.1, 1.6],
  [3.6, 2.4, 3.2],
  [-3.8, 3.9, -2.6],
  [1.2, 6.4, 2.4],
  [-1.4, 3.6, -3.2],
  [5.1, 4.8, -0.2],
  [-5.2, 2.6, 2.8],
];

/** Estrella {9/4}: cada asiento se une con el cuarto siguiente. */
const CHORDS: [number, number][] = Array.from({ length: N }, (_, i) => [i, (i + 4) % N]);

const COLORS = [AMBER, JADE_2, VIOLET, SKY, JADE, AMBER, VIOLET, SKY, JADE_2];

function Dust({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const r = 3.4 + rnd() * 4;
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
      <pointsMaterial color={INK} size={0.026} sizeAttenuation transparent opacity={0.3} />
    </points>
  );
}

const ASSEMBLY_MS = 2200;
const DELAY_MS = 350;
/** cubic-bezier(0.83, 0, 0.17, 1) aproximado: lento al inicio, llega con decisión. */
const cinematic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Table({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const seats = useRef<(THREE.Group | null)[]>([]);
  const chords = useRef<(THREE.Object3D | null)[]>([]);
  const pointer = useThree((s) => s.pointer);
  const target = useRef({ x: 0, y: 0 });
  const start = useRef<number | null>(null);
  const done = useRef(reduced);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    if (!done.current) {
      if (start.current === null) start.current = t * 1000;
      const elapsed = t * 1000 - start.current - DELAY_MS;
      let allDone = true;
      SEATS.forEach((seat, i) => {
        const m = seats.current[i];
        if (!m) return;
        const local = Math.max(0, elapsed - ((i * 137) % 9) * 70);
        const k = Math.min(1, local / ASSEMBLY_MS);
        if (k < 1) allDone = false;
        const e = cinematic(k);
        m.position.set(
          THREE.MathUtils.lerp(SCATTERED[i][0], seat[0], e),
          THREE.MathUtils.lerp(SCATTERED[i][1], seat[1], e),
          THREE.MathUtils.lerp(SCATTERED[i][2], seat[2], e)
        );
        m.scale.setScalar(0.2 + 0.8 * e);
      });
      CHORDS.forEach(([a, b], i) => {
        const l = chords.current[i];
        if (!l) return;
        const ta = Math.min(1, Math.max(0, elapsed - ((a * 137) % 9) * 70) / ASSEMBLY_MS);
        const tb = Math.min(1, Math.max(0, elapsed - ((b * 137) % 9) * 70) / ASSEMBLY_MS);
        const v = Math.max(0, Math.min(ta, tb) - 0.8) / 0.2;
        l.visible = v > 0;
        l.scale.setScalar(v > 0 ? v : 0.0001);
      });
      if (allDone) done.current = true;
    } else if (!reduced) {
      // Respiración: cada asiento flota un poco, desfasado
      seats.current.forEach((m, i) => {
        if (m) m.position.y = Math.sin(t * 0.9 + i * 0.7) * 0.06;
      });
    }

    if (reduced) return;
    target.current.x = THREE.MathUtils.lerp(target.current.x, pointer.y * 0.22, 0.04);
    target.current.y = THREE.MathUtils.lerp(target.current.y, pointer.x * 0.35, 0.04);
    if (spin.current) spin.current.rotation.y += dt * 0.1;
    g.rotation.x = 1.12 - target.current.x;
    g.rotation.z = target.current.y * 0.25;
  });

  return (
    <group ref={group} rotation={[1.12, 0, 0]}>
      <group ref={spin}>
        {/* Tablero: disco translúcido con borde, la superficie común */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <circleGeometry args={[R + 0.35, 96]} />
          <meshBasicMaterial color={PAPER} transparent opacity={0.28} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[R + 0.3, R + 0.35, 128]} />
          <meshBasicMaterial color={JADE} transparent opacity={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[R - 0.02, R + 0.02, 128]} />
          <meshBasicMaterial color={INK} transparent opacity={0.18} />
        </mesh>
        {/* Halo central: la mesa no tiene cabecera, tiene centro */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <circleGeometry args={[0.55, 48]} />
          <meshBasicMaterial color={AMBER} transparent opacity={0.22} />
        </mesh>

        {/* Estrella {9/4} entre asientos */}
        {CHORDS.map(([a, b], i) => (
          <group
            key={`${a}-${b}`}
            ref={(n) => {
              chords.current[i] = n;
            }}
            visible={reduced}
          >
            <Line
              points={[SEATS[a], SEATS[b]]}
              color={INK}
              lineWidth={1}
              transparent
              opacity={0.28}
            />
          </group>
        ))}

        {/* Asientos */}
        {SEATS.map((p, i) => (
          <group
            key={i}
            position={reduced ? p : SCATTERED[i]}
            ref={(n) => {
              seats.current[i] = n;
            }}
          >
            <mesh>
              <sphereGeometry args={[0.13, 28, 28]} />
              <meshStandardMaterial color={COLORS[i]} roughness={0.45} metalness={0.08} />
            </mesh>
            {/* Aro del asiento: la silla */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
              <ringGeometry args={[0.2, 0.235, 40]} />
              <meshBasicMaterial
                color={COLORS[i]}
                transparent
                opacity={0.55}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export default function Constellation({ mobile = false }: { mobile?: boolean }) {
  const reduced = prefersReducedMotion();
  return (
    <Canvas
      dpr={mobile ? 1 : [1, 1.75]}
      camera={{ position: [0, 2.4, 11.5], fov: 34 }}
      gl={{ alpha: true, antialias: !mobile, powerPreference: 'high-performance' }}
      frameloop={reduced ? 'demand' : 'always'}
      className="!pointer-events-none"
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.7} />
      <Table reduced={reduced} />
      <Dust count={mobile ? 200 : 480} />
    </Canvas>
  );
}

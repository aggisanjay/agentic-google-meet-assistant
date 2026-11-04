"use client";

/**
 * Hero scene: a week of Google Calendar as polished obsidian-glass tiles on a floating board.
 * A meeting proposal runs the agent's REAL flow (see backend/src/services):
 *   intent -> freebusy scan -> conflict -> resolve to a free gap -> confirm -> Meet link + provenance
 * All geometry is procedural; all text is baked into canvas textures (no network, no font CDN).
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, Environment, Lightformer, MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export type HeroPhase = 0 | 1 | 2 | 3 | 4 | 5;

type Props = {
  scrollRef?: React.MutableRefObject<number>;
  reduced?: boolean;
  visible?: boolean;
  onPhase?: (p: HeroPhase) => void;
  onReady?: () => void;
  /** Freeze the choreography at this time (seconds). Used for the poster and for tests: ?ht=7.6 */
  freezeAt?: number | null;
};

/* ───────── layout of the board ───────── */
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const H0 = 9;
const H1 = 18;
const BW = 8.2; // board width  (x)
const BD = 6.0; // board depth  (z)
const GX0 = -BW / 2 + 0.62;
const GX1 = BW / 2 - 0.22;
const GZ0 = -BD / 2 + 0.74;
const GZ1 = BD / 2 - 0.22;
const COLW = (GX1 - GX0) / DAYS.length;
const ROWH = (GZ1 - GZ0) / (H1 - H0);

const slot = (day: number, start: number, end: number) => {
  const w = COLW * 0.88;
  const d = (end - start) * ROWH * 0.92;
  return {
    x: GX0 + (day + 0.5) * COLW,
    z: GZ0 + ((start + end) / 2 - H0) * ROWH,
    w,
    d,
  };
};

const EVENTS = [
  { day: 0, s: 9, e: 9.5, t: "Standup", k: "09:00" },
  { day: 0, s: 11, e: 12.5, t: "Design review", k: "11:00" },
  { day: 1, s: 10, e: 11, t: "Planning", k: "10:00" },
  { day: 1, s: 14, e: 15, t: "1:1 · Priya", k: "14:00" },
  { day: 2, s: 10, e: 11, t: "Client call", k: "10:00" },
  { day: 2, s: 12, e: 13, t: "Lunch", k: "12:00" },
  { day: 2, s: 15, e: 16, t: "Sprint planning", k: "15:00", conflict: true },
  { day: 3, s: 13, e: 14.5, t: "Interview", k: "13:00" },
  { day: 3, s: 16, e: 17, t: "Retro", k: "16:00" },
  { day: 4, s: 11, e: 12, t: "Demo day", k: "11:00" },
  { day: 4, s: 15, e: 16, t: "Team sync", k: "15:00" },
];

const GREEN = new THREE.Color("#2bd98a");
const AMBER = new THREE.Color("#ffb454");
const SLATE = new THREE.Color("#7f978d");

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

/* ───────── textures (canvas -> texture) ───────── */
function labelTexture(w: number, d: number, title: string, time: string, color = "#e8efea") {
  const W = 640;
  const H = Math.max(96, Math.round((W * d) / w));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, W, H);
  const fs = Math.min(40, H * 0.42);
  g.fillStyle = color;
  g.textBaseline = "middle";
  g.font = `600 ${fs}px "Geist Variable", ui-sans-serif, system-ui, sans-serif`;
  g.fillText(title, 34, H / 2 - (H > 120 ? fs * 0.45 : 0));
  if (H > 120) {
    g.fillStyle = "rgba(232,239,234,0.55)";
    g.font = `500 ${fs * 0.62}px "Geist Mono Variable", ui-monospace, monospace`;
    g.fillText(time, 34, H / 2 + fs * 0.62);
  } else {
    g.fillStyle = "rgba(232,239,234,0.5)";
    g.font = `500 ${fs * 0.62}px "Geist Mono Variable", ui-monospace, monospace`;
    g.textAlign = "right";
    g.fillText(time, W - 30, H / 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function boardTexture() {
  const PPU = 220;
  const W = Math.round(BW * PPU);
  const H = Math.round(BD * PPU);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const X = (x: number) => ((x + BW / 2) / BW) * W;
  const Z = (z: number) => ((z + BD / 2) / BD) * H;

  g.fillStyle = "#17231f";
  g.fillRect(0, 0, W, H);
  // subtle vertical sheen
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "rgba(43,217,138,0.05)");
  gr.addColorStop(1, "rgba(43,217,138,0)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);

  // working-hours bands + hour lines
  for (let h = H0; h <= H1; h++) {
    const z = Z(GZ0 + (h - H0) * ROWH);
    g.strokeStyle = h % 3 === 0 ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.045)";
    g.lineWidth = h % 3 === 0 ? 2 : 1;
    g.beginPath(); g.moveTo(X(GX0 - 0.1), z); g.lineTo(X(GX1), z); g.stroke();
  }
  for (let d = 0; d <= DAYS.length; d++) {
    const x = X(GX0 + d * COLW);
    g.strokeStyle = "rgba(255,255,255,0.07)";
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, Z(GZ0 - 0.12)); g.lineTo(x, Z(GZ1)); g.stroke();
  }
  // labels
  g.fillStyle = "rgba(232,239,234,0.5)";
  g.textBaseline = "middle";
  g.font = `500 26px "Geist Mono Variable", ui-monospace, monospace`;
  g.textAlign = "right";
  for (let h = H0; h < H1; h += 1) {
    if ((h - H0) % 3 !== 0) continue;
    g.fillText(`${String(h).padStart(2, "0")}:00`, X(GX0 - 0.16), Z(GZ0 + (h - H0) * ROWH) + 2);
  }
  g.textAlign = "center";
  g.font = `600 30px "Geist Mono Variable", ui-monospace, monospace`;
  DAYS.forEach((d, i) => {
    g.fillStyle = i === 2 ? "rgba(43,217,138,0.95)" : "rgba(232,239,234,0.55)";
    g.fillText(d, X(GX0 + (i + 0.5) * COLW), Z(GZ0 - 0.38));
  });
  // today marker under WED
  g.fillStyle = "rgba(43,217,138,0.9)";
  g.beginPath(); g.arc(X(GX0 + 2.5 * COLW), Z(GZ0 - 0.18), 5, 0, Math.PI * 2); g.fill();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  return t;
}

function meetTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 192;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 512, 192);
  g.fillStyle = "#06130d";
  // generic video glyph
  const x = 70, y = 54, w = 120, h = 84, r = 20;
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x + w + 10, y + 26); g.lineTo(x + w + 52, y + 4); g.lineTo(x + w + 52, y + h - 4); g.lineTo(x + w + 10, y + h - 26); g.closePath(); g.fill();
  g.font = `700 54px "Geist Variable", ui-sans-serif, system-ui, sans-serif`;
  g.textBaseline = "middle";
  g.fillText("Meet", 296, 98);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/* ───────── pieces ───────── */
function Tile({
  x, z, w, d, label, time, tint = SLATE, glow = 0, y = 0.13, opacity = 1, innerRef, edgeRef,
}: {
  x: number; z: number; w: number; d: number; label: string; time: string;
  tint?: THREE.Color; glow?: number; y?: number; opacity?: number;
  innerRef?: React.Ref<THREE.Group>; edgeRef?: React.MutableRefObject<THREE.LineBasicMaterial | null>;
}) {
  const h = 0.16;
  const tex = useMemo(() => labelTexture(w, d, label, time), [w, d, label, time]);
  return (
    <group ref={innerRef} position={[x, y, z]}>
      <RoundedBox args={[w, h, d]} radius={0.045} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#22332c" metalness={0.2} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1}
          envMapIntensity={2.2} emissive={tint} emissiveIntensity={glow} transparent={opacity < 1} opacity={opacity}
        />
        <Edges threshold={20}>
          <lineBasicMaterial ref={edgeRef as React.Ref<THREE.LineBasicMaterial>} color={tint} transparent opacity={0.85} toneMapped={false} />
        </Edges>
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, h / 2 + 0.004, 0]}>
        <planeGeometry args={[w * 0.96, d * 0.92]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} opacity={opacity} />
      </mesh>
    </group>
  );
}

function Rig({ scrollRef, reduced, onPhase, onReady, freezeAt }: Props) {
  const { camera, pointer, size } = useThree();
  const boardTex = useMemo(() => boardTexture(), []);
  const meetTex = useMemo(() => meetTexture(), []);
  const proposalTex = useMemo(() => {
    const s = slot(2, 15, 15.5);
    return { w: s.w, d: s.d };
  }, []);

  const board = useRef<THREE.Group>(null);
  const prop = useRef<THREE.Group>(null);
  const propMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const propEdge = useRef<THREE.LineBasicMaterial | null>(null);
  const conflictEdge = useRef<THREE.LineBasicMaterial | null>(null);
  const conflictGroup = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const scanMat = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const pill = useRef<THREE.Group>(null);
  const pillMat = useRef<THREE.MeshBasicMaterial>(null);
  const beam = useRef<THREE.Mesh>(null);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);
  const lastPhase = useRef<number>(-1);
  const t0 = useRef<number>(0);
  const readyFired = useRef(false);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const T0 = useMemo(() => slot(2, 15, 15.5), []);
  const F = useMemo(() => slot(2, 16, 16.5), []);
  const LOOP = 14;

  useFrame((state, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    if (!readyFired.current) { readyFired.current = true; t0.current = state.clock.elapsedTime; onReady?.(); }
    const el = state.clock.elapsedTime - t0.current;
    // when reduced motion is requested we freeze on the "meet link" frame
    const t = freezeAt != null ? freezeAt : reduced ? 7.4 : el % LOOP;

    /* ---- choreography ---- */
    const phase: HeroPhase = t < 1.0 ? 0 : t < 2.6 ? 1 : t < 4.4 ? 2 : t < 6.2 ? 3 : t < 11.8 ? 4 : 5;
    if (phase !== lastPhase.current) { lastPhase.current = phase; onPhase?.(phase); }

    // proposal visibility + position
    const appear = outExpo(seg(t, 0.0, 0.9));
    const fadeOut = 1 - smooth(seg(t, 11.8, 13.2));
    const vis = appear * fadeOut;

    const toGap = smooth(seg(t, 2.8, 4.1));                // slide to free gap
    const px = THREE.MathUtils.lerp(T0.x, F.x, toGap);
    const pz = THREE.MathUtils.lerp(T0.z, F.z, toGap);

    const hover = 1.05 * (1 - smooth(seg(t, 0.9, 1.7)));   // descends toward the busy slot
    const lift = Math.sin(Math.PI * smooth(seg(t, 2.6, 4.4))) * 0.55;
    const settle = smooth(seg(t, 5.6, 6.2));               // locks in after confirmation
    const confirmHover = (1 - settle) * 0.34 * smooth(seg(t, 4.4, 5.0));
    const py = 0.13 + 0.02 + hover + lift + confirmHover - settle * 0.02;

    // conflict: amber flash while overlapping Sprint planning
    const conflict = smooth(seg(t, 1.9, 2.2)) * (1 - smooth(seg(t, 2.8, 3.4)));
    const shake = Math.sin(t * 60) * 0.035 * conflict;

    if (prop.current) {
      prop.current.position.set(px + shake, py, pz);
      prop.current.scale.setScalar(0.4 + 0.6 * appear);
      prop.current.visible = vis > 0.01;
    }
    if (propMat.current) {
      tmpColor.copy(GREEN).lerp(AMBER, conflict);
      propMat.current.emissive.copy(tmpColor);
      propMat.current.emissiveIntensity = (0.55 + 0.4 * conflict) * (1 - settle * 0.55);
      propMat.current.opacity = 0.2 + 0.8 * vis;
    }
    if (propEdge.current) {
      propEdge.current.color.copy(GREEN).lerp(AMBER, conflict);
      propEdge.current.opacity = vis;
    }
    // the colliding existing tile gets an amber edge while conflict is live
    if (conflictEdge.current) {
      conflictEdge.current.color.copy(SLATE).lerp(AMBER, conflict);
      conflictEdge.current.opacity = 0.85;
    }
    if (conflictGroup.current) conflictGroup.current.position.y = 0.13 + conflict * 0.05;

    // free/busy scan beam sweeping the Wednesday column
    const s = seg(t, 1.0, 2.5);
    if (scan.current && scanMat.current) {
      scan.current.position.set(slot(2, 9, 10).x, 0.2, GZ0 + (GZ1 - GZ0) * s);
      scan.current.visible = s > 0 && s < 1;
      scanMat.current.opacity = 0.55 * Math.sin(Math.PI * s);
    }

    // confirmation ring pulse
    const rp = seg(t, 5.0, 6.4);
    if (ring.current && ringMat.current) {
      ring.current.position.set(F.x, 0.16, F.z);
      const sc = 0.6 + rp * 2.4;
      ring.current.scale.set(sc, sc, sc);
      ringMat.current.opacity = rp > 0 && rp < 1 ? 0.7 * (1 - rp) : 0;
      ring.current.visible = ringMat.current.opacity > 0.01;
    }

    // Meet pill + beam rise from the confirmed event
    const mp = outExpo(seg(t, 6.2, 7.4)) * (1 - smooth(seg(t, 11.8, 12.8)));
    if (pill.current && pillMat.current) {
      pill.current.position.set(F.x, 0.5 + mp * 0.95 + Math.sin(el * 1.6) * 0.03, F.z);
      pill.current.rotation.y = Math.sin(el * 0.7) * 0.18 - 0.35;
      pill.current.scale.setScalar(0.3 + 0.7 * mp);
      pill.current.visible = mp > 0.01;
      pillMat.current.opacity = mp;
    }
    if (beam.current && beamMat.current) {
      beam.current.position.set(F.x, 0.2 + mp * 0.4, F.z);
      beam.current.scale.set(1, Math.max(0.001, mp * 0.9), 1);
      beamMat.current.opacity = 0.55 * mp;
      beam.current.visible = mp > 0.01;
    }

    /* ---- camera: slow dolly + pointer parallax + scroll ---- */
    const sp = scrollRef?.current ?? 0;
    const sway = reduced ? 0 : Math.sin(el * 0.18) * 0.5;
    const px2 = reduced ? 0 : pointer.x, py2 = reduced ? 0 : pointer.y;
    const shift = size.width > 1000 ? -3.1 : size.width > 700 ? -0.8 : 0;
    const far = size.width < 700 ? 1.55 : size.width < 1000 ? 1.15 : 1;
    camera.position.x += ((-3.0 + shift + sway + px2 * 0.8) - camera.position.x) * (1 - Math.exp(-dt * 3));
    camera.position.y += ((8.3 * far - py2 * 0.5 + sp * 1.6) - camera.position.y) * (1 - Math.exp(-dt * 3));
    camera.position.z += ((12.4 * far + sp * 2.4) - camera.position.z) * (1 - Math.exp(-dt * 3));
    camera.lookAt(0.2 + shift, -0.8, 0.4);
    if (board.current) board.current.rotation.y = sp * 0.35;
  });

  const conflictTile = EVENTS.find((e) => e.conflict)!;
  const cs = slot(conflictTile.day, conflictTile.s, conflictTile.e);

  return (
    <group>
      <group ref={board}>
        {/* floating board */}
        <RoundedBox args={[BW + 0.1, 0.14, BD + 0.1]} radius={0.09} smoothness={5} position={[0, 0, 0]} receiveShadow>
          <meshPhysicalMaterial color="#1a2823" roughness={0.28} metalness={0.5} clearcoat={0.9} envMapIntensity={2.0} />
        </RoundedBox>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0715, 0]}>
          <planeGeometry args={[BW, BD]} />
          <meshBasicMaterial map={boardTex} toneMapped={false} />
        </mesh>

        {/* existing events */}
        {EVENTS.filter((e) => !e.conflict).map((e) => {
          const s = slot(e.day, e.s, e.e);
          return <Tile key={`${e.day}-${e.s}`} x={s.x} z={s.z} w={s.w} d={s.d} label={e.t} time={e.k} />;
        })}
        <Tile
          innerRef={conflictGroup} edgeRef={conflictEdge}
          x={cs.x} z={cs.z} w={cs.w} d={cs.d} label={conflictTile.t} time={conflictTile.k}
        />

        {/* the agent's proposal */}
        <group ref={prop} visible={false}>
          <RoundedBox args={[proposalTex.w, 0.16, proposalTex.d]} radius={0.045} smoothness={4}>
            <meshPhysicalMaterial
              ref={propMat} color="#0f2a20" metalness={0.1} roughness={0.2} clearcoat={1}
              emissive={GREEN} emissiveIntensity={0.55} transparent opacity={0.9} envMapIntensity={1.4}
            />
            <Edges threshold={20}>
              <lineBasicMaterial ref={propEdge as React.Ref<THREE.LineBasicMaterial>} color={GREEN} transparent toneMapped={false} />
            </Edges>
          </RoundedBox>
          <ProposalLabel w={proposalTex.w} d={proposalTex.d} />
        </group>

        {/* free/busy scan beam */}
        <mesh ref={scan} rotation={[0, 0, 0]} visible={false}>
          <boxGeometry args={[COLW * 0.98, 0.02, 0.05]} />
          <meshBasicMaterial ref={scanMat} color={GREEN} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>

        {/* confirmation ring */}
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.36, 0.4, 64]} />
          <meshBasicMaterial ref={ringMat} color={GREEN} transparent opacity={0} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>

        {/* Meet link pill + beam */}
        <mesh ref={beam} visible={false}>
          <cylinderGeometry args={[0.012, 0.012, 1, 8]} />
          <meshBasicMaterial ref={beamMat} color={GREEN} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
        <group ref={pill} visible={false}>
          <RoundedBox args={[1.25, 0.42, 0.1]} radius={0.2} smoothness={6}>
            <meshPhysicalMaterial color="#2bd98a" emissive="#2bd98a" emissiveIntensity={0.7} roughness={0.25} clearcoat={1} />
          </RoundedBox>
          <mesh position={[0, 0, 0.056]}>
            <planeGeometry args={[1.2, 0.45]} />
            <meshBasicMaterial ref={pillMat} map={meetTex} transparent toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      </group>

      {/* reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          blur={[380, 90]} resolution={512} mixBlur={1} mixStrength={7} mirror={0.55}
          depthScale={0.8} minDepthThreshold={0.3} maxDepthThreshold={1.3}
          color="#070b0a" roughness={0.9} metalness={0.4}
        />
      </mesh>
    </group>
  );
}

function ProposalLabel({ w, d }: { w: number; d: number }) {
  const tex = useMemo(() => labelTexture(w, d, "1:1 · Bob", "+ Meet", "#c9ffe6"), [w, d]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.085, 0]}>
      <planeGeometry args={[w * 0.96, d * 0.92]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function Studio() {
  return (
    <>
      <Environment resolution={256} frames={1} background={false}>
        <Lightformer form="rect" intensity={2.6} position={[0, 6, -2]} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-7, 2, 3]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} color="#bfffe2" />
        <Lightformer form="rect" intensity={0.9} position={[7, 1, 4]} rotation-y={-Math.PI / 2} scale={[9, 3, 1]} />
      </Environment>
      <directionalLight position={[4, 8, 5]} intensity={1.4} />
      <spotLight position={[1, 9, 4]} angle={0.7} penumbra={1} intensity={90} color="#e6fff3" distance={30} />
      <pointLight position={[-4, 2.5, -2]} intensity={14} color="#2bd98a" distance={12} />
    </>
  );
}

export default function WeekScene(props: Props) {
  const { visible = true, reduced = false } = props;
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={!visible ? "never" : "always"}
      camera={{ fov: 30, position: [-3.0, 8.3, 12.4], near: 0.1, far: 80 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMappingExposure = 1.05;
        scene.fog = new THREE.Fog("#07090a", 10, 26);
      }}
      aria-hidden="true"
    >
      <Studio />
      <Rig {...props} reduced={reduced} />
    </Canvas>
  );
}

export const HERO_LOOP_SECONDS = 14;

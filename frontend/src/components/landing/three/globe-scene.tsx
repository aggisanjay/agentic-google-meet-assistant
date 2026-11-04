"use client";

/**
 * Real-data globe. Dots = Natural Earth 110m land (baked to /data/land.bin by scripts/make-land-points.mjs).
 * The day/night terminator is computed from the actual current UTC time, so what you see is true right now.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

export type City = { id: string; name: string; tz: string; lat: number; lon: number };
export const CITIES: City[] = [
  { id: "sf", name: "San Francisco", tz: "America/Los_Angeles", lat: 37.77, lon: -122.42 },
  { id: "nyc", name: "New York", tz: "America/New_York", lat: 40.71, lon: -74.0 },
  { id: "lon", name: "London", tz: "Europe/London", lat: 51.51, lon: -0.13 },
  { id: "hyd", name: "Hyderabad", tz: "Asia/Kolkata", lat: 17.38, lon: 78.48 },
  { id: "tyo", name: "Tokyo", tz: "Asia/Tokyo", lat: 35.68, lon: 139.69 },
];

const D2R = Math.PI / 180;
const toVec = (lat: number, lon: number, r = 1) =>
  new THREE.Vector3(Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)).multiplyScalar(r);

/** Sub-solar point from UTC time (declination + hour angle; ignores the equation of time, good to ~1°). */
export function sunVector(d = new Date()) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const day = Math.floor((d.getTime() - start) / 86400000);
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (day + 10));
  const hours = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  const lon = (12 - hours) * 15;
  return toVec(decl, lon);
}

const DOT_VERT = /* glsl */ `
  uniform float uSize; uniform float uPR; uniform vec3 uSun;
  varying float vDay; varying float vFront;
  void main() {
    vec3 n = normalize(position);
    vDay = dot(n, uSun);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFront = (normalMatrix * n).z;
    gl_PointSize = uSize * uPR / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const DOT_FRAG = /* glsl */ `
  varying float vDay; varying float vFront;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.25, d);
    float day = smoothstep(-0.12, 0.22, vDay);
    vec3 night = vec3(0.09, 0.30, 0.23);
    vec3 dayc = vec3(0.55, 1.0, 0.80);
    float limb = smoothstep(-0.05, 0.35, vFront);
    gl_FragColor = vec4(mix(night, dayc, day), a * (0.45 + 0.55 * day) * limb);
  }`;
const ATMO_VERT = /* glsl */ `
  varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const ATMO_FRAG = /* glsl */ `
  varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.17,0.85,0.54,1.0) * i * 0.5; }`;
const CORE_VERT = /* glsl */ `
  varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const CORE_FRAG = /* glsl */ `
  uniform vec3 uSun; varying vec3 vP;
  void main(){ float d = smoothstep(-0.15, 0.3, dot(normalize(vP), uSun)); gl_FragColor = vec4(mix(vec3(0.015,0.03,0.026), vec3(0.04,0.085,0.07), d), 1.0); }`;

function useLand() {
  const [pos, setPos] = useState<Float32Array | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/data/land.bin")
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        const raw = new Int16Array(buf);
        const out = new Float32Array((raw.length / 2) * 3);
        for (let i = 0, j = 0; i < raw.length; i += 2, j += 3) {
          const v = toVec(raw[i + 1] / 100, raw[i] / 100, 1.0);
          out[j] = v.x; out[j + 1] = v.y; out[j + 2] = v.z;
        }
        if (alive) setPos(out);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return pos;
}

function arcPoints(a: THREE.Vector3, b: THREE.Vector3, n = 48) {
  const pts: THREE.Vector3[] = [];
  const ang = a.angleTo(b);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = a.clone().lerp(b, t).normalize().multiplyScalar(1 + Math.sin(Math.PI * t) * 0.16 * Math.min(1.4, ang));
    pts.push(p);
  }
  return pts;
}

function Globe({ selected, reduced, onReady }: { selected: string; reduced: boolean; onReady?: () => void }) {
  const { gl, size, invalidate } = useThree();
  const group = useRef<THREE.Group>(null);
  const land = useLand();
  const sun = useMemo(() => sunVector(), []);
  const dotMat = useRef<THREE.ShaderMaterial>(null);
  const coreMat = useRef<THREE.ShaderMaterial>(null);
  const rot = useRef({ lat: 0.3, lon: -0.2, vx: 0, vy: 0, drag: false, last: 0 });
  const ringRef = useRef<THREE.Mesh>(null);
  const arcRefs = useRef<(THREE.Object3D | null)[]>([]);
  const fired = useRef(false);

  const city = CITIES.find((c) => c.id === selected) ?? CITIES[3];
  const target = useRef({ lat: city.lat * D2R, lon: city.lon * D2R });
  useEffect(() => { target.current = { lat: city.lat * D2R, lon: city.lon * D2R }; rot.current.last = 0; invalidate(); }, [city, invalidate]);

  const arcs = useMemo(() => CITIES.slice(0, -1).map((c, i) => arcPoints(toVec(c.lat, c.lon), toVec(CITIES[i + 1].lat, CITIES[i + 1].lon))), []);
  const uniforms = useMemo(() => ({ uSize: { value: 0.03 }, uPR: { value: 1 }, uSun: { value: sun } }), [sun]);
  const coreUniforms = useMemo(() => ({ uSun: { value: sun } }), [sun]);

  // drag to rotate (with inertia)
  useEffect(() => {
    const el = gl.domElement; let id: number | null = null, lx = 0, ly = 0, lt = 0;
    const r = rot.current;
    const down = (e: PointerEvent) => { id = e.pointerId; el.setPointerCapture(id); r.drag = true; r.vx = r.vy = 0; lx = e.clientX; ly = e.clientY; lt = e.timeStamp; r.last = performance.now(); };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - lx, dy = e.clientY - ly, dt = Math.max(1, e.timeStamp - lt) / 1000; lx = e.clientX; ly = e.clientY; lt = e.timeStamp;
      r.lon -= dx * 0.006; r.lat = THREE.MathUtils.clamp(r.lat + dy * 0.004, -1.2, 1.2);
      r.vx = THREE.MathUtils.clamp((-dx * 0.006) / dt, -6, 6); r.vy = 0; r.last = performance.now(); invalidate();
    };
    const up = (e: PointerEvent) => { if (e.pointerId !== id) return; r.drag = false; id = null; if (e.timeStamp - lt > 90) r.vx = 0; r.last = performance.now(); invalidate(); };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
  }, [gl, invalidate]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(0.05, dtRaw), r = rot.current;
    if (!fired.current && land) { fired.current = true; onReady?.(); }
    if (dotMat.current) dotMat.current.uniforms.uPR.value = size.height * gl.getPixelRatio();
    const now = performance.now();
    if (!r.drag) {
      if (r.vx) { r.lon += r.vx * dt; r.vx *= Math.exp(-3 * dt); if (Math.abs(r.vx) < 0.01) r.vx = 0; }
      else if (now - r.last > 1500 || r.last === 0) {
        // ease toward the selected city; once there, drift slowly
        const k = 1 - Math.exp(-dt * (reduced ? 20 : 2.6));
        const dl = Math.atan2(Math.sin(target.current.lon - r.lon), Math.cos(target.current.lon - r.lon));
        r.lon += dl * k; r.lat += (target.current.lat * 0.8 - r.lat) * k;
      }
    }
    if (group.current) group.current.rotation.set(r.lat, -r.lon, 0, "XYZ");
    arcRefs.current.forEach((a) => {
      const m = (a as unknown as { material?: { dashOffset: number } } | null)?.material;
      if (m) m.dashOffset -= dt * 0.35;
    });
    if (ringRef.current) {
      const s = 1 + ((state.clock.elapsedTime * 0.9) % 1) * 2.6;
      ringRef.current.scale.setScalar(s);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - ((state.clock.elapsedTime * 0.9) % 1));
    }
    if (!reduced) state.invalidate();
  });

  const cp = toVec(city.lat, city.lon, 1.005);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), cp.clone().normalize()), [cp]);

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.985, 72, 72]} />
        <shaderMaterial ref={coreMat} vertexShader={CORE_VERT} fragmentShader={CORE_FRAG} uniforms={coreUniforms} />
      </mesh>
      {land && (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[land, 3]} />
          </bufferGeometry>
          <shaderMaterial ref={dotMat} vertexShader={DOT_VERT} fragmentShader={DOT_FRAG} uniforms={uniforms} transparent depthWrite={false} />
        </points>
      )}
      <mesh scale={1.11}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial vertexShader={ATMO_VERT} fragmentShader={ATMO_FRAG} side={THREE.BackSide} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </mesh>

      {arcs.map((pts, i) => (
        <Line
          key={i} ref={(l) => { arcRefs.current[i] = l as unknown as THREE.Object3D; }}
          points={pts} color="#2bd98a" lineWidth={1.3} dashed dashSize={0.05} gapSize={0.035} transparent opacity={0.75}
        />
      ))}

      {CITIES.map((c) => {
        const p = toVec(c.lat, c.lon, 1.004);
        const on = c.id === selected;
        return (
          <mesh key={c.id} position={p}>
            <sphereGeometry args={[on ? 0.026 : 0.017, 16, 16]} />
            <meshBasicMaterial color={on ? "#ffffff" : "#2bd98a"} toneMapped={false} />
          </mesh>
        );
      })}
      <mesh ref={ringRef} position={cp} quaternion={q}>
        <ringGeometry args={[0.03, 0.034, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function GlobeScene({ selected, visible = true, reduced = false, onReady }: { selected: string; visible?: boolean; reduced?: boolean; onReady?: () => void }) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={!visible ? "never" : reduced ? "demand" : "always"}
      camera={{ fov: 32, position: [0, 0, 4.7], near: 0.1, far: 20 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ touchAction: "pan-y", cursor: "grab" }}
      aria-hidden="true"
    >
      <Globe selected={selected} reduced={reduced} onReady={onReady} />
    </Canvas>
  );
}

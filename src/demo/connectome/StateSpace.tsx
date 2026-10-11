import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface CloudLayer {
  coords: Float32Array; // n x 3 in [-1, 1]
  colors?: Float32Array; // n x 3 (0..1); defaults to pale violet
  size?: number;
  opacity?: number;
}

export interface Marker {
  position: ArrayLike<number>;
  color: string;
  size?: number;
  label?: string;
}

interface Props {
  cloud: CloudLayer | null;
  /** Full path (n x 3, NaN for missing points) up to the current time. */
  path?: Float32Array | null;
  /** Number of path points to show (current time). */
  pathLength?: number;
  /** Number of trailing points drawn bright. */
  trail?: number;
  markers?: Marker[];
  autoRotate?: boolean;
  className?: string;
  ariaLabel: string;
}

const PATH_COLOR = new THREE.Color("#8f7cf0");
const TRAIL_COLOR = new THREE.Color("#f4f1ff");

function pointTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.85)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function StateSpace({ cloud, path, pathLength = 0, trail = 100, markers = [], autoRotate = true, className, ariaLabel }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const three = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    root: THREE.Group;
    cloud?: THREE.Points;
    path?: THREE.Line;
    trail?: THREE.Line;
    head?: THREE.Mesh;
    markers: THREE.Group;
    texture: THREE.Texture;
  }>();

  useEffect(() => {
    const element = mount.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 50);
    camera.position.set(2.2, 1.0, 2.6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 7;
    controls.autoRotate = autoRotate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotateSpeed = 0.6;
    const root = new THREE.Group();
    const markerGroup = new THREE.Group();
    root.add(markerGroup);
    scene.add(root);
    const state = { renderer, scene, camera, controls, root, markers: markerGroup, texture: pointTexture() };
    three.current = state;
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = element;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    let frame = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(element);
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!visible) return;
      controls.update();
      renderer.render(scene, camera);
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      controls.dispose();
      renderer.dispose();
      element.removeChild(renderer.domElement);
    };
  }, [autoRotate]);

  // Reference cloud.
  useEffect(() => {
    const t = three.current;
    if (!t || !cloud) return;
    if (t.cloud) {
      t.root.remove(t.cloud);
      t.cloud.geometry.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(cloud.coords, 3));
    let colors = cloud.colors;
    if (!colors) {
      colors = new Float32Array(cloud.coords.length);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = 0.62;
        colors[i + 1] = 0.6;
        colors[i + 2] = 0.78;
      }
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: cloud.size ?? 0.022,
      map: t.texture,
      vertexColors: true,
      transparent: true,
      opacity: cloud.opacity ?? 0.38,
      depthWrite: false,
      sizeAttenuation: true,
    });
    t.cloud = new THREE.Points(geometry, material);
    t.root.add(t.cloud);
  }, [cloud]);

  // Path and trail.
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    for (const key of ["path", "trail", "head"] as const) {
      const object = t[key];
      if (object) {
        t.root.remove(object);
        (object as THREE.Mesh).geometry.dispose();
        t[key] = undefined;
      }
    }
    if (!path || pathLength < 2) return;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < Math.min(pathLength, path.length / 3); i++) {
      const x = path[i * 3];
      if (Number.isNaN(x)) continue;
      points.push(new THREE.Vector3(x, path[i * 3 + 1], path[i * 3 + 2]));
    }
    if (points.length < 2) return;
    const full = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: PATH_COLOR, transparent: true, opacity: 0.45 }),
    );
    const recent = points.slice(-trail);
    const colors = new Float32Array(recent.length * 3);
    recent.forEach((_, i) => {
      const c = PATH_COLOR.clone().lerp(TRAIL_COLOR, i / Math.max(recent.length - 1, 1));
      colors.set([c.r, c.g, c.b], i * 3);
    });
    const trailGeometry = new THREE.BufferGeometry().setFromPoints(recent);
    trailGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const trailLine = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 2 }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 16), new THREE.MeshBasicMaterial({ color: TRAIL_COLOR }));
    head.position.copy(points[points.length - 1]);
    t.root.add(full, trailLine, head);
    t.path = full;
    t.trail = trailLine;
    t.head = head;
  }, [path, pathLength, trail]);

  // Markers (e.g. a placed image and its neighbours).
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    t.markers.children.forEach((child) => (child as THREE.Mesh).geometry.dispose());
    t.markers.clear();
    for (const marker of markers) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(marker.size ?? 0.035, 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(marker.color) }),
      );
      mesh.position.set(marker.position[0], marker.position[1], marker.position[2]);
      t.markers.add(mesh);
    }
  }, [markers]);

  return <div ref={mount} className={className} role="img" aria-label={ariaLabel} />;
}

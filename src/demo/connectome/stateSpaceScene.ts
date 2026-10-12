import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Shared by the interactive panels and the article film's panel renderer
// (scripts/state-space-film), so both show the same space, camera and motion.

export const CAMERA_FOV = 38;
export const CAMERA_DIRECTION: readonly [number, number, number] = [2.2, 1.0, 2.6];
/** OrbitControls units: 2π·speed/60 rad per second, so 0.6 is one turn per 100 s. */
export const AUTO_ROTATE_SPEED = 0.6;

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

const PATH_COLOR = new THREE.Color("#8f7cf0");
const TRAIL_COLOR = new THREE.Color("#f4f1ff");
// Current state: the article film's warm core inside a red-magenta glow.
const HEAD_CORE_COLOR = new THREE.Color("#ffefc7");
const HEAD_GLOW_COLOR = new THREE.Color("#ff67ad");
const HEAD_CORE_SIZE = 0.055;
const HEAD_GLOW_SIZE = 0.5;
// Radial profile of the film's halo (a disk blurred by a Gaussian), at r/R = 0, 0.1, ..., 0.8.
const GLOW_PROFILE = [0.614, 0.589, 0.504, 0.393, 0.271, 0.161, 0.073, 0.03, 0.011];

/** Reference states from database images in pale violet, preset-video states slightly warmer. */
export function stateCloudLayer(coords: Float32Array, labels: ArrayLike<number>): CloudLayer {
  const colors = new Float32Array(coords.length);
  for (let i = 0; i < labels.length; i++) colors.set(labels[i] > 0 ? [0.78, 0.7, 0.62] : [0.6, 0.58, 0.8], i * 3);
  return { coords, colors, size: 0.02, opacity: 0.32 };
}

function radialTexture(stops: [number, number][]) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [offset, alpha] of stops) gradient.addColorStop(offset, `rgba(255,255,255,${alpha})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function headMarker(core: THREE.Texture, glow: THREE.Texture) {
  const sprite = (map: THREE.Texture, color: THREE.Color, size: number, blending: THREE.Blending, order: number) => {
    const material = new THREE.SpriteMaterial({ map, color, blending, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const object = new THREE.Sprite(material);
    object.scale.setScalar(size);
    object.renderOrder = order;
    return object;
  };
  const head = new THREE.Group();
  head.add(sprite(glow, HEAD_GLOW_COLOR, HEAD_GLOW_SIZE, THREE.AdditiveBlending, 10));
  head.add(sprite(core, HEAD_CORE_COLOR, HEAD_CORE_SIZE, THREE.NormalBlending, 11));
  head.visible = false;
  return head;
}

/** Orbit controls with the demo's limits and slow automatic rotation. */
export function createControls(camera: THREE.PerspectiveCamera, element: HTMLElement, autoRotate: boolean) {
  const controls = new OrbitControls(camera, element);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.2;
  controls.maxDistance = 7;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
  return controls;
}

/** Scene content of a state-space panel: reference cloud, path, trail, current state and markers. */
export class StateSpaceScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.01, 50);
  private readonly root = new THREE.Group();
  private readonly markers = new THREE.Group();
  private readonly head: THREE.Group;
  private readonly textures: THREE.Texture[];
  private cloud?: THREE.Points;
  private path?: THREE.Line;
  private trail?: THREE.Line;

  constructor(distance: number) {
    this.camera.position.set(...CAMERA_DIRECTION).setLength(distance);
    const point = radialTexture([
      [0, 1],
      [0.45, 0.85],
      [1, 0],
    ]);
    const core = radialTexture([
      [0, 1],
      [0.7, 1],
      [1, 0],
    ]);
    const glow = radialTexture(GLOW_PROFILE.map((alpha, i) => [i / 10, alpha] as [number, number]).concat([[1, 0]]));
    this.textures = [point, core, glow];
    this.head = headMarker(core, glow);
    this.root.add(this.markers, this.head);
    this.scene.add(this.root);
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setCloud(cloud: CloudLayer | null) {
    if (this.cloud) {
      this.root.remove(this.cloud);
      this.cloud.geometry.dispose();
      (this.cloud.material as THREE.Material).dispose();
      this.cloud = undefined;
    }
    if (!cloud) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(cloud.coords, 3));
    let colors = cloud.colors;
    if (!colors) {
      colors = new Float32Array(cloud.coords.length);
      for (let i = 0; i < colors.length; i += 3) colors.set([0.62, 0.6, 0.78], i);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: cloud.size ?? 0.022,
      map: this.textures[0],
      vertexColors: true,
      transparent: true,
      opacity: cloud.opacity ?? 0.38,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.cloud = new THREE.Points(geometry, material);
    this.root.add(this.cloud);
  }

  /** Path up to `pathLength` (n x 3, NaN for missing points), the last `trail` points bright. */
  setPath(path: Float32Array | null | undefined, pathLength: number, trail: number) {
    for (const key of ["path", "trail"] as const) {
      const line = this[key];
      if (line) {
        this.root.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
        this[key] = undefined;
      }
    }
    this.head.visible = false;
    if (!path || pathLength < 2) return;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < Math.min(pathLength, path.length / 3); i++) {
      const x = path[i * 3];
      if (Number.isNaN(x)) continue;
      points.push(new THREE.Vector3(x, path[i * 3 + 1], path[i * 3 + 2]));
    }
    if (points.length < 2) return;
    this.path = new THREE.Line(
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
    this.trail = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ vertexColors: true }));
    this.root.add(this.path, this.trail);
    this.head.position.copy(points[points.length - 1]);
    this.head.visible = true;
  }

  setMarkers(markers: Marker[]) {
    this.markers.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.markers.clear();
    for (const marker of markers) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(marker.size ?? 0.035, 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(marker.color) }),
      );
      mesh.position.set(marker.position[0], marker.position[1], marker.position[2]);
      this.markers.add(mesh);
    }
  }

  dispose() {
    this.setCloud(null);
    this.setPath(null, 0, 0);
    this.setMarkers([]);
    this.head.children.forEach((child) => ((child as THREE.Sprite).material as THREE.Material).dispose());
    this.textures.forEach((texture) => texture.dispose());
  }
}

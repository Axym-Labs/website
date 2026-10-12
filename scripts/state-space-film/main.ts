// Browser side of render.mjs: the connectome demo's state-space scene, stepped frame by frame.
import * as THREE from "three";
import { loadPacked } from "../../src/demo/connectome/assets";
import { createControls, StateSpaceScene, stateCloudLayer } from "../../src/demo/connectome/stateSpaceScene";

interface Options {
  width: number;
  height: number;
  distance: number;
  fps: number;
}

interface PathMeta {
  count: number;
  dt: number;
  first_time: number;
  trail_seconds: number;
}

async function setup({ width, height, distance, fps }: Options) {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  const space = new StateSpaceScene(distance);
  space.setAspect(width / height);
  const { arrays } = await loadPacked("/cloud", "state-cloud");
  space.setCloud(stateCloudLayer(arrays.coords as Float32Array, arrays.labels as Uint8Array));
  const meta: PathMeta = await (await fetch("/path/path.json")).json();
  const path = new Float32Array(await (await fetch("/path/path.bin")).arrayBuffer());
  const controls = createControls(space.camera, canvas, true);
  const trail = Math.round(meta.trail_seconds / meta.dt);
  const gl = renderer.getContext();
  const pixels = new Uint8Array(width * height * 4);

  /** Render frame `index` (called in order); returns the raw premultiplied RGBA buffer, bottom row first, base64. */
  return (index: number) => {
    const seconds = index / fps;
    controls.update(index === 0 ? 0 : 1 / fps);
    const shown = Math.min(Math.floor((seconds - meta.first_time) / meta.dt) + 1, meta.count);
    space.setPath(path, shown, trail);
    renderer.render(space.scene, space.camera);
    if (gl.isContextLost()) throw new Error("WebGL context lost");
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let binary = "";
    for (let i = 0; i < pixels.length; i += 0x8000) binary += String.fromCharCode(...pixels.subarray(i, i + 0x8000));
    return btoa(binary);
  };
}

declare global {
  interface Window {
    filmSetup: (options: Options) => Promise<void>;
    filmFrame: (index: number) => string;
  }
}

window.filmSetup = async (options) => {
  window.filmFrame = await setup(options);
};

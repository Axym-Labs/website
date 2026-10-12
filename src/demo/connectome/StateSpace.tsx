import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createControls, StateSpaceScene, type CloudLayer, type Marker } from "./stateSpaceScene";

export type { CloudLayer, Marker } from "./stateSpaceScene";

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
  /** Camera distance from the centre (the cloud spans [-1, 1]). */
  distance?: number;
  className?: string;
  ariaLabel: string;
}

export default function StateSpace({ cloud, path, pathLength = 0, trail = 100, markers = [], autoRotate = true, distance = 3.55, className, ariaLabel }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const space = useRef<StateSpaceScene>();
  const props = useRef({ cloud, path, pathLength, trail, markers });
  props.current = { cloud, path, pathLength, trail, markers };

  useEffect(() => {
    const element = mount.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    element.appendChild(renderer.domElement);
    const state = new StateSpaceScene(distance);
    const current = props.current;
    state.setCloud(current.cloud);
    state.setPath(current.path, current.pathLength, current.trail);
    state.setMarkers(current.markers);
    space.current = state;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const controls = createControls(state.camera, renderer.domElement, autoRotate && !reducedMotion);
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = element;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      state.setAspect(w / Math.max(h, 1));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    let frame = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(element);
    // Rotation follows wall-clock time, so the turn rate does not depend on the display's refresh rate.
    const clock = new THREE.Clock();
    const loop = () => {
      frame = requestAnimationFrame(loop);
      const delta = Math.min(clock.getDelta(), 0.1);
      if (!visible) return;
      controls.update(delta);
      renderer.render(state.scene, state.camera);
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      controls.dispose();
      state.dispose();
      space.current = undefined;
      renderer.dispose();
      element.removeChild(renderer.domElement);
    };
  }, [autoRotate, distance]);

  useEffect(() => space.current?.setCloud(cloud), [cloud]);
  useEffect(() => space.current?.setPath(path, pathLength, trail), [path, pathLength, trail]);
  useEffect(() => space.current?.setMarkers(markers), [markers]);

  return <div ref={mount} className={className} role="img" aria-label={ariaLabel} />;
}

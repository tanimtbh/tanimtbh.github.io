// 3D pictures: one interactive viewer for the term page, and a shared
// off-screen renderer that turns models into small still images for cards.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

// Each role names a colour from the stylesheet, so themes stay in one place.
const MESH_ROLES = {
  base: { color: '--m-base' },
  accent: { color: '--m-accent' },
  mate: { color: '--m-mate' },
  section: { color: '--m-section' },
  steel: { color: '--m-steel' },
  brass: { color: '--m-brass' },
  ghost: { color: '--m-base', opacity: 0.16 },
  tint: { color: '--m-accent', opacity: 0.32 },
  plane: { color: '--m-accent', opacity: 0.2 },
  support: { color: '--m-support', opacity: 0.5 },
  clash: { color: '--m-clash' },
  zone: { color: '--m-clash', opacity: 0.22 },
  x: { color: '--m-x' },
  y: { color: '--m-y' },
  z: { color: '--m-z' },
};

const LINE_ROLES = {
  edge: { color: '--m-edge', width: 1.25 },
  accent: { color: '--m-accent-edge', width: 2.6 },
  faint: { color: '--m-faint', width: 1 },
  dash: { color: '--m-faint', width: 1.4, dashed: true },
  x: { color: '--m-x', width: 2 },
  y: { color: '--m-y', width: 2 },
  z: { color: '--m-z', width: 2 },
};

/** What each highlight colour means, for the legend under the picture. */
export const LEGEND = {
  accent: 'what this term adds or changes',
  mate: 'second part',
  section: 'cut surface',
  steel: 'bought metal part',
  brass: 'brass insert',
  support: 'support material',
  clash: 'two parts overlap here',
  zone: 'space that must stay empty',
};

function cssColor(name) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || '#888888');
}

function buildState(state) {
  const group = new THREE.Group();

  for (const part of state.meshes) {
    const role = MESH_ROLES[part.role] ?? MESH_ROLES.base;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.pos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(part.nrm, 3));
    geometry.setIndex(part.idx);
    const seeThrough = role.opacity !== undefined;
    const material = new THREE.MeshLambertMaterial({
      color: cssColor(role.color),
      side: THREE.DoubleSide,
      transparent: seeThrough,
      opacity: role.opacity ?? 1,
      depthWrite: !seeThrough,
      // push faces back a little so the edge lines on top of them stay crisp
      polygonOffset: true,
      // see-through shapes go back further, so solid faces in the same place win
      polygonOffsetFactor: seeThrough ? 3 : 1,
      polygonOffsetUnits: seeThrough ? 3 : 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = seeThrough ? 2 : 0;
    group.add(mesh);
  }

  for (const part of state.lines) {
    const role = LINE_ROLES[part.role] ?? LINE_ROLES.edge;
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(part.pos);
    const material = new LineMaterial({
      color: cssColor(role.color),
      linewidth: role.width,
      dashed: Boolean(role.dashed),
      dashSize: 1.3,
      gapSize: 1,
    });
    const lines = new LineSegments2(geometry, material);
    if (role.dashed) lines.computeLineDistances();
    lines.renderOrder = 1;
    group.add(lines);
  }
  return group;
}

function disposeGroup(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
}

/** The box around every 3D state given, so switching states does not move the camera. */
function boundsOf(states) {
  const box = new THREE.Box3();
  const point = new THREE.Vector3();
  const grow = (values) => {
    for (let i = 0; i < values.length; i += 3) box.expandByPoint(point.set(values[i], values[i + 1], values[i + 2]));
  };
  for (const state of states) {
    if (state.type !== '3d') continue;
    state.meshes.forEach((m) => grow(m.pos));
    state.lines.forEach((l) => grow(l.pos));
    state.labels.forEach((l) => grow(l.at));
  }
  if (box.isEmpty()) box.set(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  return { box, center: sphere.center, radius: Math.max(sphere.radius, 1e-3) };
}

/** Half the width and height the box covers on screen, seen from the camera. */
function screenExtent(camera, bounds) {
  camera.updateMatrixWorld();
  const { min, max } = bounds.box;
  const corner = new THREE.Vector3();
  let x = 1e-3;
  let y = 1e-3;
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z);
    corner.applyMatrix4(camera.matrixWorldInverse);
    x = Math.max(x, Math.abs(corner.x));
    y = Math.max(y, Math.abs(corner.y));
  }
  return { x, y };
}

/** Size the camera's view so the model fills the picture with a small margin. */
function fit(camera, bounds, aspect, margin) {
  const extent = screenExtent(camera, bounds);
  const half = Math.max(extent.y, extent.x / aspect) * margin;
  camera.top = half;
  camera.bottom = -half;
  camera.right = half * aspect;
  camera.left = -half * aspect;
  camera.updateProjectionMatrix();
}

function makeRig() {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000);
  camera.up.set(0, 0, 1); // CAD convention: Z points up

  const sky = new THREE.HemisphereLight(0xffffff, 0xc2beb6, 2.0);
  sky.position.set(0, 0, 1);
  scene.add(sky);

  // A light that travels with the camera, so no side is ever left in the dark.
  const head = new THREE.DirectionalLight(0xffffff, 1.55);
  head.position.set(-0.7, 0.9, 1);
  head.target.position.set(0, 0, -1);
  camera.add(head, head.target);
  scene.add(camera);
  return { scene, camera };
}

function frame(camera, bounds, view, aspect, margin = 1.3) {
  camera.near = 0.01;
  camera.far = bounds.radius * 12;
  camera.zoom = 1;
  const direction = new THREE.Vector3(...view).normalize();
  camera.position.copy(bounds.center).addScaledVector(direction, bounds.radius * 5);
  camera.lookAt(bounds.center);
  fit(camera, bounds, aspect, margin);
}

// ---------------------------------------------------------------------------

export class Viewer {
  /** @param {HTMLElement} host element the canvas and labels are placed in */
  constructor(host) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.canvas = this.renderer.domElement;
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'img');
    host.append(this.canvas);

    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'labels';
    host.append(this.labelLayer);

    Object.assign(this, makeRig());
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = false;
    this.controls.zoomSpeed = 1.2;
    // Scrolling the page must not zoom the model by accident: the wheel only
    // zooms after you have clicked or dragged in the picture.
    this.controls.enableZoom = false;
    this.controls.addEventListener('change', () => this.render());

    this._onDown = () => { this.controls.enableZoom = true; };
    this._onLeave = () => { this.controls.enableZoom = false; };
    this._onKey = (event) => this._key(event);
    this.canvas.addEventListener('pointerdown', this._onDown);
    this.canvas.addEventListener('pointerleave', this._onLeave);
    this.canvas.addEventListener('keydown', this._onKey);

    this.group = null;
    this.labels = [];
    this.index = 0;
    this._framed = false;
    this._observer = new ResizeObserver(() => this._resize());
    this._observer.observe(host);
  }

  setModel(model, name) {
    this.model = model;
    this.bounds = boundsOf(model.states);
    this.canvas.setAttribute('aria-label', `3D picture of ${name}. Drag to rotate, or use the arrow keys.`);
    this._resize();
    this.resetView();
  }

  show(index) {
    this.index = index;
    if (this.group) {
      this.scene.remove(this.group);
      disposeGroup(this.group);
      this.group = null;
    }
    this.labelLayer.replaceChildren();
    this.labels = [];
    const state = this.model.states[index];
    if (state.type !== '3d') return;

    this.group = buildState(state);
    this.scene.add(this.group);
    for (const label of state.labels) {
      const element = document.createElement('div');
      element.className = `pin pin-${label.side}`;
      const tag = document.createElement('span');
      tag.textContent = label.text;
      element.append(tag);
      this.labelLayer.append(element);
      this.labels.push({ element, at: new THREE.Vector3(...label.at) });
    }
    this.render();
  }

  resetView() {
    const { clientWidth: w, clientHeight: h } = this.host;
    // Not on the page yet: _resize() will call this again once it has a size.
    this._framed = Boolean(w && h);
    if (!this._framed) return;
    frame(this.camera, this.bounds, this.model.view, w / h);
    this.controls.target.copy(this.bounds.center);
    this.controls.update();
    this.render();
  }

  /** Re-read the theme colours and redraw. */
  refreshTheme() {
    if (this.model) this.show(this.index);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    const { clientWidth: w, clientHeight: h } = this.host;
    const p = new THREE.Vector3();
    for (const { element, at } of this.labels) {
      p.copy(at).project(this.camera);
      const x = (p.x * 0.5 + 0.5) * w;
      const y = (-p.y * 0.5 + 0.5) * h;
      element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }

  _resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    if (!this.bounds) return;
    if (!this._framed) {
      this.resetView();
      return;
    }
    // keep the current zoom and angle, only adapt the shape of the view
    const half = this.camera.top;
    this.camera.right = half * (w / h);
    this.camera.left = -this.camera.right;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  _key(event) {
    const step = Math.PI / 18;
    const turns = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const turn = turns[event.key];
    if (!turn) return;
    event.preventDefault();
    const target = this.controls.target;
    const offset = this.camera.position.clone().sub(target);
    const up = new THREE.Vector3(0, 0, 1);
    offset.applyAxisAngle(up, turn[0]);
    if (turn[1]) {
      const side = new THREE.Vector3().crossVectors(up, offset).normalize();
      const tilted = offset.clone().applyAxisAngle(side, turn[1]);
      // stop before the camera flips over the top or the bottom
      if (Math.abs(tilted.clone().normalize().dot(up)) < 0.985) offset.copy(tilted);
    }
    this.camera.position.copy(target).add(offset);
    this.controls.update();
    this.render();
  }

  dispose() {
    this._observer.disconnect();
    this.canvas.removeEventListener('pointerdown', this._onDown);
    this.canvas.removeEventListener('pointerleave', this._onLeave);
    this.canvas.removeEventListener('keydown', this._onKey);
    this.controls.dispose();
    if (this.group) disposeGroup(this.group);
    this.renderer.dispose();
    this.canvas.remove();
    this.labelLayer.remove();
  }
}

// ---------------------------------------------------------------------------
// Still pictures for cards. One hidden renderer is reused for all of them,
// because a browser only allows a handful of live 3D canvases per page.

const THUMB = { width: 360, height: 270, scale: 2 };
let thumbRig = null;

/** Render one state of a model to a PNG data URL. */
export function renderThumb(model, index) {
  if (!thumbRig) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(THUMB.scale);
    renderer.setSize(THUMB.width, THUMB.height, false);
    thumbRig = { renderer, ...makeRig() };
  }
  const { renderer, scene, camera } = thumbRig;
  const state = model.states[index];
  const group = buildState(state);
  scene.add(group);
  frame(camera, boundsOf([{ ...state, labels: [] }]), model.view, THUMB.width / THUMB.height, 1.16);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(group);
  disposeGroup(group);
  return url;
}

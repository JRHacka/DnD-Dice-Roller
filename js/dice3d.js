// Tavern Table · dice3d.js
// The 3D dice table: shapes, numbers, skins on the dice, physics, rolling and the glowing highlight.

// It's a plain script (not a module) so the page still works when opened straight from a folder.
// Three.js is loaded from the web below; the import map in index.html says where "three" lives.
(async () => {
  "use strict";
  const THREE = await import("three");
  const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");

  // --- Setup: renderer (draws), scene (holds objects), camera (viewpoint), lights
  const canvas = document.getElementById("dieCanvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.up.set(0, 0, 1);                         // in our world, +z is "up", off the table
  camera.position.set(0, -4, 7);                  // above the table and toward you...
  camera.lookAt(0, 0, 0);                         // ...looking down at its center at about 60°

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  // A soft, blurry "room" for shiny dice to reflect, so gems glint and metal looks like metal
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(3, -4, 8);                // light from above, slightly right and in front
  scene.add(keyLight);

  // --- Keep the 3D view matched to the canvas size (it changes with the window width)
  function fitCanvas() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;                        // width ÷ height, so the die isn't stretched
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  new ResizeObserver(fitCanvas).observe(canvas);  // run fitCanvas now and whenever the canvas resizes

  // --- Where a point on the screen lands on the table (sx, sy go from -1 to 1 across the canvas)
  const ray = new THREE.Raycaster();
  const table = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);   // the flat table, at height 0
  function onTable(sx, sy) {
    camera.updateMatrixWorld();
    ray.setFromCamera(new THREE.Vector2(sx, sy), camera);
    return ray.ray.intersectPlane(table, new THREE.Vector3());
  }

  // --- The edges of the visible table. Tilted, the far edge is wider than the near one,
  //     so we use the near (narrower) width: dice never roll off the sides.
  function walls() {
    const near = onTable(-1, -1), far = onTable(-1, 1);
    return { x: Math.abs(near.x), yMin: near.y, yMax: far.y };
  }

  // --- d10 has no built-in shape, so we build it from points (a "pentagonal trapezohedron")
  function d10Geometry() {
    const H = 1.2, R = 1.1;                       // tip height, ring radius
    const c = Math.cos(Math.PI / 5);
    const h = H * (1 - c) / (1 + c);              // ring zig-zag height that keeps each face flat
    const top = [0, H, 0], bottom = [0, -H, 0];
    const ring = [];
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5;
      ring.push([Math.cos(a) * R, i % 2 ? -h : h, Math.sin(a) * R]);
    }
    const tris = [];
    for (let k = 0; k < 5; k++) {
      const u0 = ring[2 * k], l = ring[2 * k + 1], u1 = ring[(2 * k + 2) % 10];
      tris.push(top, u1, l, top, l, u0);          // upper face (two triangles)
      const l0 = ring[2 * k + 1], u = ring[(2 * k + 2) % 10], l1 = ring[(2 * k + 3) % 10];
      tris.push(bottom, l0, u, bottom, u, l1);    // lower face (two triangles)
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(tris.flat(), 3));
    geo.computeVertexNormals();
    return geo;
  }

  // --- One shape per die type
  const SHAPES = {
    4:   () => new THREE.TetrahedronGeometry(1.5)
               .rotateY(Math.PI / 4)              // turn a corner to face sideways...
               .rotateZ(Math.atan(Math.SQRT2)),   // ...then tip it so that corner points straight up
    6:   () => new THREE.BoxGeometry(1.5, 1.5, 1.5),
    8:   () => new THREE.OctahedronGeometry(1.25),
    10:  d10Geometry,
    12:  () => new THREE.DodecahedronGeometry(1.2),
    20:  () => new THREE.IcosahedronGeometry(1.25),
    100: () => new THREE.SphereGeometry(1.2, 48, 32)  // round "ball" d100
  };

  // --- Every die face projects the skin's pattern straight on, so the pattern isn't stretched.
  //     Each face gets its own slice of the pattern, so the faces don't all look the same.
  function faceUVs(geo) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    const p = g.attributes.position, uv = new Float32Array(p.count * 2);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), t = new THREE.Vector3(), s = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      t.set(0, 0, 1); if (Math.abs(n.z) > 0.9) t.set(1, 0, 0);
      t.cross(n).normalize(); s.crossVectors(n, t);  // two directions lying flat on this face
      const off = (n.x * 3.7 + n.y * 5.3 + n.z * 7.1) % 1;  // where in the pattern this face starts
      for (const [k, v] of [[0, a], [1, b], [2, c]]) {
        uv[(i + k) * 2] = v.dot(t) * 0.3 + off;
        uv[(i + k) * 2 + 1] = v.dot(s) * 0.3 + off * 1.7;
      }
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return g;
  }

  // --- The dice's look comes from the chosen skin (see the skin menu)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2440, roughness: 0.5, flatShading: true });
  const ballMat = bodyMat.clone(); ballMat.flatShading = false;      // same look, smooth for the ball
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xd4a64a });
  let ink = "#d4a64a";                            // the color of the numbers
  const FINISH = {
    matte: { roughness: 0.85, metalness: 0 },
    satin: { roughness: 0.5, metalness: 0 },
    gloss: { roughness: 0.15, metalness: 0 },
    metal: { roughness: 0.32, metalness: 0.9 }
  };
  let skinTex = null, ballTex = null;
  function applySkin({ skin, canvas }) {
    skinTex?.dispose(); ballTex?.dispose();
    skinTex = new THREE.CanvasTexture(canvas);
    skinTex.colorSpace = THREE.SRGBColorSpace;
    skinTex.wrapS = skinTex.wrapT = THREE.RepeatWrapping;
    skinTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    ballTex = skinTex.clone(); ballTex.repeat.set(3, 1.5);   // the ball wraps the pattern around itself; repeat so it isn't stretched
    for (const [m, tex] of [[bodyMat, skinTex], [ballMat, ballTex]]) {
      m.map = tex; m.color.set(0xffffff);
      Object.assign(m, FINISH[skin.finish] || FINISH.satin);
      m.needsUpdate = true;
    }
    edgeMat.color.set(skin.edge);
    ink = skin.ink;                               // repaint every number in the new color
    const old = [...labelCache.values()];
    labelCache.clear();
    scene.traverse(o => {
      if (!o.userData.label) return;
      const m = labelMaterial(o.userData.label.n, o.userData.label.underline);
      if (o.userData.lit) o.userData.lit.mat = m; else o.material = m;   // a glowing number stays glowing; it gets the new color when it's put back
    });
    old.forEach(m => { m.map.dispose(); m.dispose(); });
    renderer.render(scene, camera);
  }

  // --- Number stickers: draw a number onto a small transparent image (made once per number, then reused)
  const labelCache = new Map();
  function labelMaterial(n, underline) {
    const key = `${n}${underline ? "_" : ""}`;
    if (labelCache.has(key)) return labelCache.get(key);
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = ink;                          // the skin's number color
    const digits = String(n).length;
    ctx.font = `bold ${digits > 2 ? 54 : digits > 1 ? 70 : 84}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 8; ctx.lineJoin = "round";
    ctx.strokeStyle = window.tavernOutline ? window.tavernOutline(ink) : "rgba(0,0,0,.5)";
    ctx.strokeText(n, 64, 66);                    // outline first, so the number reads on busy skins
    ctx.fillText(n, 64, 66);
    if (underline && (n === 6 || n === 9)) ctx.fillRect(40, 106, 48, 7);  // so 6 and 9 can't be mixed up
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1 });   // draw on top of the face without flickering
    labelCache.set(key, mat);
    return mat;
  }

  // --- Stick one number onto a die: at a point, facing out along `normal`, with its top toward `up`
  const plane = new THREE.PlaneGeometry(1, 1);    // one square shared by every sticker
  const basis = new THREE.Matrix4(), right = new THREE.Vector3();
  function addSticker(group, value, at, normal, up, size, underline) {
    const s = new THREE.Mesh(plane, labelMaterial(value, underline));
    s.userData.label = { n: value, underline };   // so a new skin can repaint it
    right.crossVectors(up, normal);
    s.quaternion.setFromRotationMatrix(basis.makeBasis(right, up, normal));  // aim the square
    s.position.copy(at).addScaledVector(normal, 0.01);  // a hair above the face
    s.scale.setScalar(size);
    group.add(s);
    return s;
  }

  // --- The rolled number, lit up: bright yellow with a glowing halo. Drawn on a bigger square
  //     than a normal number so the halo has room, and the sticker is scaled up to match.
  const GLOW_ROOM = 1.5;                          // the glow square is 1.5× a normal number's square
  const POP = 1.3;                                // how much bigger a lit number ends up
  const glowCache = new Map();
  function glowMaterial(n, underline) {
    const key = `${n}${underline ? "_" : ""}`;
    if (glowCache.has(key)) return glowCache.get(key);
    const c = document.createElement("canvas");
    c.width = c.height = 192;                     // 128 × GLOW_ROOM
    const ctx = c.getContext("2d");
    const digits = String(n).length;
    ctx.font = `bold ${digits > 2 ? 54 : digits > 1 ? 70 : 84}px Georgia, serif`;   // same size as the normal numbers
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const mark = () => { if (underline && (n === 6 || n === 9)) ctx.fillRect(72, 138, 48, 7); };
    ctx.shadowColor = "rgba(255, 200, 40, 1)";    // the halo: a few blurred passes build it up
    ctx.fillStyle = "#ffd84a";
    for (const blur of [28, 16, 8]) { ctx.shadowBlur = blur; ctx.fillText(n, 96, 98); mark(); }
    ctx.shadowBlur = 0;
    ctx.lineWidth = 8; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(80, 38, 0, .9)";
    ctx.strokeText(n, 96, 98);                    // a thin dark edge so it still reads on light skins
    ctx.fillStyle = "#fff4b8"; ctx.fillText(n, 96, 98); mark();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2 });
    glowCache.set(key, mat);
    return mat;
  }

  // --- Light up the number each die landed on, with a quick "pop" (grows past full size, then settles)
  let litList = [];                               // the numbers lit right now
  let popFrame = null;
  function clearHighlight() {
    cancelAnimationFrame(popFrame);
    for (const m of litList) {
      m.material = m.userData.lit.mat;            // back to the normal number
      m.scale.setScalar(m.userData.lit.size);
      delete m.userData.lit;
    }
    litList = [];
  }
  function highlight(values, keep, instant) {
    clearHighlight();
    dice.forEach((d, i) => {
      if (values?.[i] === undefined || keep?.[i] === false) return;   // the dropped die of advantage/disadvantage stays plain
      for (const m of d.group.children) {         // every sticker showing the rolled number (a d4 shows it on three faces)
        const label = m.userData.label;
        if (!label || label.n !== values[i] || (d.kit.kind === "ball" && m !== d.sticker)) continue;
        m.userData.lit = { mat: m.material, size: m.scale.x };
        m.material = glowMaterial(label.n, label.underline);
        litList.push(m);
      }
    });
    const start = performance.now(), POP_MS = 380;
    const grow = now => {
      const t = instant ? 1 : Math.min(1, (now - start) / POP_MS);
      const k = 1 + (POP - 1) * (1 - Math.pow(1 - t, 3)) + Math.sin(t * Math.PI) * 0.18;  // ease out, with a bump in the middle
      for (const m of litList) m.scale.setScalar(m.userData.lit.size * GLOW_ROOM * k);
      renderer.render(scene, camera);
      if (t < 1) popFrame = requestAnimationFrame(grow);
    };
    grow(start);
  }

  // --- Work out each flat face: which way it points, its corners, its middle, and which way is "up" for its number
  function findFaces(geo, squareFaces) {
    const g = geo.index ? geo.toNonIndexed() : geo;  // get the shape as plain triangles
    const p = g.attributes.position, faces = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();   // the direction this triangle faces
      let face = faces.find(f => f.normal.dot(n) > 0.999);              // triangles facing the same way = one face
      if (!face) faces.push(face = { normal: n, corners: [] });
      for (const v of [a, b, c]) if (!face.corners.some(k => k.distanceTo(v) < 1e-4)) face.corners.push(v.clone());
    }
    if (g !== geo) g.dispose();
    for (const f of faces) {
      f.center = f.corners.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(f.corners.length);
      const dist = v => v.distanceTo(f.center);
      let toward = f.corners.reduce((x, v) => dist(v) > dist(x) + 1e-4 ? v : x);  // the farthest corner
      if (squareFaces) {                          // d6: point the number at an edge, not a corner, so it sits straight
        const [k0, ...rest] = f.corners;
        const k1 = rest.reduce((x, v) => v.distanceTo(k0) < x.distanceTo(k0) ? v : x);
        toward = k0.clone().add(k1).multiplyScalar(0.5);
      }
      f.up = toward.clone().sub(f.center).projectOnPlane(f.normal).normalize();
      f.size = Math.min(...f.corners.map(dist));  // how much room the number has
    }
    return faces;
  }

  // --- Number the faces like real dice: opposite faces add up to sides + 1
  function numberFaces(faces, sides) {
    let next = 1;
    for (const f of faces) {
      if (f.value) continue;
      const opposite = faces.find(o => !o.value && o !== f && o.normal.dot(f.normal) < -0.999);
      f.value = next;
      if (opposite) opposite.value = sides + 1 - next;
      next++;
    }
  }

  // --- A d4's four corners, numbered 1 to 4 (a d4 is read at the corner pointing up)
  function cornersOf(faces) {
    const list = [];
    for (const f of faces) for (const v of f.corners)
      if (!list.some(k => k.at.distanceTo(v) < 1e-4)) list.push({ at: v, dir: v.clone().normalize(), value: list.length + 1 });
    return list;
  }

  // --- Put all the numbers on one die
  function addNumbers(group, kit) {
    const underline = kit.sides >= 10;            // 6 and 9 look alike upside down on the bigger dice
    if (kit.kind === "faces") for (const f of kit.faces) addSticker(group, f.value, f.center, f.normal, f.up, f.size * 0.85, underline);
    if (kit.kind === "d4") for (const f of kit.faces) for (const v of f.corners) {   // each face shows each corner's number, near that corner
      const toCorner = v.clone().sub(f.center);
      const value = kit.d4Corners.find(k => k.at.distanceTo(v) < 1e-4).value;
      addSticker(group, value, f.center.clone().addScaledVector(toCorner, 0.5), f.normal, toCorner.clone().normalize(), f.size * 0.5, false);
    }
  }

  // --- Turn a die the smallest amount that puts its lowest face flat on the table
  const DOWN = new THREE.Vector3(0, 0, -1);
  function landFlat(q, normals) {
    if (!normals.length) return q.clone();        // the ball has no flat faces
    let lowest = null;
    for (const n of normals) {
      const w = n.clone().applyQuaternion(q);     // where this face points right now
      if (!lowest || w.z < lowest.z) lowest = w;
    }
    return new THREE.Quaternion().setFromUnitVectors(lowest, DOWN).multiply(q);
  }

  // --- Everything about one type of die, worked out once and shared by every die of that type
  const kits = new Map();
  function kitFor(sides) {
    if (kits.has(sides)) return kits.get(sides);
    const geo = sides === 100 ? SHAPES[sides]() : faceUVs(SHAPES[sides]());  // the ball keeps its own round mapping
    geo.computeBoundingSphere();                  // the smallest ball that fits around the die
    const kind = sides === 100 ? "ball" : sides === 4 ? "d4" : "faces";   // how it shows a result
    const faces = kind === "ball" ? [] : findFaces(geo, sides === 6);
    if (kind === "faces") numberFaces(faces, sides);
    const kit = {
      sides, kind, geo, faces,
      edges: new THREE.EdgesGeometry(geo, 10),
      normals: faces.map(f => f.normal),          // landFlat() works from these
      d4Corners: kind === "d4" ? cornersOf(faces) : [],
      r0: geo.boundingSphere.radius               // its size before shrinking
    };
    kits.set(sides, kit);
    return kit;
  }

  let dice = [];                                  // one entry per die on the table
  let shown = "";                                 // which dice are on the table, e.g. "6,6,8"
  const DIE_SIZE = 0.6;                           // the biggest a die can be (1 = original size)

  function setDice(list) {
    const key = list.join(",");
    if (key === shown) return;                    // e.g. changing the modifier doesn't need new dice
    shown = key;
    cancelAnimationFrame(rollFrame);              // stop any roll in progress
    clearHighlight();
    dice.forEach(d => scene.remove(d.group));     // clear the old dice (their shapes are kept for next time)

    // Shrink the dice when there are lots of them, so together they cover about 20% of the table
    const w = walls(), area = (w.x * 2) * (w.yMax - w.yMin);   // the table's width × depth
    const kitList = list.map(kitFor);
    const footprint = kitList.reduce((sum, k) => sum + Math.PI * k.r0 * k.r0, 0);
    const scale = footprint ? Math.min(DIE_SIZE, Math.sqrt((area * 0.2) / footprint)) : DIE_SIZE;

    dice = kitList.map(kit => {
      const group = new THREE.Group();
      group.add(new THREE.Mesh(kit.geo, kit.kind === "ball" ? ballMat : bodyMat));  // the solid body
      group.add(new THREE.LineSegments(kit.edges, edgeMat));                       // the outlines
      addNumbers(group, kit);                     // the number stickers
      group.scale.setScalar(scale);
      const randomTurn = new THREE.Euler(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3);
      group.quaternion.copy(landFlat(new THREE.Quaternion().setFromEuler(randomTurn), kit.normals));  // lying flat, random face up
      scene.add(group);
      const reach = kit.r0 * scale;               // how far it reaches from its center (for walls)
      return { group, kit, reach, radius: reach * 0.85,   // a little less for bumping, so dice can get close like real ones
               vx: 0, vy: 0, vz: 0 };             // speed sideways, front/back, and up/down
    });
    lineUp();
    renderer.render(scene, camera);
  }

  // --- Line the dice up in neat, centered rows (when they first appear)
  function lineUp() {
    if (!dice.length) return;
    const w = walls(), gap = Math.max(...dice.map(d => d.reach)) * 2.2;
    const perRow = Math.max(1, Math.floor((w.x * 2) / gap));
    const rows = Math.ceil(dice.length / perRow);
    const midY = (w.yMin + w.yMax) / 2;           // the middle of the table, front to back
    dice.forEach((d, i) => {
      const row = Math.floor(i / perRow), col = i % perRow;
      const inRow = Math.min(perRow, dice.length - row * perRow);
      d.group.position.set((col - (inRow - 1) / 2) * gap, midY + ((rows - 1) / 2 - row) * gap, 0);
    });
  }

  const BOUNCE = 0.85;                            // speed kept bouncing off walls and other dice
  const FLOOR_BOUNCE = 0.45;                      // how high a die bounces back up off the table
  const GRAVITY = 30;                             // how hard dice fall back to the table
  const TUMBLE = 1.0;                             // 1 = rolls without sliding; lower = slides a little

  const turn = new THREE.Quaternion(), rollAxis = new THREE.Vector3();

  // --- One small physics step: move, fall and bounce, roll, hit walls, then hit each other
  function step(dt, friction, w, tumbling) {
    const drag = Math.exp(-friction * dt);        // friction: lose a little speed every step
    for (const d of dice) {
      const p = d.group.position;
      d.vx *= drag; d.vy *= drag;
      p.x += d.vx * dt; p.y += d.vy * dt;

      d.vz -= GRAVITY * dt;                       // gravity pulls it down...
      p.z += d.vz * dt;
      if (p.z < 0) {                              // ...until it hits the table
        p.z = 0;
        if (d.vz < -1) { d.vz = -d.vz * FLOOR_BOUNCE; d.vx *= 0.85; d.vy *= 0.85; }  // bounce, losing a bit of speed
        else d.vz = 0;                            // too slow to bounce: it just sits on the table
      }

      const speed = Math.hypot(d.vx, d.vy);
      if (tumbling && speed > 0.01) {             // roll over in the direction it's moving
        rollAxis.set(-d.vy, d.vx, 0).divideScalar(speed);  // the axis is sideways to its path
        turn.setFromAxisAngle(rollAxis, speed * dt / d.reach * TUMBLE);
        d.group.quaternion.premultiply(turn);
      }

      const m = d.reach + 0.1;                    // keep the whole die inside the walls
      const edge = { minX: -w.x + m, maxX: w.x - m, minY: w.yMin + m, maxY: w.yMax - m };
      if (p.x < edge.minX) { p.x = edge.minX; d.vx =  Math.abs(d.vx) * BOUNCE; }   // left wall
      if (p.x > edge.maxX) { p.x = edge.maxX; d.vx = -Math.abs(d.vx) * BOUNCE; }   // right wall
      if (p.y < edge.minY) { p.y = edge.minY; d.vy =  Math.abs(d.vy) * BOUNCE; }   // near edge
      if (p.y > edge.maxY) { p.y = edge.maxY; d.vy = -Math.abs(d.vy) * BOUNCE; }   // far edge
    }
    for (let i = 0; i < dice.length; i++) {       // check every pair of dice once
      for (let j = i + 1; j < dice.length; j++) {
        const a = dice[i], b = dice[j];
        const pa = a.group.position, pb = b.group.position;
        const dx = pb.x - pa.x, dy = pb.y - pa.y;
        const dist = Math.hypot(dx, dy);
        const touch = a.radius + b.radius;        // how close their centers get when touching
        if (dist >= touch) continue;              // not touching, nothing to do
        const nx = dist ? dx / dist : 1, ny = dist ? dy / dist : 0;  // direction from a to b
        const push = (touch - dist) / 2;          // move each half the overlap, so they just touch
        pa.x -= nx * push; pa.y -= ny * push;
        pb.x += nx * push; pb.y += ny * push;
        const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;  // how fast they're heading into each other
        if (closing > 0) {                        // only bounce if they're moving together, not apart
          const kick = closing * (1 + BOUNCE) / 2;  // equal-weight dice share the hit
          a.vx -= kick * nx; a.vy -= kick * ny;
          b.vx += kick * nx; b.vy += kick * ny;
        }
      }
    }
  }

  // --- The extra turn, inside the die, that puts `value` on top without changing how the roll looks
  const UP = new THREE.Vector3(0, 0, 1);
  function topFix(d, end, value) {
    const fix = new THREE.Quaternion();
    if (value === undefined) return fix;
    const { kind } = d.kit;
    if (kind === "ball") { placeBallNumber(d, end, value); return fix; }
    const list = kind === "d4" ? d.kit.d4Corners : d.kit.faces;     // a d4 is read at its top corner, the rest at their top face
    const dirOf = it => it.dir || it.normal;
    const height = it => dirOf(it).clone().applyQuaternion(end.q).z;
    const top = list.reduce((best, it) => height(it) > height(best) ? it : best);  // what ended up on top
    const want = list.find(it => it.value === value);                              // what we rolled
    fix.setFromUnitVectors(dirOf(want), dirOf(top));    // move the rolled number to where the top one was
    if (kind === "faces") {                             // ...and spin it so it reads upright from where you sit
      const v = want.up.clone().applyQuaternion(fix).applyQuaternion(end.q);
      const twist = Math.PI / 2 - Math.atan2(v.y, v.x);
      fix.premultiply(new THREE.Quaternion().setFromAxisAngle(dirOf(top), twist));
    }
    return fix;
  }

  // --- The ball has no faces: put one sticker where it will face you when the ball stops
  function placeBallNumber(d, end, value) {
    if (d.sticker) d.group.remove(d.sticker);
    const view = camera.position.clone().sub(end.p).normalize();   // from the ball toward you
    const screenUp = UP.clone().projectOnPlane(view).normalize();  // "up" as you see it
    const inside = end.q.clone().invert();                         // turn those directions into the ball's own
    const n = view.applyQuaternion(inside), up = screenUp.applyQuaternion(inside);
    const r = d.kit.r0;
    d.sticker = addSticker(d.group, value, n.clone().multiplyScalar(r), n, up, r * 0.9, false);
  }

  // --- Rolling: work out the whole roll first, fix the numbers, then play it back
  const STEP = 1 / 240;                           // the physics runs in steps of 1/240th of a second
  let rollFrame = null;
  function roll(duration, values, keep) {
    cancelAnimationFrame(rollFrame);              // stop any roll already in progress
    clearHighlight();                             // the last roll's numbers go back to normal
    const w = walls();
    const secs = duration / 1000;
    dice.forEach(d => {
      const angle = Math.random() * Math.PI * 2;  // a random direction...
      const speed = 16 + Math.random() * 10;      // ...and speed, in 3D units per second
      d.vx = Math.cos(angle) * speed;
      d.vy = Math.sin(angle) * speed;
      d.vz = 8 + Math.random() * 4;               // tossed up off the table
      d.settle = null;
      d.path = [];
    });

    // 1. Simulate the whole roll right now, recording every die at every step
    const steps = Math.round(secs / STEP);
    const record = () => dice.forEach(d => d.path.push({ p: d.group.position.clone(), q: d.group.quaternion.clone() }));
    record();
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;                        // goes from 0 to 1 over the roll
      const friction = (0.8 + 6 * t * t) * (2 / secs);  // light at first, heavier toward the end
      const tumbling = t < 0.8;                   // roll freely for the first 80%...
      step(STEP, friction, w, tumbling);
      if (!tumbling) {                            // ...then spend the last 20% tipping onto a face
        const k = (t - 0.8) / 0.2;
        const ease = k * k * (3 - 2 * k);         // starts and ends gently
        dice.forEach(d => {
          if (!d.settle) d.settle = { from: d.group.quaternion.clone(), to: landFlat(d.group.quaternion, d.kit.normals) };
          d.group.quaternion.slerpQuaternions(d.settle.from, d.settle.to, ease);
        });
      }
      if (i === steps) dice.forEach(d => { d.group.position.z = 0; });  // fully at rest on the table
      record();
    }

    // 2. Turn each die's numbers so what you rolled is the one that lands on top
    dice.forEach((d, i) => {
      const fix = topFix(d, d.path[d.path.length - 1], values?.[i]);
      d.path.forEach(f => f.q.multiply(fix));
    });

    // 3. Play the recording back over the roll's duration
    const start = performance.now();
    const frame = now => {
      const t = duration ? Math.min(1, Math.max(0, (now - start) / duration)) : 1;  // kept between 0 and 1
      const i = Math.round(t * steps);            // the recorded step for this moment
      dice.forEach(d => { d.group.position.copy(d.path[i].p); d.group.quaternion.copy(d.path[i].q); });
      renderer.render(scene, camera);
      if (t < 1) rollFrame = requestAnimationFrame(frame);  // ask the browser for the next frame
      else highlight(values, keep, !duration);    // landed: light up the rolled numbers
    };
    rollFrame = requestAnimationFrame(frame);
  }

  document.addEventListener("die:roll", e => roll(e.detail.duration, e.detail.values, e.detail.keep));
  document.addEventListener("tray:change", e => setDice(e.detail.dice));
  document.addEventListener("skin:change", e => applySkin(e.detail));
  if (window.tavernSkin) applySkin(window.tavernSkin);   // the skin and dice chosen before this loaded
  setDice(window.tavernDice || [20]);
})();

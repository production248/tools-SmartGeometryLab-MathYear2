import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const toolRoot = resolve(here, "..");
const previewFile = resolve(toolRoot, "index-preview.html");
const productionFile = resolve(toolRoot, "index.html");
const contextualKeys = [
  "goal-shape-explorer", "shape-choose", "shape-move", "shape-properties", "shape-summary",
  "goal-net-builder", "net-choose", "net-compare", "net-fold", "net-check",
  "goal-shape-drawer", "drawer-draw", "drawer-close", "drawer-connect", "drawer-inspect"
];
const shapeIconIds = [
  "triangle", "square", "rectangle", "circle", "cube",
  "cuboid", "pyramid", "cylinder", "cone", "sphere"
];

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
];
const chromePath = chromeCandidates.find(existsSync);
if (!chromePath) throw new Error("Chrome or Edge was not found.");
const hasFfprobe = spawnSync("ffprobe", ["-version"], { windowsHide: true }).status === 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const productionHtml = readFileSync(productionFile, "utf8");
const previewHtml = readFileSync(previewFile, "utf8");
assert(productionHtml.includes('type="module" src="auth-bootstrap.js"'), "Production entry does not load authorization.");
assert(!productionHtml.includes('<script src="app.js"'), "Production entry bypasses authorization by loading app.js directly.");
assert(previewHtml.includes('src="shared-components-loader.js"') && previewHtml.includes('src="app.js"'), "Preview does not load the app directly.");
assert(!previewHtml.includes('id="authGate"'), "Preview unexpectedly contains the authorization gate.");

for (const id of shapeIconIds) {
  const path = resolve(toolRoot, "assets", "shape-icons", `${id}.png`);
  assert(existsSync(path) && statSync(path).size > 2048, `Missing crayon shape icon: ${id}.png`);
  if (hasFfprobe) {
    const probe = spawnSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=codec_name,width,height,pix_fmt", "-of", "json", path
    ], { encoding: "utf8", windowsHide: true });
    assert(probe.status === 0, `Invalid crayon shape icon: ${id}.png`);
    const stream = JSON.parse(probe.stdout).streams?.[0];
    assert(stream?.codec_name === "png" && stream.width === 256 && stream.height === 256 && stream.pix_fmt === "rgba", `Crayon shape icon must be a 256x256 transparent PNG: ${id}.png (${probe.stdout.trim()})`);
  } else {
    const image = readFileSync(path);
    assert(image.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && image.readUInt32BE(16) === 256 && image.readUInt32BE(20) === 256 && image[25] === 6, `Crayon shape icon must be a 256x256 transparent PNG: ${id}.png`);
  }
}

for (const language of ["bm", "zh", "en"]) {
  for (const key of contextualKeys) {
    const path = resolve(toolRoot, "assets", "operation-guide", "voices", language, "contextual", `${key}.mp3`);
    assert(existsSync(path) && statSync(path).size > 1024, `Missing narration: ${language}/${key}.mp3`);
    if (hasFfprobe) {
      const probe = spawnSync("ffprobe", [
        "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name", "-of", "default=noprint_wrappers=1:nokey=1", path
      ], { encoding: "utf8", windowsHide: true });
      assert(probe.status === 0 && probe.stdout.trim() === "mp3", `Invalid narration: ${language}/${key}.mp3`);
    } else {
      const audio = readFileSync(path);
      assert(audio.toString("ascii", 0, 3) === "ID3" || (audio[0] === 255 && (audio[1] & 224) === 224), `Invalid narration: ${language}/${key}.mp3`);
    }
  }
}

const port = 9450 + Math.floor(Math.random() * 300);
const profile = mkdtempSync(join(tmpdir(), "edcloud-geometry-smoke-"));
const browser = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--allow-file-access-from-files",
  "--autoplay-policy=no-user-gesture-required",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--window-size=1440,900",
  pathToFileURL(previewFile).href
], { stdio: "ignore", windowsHide: true });

const delay = milliseconds => new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
      const page = pages.find(candidate => candidate.type === "page" && candidate.url.startsWith("file:"));
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (_) {
      // Browser is starting.
    }
    await delay(100);
  }
  throw new Error("Chrome DevTools endpoint did not become ready.");
}

const socket = new WebSocket(await waitForEndpoint());
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", rejectOpen, { once: true });
});

let nextId = 1;
const pending = new Map();
const browserErrors = [];
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const pendingCall = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) pendingCall.reject(new Error(message.error.message));
    else pendingCall.resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails?.text || "Runtime exception");
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") browserErrors.push(message.params.entry.text);
});

function call(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCall, rejectCall) => pending.set(id, { resolve: resolveCall, reject: rejectCall }));
}

async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Evaluation failed");
  return result.result.value;
}

async function waitFor(expression, message, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`${message} Browser errors: ${browserErrors.join(" | ")}`);
}

async function setMysterySolid(id) {
  await evaluate(`(() => {
    const tool = state.tool;
    tool.shape = ${JSON.stringify(id)};
    tool.step = 0;
    tool.revealed = false;
    tool.viewX = -18;
    tool.viewY = 30;
    delete tool.foldTransitionFrom;
    renderTool();
  })()`);
  await waitFor(`state.tool.shape === ${JSON.stringify(id)} && document.querySelector('#foldStep')?.value === '0'`, `${id} mystery net did not reset.`);
}

async function verifyPolyhedronFoldAnimation(spec) {
  await setMysterySolid(spec.id);
  await waitFor(`document.querySelector('.polyhedron-fold-model')?.dataset.foldStep === '0.00'`, `${spec.id} did not reset to its flat net.`);
  let lastFaceStartPoints = "";

  for (let index = 0; index < spec.order.length; index += 1) {
    const targetStep = index + 1;
    const targetFace = spec.order[index];
    const startPoints = await evaluate(`document.querySelector('[data-fold-face="${targetFace}"] .solid-face').getAttribute('points')`);
    if (targetStep === spec.order.length) lastFaceStartPoints = startPoints;
    await evaluate(`(() => {
      const input = document.querySelector('#foldStep');
      input.value = '${targetStep}';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await waitFor(`(() => {
      const model = document.querySelector('.polyhedron-fold-model');
      const face = document.querySelector('[data-fold-face="${targetFace}"]');
      const step = Number(model?.dataset.foldStep);
      const progress = Number(face?.dataset.foldProgress);
      return step > ${index} && step < ${targetStep} && progress > 0 && progress < 1;
    })()`, `${spec.id} face ${targetFace} did not produce an intermediate folding frame.`);
    const intermediate = await evaluate(`(() => {
      const model = document.querySelector('.polyhedron-fold-model');
      const face = document.querySelector('[data-fold-face="${targetFace}"]');
      return {
        points: face.querySelector('.solid-face').getAttribute('points'),
        progress: Number(face.dataset.foldProgress),
        activeFace: model.querySelector('.folding-face-group.active')?.dataset.foldFace,
        faceCount: model.querySelectorAll('[data-fold-face]').length,
        completedReady: ${JSON.stringify(spec.order.slice(0, index))}.every(id => model.querySelector('[data-fold-face="' + id + '"]')?.dataset.foldProgress === '1.00'),
        futureFlat: ${JSON.stringify(spec.order.slice(index + 1))}.every(id => model.querySelector('[data-fold-face="' + id + '"]')?.dataset.foldProgress === '0.00')
      };
    })()`);
    assert(intermediate.points !== startPoints && intermediate.progress > 0 && intermediate.progress < 1 && intermediate.activeFace === String(targetFace) && intermediate.faceCount === spec.faces && intermediate.completedReady && intermediate.futureFlat, `${spec.id} face ${targetFace} has an invalid intermediate fold: ${JSON.stringify(intermediate)}`);
    if ((spec.id === "cube" || spec.id === "cuboid") && targetFace === 5) {
      const hingeGap = await evaluate(`(() => {
        const points = face => document.querySelector('[data-fold-face="' + face + '"] .solid-face').getAttribute('points').trim().split(/\\s+/).map(pair => pair.split(',').map(Number));
        const face4 = points(4), face5 = points(5);
        const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
        return Math.max(distance(face4[1], face5[0]), distance(face4[2], face5[3]));
      })()`);
      assert(hingeGap <= .2, `${spec.id} face 5 detached from face 4 during folding: ${hingeGap}`);
    }
    await waitFor(`document.querySelector('#netFold3d')?.dataset.foldAnimating !== 'true' && document.querySelector('.polyhedron-fold-model')?.dataset.foldStep === '${targetStep.toFixed(2)}' && document.querySelector('[data-fold-face="${targetFace}"]')?.dataset.foldProgress === '1.00'`, `${spec.id} face ${targetFace} did not finish folding.`);
    const finalPoints = await evaluate(`document.querySelector('[data-fold-face="${targetFace}"] .solid-face').getAttribute('points')`);
    assert(finalPoints !== startPoints && finalPoints !== intermediate.points, `${spec.id} face ${targetFace} did not move through distinct start, middle, and end positions.`);
  }

  const lastFace = spec.order.at(-1);
  await evaluate(`document.querySelector('#previousFold').click()`);
  await waitFor(`(() => {
    const step = Number(document.querySelector('.polyhedron-fold-model')?.dataset.foldStep);
    const progress = Number(document.querySelector('[data-fold-face="${lastFace}"]')?.dataset.foldProgress);
    return step > ${spec.order.length - 1} && step < ${spec.order.length} && progress > 0 && progress < 1;
  })()`, `${spec.id} did not animate while unfolding face ${lastFace}.`);
  await waitFor(`document.querySelector('#netFold3d')?.dataset.foldAnimating !== 'true' && document.querySelector('.polyhedron-fold-model')?.dataset.foldStep === '${(spec.order.length - 1).toFixed(2)}' && document.querySelector('[data-fold-face="${lastFace}"]')?.dataset.foldProgress === '0.00'`, `${spec.id} face ${lastFace} did not finish unfolding.`);
  const reversedPoints = await evaluate(`document.querySelector('[data-fold-face="${lastFace}"] .solid-face').getAttribute('points')`);
  assert(reversedPoints === lastFaceStartPoints, `${spec.id} reverse animation did not return face ${lastFace} to its prior position.`);
}

try {
  await call("Runtime.enable");
  await call("Page.enable");
  await call("Log.enable");
  await waitFor(
    `Boolean(document.querySelector('#activityTitle')?.textContent && document.querySelector('edcloud-operation-guide')?.shadowRoot?.querySelector('.guide-root[data-ready="true"]'))`,
    "Geometry tool or shared guide did not initialize."
  );

  const desktop = await evaluate(`(() => {
    const font = selector => Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return {
      tabs: [...document.querySelectorAll('.activity-tab')].map(button => button.dataset.activity),
      brandTitle: font('.brand h1'),
      brandSubtitle: font('.brand p'),
      activityTab: font('.activity-tab'),
      challenge: font('.challenge-text'),
      feedback: font('.feedback'),
      inactiveTabAnimation: getComputedStyle(document.querySelector('.activity-tab:not(.active)')).animationName,
      inactiveTabDuration: Number.parseFloat(getComputedStyle(document.querySelector('.activity-tab:not(.active)')).animationDuration),
      activeTabAnimation: getComputedStyle(document.querySelector('.activity-tab.active')).animationName,
      inactiveChoiceAnimation: getComputedStyle(document.querySelector('.choice-chip:not(.active)')).animationName,
      shapeSummaryHidden: document.querySelector('#liveSummary').hidden,
      shapeFullscreenLabel: document.querySelector('#shapeFullscreenToggle').textContent.trim(),
      shapeFullscreenPressed: document.querySelector('#shapeFullscreenToggle').getAttribute('aria-pressed'),
      shapeFullscreenButton: rect('#shapeFullscreenToggle'),
      explanationFont: font('.property-explanation'),
      explorer: rect('.shape-explorer'),
      shapeCanvas: rect('.shape-canvas'),
      propertyPanel: rect('.property-panel'),
      propertyExplanation: rect('.property-explanation'),
      shapeIcons: [...document.querySelectorAll('[data-shape] .shape-choice-icon')].map(icon => ({
        source: icon.getAttribute('src'),
        loaded: icon.complete && icon.naturalWidth === 256 && icon.naturalHeight === 256,
        width: Number.parseFloat(getComputedStyle(icon).width)
      })),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      sideCard: Boolean(document.querySelector('.control-card')),
      repeatedSteps: Boolean(document.querySelector('.steps')) || document.querySelector('#toolGuide')?.offsetParent !== null
    };
  })()`);
  assert(JSON.stringify(desktop.tabs) === JSON.stringify(["shapeExplorer", "netBuilder", "shapeDrawer"]), `Wrong Year 2 activities: ${JSON.stringify(desktop)}`);
  assert(desktop.brandTitle <= 41 && desktop.brandSubtitle === 14, `Brand copy was enlarged: ${JSON.stringify(desktop)}`);
  assert(desktop.activityTab >= 30 && desktop.challenge >= 52 && desktop.feedback >= 30, `Classroom copy is too small: ${JSON.stringify(desktop)}`);
  assert(desktop.inactiveTabAnimation === "choice-nudge" && desktop.inactiveTabDuration >= 6 && desktop.activeTabAnimation === "none" && desktop.inactiveChoiceAnimation === "choice-nudge", `Periodic choice nudges are not configured correctly: ${JSON.stringify(desktop)}`);
  assert(desktop.shapeSummaryHidden, `The duplicate shape summary is still visible: ${JSON.stringify(desktop)}`);
  assert(desktop.shapeFullscreenLabel.includes("Paparan bentuk penuh") && desktop.shapeFullscreenPressed === "false" && desktop.shapeFullscreenButton.left >= desktop.shapeCanvas.left && desktop.shapeFullscreenButton.right <= desktop.shapeCanvas.right, `The shape full-screen control is missing or misplaced: ${JSON.stringify(desktop)}`);
  assert(desktop.explanationFont >= 32 && desktop.propertyExplanation.left <= desktop.explorer.left + 1 && desktop.propertyExplanation.right >= desktop.explorer.right - 1 && desktop.propertyExplanation.top >= Math.max(desktop.shapeCanvas.bottom, desktop.propertyPanel.bottom) - 1, `The enlarged shape explanation is not a full-width row below the diagram: ${JSON.stringify(desktop)}`);
  assert(desktop.shapeIcons.length === 10 && desktop.shapeIcons.every((icon, index) => icon.source.endsWith(`assets/shape-icons/${shapeIconIds[index]}.png`) && icon.loaded && icon.width >= 54), `Desktop crayon shape icons are missing, broken, or too small: ${JSON.stringify(desktop.shapeIcons)}`);
  assert(!desktop.horizontalOverflow && !desktop.sideCard && !desktop.repeatedSteps, `Desktop layout regression: ${JSON.stringify(desktop)}`);

  await evaluate(`Object.defineProperty(document.querySelector('.shape-canvas'), 'requestFullscreen', { configurable: true, value: undefined }); document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen')`, "The shape full-screen fallback did not open.");
  const expandedShape = await evaluate(`(() => {
    const canvas = document.querySelector('.shape-canvas');
    const button = document.querySelector('#shapeFullscreenToggle');
    return {
      canvas: canvas.getBoundingClientRect().toJSON(),
      viewport: { width: innerWidth, height: innerHeight },
      bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
      pressed: button.getAttribute('aria-pressed'),
      label: button.textContent.trim(),
      propertiesInsideCanvas: canvas.contains(document.querySelector('.property-panel')),
      explanationInsideCanvas: canvas.contains(document.querySelector('.property-explanation'))
    };
  })()`);
  assert(expandedShape.canvas.left === 0 && expandedShape.canvas.top === 0 && Math.abs(expandedShape.canvas.width - expandedShape.viewport.width) <= 1 && Math.abs(expandedShape.canvas.height - expandedShape.viewport.height) <= 1 && expandedShape.bodyLocked && expandedShape.pressed === "true" && expandedShape.label.includes("Keluar paparan bentuk") && !expandedShape.propertiesInsideCanvas && !expandedShape.explanationInsideCanvas, `The shape canvas alone does not cover the desktop viewport: ${JSON.stringify(expandedShape)}`);
  await evaluate(`for (let step = 0; step < 3; step += 1) document.querySelector('.solid-zoom-controls button:last-of-type').click()`);
  const expandedZoom = await evaluate(`(() => {
    const canvas = document.querySelector('.shape-canvas').getBoundingClientRect();
    const svg = document.querySelector('.solid-3d-svg');
    const graphics = [...svg.querySelectorAll('.solid-face, .solid-edge, .solid-face-label')]
      .map(element => element.getBoundingClientRect())
      .filter(rect => rect.width > 0 || rect.height > 0);
    return {
      zoom: document.querySelector('.solid-zoom-value').textContent.trim(),
      overflow: getComputedStyle(svg).overflow,
      canvas: canvas.toJSON(),
      graphics: {
        left: Math.min(...graphics.map(rect => rect.left)),
        top: Math.min(...graphics.map(rect => rect.top)),
        right: Math.max(...graphics.map(rect => rect.right)),
        bottom: Math.max(...graphics.map(rect => rect.bottom))
      },
      fullscreen: document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen'),
      pressed: document.querySelector('#shapeFullscreenToggle').getAttribute('aria-pressed')
    };
  })()`);
  assert(expandedZoom.zoom === "160%" && expandedZoom.overflow === "visible" && expandedZoom.fullscreen && expandedZoom.pressed === "true" && expandedZoom.graphics.left >= expandedZoom.canvas.left && expandedZoom.graphics.top >= expandedZoom.canvas.top && expandedZoom.graphics.right <= expandedZoom.canvas.right && expandedZoom.graphics.bottom <= expandedZoom.canvas.bottom, `The 160% solid is clipped or shape full-screen state was lost: ${JSON.stringify(expandedZoom)}`);
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await waitFor(`!document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen')`, "Escape did not close the shape full-screen fallback.");
  await evaluate(`delete document.querySelector('.shape-canvas').requestFullscreen`);

  const solidAssemblySpecs = [
    { id: "cuboid", parts: 6 },
    { id: "pyramid", parts: 5 },
    { id: "cylinder", parts: 3 },
    { id: "cone", parts: 2 },
    { id: "sphere", parts: 1 },
    { id: "cube", parts: 6 }
  ];
  for (const spec of solidAssemblySpecs) {
    await evaluate(`document.querySelector('[data-shape="${spec.id}"]').click()`);
    await waitFor(`document.querySelector('#shapeSolid3d[data-solid-shape="${spec.id}"]')?.classList.contains('solid-assembling')`, `${spec.id} did not start its solid assembly animation.`);
    const assembling = await evaluate(`(() => {
      const svg = document.querySelector('#shapeSolid3d');
      const parts = [...svg.querySelectorAll('.solid-assembly-part[data-solid-part]')];
      return {
        shape: svg.dataset.solidShape,
        activeChoice: document.querySelector('[data-shape].active')?.dataset.shape,
        uniqueParts: [...new Set(parts.map(part => part.dataset.solidPart))],
        animationCount: svg.__solidAssemblyAnimations?.length || 0,
        movingParts: parts.filter(part => {
          const style = getComputedStyle(part);
          return Number(style.opacity) < .99 || (style.transform !== 'none' && !style.transform.includes('matrix(1, 0, 0, 1'));
        }).length,
        flagConsumed: state.tool.assembleSolid === false
      };
    })()`);
    assert(assembling.shape === spec.id && assembling.activeChoice === spec.id && assembling.uniqueParts.length === spec.parts && assembling.animationCount >= spec.parts && assembling.movingParts > 0 && assembling.flagConsumed, `${spec.id} assembly structure or motion is wrong: ${JSON.stringify(assembling)}`);
    await waitFor(`!document.querySelector('#shapeSolid3d')?.classList.contains('solid-assembling')`, `${spec.id} assembly animation did not settle.`, 3000);
    const assembled = await evaluate(`(() => {
      const svg = document.querySelector('#shapeSolid3d');
      return {
        active: svg.classList.contains('solid-assembling'),
        animations: svg.__solidAssemblyAnimations?.length || 0,
        visible: [...svg.querySelectorAll('.solid-assembly-part')].every(part => Number(getComputedStyle(part).opacity) === 1)
      };
    })()`);
    assert(!assembled.active && assembled.animations === 0 && assembled.visible, `${spec.id} did not finish as a complete solid: ${JSON.stringify(assembled)}`);
  }

  await evaluate(`document.querySelector('[data-shape="cube"]').click()`);
  await delay(80);
  assert(await evaluate(`!document.querySelector('#shapeSolid3d').classList.contains('solid-assembling') && !state.tool.assembleSolid`), "Clicking the active solid replayed its assembly animation.");

  await evaluate(`document.querySelector('[data-shape="pyramid"]').click()`);
  await waitFor(`document.querySelector('#shapeSolid3d')?.classList.contains('solid-assembling')`, "Pyramid assembly did not start for the drag-interruption check.");
  const assemblyBeforeDrag = await evaluate(`document.querySelector('#shapeSolid3d .solid-face').getAttribute('points')`);
  await evaluate(`(() => {
    const svg = document.querySelector('#shapeSolid3d');
    const rect = svg.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    svg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 31, pointerType: 'mouse', buttons: 1, clientX: startX, clientY: startY }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 31, pointerType: 'mouse', buttons: 1, clientX: startX + 72, clientY: startY + 24 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 31, pointerType: 'mouse', buttons: 0, clientX: startX + 72, clientY: startY + 24 }));
  })()`);
  await waitFor(`!document.querySelector('#shapeSolid3d')?.classList.contains('solid-assembling')`, "Dragging did not finish the in-progress solid assembly.");
  const assemblyAfterDrag = await evaluate(`({
    points: document.querySelector('#shapeSolid3d .solid-face').getAttribute('points'),
    animations: document.querySelector('#shapeSolid3d').__solidAssemblyAnimations?.length || 0
  })`);
  assert(assemblyAfterDrag.points !== assemblyBeforeDrag && assemblyAfterDrag.animations === 0, `The solid could not be dragged cleanly during assembly: ${JSON.stringify(assemblyAfterDrag)}`);

  await evaluate(`document.querySelector('[data-property="1"]').click(); document.querySelector('#reset3dView').click()`);
  await delay(80);
  assert(await evaluate(`!document.querySelector('#shapeSolid3d').classList.contains('solid-assembling') && !state.tool.assembleSolid`), "A property or reset action replayed the solid assembly animation.");

  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await evaluate(`document.querySelector('[data-shape="cylinder"]').click()`);
  await delay(100);
  const reducedAssembly = await evaluate(`(() => {
    const svg = document.querySelector('#shapeSolid3d');
    return {
      shape: svg.dataset.solidShape,
      active: svg.classList.contains('solid-assembling'),
      animations: svg.__solidAssemblyAnimations?.length || 0,
      visible: [...svg.querySelectorAll('.solid-assembly-part')].every(part => Number(getComputedStyle(part).opacity) === 1)
    };
  })()`);
  assert(reducedAssembly.shape === "cylinder" && !reducedAssembly.active && reducedAssembly.animations === 0 && reducedAssembly.visible, `Reduced-motion mode did not skip solid assembly cleanly: ${JSON.stringify(reducedAssembly)}`);
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await evaluate(`state.tool.shape = 'cube'; state.tool.property = 0; state.tool.assembleSolid = false; state.tool.viewX = -18; state.tool.viewY = 30; state.tool.zoom = 1; renderTool()`);

  await evaluate(`document.querySelector('[data-property="1"]').click()`);
  await waitFor(`document.querySelector('[data-property="1"]')?.classList.contains('active') && document.querySelectorAll('.solid-edge.feature-active').length > 0`, "Shape Explorer did not activate its edges.");
  const edgePulse = await evaluate(`(() => ({
    activeEdges: document.querySelectorAll('.solid-edge.feature-active').length,
    animationNames: [...document.querySelectorAll('.solid-edge.feature-active')].map(edge => getComputedStyle(edge).animationName),
    vertexCount: document.querySelectorAll('.solid-vertex').length
  }))()`);
  assert(edgePulse.activeEdges > 0 && edgePulse.animationNames.every(name => name === "edge-gentle-pulse") && edgePulse.vertexCount === 0, `Shape Explorer edges do not use the subtle edge pulse exclusively: ${JSON.stringify(edgePulse)}`);

  await evaluate(`document.querySelector('[data-property="2"]').click()`);
  await waitFor(`document.querySelector('[data-property="2"]')?.classList.contains('active') && document.querySelectorAll('.solid-vertex.feature-active').length > 0`, "Shape Explorer did not activate its vertices.");
  const vertexPulse = await evaluate(`(() => ({
    activeVertices: document.querySelectorAll('.solid-vertex.feature-active').length,
    animationNames: [...document.querySelectorAll('.solid-vertex.feature-active')].map(vertex => getComputedStyle(vertex).animationName),
    edgeAnimations: [...document.querySelectorAll('.solid-edge')].map(edge => getComputedStyle(edge).animationName)
  }))()`);
  assert(vertexPulse.activeVertices > 0 && vertexPulse.animationNames.every(name => name === "vertex-gentle-pulse") && vertexPulse.edgeAnimations.every(name => name === "none"), `Shape Explorer vertices do not use the subtle vertex-only pulse: ${JSON.stringify(vertexPulse)}`);

  await evaluate(`document.querySelector('[data-property="0"]').click()`);
  const faceModePulse = await evaluate(`(() => ({
    edgeAnimations: [...document.querySelectorAll('.solid-edge')].map(edge => getComputedStyle(edge).animationName),
    vertexCount: document.querySelectorAll('.solid-vertex').length
  }))()`);
  assert(faceModePulse.edgeAnimations.length > 0 && faceModePulse.edgeAnimations.every(name => name === "none") && faceModePulse.vertexCount === 0, `Face mode unexpectedly animates edges or vertices: ${JSON.stringify(faceModePulse)}`);

  await evaluate(`document.querySelector('[data-property="1"]').click()`);
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const reducedEdgePulse = await evaluate(`(() => ({
    choice: getComputedStyle(document.querySelector('.activity-tab:not(.active)')).animationName,
    edges: [...document.querySelectorAll('.solid-edge.feature-active')].map(edge => getComputedStyle(edge).animationName)
  }))()`);
  assert(reducedEdgePulse.choice === "none" && reducedEdgePulse.edges.length > 0 && reducedEdgePulse.edges.every(name => name === "none"), `Reduced-motion mode did not disable choice nudges and edge pulses: ${JSON.stringify(reducedEdgePulse)}`);
  await evaluate(`document.querySelector('[data-property="2"]').click()`);
  const reducedVertexPulse = await evaluate(`[...document.querySelectorAll('.solid-vertex.feature-active')].map(vertex => getComputedStyle(vertex).animationName)`);
  assert(reducedVertexPulse.length > 0 && reducedVertexPulse.every(name => name === "none"), `Reduced-motion mode did not disable vertex pulses: ${JSON.stringify(reducedVertexPulse)}`);
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await evaluate(`document.querySelector('[data-property="0"]').click()`);

  const activities = [
    { id: "shapeExplorer", goal: "Kenali bentuk", firstKey: "goal-shape-explorer" },
    { id: "netBuilder", goal: "Fahami bentangan", firstKey: "goal-net-builder" },
    { id: "shapeDrawer", goal: "Bina bentuk 2D dan 3D", firstKey: "goal-shape-drawer" }
  ];
  for (const activity of activities) {
    await evaluate(`document.querySelector('.activity-tab[data-activity="${activity.id}"]').click()`);
    await waitFor(`document.querySelector('.activity-tab.active')?.dataset.activity === '${activity.id}'`, `${activity.id} did not activate.`);
    const closedState = await evaluate(`(() => {
      const guide = document.querySelector('edcloud-operation-guide');
      return {
        hidden: guide.shadowRoot.querySelector('.guide-layer').hidden,
        ids: guide._config.steps.map(step => step.id),
        targets: guide._config.steps.map(step => step.target),
        narrations: guide._config.steps.map(step => step.narration?.bm),
        copy: guide._config.steps.map(step => step.content),
        summaryHidden: document.querySelector('#liveSummary').hidden
      };
    })()`);
    assert(closedState.hidden, `${activity.id} opened the guide automatically.`);
    assert(closedState.ids.length === 5 && closedState.ids.every(id => id.startsWith(`${activity.id}-`)), `${activity.id} guide is not activity-specific: ${JSON.stringify(closedState)}`);
    assert(closedState.targets[0] === `.activity-tab[data-activity="${activity.id}"]`, `${activity.id} goal target is wrong.`);
    if (activity.id === "shapeExplorer") {
      assert(closedState.targets.at(-1) === "#visualStage .property-explanation" && closedState.summaryHidden, `Shape Explorer still targets the removed duplicate summary: ${JSON.stringify(closedState)}`);
    } else if (activity.id === "netBuilder") {
      const expectedTargets = ['.activity-tab[data-activity="netBuilder"]', '#netFold3d .polyhedron-fold-model, #netFold3d .cylinder-fold-model', '#foldStep', '#nextFold', '#revealNetAnswer'];
      const expectedNarrations = ['goal-net-builder', 'net-choose', 'net-compare', 'net-fold', 'net-check'];
      const staleGuidePhrases = [
        'Pilih kubus', 'Bandingkan bentangan rata dengan binaan 3D', 'Lihat senarai muka',
        '选择正方体', '比较平面展开图和立体模型', '查看已经折起的面',
        'Choose a cube', 'Compare the flat net with the 3D build', 'Watch the list of folded faces',
        'Learn how flat faces fold', 'Tap Next step to fold one face'
      ];
      const requiredGuidePhrases = [
        'Selepas panduan ditutup', 'setiap bahagian bentangan',
        '指南结束后', '展开图的各部分',
        'After the guide closes', 'each part of a net'
      ];
      const visibleCopy = closedState.copy.flatMap(content => Object.values(content || {}).flatMap(value => [value?.title || '', value?.body || ''])).join(' ');
      assert(JSON.stringify(closedState.targets) === JSON.stringify(expectedTargets), `Mystery Net guide targets are out of sequence: ${JSON.stringify(closedState.targets)}`);
      assert(closedState.narrations.every((source, index) => source?.includes(`/bm/contextual/${expectedNarrations[index]}.mp3`)), `Mystery Net guide narrations are out of sequence: ${JSON.stringify(closedState.narrations)}`);
      assert(staleGuidePhrases.every(phrase => !visibleCopy.includes(phrase)) && requiredGuidePhrases.every(phrase => visibleCopy.includes(phrase)) && visibleCopy.includes('Semak langkah lipatan') && visibleCopy.includes('查看折叠步骤') && visibleCopy.includes('Track the folding steps') && !closedState.summaryHidden, `Mystery Net guide still describes removed content or omits the corrected folding instructions: ${visibleCopy}`);
    } else {
      assert(!closedState.summaryHidden, `${activity.id} did not restore its result summary.`);
    }

    await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.actor-button').click()`);
    await waitFor(`!document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.guide-layer').hidden`, `${activity.id} guide did not open.`);
    const opened = await evaluate(`(() => {
      const guide = document.querySelector('edcloud-operation-guide');
      const root = guide.shadowRoot;
      const card = root.querySelector('.guide-card').getBoundingClientRect();
      return {
        title: root.querySelector('#guide-title').textContent,
        count: root.querySelector('.step-count').textContent,
        narration: root.querySelector('.narration').src,
        titleSize: Number.parseFloat(getComputedStyle(root.querySelector('#guide-title')).fontSize),
        bodySize: Number.parseFloat(getComputedStyle(root.querySelector('.guide-body')).fontSize),
        card: card.toJSON()
      };
    })()`);
    assert(opened.title === activity.goal && opened.count.includes("1") && opened.count.includes("5"), `${activity.id} goal copy is wrong: ${JSON.stringify(opened)}`);
    assert(opened.narration.includes(`/bm/contextual/${activity.firstKey}.mp3`), `${activity.id} narration is wrong.`);
    assert(opened.titleSize >= 50 && opened.bodySize >= 38, `${activity.id} guide copy is too small.`);
    assert(opened.card.left >= 0 && opened.card.right <= 1440 && opened.card.top >= 0 && opened.card.bottom <= 900, `${activity.id} guide is outside the desktop viewport.`);

    if (activity.id === "netBuilder") {
      const expectedTargets = ['.activity-tab[data-activity="netBuilder"]', '#netFold3d .polyhedron-fold-model, #netFold3d .cylinder-fold-model', '#foldStep', '#nextFold', '#revealNetAnswer'];
      const expectedNarrations = ['goal-net-builder', 'net-choose', 'net-compare', 'net-fold', 'net-check'];
      for (let stepIndex = 0; stepIndex < expectedTargets.length; stepIndex += 1) {
        if (stepIndex > 0) await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.next-button').click()`);
        await waitFor(`(() => {
          const guide = document.querySelector('edcloud-operation-guide');
          return guide._sequenceIndex === ${stepIndex} && !guide._moving && guide._currentTarget === document.querySelector(${JSON.stringify(expectedTargets[stepIndex])});
        })()`, `Mystery Net guide did not reach step ${stepIndex + 1}.`);
        const guideStep = await evaluate(`(() => {
          const guide = document.querySelector('edcloud-operation-guide');
          const root = guide.shadowRoot;
          const target = document.querySelector(${JSON.stringify(expectedTargets[stepIndex])});
          const targetRect = target.getBoundingClientRect();
          const spotlight = root.querySelector('.spotlight').getBoundingClientRect();
          const card = root.querySelector('.guide-card').getBoundingClientRect();
          const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          return {
            id: guide._currentStep().id,
            narration: root.querySelector('.narration').src,
            targetVisible: targetRect.width > 0 && targetRect.height > 0 && targetRect.top < innerHeight && targetRect.bottom > 0,
            spotlightCoversTarget: spotlight.left <= targetRect.left && spotlight.top <= targetRect.top && spotlight.right >= targetRect.right && spotlight.bottom >= targetRect.bottom,
            cardAvoidsTarget: !overlaps(card, targetRect),
            cardInViewport: card.left >= 0 && card.top >= 0 && card.right <= innerWidth && card.bottom <= innerHeight,
            target: targetRect.toJSON(),
            spotlight: spotlight.toJSON(),
            card: card.toJSON()
          };
        })()`);
        assert(guideStep.id === `netBuilder-${['goal-net-builder', 'net-choose', 'net-compare', 'net-fold', 'net-check'][stepIndex]}` && guideStep.narration.includes(`/bm/contextual/${expectedNarrations[stepIndex]}.mp3`) && guideStep.targetVisible && guideStep.spotlightCoversTarget && guideStep.cardInViewport, `Mystery Net guide step ${stepIndex + 1} points incorrectly: ${JSON.stringify(guideStep)}`);
      }
    }

    const lockedActivity = activity.id === "shapeExplorer" ? "netBuilder" : "shapeExplorer";
    await evaluate(`document.querySelector('.activity-tab[data-activity="${lockedActivity}"]').click()`);
    assert(await evaluate(`document.querySelector('.activity-tab.active').dataset.activity === '${activity.id}'`), `${activity.id} changed while its guide was open.`);
    await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.close-button').click()`);
    await waitFor(`(() => {
      const guide = document.querySelector('edcloud-operation-guide');
      return guide.shadowRoot.querySelector('.guide-layer').hidden && !guide._closing && !guide._moving;
    })()`, `${activity.id} guide did not finish closing.`);
  }

  const drawPlaneSetup = await evaluate(`(() => {
    const canvas = document.querySelector('.shape-fullscreen-canvas');
    const board = document.querySelector('#drawBoard');
    board.dataset.smokeIdentity = 'preserved';
    return {
      canvasContainsBoard: canvas?.contains(board),
      canvasContainsButton: canvas?.contains(document.querySelector('#shapeFullscreenToggle')),
      buttonLabel: document.querySelector('#shapeFullscreenToggle')?.textContent.trim(),
      button: document.querySelector('#shapeFullscreenToggle')?.getBoundingClientRect().toJSON(),
      board: board?.getBoundingClientRect().toJSON()
    };
  })()`);
  assert(drawPlaneSetup.canvasContainsBoard && drawPlaneSetup.canvasContainsButton && drawPlaneSetup.buttonLabel.includes("Paparan bentuk penuh") && drawPlaneSetup.button.bottom <= drawPlaneSetup.board.top, `The drawing board full-screen control is missing or overlaps the drawable grid: ${JSON.stringify(drawPlaneSetup)}`);
  await evaluate(`Object.defineProperty(document.querySelector('.shape-fullscreen-canvas'), 'requestFullscreen', { configurable: true, value: undefined }); document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`document.querySelector('.shape-fullscreen-canvas').classList.contains('is-viewport-fullscreen')`, "The drawing-board full-screen fallback did not open.");
  await evaluate(`(() => {
    const board = document.querySelector('#drawBoard');
    const rect = board.getBoundingClientRect();
    const pointer = (type, x, y) => new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 41,
      pointerType: 'mouse',
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: rect.left + x / 400 * rect.width,
      clientY: rect.top + y / 300 * rect.height
    });
    board.dispatchEvent(pointer('pointerdown', 60, 60));
    window.dispatchEvent(pointer('pointermove', 100, 60));
    window.dispatchEvent(pointer('pointermove', 140, 100));
    window.dispatchEvent(pointer('pointerup', 140, 100));
  })()`);
  const drawPlaneExpanded = await evaluate(`(() => {
    const canvas = document.querySelector('.shape-fullscreen-canvas');
    const rect = canvas.getBoundingClientRect();
    return {
      rect: rect.toJSON(),
      viewport: { width: innerWidth, height: innerHeight },
      pointCount: document.querySelectorAll('#drawBoard .point-handle').length,
      boardPreserved: document.querySelector('#drawBoard').dataset.smokeIdentity === 'preserved',
      pressed: document.querySelector('#shapeFullscreenToggle').getAttribute('aria-pressed'),
      bodyLocked: getComputedStyle(document.body).overflow === 'hidden'
    };
  })()`);
  assert(drawPlaneExpanded.pointCount >= 3 && drawPlaneExpanded.boardPreserved && drawPlaneExpanded.pressed === "true" && drawPlaneExpanded.bodyLocked && Math.abs(drawPlaneExpanded.rect.width - drawPlaneExpanded.viewport.width) <= 1 && Math.abs(drawPlaneExpanded.rect.height - drawPlaneExpanded.viewport.height) <= 1, `Drawing replaced its board or lost full-screen while dragging: ${JSON.stringify(drawPlaneExpanded)}`);
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await waitFor(`!document.querySelector('.shape-fullscreen-canvas').classList.contains('is-viewport-fullscreen')`, "Escape did not close the drawing-board full-screen fallback.");
  await evaluate(`delete document.querySelector('.shape-fullscreen-canvas').requestFullscreen; document.querySelector('#randomExample').click(); document.querySelector('#toggleDrawSolid').click()`);
  await waitFor(`Boolean(document.querySelector('#drawnSolid3d') && document.querySelector('.draw-solid-canvas #shapeFullscreenToggle'))`, "The drawn 3D solid did not expose shape full-screen.");
  assert(await evaluate(`document.querySelector('#shapeFullscreenToggle').getBoundingClientRect().bottom <= document.querySelector('.draw-solid-canvas .solid-3d-scene').getBoundingClientRect().top`), "The drawn-solid full-screen control overlaps the draggable model.");

  await evaluate(`Object.defineProperty(document.querySelector('.draw-solid-canvas'), 'requestFullscreen', { configurable: true, value: undefined }); document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`document.querySelector('.draw-solid-canvas').classList.contains('is-viewport-fullscreen')`, "The drawn-solid full-screen fallback did not open.");
  const drawnSolidBefore = await evaluate(`document.querySelector('#drawnSolid3d .solid-face').getAttribute('points')`);
  await evaluate(`(() => {
    const svg = document.querySelector('#drawnSolid3d');
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 42, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 42, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2 + 90, clientY: rect.top + rect.height / 2 + 35 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 42, pointerType: 'mouse', buttons: 0, clientX: rect.left + rect.width / 2 + 90, clientY: rect.top + rect.height / 2 + 35 }));
    document.querySelector('.solid-zoom-controls button:last-of-type').click();
  })()`);
  const drawnSolidExpanded = await evaluate(`({
    points: document.querySelector('#drawnSolid3d .solid-face').getAttribute('points'),
    zoom: document.querySelector('.solid-zoom-value').textContent.trim(),
    fullscreen: document.querySelector('.draw-solid-canvas').classList.contains('is-viewport-fullscreen'),
    pressed: document.querySelector('#shapeFullscreenToggle').getAttribute('aria-pressed')
  })`);
  assert(drawnSolidExpanded.points !== drawnSolidBefore && drawnSolidExpanded.zoom === "120%" && drawnSolidExpanded.fullscreen && drawnSolidExpanded.pressed === "true", `The drawn 3D solid did not remain interactive in full-screen: ${JSON.stringify(drawnSolidExpanded)}`);
  await evaluate(`document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`!document.querySelector('.draw-solid-canvas').classList.contains('is-viewport-fullscreen')`, "The drawn-solid full-screen fallback did not close.");

  await evaluate(`document.querySelector('.activity-tab[data-activity="netBuilder"]').click()`);
  await waitFor(`document.querySelector('.activity-tab.active')?.dataset.activity === 'netBuilder'`, "Net builder did not activate for full-screen testing.");
  await setMysterySolid("cube");
  const netFullscreenSetup = await evaluate(`(() => {
    const canvas = document.querySelector('.net-model-panel');
    const board = document.querySelector('.mystery-net-board');
    const fullscreenActions = document.querySelector('.net-fullscreen-fold-actions');
    const panelRect = canvas?.getBoundingClientRect();
    const boardRect = board?.getBoundingClientRect();
    const rangeRect = document.querySelector('.mystery-fold-range .range-control')?.getBoundingClientRect();
    const controlsRect = document.querySelector('#controlArea')?.getBoundingClientRect();
    return {
      containsModel: canvas?.contains(document.querySelector('#netFold3d')),
      flatPreviewExists: Boolean(document.querySelector('.net-flat-svg, .mystery-net-panel')),
      panelCount: board?.querySelectorAll(':scope > .net-panel').length,
      panelCentered: Math.abs((panelRect.left + panelRect.right) / 2 - (boardRect.left + boardRect.right) / 2) <= 2,
      foldRangeCentered: Math.abs((rangeRect.left + rangeRect.right) / 2 - (controlsRect.left + controlsRect.right) / 2) <= 2,
      containsButton: canvas?.contains(document.querySelector('#shapeFullscreenToggle')),
      containsFullscreenActions: canvas?.contains(fullscreenActions),
      containsFullscreenReveal: canvas?.contains(fullscreenActions?.querySelector('[data-fullscreen-reveal-answer]')),
      fullscreenActionsHidden: getComputedStyle(fullscreenActions).display === 'none',
      fullscreenButtonCount: fullscreenActions?.querySelectorAll('[data-fold-action]').length,
      fullscreenRevealDisabled: fullscreenActions?.querySelector('[data-fullscreen-reveal-answer]')?.disabled,
      button: document.querySelector('#shapeFullscreenToggle')?.getBoundingClientRect().toJSON(),
      model: document.querySelector('#netFold3d')?.getBoundingClientRect().toJSON()
    };
  })()`);
  assert(netFullscreenSetup.containsModel && !netFullscreenSetup.flatPreviewExists && netFullscreenSetup.panelCount === 1 && netFullscreenSetup.panelCentered && netFullscreenSetup.foldRangeCentered && netFullscreenSetup.containsButton && netFullscreenSetup.containsFullscreenActions && netFullscreenSetup.containsFullscreenReveal && netFullscreenSetup.fullscreenActionsHidden && netFullscreenSetup.fullscreenButtonCount === 2 && netFullscreenSetup.fullscreenRevealDisabled && netFullscreenSetup.button.bottom <= netFullscreenSetup.model.top, `The single net model, centered controls, or full-screen navigation are laid out incorrectly: ${JSON.stringify(netFullscreenSetup)}`);
  await evaluate(`Object.defineProperty(document.querySelector('.net-model-panel'), 'requestFullscreen', { configurable: true, value: undefined }); document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`document.querySelector('.net-model-panel').classList.contains('is-viewport-fullscreen')`, "The net-model full-screen fallback did not open.");
  const openedFullscreenNavigation = await evaluate(`(() => {
    const canvas = document.querySelector('.net-model-panel');
    const actions = canvas.querySelector('.net-fullscreen-fold-actions');
    return {
      visible: getComputedStyle(actions).display !== 'none',
      previousDisabled: actions.querySelector('[data-fold-action="previous"]').disabled,
      nextDisabled: actions.querySelector('[data-fold-action="next"]').disabled,
      revealDisabled: actions.querySelector('[data-fullscreen-reveal-answer]').disabled
    };
  })()`);
  assert(openedFullscreenNavigation.visible && openedFullscreenNavigation.previousDisabled && !openedFullscreenNavigation.nextDisabled && openedFullscreenNavigation.revealDisabled, `The initial full-screen folding navigation state is wrong: ${JSON.stringify(openedFullscreenNavigation)}`);
  await evaluate(`document.querySelector('[data-fold-action="next"]').click()`);
  await waitFor(`document.querySelector('.net-model-panel')?.classList.contains('is-viewport-fullscreen') && document.querySelector('#netFold3d')?.dataset.foldAnimating === 'true'`, "Next step exited full-screen or did not start folding.");
  await waitFor(`document.querySelector('.net-model-panel')?.classList.contains('is-viewport-fullscreen') && document.querySelector('#netFold3d')?.dataset.foldAnimating !== 'true' && document.querySelector('.polyhedron-fold-model')?.dataset.foldStep === '1.00'`, "Next step did not finish while preserving full-screen.");
  const forwardFullscreenNavigation = await evaluate(`(() => {
    const actions = document.querySelector('.net-fullscreen-fold-actions');
    return {
      visible: getComputedStyle(actions).display !== 'none',
      previousDisabled: actions.querySelector('[data-fold-action="previous"]').disabled,
      fullscreen: document.querySelector('.net-model-panel').classList.contains('is-viewport-fullscreen')
    };
  })()`);
  assert(forwardFullscreenNavigation.visible && !forwardFullscreenNavigation.previousDisabled && forwardFullscreenNavigation.fullscreen, `Full-screen navigation did not update after Next: ${JSON.stringify(forwardFullscreenNavigation)}`);
  await evaluate(`document.querySelector('[data-fold-action="previous"]').click()`);
  await waitFor(`document.querySelector('.net-model-panel')?.classList.contains('is-viewport-fullscreen') && document.querySelector('#netFold3d')?.dataset.foldAnimating === 'true'`, "Previous step exited full-screen or did not start unfolding.");
  await waitFor(`document.querySelector('.net-model-panel')?.classList.contains('is-viewport-fullscreen') && document.querySelector('#netFold3d')?.dataset.foldAnimating !== 'true' && document.querySelector('.polyhedron-fold-model')?.dataset.foldStep === '0.00' && document.querySelector('[data-fold-action="previous"]')?.disabled`, "Previous step did not finish at step 0 while preserving full-screen.");
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await evaluate(`(() => {
    for (let index = 0; index < 10; index += 1) {
      const next = document.querySelector('[data-fold-action="next"]');
      if (!next || next.disabled) break;
      next.click();
    }
  })()`);
  const completedFullscreenNavigation = await evaluate(`(() => ({
    fullscreen: document.querySelector('.net-model-panel').classList.contains('is-viewport-fullscreen'),
    visible: getComputedStyle(document.querySelector('.net-fullscreen-fold-actions')).display !== 'none',
    step: document.querySelector('.net-fullscreen-fold-step').textContent.trim(),
    previousDisabled: document.querySelector('[data-fold-action="previous"]').disabled,
    nextDisabled: document.querySelector('[data-fold-action="next"]').disabled,
    revealDisabled: document.querySelector('[data-fullscreen-reveal-answer]').disabled
  }))()`);
  assert(completedFullscreenNavigation.fullscreen && completedFullscreenNavigation.visible && completedFullscreenNavigation.step === "5/5" && !completedFullscreenNavigation.previousDisabled && completedFullscreenNavigation.nextDisabled && !completedFullscreenNavigation.revealDisabled, `Completed folding did not keep usable full-screen navigation: ${JSON.stringify(completedFullscreenNavigation)}`);
  await evaluate(`document.querySelector('[data-fullscreen-reveal-answer]').click()`);
  await waitFor(`document.querySelector('edcloud-correct-celebration')?.shadowRoot.querySelector('.cc-dialog')?.open && document.querySelector('.net-model-panel')?.classList.contains('is-viewport-fullscreen') && state.tool.revealed === true`, "Full-screen Reveal answer did not open the celebration or preserve full-screen.");
  const fullscreenReveal = await evaluate(`(() => ({
    fullscreen: document.querySelector('.net-model-panel').classList.contains('is-viewport-fullscreen'),
    revealed: state.tool.revealed,
    revealDisabled: document.querySelector('[data-fullscreen-reveal-answer]').disabled,
    answer: document.querySelector('edcloud-correct-celebration').shadowRoot.querySelector('.cc-answer-text').textContent
  }))()`);
  assert(fullscreenReveal.fullscreen && fullscreenReveal.revealed && fullscreenReveal.revealDisabled && fullscreenReveal.answer === "Kubus", `Full-screen reveal state is wrong: ${JSON.stringify(fullscreenReveal)}`);
  await evaluate(`window.EdCloudCorrectCelebration.close('fullscreen-smoke-test')`);
  await waitFor(`!document.querySelector('edcloud-correct-celebration').shadowRoot.querySelector('.cc-dialog').open`, "Full-screen reveal celebration did not close.");
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  const netBefore = await evaluate(`document.querySelector('#netFold3d .solid-face').getAttribute('points')`);
  await evaluate(`(() => {
    const svg = document.querySelector('#netFold3d');
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 43, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 43, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2 + 75, clientY: rect.top + rect.height / 2 + 30 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 43, pointerType: 'mouse', buttons: 0, clientX: rect.left + rect.width / 2 + 75, clientY: rect.top + rect.height / 2 + 30 }));
  })()`);
  const netExpanded = await evaluate(`(() => {
    const canvas = document.querySelector('.net-model-panel');
    const rect = canvas.getBoundingClientRect();
    return {
      points: document.querySelector('#netFold3d .solid-face').getAttribute('points'),
      rect: rect.toJSON(),
      viewport: { width: innerWidth, height: innerHeight },
      fullscreen: canvas.classList.contains('is-viewport-fullscreen'),
      pressed: document.querySelector('#shapeFullscreenToggle').getAttribute('aria-pressed')
    };
  })()`);
  assert(netExpanded.points !== netBefore && netExpanded.fullscreen && netExpanded.pressed === "true" && Math.abs(netExpanded.rect.width - netExpanded.viewport.width) <= 1 && Math.abs(netExpanded.rect.height - netExpanded.viewport.height) <= 1, `The folded net did not remain draggable in full-screen: ${JSON.stringify(netExpanded)}`);
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await waitFor(`!document.querySelector('.net-model-panel').classList.contains('is-viewport-fullscreen')`, "Escape did not close the net-model full-screen fallback.");

  const mysteryIdentityChecks = [
    { lang: "ms", names: { cube: "Kubus", cuboid: "Kuboid", pyramid: "Piramid", cylinder: "Silinder" } },
    { lang: "zh", names: { cube: "正方体", cuboid: "长方体", pyramid: "棱锥", cylinder: "圆柱体" } },
    { lang: "en", names: { cube: "Cube", cuboid: "Cuboid", pyramid: "Pyramid", cylinder: "Cylinder" } }
  ];
  for (const language of mysteryIdentityChecks) {
    await evaluate(`document.querySelector('.language-btn[data-lang="${language.lang}"]').click()`);
    for (const [id, name] of Object.entries(language.names)) {
      await setMysterySolid(id);
      const hiddenIdentity = await evaluate(`(() => ({
        visibleText: [document.querySelector('#challengePanel'), document.querySelector('#visualStage'), document.querySelector('#controlArea'), document.querySelector('#liveSummary')].map(node => node.textContent).join(' '),
        hasChooser: Boolean(document.querySelector('.net-shape-choices, [data-net-shape]')),
        flatPreviewExists: Boolean(document.querySelector('.net-flat-svg, .mystery-net-panel')),
        panelCount: document.querySelectorAll('.mystery-net-board > .net-panel').length,
        revealDisabled: document.querySelector('#revealNetAnswer').disabled
      }))()`);
      assert(!hiddenIdentity.visibleText.includes(name) && !hiddenIdentity.hasChooser && !hiddenIdentity.flatPreviewExists && hiddenIdentity.panelCount === 1 && hiddenIdentity.revealDisabled, `${language.lang}/${id} leaks the mystery answer or restores the removed preview: ${JSON.stringify(hiddenIdentity)}`);
    }
  }
  await evaluate(`document.querySelector('.language-btn[data-lang="ms"]').click()`);

  const animatedPolyhedra = [
    { id: "cube", order: [3, 2, 4, 5, 6], faces: 6 },
    { id: "cuboid", order: [3, 2, 4, 5, 6], faces: 6 },
    { id: "pyramid", order: [1, 2, 3, 4], faces: 5 }
  ];
  for (const polyhedron of animatedPolyhedra) await verifyPolyhedronFoldAnimation(polyhedron);

  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  for (const polyhedron of animatedPolyhedra) {
    await setMysterySolid(polyhedron.id);
    await evaluate(`document.querySelector('#nextFold').click()`);
    const reducedFold = await evaluate(`(() => ({
      step: document.querySelector('.polyhedron-fold-model')?.dataset.foldStep,
      progress: document.querySelector('[data-fold-face="${polyhedron.order[0]}"]')?.dataset.foldProgress
    }))()`);
    assert(reducedFold.step === "1.00" && reducedFold.progress === "1.00", `${polyhedron.id} did not skip folding motion under reduced-motion mode: ${JSON.stringify(reducedFold)}`);
  }
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });

  await setMysterySolid("cube");
  await evaluate(`document.querySelector('#nextFold').click()`);
  await waitFor(`(() => { const value = Number(document.querySelector('[data-fold-face="3"]')?.dataset.foldProgress); return value > 0 && value < 1; })()`, "Cube folding did not reach an intermediate frame before the drag-interruption check.");
  const cubeMidFoldPoints = await evaluate(`document.querySelector('[data-fold-face="3"] .solid-face').getAttribute('points')`);
  await evaluate(`(() => {
    const svg = document.querySelector('#netFold3d');
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 46, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 46, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2 + 60, clientY: rect.top + rect.height / 2 + 22 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 46, pointerType: 'mouse', buttons: 0, clientX: rect.left + rect.width / 2 + 60, clientY: rect.top + rect.height / 2 + 22 }));
  })()`);
  const cubeAfterInterruptedDrag = await evaluate(`(() => ({
    points: document.querySelector('[data-fold-face="3"] .solid-face').getAttribute('points'),
    step: document.querySelector('.polyhedron-fold-model').dataset.foldStep,
    progress: document.querySelector('[data-fold-face="3"]').dataset.foldProgress,
    animating: document.querySelector('#netFold3d').dataset.foldAnimating === 'true'
  }))()`);
  assert(cubeAfterInterruptedDrag.points !== cubeMidFoldPoints && cubeAfterInterruptedDrag.step === "1.00" && cubeAfterInterruptedDrag.progress === "1.00" && !cubeAfterInterruptedDrag.animating, `Dragging did not safely finish and rotate the active cube fold: ${JSON.stringify(cubeAfterInterruptedDrag)}`);
  await delay(800);
  assert(await evaluate(`document.querySelector('[data-fold-face="3"] .solid-face').getAttribute('points') === ${JSON.stringify(cubeAfterInterruptedDrag.points)}`), "The cancelled cube folding animation continued changing the model after dragging.");

  await setMysterySolid("cylinder");
  await waitFor(`document.querySelector('.cylinder-fold-model')?.dataset.cylinderRoll === '0.00'`, "Cylinder net did not activate.");
  const cylinderFlat = await evaluate(`(() => {
    const model = document.querySelector('.cylinder-fold-model');
    return {
      rangeMax: document.querySelector('#foldStep').max,
      viewBox: document.querySelector('#netFold3d').getAttribute('viewBox'),
      roll: model.dataset.cylinderRoll,
      top: model.dataset.cylinderTopFold,
      bottom: model.dataset.cylinderBottomFold,
      sideSections: model.querySelectorAll('[data-cylinder-face="2"]').length,
      faceLabels: model.querySelectorAll('.cylinder-face-label').length,
      challenge: document.querySelector('.challenge-text').textContent,
      instructionOverlays: document.querySelectorAll('.net-model-panel .panel-caption, .cylinder-fold-status, .cylinder-fold-scene .solid-drag-hint').length,
      ariaLabel: document.querySelector('#netFold3d').getAttribute('aria-label'),
      flatPreviewExists: Boolean(document.querySelector('.net-flat-svg, .mystery-net-panel')),
      panelCount: document.querySelectorAll('.mystery-net-board > .net-panel').length,
      shapeChoices: document.querySelectorAll('.net-shape-choices, [data-net-shape]').length,
      revealDisabled: document.querySelector('#revealNetAnswer').disabled,
      visibleText: [document.querySelector('#challengePanel'), document.querySelector('#visualStage'), document.querySelector('#controlArea'), document.querySelector('#liveSummary')].map(node => node.textContent).join(' ')
    };
  })()`);
  assert(cylinderFlat.rangeMax === "3" && cylinderFlat.viewBox === "0 0 420 300" && cylinderFlat.roll === "0.00" && cylinderFlat.top === "0.00" && cylinderFlat.bottom === "0.00" && cylinderFlat.sideSections === 1 && cylinderFlat.faceLabels === 3 && cylinderFlat.challenge.includes("Perhatikan dahulu") && cylinderFlat.instructionOverlays === 0 && cylinderFlat.ariaLabel.includes("boleh diputar") && !cylinderFlat.flatPreviewExists && cylinderFlat.panelCount === 1 && cylinderFlat.shapeChoices === 0 && cylinderFlat.revealDisabled && !cylinderFlat.visibleText.includes("Silinder"), `The cylinder mystery model leaks its answer or restores the removed preview: ${JSON.stringify(cylinderFlat)}`);

  const cylinderFlatBeforeDrag = await evaluate(`document.querySelector('.cylinder-fold-model [data-cylinder-face="2"]').getAttribute('points')`);
  await evaluate(`(() => {
    const svg = document.querySelector('#netFold3d');
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 45, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 45, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2 + 55, clientY: rect.top + rect.height / 2 + 20 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 45, pointerType: 'mouse', buttons: 0, clientX: rect.left + rect.width / 2 + 55, clientY: rect.top + rect.height / 2 + 20 }));
  })()`);
  assert(await evaluate(`document.querySelector('.cylinder-fold-model [data-cylinder-face="2"]').getAttribute('points') !== ${JSON.stringify(cylinderFlatBeforeDrag)}`), "The flat cylinder net cannot be rotated at step 0.");
  await evaluate(`document.querySelector('#resetNetView').click()`);

  await evaluate(`document.querySelector('#nextFold').click()`);
  await waitFor(`(() => { const value = Number(document.querySelector('.cylinder-fold-model')?.dataset.cylinderRoll); return value > 0 && value < 1; })()`, "The rectangle did not animate while rolling into the curved surface.");
  await waitFor(`document.querySelector('#netFold3d')?.dataset.foldAnimating !== 'true' && document.querySelector('.cylinder-fold-model')?.dataset.cylinderRoll === '1.00'`, "Cylinder rolling did not finish.");
  const cylinderSleeve = await evaluate(`(() => {
    const model = document.querySelector('.cylinder-fold-model');
    return {
      viewBox: document.querySelector('#netFold3d').getAttribute('viewBox'),
      roll: model.dataset.cylinderRoll,
      top: model.dataset.cylinderTopFold,
      bottom: model.dataset.cylinderBottomFold,
      sideSections: model.querySelectorAll('[data-cylinder-face="2"]').length,
      openRims: model.querySelectorAll('.cylinder-rim.open').length,
      seams: model.querySelectorAll('.cylinder-seam').length,
      moveArrows: model.querySelectorAll('.cylinder-move-arrow').length,
      challenge: document.querySelector('.challenge-text').textContent
    };
  })()`);
  assert(cylinderSleeve.viewBox === "0 0 420 300" && cylinderSleeve.roll === "1.00" && cylinderSleeve.top === "0.00" && cylinderSleeve.bottom === "0.00" && cylinderSleeve.sideSections === 28 && cylinderSleeve.openRims === 2 && cylinderSleeve.seams === 1 && cylinderSleeve.moveArrows === 0 && cylinderSleeve.challenge.includes("Teruskan melipat"), `The first cylinder step is not a clear, answer-safe open sleeve: ${JSON.stringify(cylinderSleeve)}`);

  await evaluate(`document.querySelector('#nextFold').click()`);
  await waitFor(`(() => { const value = Number(document.querySelector('.cylinder-fold-model')?.dataset.cylinderTopFold); return value > 0 && value < 1; })()`, "The top circle did not animate toward the upper opening.");
  await waitFor(`document.querySelector('#netFold3d')?.dataset.foldAnimating !== 'true' && document.querySelector('.cylinder-fold-model')?.dataset.cylinderTopFold === '1.00'`, "The top circle did not finish covering the opening.");
  const cylinderTop = await evaluate(`(() => {
    const model = document.querySelector('.cylinder-fold-model');
    return {
      roll: model.dataset.cylinderRoll,
      top: model.dataset.cylinderTopFold,
      bottom: model.dataset.cylinderBottomFold,
      openRims: model.querySelectorAll('.cylinder-rim.open').length,
      currentFace: model.querySelector('.cylinder-cap.cylinder-fold-current')?.dataset.cylinderFace,
      challenge: document.querySelector('.challenge-text').textContent
    };
  })()`);
  assert(cylinderTop.roll === "1.00" && cylinderTop.top === "1.00" && cylinderTop.bottom === "0.00" && cylinderTop.openRims === 1 && cylinderTop.currentFace === "1" && cylinderTop.challenge.includes("Teruskan melipat"), `The second cylinder step does not leave only the bottom open without revealing its identity: ${JSON.stringify(cylinderTop)}`);

  await evaluate(`(() => { const input = document.querySelector('#foldStep'); input.value = '3'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  assert(await evaluate(`document.querySelector('#revealNetAnswer').disabled`), "Reveal answer became available before the final cylinder animation finished.");
  await waitFor(`document.querySelector('#netFold3d')?.dataset.foldAnimating !== 'true' && document.querySelector('.cylinder-fold-model')?.dataset.cylinderBottomFold === '1.00'`, "The bottom circle did not finish covering the opening.");
  const cylinderComplete = await evaluate(`(() => {
    const model = document.querySelector('.cylinder-fold-model');
    return {
      viewBox: document.querySelector('#netFold3d').getAttribute('viewBox'),
      roll: model.dataset.cylinderRoll,
      top: model.dataset.cylinderTopFold,
      bottom: model.dataset.cylinderBottomFold,
      openRims: model.querySelectorAll('.cylinder-rim.open').length,
      labels: [...model.querySelectorAll('.cylinder-face-label')].map(label => label.textContent).sort(),
      summary: document.querySelector('#liveSummary').textContent,
      revealDisabled: document.querySelector('#revealNetAnswer').disabled,
      celebrationOpen: Boolean(document.querySelector('edcloud-correct-celebration')?.shadowRoot.querySelector('.cc-dialog')?.open),
      visibleText: [document.querySelector('#challengePanel'), document.querySelector('#visualStage'), document.querySelector('#controlArea'), document.querySelector('#liveSummary')].map(node => node.textContent).join(' ')
    };
  })()`);
  assert(cylinderComplete.viewBox === "0 0 420 300" && cylinderComplete.roll === "1.00" && cylinderComplete.top === "1.00" && cylinderComplete.bottom === "1.00" && cylinderComplete.openRims === 0 && JSON.stringify(cylinderComplete.labels) === JSON.stringify(["1", "2", "3"]) && cylinderComplete.summary.includes("Jawapan masih dirahsiakan") && !cylinderComplete.revealDisabled && !cylinderComplete.celebrationOpen && !cylinderComplete.visibleText.includes("Silinder"), `The completed cylinder is open, revealed too soon, or missing its reveal action: ${JSON.stringify(cylinderComplete)}`);

  const cylinderBeforeDrag = await evaluate(`document.querySelector('.cylinder-fold-model [data-cylinder-face="2"]').getAttribute('points')`);
  await evaluate(`(() => {
    const svg = document.querySelector('#netFold3d');
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 44, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 44, pointerType: 'mouse', buttons: 1, clientX: rect.left + rect.width / 2 + 65, clientY: rect.top + rect.height / 2 + 25 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 44, pointerType: 'mouse', buttons: 0, clientX: rect.left + rect.width / 2 + 65, clientY: rect.top + rect.height / 2 + 25 }));
  })()`);
  assert(await evaluate(`document.querySelector('.cylinder-fold-model [data-cylinder-face="2"]').getAttribute('points') !== ${JSON.stringify(cylinderBeforeDrag)}`), "The completed cylinder cannot be rotated.");

  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await evaluate(`(() => { const input = document.querySelector('#foldStep'); input.value = '2'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  assert(await evaluate(`document.querySelector('.cylinder-fold-model')?.dataset.cylinderTopFold === '1.00' && document.querySelector('.cylinder-fold-model')?.dataset.cylinderBottomFold === '0.00'`), "Reduced-motion mode did not skip the cylinder transition.");
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });

  await evaluate(`document.querySelector('.language-btn[data-lang="zh"]').click()`);
  assert(await evaluate(`document.querySelector('.challenge-text').textContent.includes('继续折叠') && !document.querySelector('.cylinder-fold-status') && !document.querySelector('.cylinder-fold-scene .solid-drag-hint') && !document.querySelector('#visualStage').textContent.includes('圆柱体')`), "Chinese mystery guidance leaks the cylinder answer or an unwanted overlay returned.");
  await evaluate(`document.querySelector('.language-btn[data-lang="en"]').click()`);
  assert(await evaluate(`document.querySelector('.challenge-text').textContent.includes('Keep folding') && !document.querySelector('.cylinder-fold-status') && !document.querySelector('.cylinder-fold-scene .solid-drag-hint') && !document.querySelector('#visualStage').textContent.includes('Cylinder')`), "English mystery guidance leaks the cylinder answer or an unwanted overlay returned.");
  await evaluate(`document.querySelector('.language-btn[data-lang="ms"]').click()`);
  await setMysterySolid("cube");

  await evaluate(`document.querySelector('.activity-tab[data-activity="netBuilder"]').click()`);
  await waitFor(`document.querySelector('.activity-tab.active')?.dataset.activity === 'netBuilder'`, "Net builder did not activate for the celebration test.");
  assert(await evaluate(`!document.querySelector('.net-shape-choices') && !document.querySelector('[data-net-shape]') && !document.querySelector('.net-flat-svg, .mystery-net-panel') && document.querySelectorAll('.mystery-net-board > .net-panel').length === 1`), "Mystery Net still exposes the shape chooser or removed flat-net preview.");
  await evaluate(`(() => {
    for (let index = 0; index < 20; index += 1) {
      const next = document.querySelector('#nextFold');
      if (!next || next.disabled) break;
      next.click();
    }
  })()`);
  assert(await evaluate(`document.querySelector('#revealNetAnswer').disabled`), "Reveal answer became available while the last cube face was still folding.");
  await waitFor(`document.querySelector('#netFold3d')?.dataset.foldAnimating !== 'true' && !document.querySelector('#revealNetAnswer').disabled`, "Reveal answer did not become available after folding finished.");
  assert(await evaluate(`!document.querySelector('edcloud-correct-celebration')?.shadowRoot.querySelector('.cc-dialog')?.open && !document.querySelector('#challengePanel').textContent.includes('Kubus') && !document.querySelector('#liveSummary').textContent.includes('Kubus')`), "The cube answer or celebration appeared before the student requested it.");
  await evaluate(`document.querySelector('#revealNetAnswer').click()`);
  await waitFor(`document.querySelector('edcloud-correct-celebration')?.shadowRoot.querySelector('.cc-dialog')?.open`, "Reveal-answer celebration did not open.");
  const celebration = await evaluate(`(() => {
    const root = document.querySelector('edcloud-correct-celebration').shadowRoot;
    return {
      title: root.querySelector('.cc-title').textContent,
      message: root.querySelector('.cc-message').textContent,
      label: root.querySelector('.cc-answer-label').textContent,
      answer: root.querySelector('.cc-answer-text').textContent,
      nextText: root.querySelector('[data-action="next"]').textContent,
      pageAnswer: document.querySelector('#challengePanel').textContent,
      revealText: document.querySelector('#revealNetAnswer').textContent,
      dialog: root.querySelector('.cc-dialog').getBoundingClientRect().toJSON()
    };
  })()`);
  assert(celebration.title === "Adakah tekaan kamu betul?" && celebration.message.includes("tekaan kamu") && celebration.label === "Jawapan sebenar" && celebration.answer === "Kubus" && celebration.nextText === "Teka bentuk seterusnya" && celebration.pageAnswer.includes("Kubus") && celebration.revealText.includes("Kubus"), `Mystery reveal celebration copy or page answer is wrong: ${JSON.stringify(celebration)}`);
  assert(celebration.dialog.left >= 0 && celebration.dialog.right <= 1440 && celebration.dialog.top >= 0 && celebration.dialog.bottom <= 900, `Completion celebration is outside the desktop viewport: ${JSON.stringify(celebration)}`);
  const revealedShape = await evaluate(`state.tool.shape`);
  await evaluate(`document.querySelector('edcloud-correct-celebration').shadowRoot.querySelector('[data-action="next"]').click()`);
  await waitFor(`!document.querySelector('edcloud-correct-celebration').shadowRoot.querySelector('.cc-dialog').open && state.tool.step === 0 && state.tool.revealed === false`, "The next mystery did not reset after celebration.");
  assert(await evaluate(`state.tool.shape !== ${JSON.stringify(revealedShape)} && document.querySelector('#revealNetAnswer').disabled && !document.querySelector('#challengePanel').textContent.includes('Kubus')`), "The next mystery repeated or exposed the previous answer.");

  await evaluate(`document.querySelector('.language-btn[data-lang="zh"]').click()`);
  await setMysterySolid("pyramid");
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await evaluate(`(() => { const input = document.querySelector('#foldStep'); input.value = input.max; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  assert(await evaluate(`!document.querySelector('#revealNetAnswer').disabled && !document.querySelector('#challengePanel').textContent.includes('棱锥')`), "Chinese mystery answer was revealed before clicking its button.");
  await evaluate(`document.querySelector('#revealNetAnswer').click()`);
  await waitFor(`document.querySelector('edcloud-correct-celebration').shadowRoot.querySelector('.cc-dialog').open`, "Chinese reveal celebration did not open.");
  const chineseReveal = await evaluate(`(() => {
    const root = document.querySelector('edcloud-correct-celebration').shadowRoot;
    return {
      title: root.querySelector('.cc-title').textContent,
      message: root.querySelector('.cc-message').textContent,
      label: root.querySelector('.cc-answer-label').textContent,
      answer: root.querySelector('.cc-answer-text').textContent,
      review: root.querySelector('[data-action="review"]').textContent
    };
  })()`);
  assert(chineseReveal.title === "你猜对了吗？" && chineseReveal.message.includes("和你的猜想一样吗") && chineseReveal.label === "正确答案" && chineseReveal.answer === "棱锥" && chineseReveal.review === "再看一次", `Chinese mystery reveal copy is wrong: ${JSON.stringify(chineseReveal)}`);
  await evaluate(`document.querySelector('edcloud-correct-celebration').shadowRoot.querySelector('[data-action="review"]').click()`);
  await waitFor(`!document.querySelector('edcloud-correct-celebration').shadowRoot.querySelector('.cc-dialog').open`, "Chinese review action did not close the celebration.");
  assert(await evaluate(`state.tool.revealed && document.querySelector('#challengePanel').textContent.includes('棱锥') && document.querySelector('#revealNetAnswer').disabled`), "The revealed Chinese answer did not remain visible for review.");
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });

  await evaluate(`(async () => {
    window.__dragSoundEvents = [];
    document.addEventListener('edcloud-drag-sound', event => {
      window.__dragSoundEvents.push({
        phase: String(event.detail?.phase || ''),
        kind: String(event.detail?.kind || ''),
        frequency: Number(event.detail?.frequency || 0),
        contextState: String(event.detail?.contextState || '')
      });
    });
    const pause = milliseconds => new Promise(resolvePause => setTimeout(resolvePause, milliseconds));
    const drag = async (selector, pointerId, customPath = null, pathUsesViewBox = false) => {
      const target = document.querySelector(selector);
      if (!target) throw new Error('Missing drag-audio target: ' + selector);
      const rect = target.getBoundingClientRect();
      const toClientPoint = point => pathUsesViewBox
        ? [rect.left + point[0] / 400 * rect.width, rect.top + point[1] / 300 * rect.height]
        : [rect.left + rect.width / 2 + point[0], rect.top + rect.height / 2 + point[1]];
      const path = customPath || [[0, 0], [32, 16], [76, 34]];
      const [startX, startY] = toClientPoint(path[0]);
      const pointer = (type, x, y) => new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId,
        pointerType: 'mouse',
        buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
        clientX: x,
        clientY: y
      });
      target.dispatchEvent(pointer('pointerdown', startX, startY));
      await pause(80);
      const [middleX, middleY] = toClientPoint(path[1]);
      window.dispatchEvent(pointer('pointermove', middleX, middleY));
      await pause(80);
      const [endX, endY] = toClientPoint(path[2]);
      window.dispatchEvent(pointer('pointermove', endX, endY));
      await pause(30);
      window.dispatchEvent(pointer('pointerup', endX, endY));
    };
    const cases = [
      ['solid', 'shapeExplorer', '#shapeSolid3d'],
      ['net', 'netBuilder', '#netFold3d'],
      ['draw', 'shapeDrawer', '#drawBoard', [[60, 60], [100, 60], [140, 100]], true],
      ['symmetry', 'symmetryLab', '[data-stamp-id="1"]'],
      ['angle', 'angleLab', '#angleHandle', [[0, 0], [-25, -45], [-65, -80]]],
      ['line', 'lineLab', '[data-line-handle="A"]', [[0, 0], [-25, -45], [-65, -80]]],
      ['circle', 'circleLab', '#circleDragHandle', [[0, 0], [-20, 40], [-55, 70]]]
    ];
    state.sound = true;
    for (let index = 0; index < cases.length; index += 1) {
      const [, activity, selector, path, pathUsesViewBox] = cases[index];
      state.activity = activity;
      state.tool = factories[activity]();
      renderTool();
      await drag(selector, 70 + index, path, pathUsesViewBox);
    }
    state.activity = 'shapeExplorer';
    state.tool = factories.shapeExplorer();
    renderTool();
    state.sound = false;
    const mutedEventStart = window.__dragSoundEvents.length;
    await drag('#shapeSolid3d', 89);
    window.__mutedDragSoundEvents = window.__dragSoundEvents.slice(mutedEventStart);
    state.sound = true;
    state.activity = 'shapeExplorer';
    state.tool = factories.shapeExplorer();
    renderTool();
  })()`);
  const dragSound = await evaluate(`({ events: window.__dragSoundEvents, muted: window.__mutedDragSoundEvents })`);
  const dragSoundKinds = ["solid", "net", "draw", "symmetry", "angle", "line", "circle"];
  for (const kind of dragSoundKinds) {
    const phases = dragSound.events.filter(event => event.kind === kind).map(event => event.phase);
    const starts = phases.filter(phase => phase === "start").length;
    const pulses = phases.filter(phase => phase === "pulse").length;
    const stops = phases.filter(phase => phase === "stop").length;
    assert(starts === stops && starts >= 1 && pulses >= 1 && phases.indexOf("start") < phases.indexOf("pulse") && phases.lastIndexOf("pulse") < phases.lastIndexOf("stop"), `${kind} drag sound lifecycle is incomplete or out of order: ${JSON.stringify(phases)}`);
    assert(dragSound.events.filter(event => event.kind === kind && event.phase === "pulse").every(event => event.frequency >= 520), `${kind} drag sound is still below the audible small-speaker range: ${JSON.stringify(dragSound.events)}`);
    assert(dragSound.events.filter(event => event.kind === kind && event.phase === "pulse").every(event => event.contextState === "running"), `${kind} drag sound played while the audio context was not running: ${JSON.stringify(dragSound.events)}`);
  }
  assert(!dragSound.muted.some(event => event.phase === "pulse"), `Muted dragging still emitted a sound pulse: ${JSON.stringify(dragSound.muted)}`);

  await evaluate(`document.querySelector('.activity-tab[data-activity="shapeExplorer"]').click(); document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.actor-button').click()`);
  await waitFor(`!document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.guide-layer').hidden`, "Guide did not reopen for localization test.");
  await evaluate(`document.querySelector('.language-btn[data-lang="zh"]').click()`);
  await waitFor(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('#guide-title').textContent === '认识图形'`, "Chinese guide copy did not synchronize.");
  assert(await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.narration').src.includes('/zh/contextual/goal-shape-explorer.mp3')`), "Chinese narration did not synchronize.");
  await evaluate(`document.querySelector('#soundToggle').click()`);
  assert(await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.replay-button').disabled`), "Guide mute state did not synchronize.");
  await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.close-button').click()`);
  await waitFor(`(() => {
    const guide = document.querySelector('edcloud-operation-guide');
    return guide.shadowRoot.querySelector('.guide-layer').hidden && !guide._closing && !guide._moving;
  })()`, "Localized guide did not finish closing.");

  await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await delay(250);
  const mobile = await evaluate(`(() => ({
    width: innerWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    tabs: [...document.querySelectorAll('.activity-tab')].map(button => button.getBoundingClientRect().toJSON()),
    controls: document.querySelector('.heading-actions').getBoundingClientRect().toJSON(),
    summaryHidden: document.querySelector('#liveSummary').hidden,
    fullscreenLabelDisplay: getComputedStyle(document.querySelector('#shapeFullscreenToggle span:last-child')).display,
    explorer: document.querySelector('.shape-explorer').getBoundingClientRect().toJSON(),
    propertyPanel: document.querySelector('.property-panel').getBoundingClientRect().toJSON(),
    propertyExplanation: document.querySelector('.property-explanation').getBoundingClientRect().toJSON(),
    shapeIconWidths: [...document.querySelectorAll('[data-shape] .shape-choice-icon')].map(icon => Number.parseFloat(getComputedStyle(icon).width))
  }))()`);
  assert(mobile.width === 390 && !mobile.horizontalOverflow, `Mobile layout has horizontal overflow: ${JSON.stringify(mobile)}`);
  assert(mobile.tabs.every(rect => rect.left >= 0 && rect.right <= 390), `A mobile activity tab is outside the viewport: ${JSON.stringify(mobile)}`);
  assert(mobile.summaryHidden && mobile.propertyExplanation.left >= mobile.explorer.left - 1 && mobile.propertyExplanation.right <= mobile.explorer.right + 1 && mobile.propertyExplanation.top >= mobile.propertyPanel.bottom - 1, `The mobile shape explanation layout is wrong: ${JSON.stringify(mobile)}`);
  assert(mobile.shapeIconWidths.length === 10 && mobile.shapeIconWidths.every(width => width >= 36), `Mobile crayon shape icons are missing or too small: ${JSON.stringify(mobile)}`);
  assert(mobile.fullscreenLabelDisplay === "none", `The mobile shape full-screen control is not compact: ${JSON.stringify(mobile)}`);

  await evaluate(`document.querySelector('[data-shape="cylinder"]').click()`);
  await waitFor(`document.querySelector('#shapeSolid3d[data-solid-shape="cylinder"]')?.classList.contains('solid-assembling')`, "The mobile cylinder assembly did not start.");
  const mobileSolidAssembly = await evaluate(`(() => {
    const canvas = document.querySelector('.shape-canvas').getBoundingClientRect();
    const svg = document.querySelector('#shapeSolid3d').getBoundingClientRect();
    return {
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      animationCount: document.querySelector('#shapeSolid3d').__solidAssemblyAnimations?.length || 0,
      canvas: canvas.toJSON(),
      svg: svg.toJSON()
    };
  })()`);
  assert(!mobileSolidAssembly.horizontalOverflow && mobileSolidAssembly.animationCount >= 3 && mobileSolidAssembly.svg.left >= mobileSolidAssembly.canvas.left - 1 && mobileSolidAssembly.svg.right <= mobileSolidAssembly.canvas.right + 1, `The mobile solid assembly is clipped or causes overflow: ${JSON.stringify(mobileSolidAssembly)}`);
  await waitFor(`!document.querySelector('#shapeSolid3d')?.classList.contains('solid-assembling')`, "The mobile cylinder assembly did not settle.", 3000);

  await evaluate(`Object.defineProperty(document.querySelector('.shape-canvas'), 'requestFullscreen', { configurable: true, value: undefined }); document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen')`, "The iOS-style full-screen fallback did not open.");
  const mobileExpandedShape = await evaluate(`(() => {
    const canvas = document.querySelector('.shape-canvas');
    const rect = canvas.getBoundingClientRect();
    return { rect: rect.toJSON(), horizontalOverflow: canvas.scrollWidth > canvas.clientWidth, bodyLocked: getComputedStyle(document.body).overflow === 'hidden', propertiesInsideCanvas: canvas.contains(document.querySelector('.property-panel')) };
  })()`);
  assert(Math.abs(mobileExpandedShape.rect.width - 390) <= 1 && Math.abs(mobileExpandedShape.rect.height - 844) <= 1 && !mobileExpandedShape.horizontalOverflow && mobileExpandedShape.bodyLocked && !mobileExpandedShape.propertiesInsideCanvas, `The mobile shape-only full-screen fallback is outside the viewport: ${JSON.stringify(mobileExpandedShape)}`);
  await evaluate(`document.querySelector('#shapeFullscreenToggle').click(); delete document.querySelector('.shape-canvas').requestFullscreen`);
  await waitFor(`!document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen')`, "The mobile shape full-screen fallback did not close.");

  await evaluate(`document.querySelector('.activity-tab[data-activity="netBuilder"]').click()`);
  await waitFor(`Boolean(document.querySelector('.net-model-panel #netFold3d') && document.querySelector('.net-model-panel #shapeFullscreenToggle'))`, "The mobile net model did not expose shape full-screen.");
  await setMysterySolid("cylinder");
  const mobileMysteryControls = await evaluate(`(() => ({
    buttons: [...document.querySelectorAll('.mystery-net-actions button')].map(button => button.getBoundingClientRect().toJSON()),
    revealDisabled: document.querySelector('#revealNetAnswer').disabled,
    hasChooser: Boolean(document.querySelector('.net-shape-choices, [data-net-shape]')),
    flatPreviewExists: Boolean(document.querySelector('.net-flat-svg, .mystery-net-panel')),
    panelCount: document.querySelectorAll('.mystery-net-board > .net-panel').length,
    foldRange: document.querySelector('.mystery-fold-range .range-control').getBoundingClientRect().toJSON(),
    controls: document.querySelector('#controlArea').getBoundingClientRect().toJSON(),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth
  }))()`);
  assert(mobileMysteryControls.buttons.length === 5 && mobileMysteryControls.buttons.every(rect => rect.left >= 0 && rect.right <= 390) && mobileMysteryControls.revealDisabled && !mobileMysteryControls.hasChooser && !mobileMysteryControls.flatPreviewExists && mobileMysteryControls.panelCount === 1 && Math.abs((mobileMysteryControls.foldRange.left + mobileMysteryControls.foldRange.right) / 2 - (mobileMysteryControls.controls.left + mobileMysteryControls.controls.right) / 2) <= 2 && !mobileMysteryControls.horizontalOverflow, `Mobile mystery controls overflow, are not centered, or expose removed content: ${JSON.stringify(mobileMysteryControls)}`);
  await evaluate(`document.querySelector('#nextFold').click()`);
  await waitFor(`document.querySelector('#netFold3d')?.dataset.foldAnimating !== 'true' && document.querySelector('.cylinder-fold-model')?.dataset.cylinderRoll === '1.00'`, "The cylinder sleeve did not finish rolling before the mobile full-screen check.");
  await evaluate(`Object.defineProperty(document.querySelector('.net-model-panel'), 'requestFullscreen', { configurable: true, value: undefined }); document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`document.querySelector('.net-model-panel').classList.contains('is-viewport-fullscreen')`, "The mobile net-model full-screen fallback did not open.");
  const mobileCylinderBeforeDrag = await evaluate(`document.querySelector('.cylinder-fold-model [data-cylinder-face="2"]').getAttribute('points')`);
  await evaluate(`(() => {
    const svg = document.querySelector('#netFold3d');
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 52, pointerType: 'touch', buttons: 1, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 52, pointerType: 'touch', buttons: 1, clientX: rect.left + rect.width / 2 + 48, clientY: rect.top + rect.height / 2 + 18 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 52, pointerType: 'touch', buttons: 0, clientX: rect.left + rect.width / 2 + 48, clientY: rect.top + rect.height / 2 + 18 }));
  })()`);
  const mobileCylinderAfterDrag = await evaluate(`document.querySelector('.cylinder-fold-model [data-cylinder-face="2"]').getAttribute('points')`);
  const mobileExpandedNet = await evaluate(`(() => {
    const canvas = document.querySelector('.net-model-panel');
    const rect = canvas.getBoundingClientRect();
    const modelRect = document.querySelector('#netFold3d').getBoundingClientRect();
    const fullscreenActions = canvas.querySelector('.net-fullscreen-fold-actions');
    const fullscreenButtons = [...fullscreenActions.querySelectorAll('[data-fold-action]')];
    const fullscreenReveal = fullscreenActions.querySelector('[data-fullscreen-reveal-answer]');
    return {
      rect: rect.toJSON(),
      labelDisplay: getComputedStyle(document.querySelector('#shapeFullscreenToggle span:last-child')).display,
      flatPreviewExists: Boolean(document.querySelector('.net-flat-svg, .mystery-net-panel')),
      horizontalOverflow: canvas.scrollWidth > canvas.clientWidth,
      cylinderRoll: document.querySelector('.cylinder-fold-model').dataset.cylinderRoll,
      modelRect: modelRect.toJSON(),
      modelInsideCanvas: modelRect.left >= rect.left - 1 && modelRect.right <= rect.right + 1 && modelRect.top >= rect.top - 1 && modelRect.bottom <= rect.bottom + 1,
      instructionOverlays: canvas.querySelectorAll('.panel-caption, .cylinder-fold-status, .solid-drag-hint').length,
      fullscreenNavigationVisible: getComputedStyle(fullscreenActions).display !== 'none',
      fullscreenNavigationButtons: fullscreenButtons.map(button => ({ disabled: button.disabled, rect: button.getBoundingClientRect().toJSON() })),
      fullscreenReveal: { disabled: fullscreenReveal.disabled, rect: fullscreenReveal.getBoundingClientRect().toJSON() }
    };
  })()`);
  assert(Math.abs(mobileExpandedNet.rect.width - 390) <= 1 && Math.abs(mobileExpandedNet.rect.height - 844) <= 1 && mobileExpandedNet.labelDisplay === "none" && !mobileExpandedNet.flatPreviewExists && !mobileExpandedNet.horizontalOverflow && mobileExpandedNet.cylinderRoll === "1.00" && mobileExpandedNet.modelInsideCanvas && mobileExpandedNet.instructionOverlays === 0 && mobileExpandedNet.fullscreenNavigationVisible && mobileExpandedNet.fullscreenNavigationButtons.length === 2 && mobileExpandedNet.fullscreenNavigationButtons.every(button => button.rect.left >= 0 && button.rect.right <= 390 && button.rect.top >= 0 && button.rect.bottom <= 844) && mobileExpandedNet.fullscreenNavigationButtons.every(button => !button.disabled) && mobileExpandedNet.fullscreenReveal.disabled && mobileExpandedNet.fullscreenReveal.rect.left >= 0 && mobileExpandedNet.fullscreenReveal.rect.right <= 390 && mobileExpandedNet.fullscreenReveal.rect.top >= 0 && mobileExpandedNet.fullscreenReveal.rect.bottom <= 844 && mobileCylinderAfterDrag !== mobileCylinderBeforeDrag, `The mobile cylinder full-screen layout, folding navigation, reveal action, or dragging is wrong: ${JSON.stringify(mobileExpandedNet)}`);
  await evaluate(`document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`!document.querySelector('.net-model-panel').classList.contains('is-viewport-fullscreen')`, "The mobile net-model full-screen fallback did not close.");

  await evaluate(`document.querySelector('.activity-tab[data-activity="shapeDrawer"]').click()`);
  await waitFor(`Boolean(document.querySelector('.draw-canvas-shell #drawBoard') && document.querySelector('.draw-canvas-shell #shapeFullscreenToggle'))`, "The mobile drawing board did not expose shape full-screen.");
  await evaluate(`Object.defineProperty(document.querySelector('.draw-canvas-shell'), 'requestFullscreen', { configurable: true, value: undefined }); document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`document.querySelector('.draw-canvas-shell').classList.contains('is-viewport-fullscreen')`, "The mobile drawing-board full-screen fallback did not open.");
  await evaluate(`(() => {
    const board = document.querySelector('#drawBoard');
    const rect = board.getBoundingClientRect();
    const pointer = (type, x, y) => new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 51,
      pointerType: 'touch',
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: rect.left + x / 400 * rect.width,
      clientY: rect.top + y / 300 * rect.height
    });
    board.dispatchEvent(pointer('pointerdown', 60, 60));
    window.dispatchEvent(pointer('pointermove', 100, 60));
    window.dispatchEvent(pointer('pointerup', 100, 60));
  })()`);
  const mobileExpandedDraw = await evaluate(`(() => {
    const canvas = document.querySelector('.draw-canvas-shell');
    const canvasRect = canvas.getBoundingClientRect();
    const boardRect = document.querySelector('#drawBoard').getBoundingClientRect();
    return {
      canvas: canvasRect.toJSON(),
      board: boardRect.toJSON(),
      pointCount: document.querySelectorAll('#drawBoard .point-handle').length,
      labelDisplay: getComputedStyle(document.querySelector('#shapeFullscreenToggle span:last-child')).display,
      horizontalOverflow: canvas.scrollWidth > canvas.clientWidth
    };
  })()`);
  assert(Math.abs(mobileExpandedDraw.canvas.width - 390) <= 1 && Math.abs(mobileExpandedDraw.canvas.height - 844) <= 1 && mobileExpandedDraw.pointCount >= 2 && mobileExpandedDraw.labelDisplay === "none" && !mobileExpandedDraw.horizontalOverflow && Math.abs(mobileExpandedDraw.board.width / mobileExpandedDraw.board.height - 4 / 3) < .02, `The mobile draggable drawing full-screen layout is wrong: ${JSON.stringify(mobileExpandedDraw)}`);
  await evaluate(`document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`!document.querySelector('.draw-canvas-shell').classList.contains('is-viewport-fullscreen')`, "The mobile drawing-board full-screen fallback did not close.");

  await evaluate(`document.querySelector('.language-btn[data-lang="ms"]').click(); document.querySelector('.activity-tab[data-activity="netBuilder"]').click(); document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.actor-button').click()`);
  await waitFor(`!document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.guide-layer').hidden`, "Mobile guide did not open.");
  const mobileCard = await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.guide-card').getBoundingClientRect().toJSON()`);
  assert(mobileCard.left >= 0 && mobileCard.right <= 390 && mobileCard.top >= 0 && mobileCard.bottom <= 844, `Mobile guide card is outside the viewport: ${JSON.stringify(mobileCard)}`);
  await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.close-button').click()`);

  assert(browserErrors.length === 0, `Browser errors: ${browserErrors.join(" | ")}`);
  console.log(JSON.stringify({
    status: "passed",
    activities: 3,
    stepsPerActivity: 5,
    contextualNarrations: 45,
    desktopWhiteboardType: true,
    brandTypePreserved: true,
    periodicChoiceNudges: true,
    reducedMotion: true,
    solidAssemblyShapes: solidAssemblySpecs.map(spec => spec.id),
    solidAssemblyLogicalParts: solidAssemblySpecs.reduce((total, spec) => total + spec.parts, 0),
    solidAssemblyDragInterrupt: true,
    solidAssemblyReducedMotion: true,
    shapeExplanationRow: true,
    shapeCanvasFullscreen: true,
    solidZoom160Contained: true,
    draggableNetFullscreen: true,
    drawingBoardFullscreen: true,
    drawnSolidFullscreen: true,
    crayonShapeIcons: 10,
    iosFullscreenFallback: true,
    mobileInteractiveFullscreen: true,
    mobileSolidAssembly: true,
    animatedPolyhedra: ["cube", "cuboid", "pyramid"],
    polyhedronFacesAnimated: 14,
    reverseFoldAnimation: true,
    dragInterruptsFoldAnimation: true,
    mysteryNetIdentityHidden: true,
    revealLockedUntilFoldComplete: true,
    revealCelebrationAsksForGuess: true,
    localizedMysteryReveal: true,
    mobileMysteryControls: true,
    cylinderFoldSequence: 4,
    cylinderFoldAnimation: true,
    cylinderFoldModelGeometry: true,
    cylinderStep0Dragging: true,
    cylinderInstructionOverlaysHidden: true,
    cylinderMobileFullscreen: true,
    dragSoundKinds,
    mutedDragSound: true,
    mobileViewport: "390x844",
    authorizationEntry: true,
    noAuthorizationPreview: true,
    unifiedSharedComponents: true,
    completionCelebration: true
  }, null, 2));
} finally {
  socket.close();
  const browserExited = browser.exitCode !== null ? Promise.resolve() : new Promise(resolveExit => browser.once("exit", resolveExit));
  browser.kill();
  await Promise.race([browserExited, delay(1500)]);
  const resolvedProfile = resolve(profile);
  if (resolvedProfile.startsWith(resolve(tmpdir()))) {
    rmSync(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

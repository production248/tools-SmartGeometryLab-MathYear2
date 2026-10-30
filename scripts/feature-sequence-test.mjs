import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const previewUrl = process.argv[2] || pathToFileURL(resolve(root, "index-preview.html")).href;
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
if (!chrome) throw new Error("Chrome or Edge is required.");
const profile = mkdtempSync(join(tmpdir(), "geometry-feature-test-"));
const port = 9700 + Math.floor(Math.random() * 200);
const browser = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", ...(previewUrl.startsWith("file:") ? ["--allow-file-access-from-files"] : []), "--autoplay-policy=no-user-gesture-required", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, previewUrl], { stdio: "ignore", windowsHide: true });
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));
let socket;
try {
  let endpoint;
  for (let i = 0; i < 100 && !endpoint; i += 1) {
    try {
      const tabs = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
      endpoint = tabs.find(tab => tab.type === "page" && tab.url === previewUrl)?.webSocketDebuggerUrl;
    } catch {}
    if (!endpoint) await sleep(100);
  }
  if (!endpoint) throw new Error("Browser did not start.");
  socket = new WebSocket(endpoint);
  await new Promise((resolveOpen, rejectOpen) => { socket.addEventListener("open", resolveOpen, { once: true }); socket.addEventListener("error", rejectOpen, { once: true }); });
  let callId = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  const call = (method, params = {}) => new Promise((resolveCall, rejectCall) => { const id = ++callId; pending.set(id, { resolve: resolveCall, reject: rejectCall }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression, description, timeout = 10000) => {
    for (let elapsed = 0; elapsed < timeout; elapsed += 100) {
      if (await evaluate(expression)) return;
      await sleep(100);
    }
    throw new Error(description);
  };
  const assert = (condition, description) => { if (!condition) throw new Error(description); };
  const dragWhileSequencing = () => evaluate(`(() => {
    const svg = document.querySelector('#shapeSolid3d');
    const before = svg.querySelector('.solid-face')?.getAttribute('points');
    const stepBefore = svg.dataset.featureSequenceStep;
    const rect = svg.getBoundingClientRect();
    const pointer = (type, x) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 73, pointerType: 'mouse', buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: rect.top + rect.height / 2 });
    svg.dispatchEvent(pointer('pointerdown', rect.left + rect.width / 2));
    window.dispatchEvent(pointer('pointermove', rect.left + rect.width / 2 + 45));
    window.dispatchEvent(pointer('pointerup', rect.left + rect.width / 2 + 45));
    return { before, after: svg.querySelector('.solid-face')?.getAttribute('points'), stepBefore, stepAfter: svg.dataset.featureSequenceStep, active: svg.classList.contains('feature-sequencing') };
  })()`);
  await call("Runtime.enable");
  await waitFor("Boolean(document.querySelector('#shapeSolid3d'))", "Shape explorer did not initialize.");
  await evaluate(`(() => {
    state.sound = true;
    window.__sampleStarts = 0;
    window.__sampleCalls = [];
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args) { window.__sampleStarts += 1; window.__sampleCalls.push({ offset: args[1], duration: args[2] }); return start.apply(this, args); };
    const canvas = document.querySelector('.shape-fullscreen-canvas');
    Object.defineProperty(canvas, 'requestFullscreen', { configurable: true, value: undefined });
    document.querySelector('#shapeFullscreenToggle').click();
    document.querySelector('.fullscreen-property-panel [data-property="1"]').click();
  })()`);
  const start = await evaluate(`(() => ({
    expanded: document.querySelector('.shape-fullscreen-canvas').classList.contains('is-viewport-fullscreen'),
    visibleControls: getComputedStyle(document.querySelector('.fullscreen-property-panel')).display !== 'none',
    step: document.querySelector('#shapeSolid3d').dataset.featureSequenceStep,
    edgeCount: new Set([...document.querySelectorAll('#shapeSolid3d .solid-edge-group')].map(node => node.dataset.featureIndex)).size,
    firstDash: Number(document.querySelector('#shapeSolid3d .solid-edge-group line').style.strokeDashoffset)
  }))()`);
  assert(start.expanded && start.visibleControls && start.step === "1/12" && start.edgeCount === 12 && start.firstDash > 0, `Edges did not start drawing one by one in full screen: ${JSON.stringify(start)}`);
  await waitFor("window.__sampleStarts > 0", "First edge did not receive its crayon sound promptly.", 400);
  await waitFor("document.querySelector('#shapeSolid3d').dataset.featureSequenceStep === '2/12'", "Second edge was not drawn separately.");
  const draggedEdge = await dragWhileSequencing();
  assert(draggedEdge.before !== draggedEdge.after && draggedEdge.active && draggedEdge.stepAfter, `Dragging interrupted edge drawing: ${JSON.stringify(draggedEdge)}`);
  await waitFor("!document.querySelector('#shapeSolid3d').classList.contains('feature-sequencing')", "Edge sequence did not finish cleanly.", 10000);
  assert(await evaluate(`document.querySelector('#shapeSolid3d .solid-edge-group line').style.strokeDashoffset === ''`), "Completed edge still has a drawing mask.");
  await evaluate(`document.querySelector('.fullscreen-property-panel [data-property="2"]').click()`);
  const switched = await evaluate(`(() => ({ expanded: document.querySelector('.shape-fullscreen-canvas').classList.contains('is-viewport-fullscreen'), step: document.querySelector('#shapeSolid3d').dataset.featureSequenceStep, vertexCount: document.querySelectorAll('#shapeSolid3d .solid-vertex-group').length }))()`);
  assert(switched.expanded && switched.step === "1/8" && switched.vertexCount === 8, `Vertex sequence or full-screen persistence failed: ${JSON.stringify(switched)}`);
  const draggedVertex = await dragWhileSequencing();
  assert(draggedVertex.before !== draggedVertex.after && draggedVertex.active && draggedVertex.stepAfter, `Dragging interrupted vertex lighting: ${JSON.stringify(draggedVertex)}`);
  await waitFor("!document.querySelector('#shapeSolid3d').classList.contains('feature-sequencing')", "Vertex sequence did not finish after dragging.", 6000);
  await evaluate(`document.querySelector('.fullscreen-property-panel [data-property="0"]').click()`);
  assert(await evaluate(`document.querySelector('#shapeSolid3d').dataset.featureSequenceStep === '1/6'`), "Faces did not animate individually.");
  const draggedFace = await dragWhileSequencing();
  assert(draggedFace.before !== draggedFace.after && draggedFace.active && draggedFace.stepAfter, `Dragging interrupted face display: ${JSON.stringify(draggedFace)}`);
  await waitFor("!document.querySelector('#shapeSolid3d').classList.contains('feature-sequencing')", "Face sequence did not finish after dragging.", 6000);
  await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const mobile = await evaluate(`(() => {
    const controls = document.querySelector('.fullscreen-property-panel').getBoundingClientRect();
    const toggle = document.querySelector('#shapeFullscreenToggle').getBoundingClientRect();
    return { controls: controls.toJSON(), toggle: toggle.toJSON(), width: innerWidth, height: innerHeight };
  })()`);
  assert(mobile.controls.left >= 0 && mobile.controls.right <= mobile.width && mobile.controls.bottom <= mobile.height && mobile.controls.top > mobile.toggle.bottom, `Mobile full-screen controls overflow or overlap: ${JSON.stringify(mobile)}`);
  await call("Emulation.clearDeviceMetricsOverride");
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  for (const [shape, expected] of [["cylinder", 2], ["cone", 1], ["sphere", 0]]) {
    const count = await evaluate(`(() => { state.tool.shape = ${JSON.stringify(shape)}; renderTool(); document.querySelector('.property-panel [data-property="1"]').click(); return new Set([...document.querySelectorAll('#shapeSolid3d .solid-edge-group')].map(node => node.dataset.featureIndex)).size; })()`);
    assert(count === expected, `${shape} has ${count} logical edges instead of ${expected}.`);
  }
  const startsBeforeMute = await evaluate(`window.__sampleStarts`);
  await evaluate(`state.sound = false`);
  for (const id of ["triangle", "square", "rectangle", "circle", "cube", "cuboid", "pyramid", "cylinder", "cone", "sphere"]) {
    for (let property = 0; property < 3; property += 1) {
      const actual = await evaluate(`(() => {
        state.tool.shape = ${JSON.stringify(id)};
        state.tool.property = 0;
        renderTool();
        document.querySelector('.property-panel [data-property="${property}"]').click();
        return document.querySelector('#shapeSolid3d, .planar-feature-svg')?.dataset.featureSequenceStep || null;
      })()`);
      const shape = await evaluate(`(() => { const shape = SHAPES.find(item => item.id === ${JSON.stringify(id)}); return { kind: shape.kind, sides: shape.sides, corners: shape.corners, curved: shape.curved, faces: shape.faces, edges: shape.edges, vertices: shape.vertices }; })()`);
      const expected = shape.kind === "3d" ? [shape.faces, shape.edges, shape.vertices][property] : [shape.sides, shape.corners, shape.curved ? 1 : 0][property];
      assert(actual === (expected ? `1/${expected}` : null), `${id} property ${property} sequence is ${actual}, expected ${expected ? `1/${expected}` : "none"}.`);
    }
  }
  assert(await evaluate(`window.__sampleStarts === ${startsBeforeMute}`), "Muted property changes still played sample audio.");
  await evaluate(`state.sound = true`);
  const startsBeforeFold = await evaluate(`window.__sampleStarts`);
  await evaluate(`(() => { state.activity = 'netBuilder'; state.tool = factories.netBuilder(); renderTool(); document.querySelector('#nextFold').click(); })()`);
  await waitFor("document.querySelector('#netFold3d')?.dataset.foldAnimating === 'true'", "Net fold animation did not start.");
  await waitFor(`window.__sampleStarts > ${startsBeforeFold}`, "Paper-fold sound sample was not played.");
  const paperCall = await evaluate(`window.__sampleCalls.at(-1)`);
  assert(paperCall.offset === 0 && paperCall.duration === .5, `Paper-fold playback did not use the gentle short clip: ${JSON.stringify(paperCall)}`);
  const audio = await evaluate(`Promise.all([...interactionSoundBuffers.values()]).then(buffers => buffers.map((buffer, index) => {
    const data = buffer.getChannelData(0);
    const from = Math.floor((index === 0 ? 3.5 : 0) * buffer.sampleRate);
    const to = Math.min(data.length, from + Math.floor(.4 * buffer.sampleRate));
    let energy = 0;
    for (let i = from; i < to; i += 1) energy += data[i] * data[i];
    return { duration: buffer.duration, channels: buffer.numberOfChannels, rms: Math.sqrt(energy / (to - from)) };
  }))`);
  assert(audio.length === 2 && audio[0].duration > 2 && audio[1].duration > .5 && audio.every(buffer => buffer.channels > 0 && buffer.rms > .01), `Sound samples are silent or did not decode: ${JSON.stringify(audio)}`);
  console.log(JSON.stringify({ fullScreenControls: true, mobileControls: true, edgesDrawSequentially: true, facesAndVerticesSequential: true, dragPreservesAllFeatureSequences: true, curvedEdgeCounts: true, paperFoldSound: true, audio }, null, 2));
} finally {
  socket?.close();
  browser.kill();
  await sleep(300);
  const resolvedProfile = resolve(profile);
  if (resolvedProfile.startsWith(resolve(tmpdir()) + sep) && resolvedProfile.split(sep).at(-1).startsWith("geometry-feature-test-")) {
    rmSync(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

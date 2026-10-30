import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const copy = {
  bm: {
    voice: "ms-MY-YasminNeural",
    locale: "ms-MY",
    lines: {
      "goal-shape-explorer": "Belajar membezakan bentuk 2D dan 3D serta mengenal sisi, bucu, permukaan dan tepi.",
      "shape-choose": "Pilih satu bentuk daripada kad di bahagian bawah.",
      "shape-move": "Putar bentuk 2D dengan peluncur atau seret model 3D untuk melihat setiap arah.",
      "shape-properties": "Tekan kad ciri untuk melihat nombor dan warna pada bentuk.",
      "shape-summary": "Baca penerangan di bawah untuk memahami ciri yang dipilih.",
      "goal-net-builder": "Kenali bagaimana setiap bahagian bentangan dilipat menjadi bentuk 3D sambil menjejaki nombornya.",
      "net-choose": "Selepas panduan ditutup, seret model untuk memutarnya. Cari petunjuk pada bentuk dan nombor tanpa membuka jawapan.",
      "net-compare": "Peluncur ini menunjukkan langkah semasa. Selepas panduan ditutup, seretnya untuk melihat semula setiap lipatan.",
      "net-fold": "Selepas panduan ditutup, tekan Langkah seterusnya untuk melipat satu bahagian pada satu masa.",
      "net-check": "Selepas lipatan lengkap, sebut tekaan kamu dahulu kemudian tekan Buka jawapan.",
      "goal-shape-drawer": "Belajar melukis bentuk tertutup pada grid dan menyambungkannya menjadi model 3D.",
      "drawer-draw": "Klik titik satu demi satu atau tahan dan seret melalui beberapa titik.",
      "drawer-close": "Selepas memilih sekurang-kurangnya tiga titik, tekan Tutup bentuk.",
      "drawer-connect": "Tekan Sambung jadi 3D untuk menambah kedalaman pada bentuk tertutup.",
      "drawer-inspect": "Lihat bilangan sisi; selepas disambung, seret model dan periksa muka, tepi serta bucu."
    }
  },
  zh: {
    voice: "zh-CN-XiaoxiaoNeural",
    locale: "zh-CN",
    lines: {
      "goal-shape-explorer": "学习分辨二维和三维图形，并认识边、顶点、面和棱。",
      "shape-choose": "从下方的图形卡中选择一个图形。",
      "shape-move": "用滑杆旋转二维图形，或拖动三维模型从不同方向观察。",
      "shape-properties": "点击特征卡，在图形上查看对应的编号和颜色。",
      "shape-summary": "阅读下方说明，理解刚才选择的图形特征。",
      "goal-net-builder": "了解展开图的各部分怎样折成立体图形，并跟踪各部分的编号。",
      "net-choose": "指南结束后，拖动模型进行旋转；从形状和编号中寻找线索，先不要揭晓答案。",
      "net-compare": "滑杆会显示当前步骤。指南结束后，拖动它可前后查看每一次折叠。",
      "net-fold": "指南结束后，点击下一步，每次折起一个部分。",
      "net-check": "折叠完成后，先说出你的猜测，再点击揭晓答案。",
      "goal-shape-drawer": "学习在格点上画出封闭图形，再把它连接成立体模型。",
      "drawer-draw": "逐点点击，或按住并拖过多个格点。",
      "drawer-close": "选择至少三个点后，点击闭合图形。",
      "drawer-connect": "点击连接成立体，为封闭图形加上深度。",
      "drawer-inspect": "查看边数；连接后拖动模型，并检查面、棱和顶点。"
    }
  },
  en: {
    voice: "en-SG-LunaNeural",
    locale: "en-SG",
    lines: {
      "goal-shape-explorer": "Learn to tell 2D and 3D shapes apart and identify their sides, vertices, faces and edges.",
      "shape-choose": "Choose one shape from the cards below.",
      "shape-move": "Use the slider to rotate a 2D shape, or drag a 3D model to view every side.",
      "shape-properties": "Tap a feature card to show its numbers and colours on the shape.",
      "shape-summary": "Read the explanation below to understand the selected feature.",
      "goal-net-builder": "Learn how each part of a net folds into a 3D solid while tracking its number.",
      "net-choose": "After the guide closes, drag the model to rotate it. Look for clues in its shape and numbers without revealing the answer.",
      "net-compare": "The slider shows the current step. After the guide closes, drag it to review each fold.",
      "net-fold": "After the guide closes, press Next step to fold one part at a time.",
      "net-check": "When folding is complete, say your guess first and then press Reveal answer.",
      "goal-shape-drawer": "Learn to draw a closed shape on the grid and connect it into a 3D model.",
      "drawer-draw": "Click points one by one, or hold and drag across several points.",
      "drawer-close": "After choosing at least three points, tap Close shape.",
      "drawer-connect": "Tap Connect as 3D to add depth to the closed shape.",
      "drawer-inspect": "Check the side count; after connecting, drag the model and inspect its faces, edges and vertices."
    }
  }
};

const args = new Map(process.argv.slice(2).map(argument => {
  const [key, ...value] = argument.replace(/^--/, "").split("=");
  return [key, value.length ? value.join("=") : true];
}));
const requestedLanguage = String(args.get("language") || "all");
const requestedKey = args.get("only") ? String(args.get("only")) : null;
const limit = Number(args.get("limit") || Number.POSITIVE_INFINITY);
const force = args.has("force");
const showBrowser = args.has("show-browser");
if (requestedLanguage !== "all" && !copy[requestedLanguage]) throw new Error(`Unsupported language: ${requestedLanguage}`);
if (!Number.isFinite(limit) && args.has("limit")) throw new Error("--limit must be a positive number.");

const here = dirname(fileURLToPath(import.meta.url));
const defaultToolRoot = resolve(here, "..");
const toolRoot = resolve(String(args.get("tool-root") || defaultToolRoot));
const voicesRoot = resolve(toolRoot, "assets", "operation-guide", "voices");
const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
];
const chromePath = chromeCandidates.find(existsSync);
if (!chromePath) throw new Error("Chrome or Edge was not found.");
if (!existsSync(toolRoot)) throw new Error(`Tool root was not found: ${toolRoot}`);

const jobs = [];
for (const [language, configuration] of Object.entries(copy)) {
  if (requestedLanguage !== "all" && requestedLanguage !== language) continue;
  for (const [key, text] of Object.entries(configuration.lines)) {
    if (requestedKey && requestedKey !== key) continue;
    const output = resolve(voicesRoot, language, "contextual", `${key}.mp3`);
    if (!force && existsSync(output) && statSync(output).size > 1024) continue;
    jobs.push({ language, key, text, output, ...configuration });
  }
}
jobs.splice(Math.max(0, Math.floor(limit)));
if (!jobs.length) {
  console.log("All requested contextual narrations already exist.");
  process.exit(0);
}

const port = 9600 + Math.floor(Math.random() * 150);
const profile = mkdtempSync(join(tmpdir(), "edcloud-ttsfree-generate-"));
const browserArgs = [
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--autoplay-policy=no-user-gesture-required",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--window-size=1280,900",
  "https://ttsfree.com/#try-now"
];
if (!showBrowser) browserArgs.unshift("--headless=new");
const browser = spawn(chromePath, browserArgs, { stdio: "ignore", windowsHide: !showBrowser });
const delay = milliseconds => new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
      const page = pages.find(candidate => candidate.type === "page" && candidate.url.includes("ttsfree.com"));
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (_) {
      // Browser is still starting.
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
    const { resolve: resolveCall, reject: rejectCall } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) rejectCall(new Error(message.error.message));
    else resolveCall(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails?.text || "Runtime exception");
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

async function waitFor(expression, message, timeout = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await delay(150);
  }
  throw new Error(message);
}

async function chooseVoice(job) {
  const selection = await evaluate(`(() => {
    const locale = ${JSON.stringify(job.locale)};
    const voice = ${JSON.stringify(job.voice)};
    const language = window.lang_and_voice?.[locale];
    if (!language) return { error: 'language-not-found', locale };
    if (document.querySelector('#select_lang').value !== locale) {
      document.querySelector('#selectedLang').click();
      const item = [...document.querySelectorAll('#langList .lang-item')]
        .find(candidate => candidate.textContent.trim() === language.lang_country);
      if (!item) return { error: 'language-option-not-found', expected: language.lang_country };
      item.click();
    }
    const voiceOption = document.querySelector('#voiceList [data-voice-id="' + CSS.escape(voice) + '"]');
    if (!voiceOption) return { error: 'voice-not-found', voice };
    voiceOption.click();

    const rate = document.querySelector('#rate-slider');
    rate.value = '-10';
    rate.dispatchEvent(new Event('input', { bubbles: true }));
    rate.dispatchEvent(new Event('change', { bubbles: true }));
    const pitch = document.querySelector('#pitch-slider');
    pitch.value = '0';
    pitch.dispatchEvent(new Event('input', { bubbles: true }));
    pitch.dispatchEvent(new Event('change', { bubbles: true }));

    const musicConfig = document.querySelector('#music-config-checkbox');
    if (musicConfig?.checked) musicConfig.click();
    document.querySelectorAll('input[name="music"]').forEach(input => {
      input.checked = false;
      input.removeAttribute('checked');
    });
    document.querySelectorAll('input[name^="bgm_"]').forEach(input => { input.value = ''; });

    return {
      locale: document.querySelector('#select_lang').value,
      voice: document.querySelector('#voiceID').value,
      service: document.querySelector('#voice_service').value,
      rate: document.querySelector('#rate-hidden').value,
      pitch: document.querySelector('#pitch-hidden').value,
      musicConfigured: Boolean(musicConfig?.checked),
      musicFields: [...new FormData(document.querySelector('#frm_tts')).entries()].filter(([name]) => name === 'music' || name.startsWith('bgm_'))
    };
  })()`);
  if (selection.error) throw new Error(`TTSFree selection failed: ${JSON.stringify(selection)}`);
  if (selection.locale !== job.locale || selection.voice !== job.voice || selection.service !== "voice_bin") {
    throw new Error(`TTSFree chose the wrong voice: ${JSON.stringify(selection)}`);
  }
  if (selection.rate !== "-10" || selection.pitch !== "0") throw new Error(`TTSFree rate or pitch is incorrect: ${JSON.stringify(selection)}`);
  if (selection.musicConfigured || selection.musicFields.some(([, value]) => value)) throw new Error(`Background music is still enabled: ${JSON.stringify(selection)}`);
}

async function convert(job) {
  const submitted = await evaluate(`(() => {
    const text = document.querySelector('#tts-text');
    text.value = ${JSON.stringify(job.text)};
    text.dispatchEvent(new Event('input', { bubbles: true }));
    const button = document.querySelector('#convert_now');
    if (button.disabled) return { error: 'submit-disabled' };
    document.querySelector('#message_display').textContent = '';
    document.querySelector('#status_label').textContent = 'waiting';
    button.click();
    const data = [...new FormData(document.querySelector('#frm_tts')).entries()];
    return {
      text: document.querySelector('#tts-text').value,
      voice: document.querySelector('#voiceID').value,
      rate: document.querySelector('#rate-hidden').value,
      pitch: document.querySelector('#pitch-hidden').value,
      disabledAfterSubmit: button.disabled,
      forbiddenMusic: data.filter(([name, value]) => (name === 'music' || name.startsWith('bgm_')) && value)
    };
  })()`);
  if (submitted.error) throw new Error(`TTSFree submission failed: ${submitted.error}`);
  if (submitted.text !== job.text || submitted.voice !== job.voice || submitted.rate !== "-10" || submitted.pitch !== "0" || !submitted.disabledAfterSubmit || submitted.forbiddenMusic.length) {
    throw new Error(`TTSFree submitted unexpected values: ${JSON.stringify(submitted)}`);
  }

  await waitFor(
    `(() => {
      const status = document.querySelector('#status_label')?.textContent.trim().toLowerCase();
      const button = document.querySelector('#convert_now');
      return !button.disabled && (status === 'finish' || status === 'error');
    })()`,
    `TTSFree timed out while generating ${job.language}/${job.key}.`,
    60000
  );
  const result = await evaluate(`(() => {
    const container = document.querySelector('#message_display');
    const urls = [...container.querySelectorAll('a[href], audio[src], source[src]')]
      .map(element => element.href || element.src)
      .filter(Boolean);
    return {
      status: document.querySelector('#status_label')?.textContent.trim().toLowerCase(),
      text: container.textContent.trim().replace(/\\s+/g, ' '),
      html: container.innerHTML,
      urls
    };
  })()`);
  if (result.status !== "finish") throw new Error(`TTSFree returned an error for ${job.language}/${job.key}: ${result.text}`);
  const audioUrl = result.urls.find(url => /(?:mp3|download|audio)/i.test(url)) || result.urls[0];
  if (!audioUrl) throw new Error(`TTSFree finished without an audio URL for ${job.language}/${job.key}: ${result.html}`);
  return audioUrl;
}

async function downloadAudio(url) {
  const cookieResult = await call("Network.getAllCookies");
  const cookie = (cookieResult.cookies || []).filter(item => item.domain.includes("ttsfree.com")).map(item => `${item.name}=${item.value}`).join("; ");
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const downloadUrl = new URL(url);
      downloadUrl.searchParams.set("edcloud_nocache", `${Date.now()}-${attempt}-${Math.random().toString(16).slice(2)}`);
      const response = await fetch(downloadUrl, {
        cache: "no-store",
        headers: {
          "Cookie": cookie,
          "Cache-Control": "no-cache",
          "Referer": "https://ttsfree.com/",
          "User-Agent": "Mozilla/5.0 EdCloud contextual narration generator"
        }
      });
      if (!response.ok) throw new Error(`Audio download failed (${response.status} ${response.statusText}): ${url}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1024) throw new Error(`Downloaded audio is unexpectedly small (${buffer.length} bytes): ${url}`);
      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await delay(attempt * 750);
    }
  }
  throw lastError;
}

function validateMp3(path) {
  const probe = spawnSync("ffprobe", [
    "-v", "error", "-select_streams", "a:0",
    "-show_entries", "stream=codec_name,sample_rate,channels,bit_rate,duration",
    "-of", "json", path
  ], { encoding: "utf8", windowsHide: true });
  if (probe.status !== 0) throw new Error(`ffprobe could not decode ${path}: ${probe.stderr}`);
  const stream = JSON.parse(probe.stdout).streams?.[0];
  if (!stream || stream.codec_name !== "mp3") throw new Error(`Generated narration is not MP3: ${path}`);
  return stream;
}

try {
  await call("Runtime.enable");
  await call("Page.enable");
  await call("Network.enable");
  await waitFor(
    `document.readyState === 'complete' && Boolean(document.querySelector('#convert_now')) && Boolean(window.lang_and_voice)`,
    "TTSFree did not finish loading."
  );
  await delay(1200);
  let currentLanguage = null;
  const hashes = new Map();
  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index];
    if (index > 0) {
      await call("Page.reload", { ignoreCache: true });
      await waitFor(
        `document.readyState === 'complete' && Boolean(document.querySelector('#convert_now')) && Boolean(window.lang_and_voice)`,
        `TTSFree did not reload before ${job.language}/${job.key}.`
      );
      await delay(800);
      currentLanguage = null;
    }
    if (currentLanguage !== job.language) {
      await chooseVoice(job);
      currentLanguage = job.language;
    }
    const audioUrl = await convert(job);
    const audio = await downloadAudio(audioUrl);
    mkdirSync(dirname(job.output), { recursive: true });
    writeFileSync(job.output, audio);
    const stream = validateMp3(job.output);
    const hash = createHash("sha256").update(audio).digest("hex");
    if (hashes.has(hash)) throw new Error(`Duplicate narration bytes for ${hashes.get(hash)} and ${job.language}/${job.key}.`);
    hashes.set(hash, `${job.language}/${job.key}`);
    console.log(`[${index + 1}/${jobs.length}] ${job.language}/${job.key}.mp3 ${audio.length} bytes ${stream.sample_rate}Hz ${stream.channels}ch`);
  }
  if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);
  console.log(JSON.stringify({ status: "passed", generated: jobs.length, speed: "-10%", pitch: "0%", backgroundMusic: false }, null, 2));
} finally {
  socket.close();
  const browserExited = browser.exitCode !== null ? Promise.resolve() : new Promise(resolveExit => browser.once("exit", resolveExit));
  browser.kill();
  await Promise.race([browserExited, delay(1500)]);
  const resolvedProfile = resolve(profile);
  if (resolvedProfile.startsWith(resolve(tmpdir()))) {
    try {
      rmSync(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch (error) {
      console.warn(`Temporary Chrome profile could not be removed: ${error.message}`);
    }
  }
}

const productionLauncherOrigins = [
  "https://app.edcloud.dev",
  "https://portal.edcloud.dev",
  "https://student.edcloud.dev",
  "https://reader.edcloud.dev",
];
const isLocalDevelopment =
  window.location.hostname === "localhost" &&
  (window.location.protocol === "http:" ||
    window.location.protocol === "https:");
const TRUSTED_LAUNCHER_ORIGINS = Object.freeze([
  ...productionLauncherOrigins,
  ...(isLocalDevelopment ? [window.location.origin] : []),
]);

const authGate = document.getElementById("authGate");
const authTitle = document.getElementById("authTitle");
const authMessage = document.getElementById("authMessage");
const pageShell = document.querySelector(".page-shell");
const forestFooter = document.querySelector(".forest-footer");

function showStartupError(title, message) {
  authGate.classList.add("is-error");
  authGate.setAttribute("role", "alert");
  authGate.setAttribute("aria-live", "assertive");
  authTitle.textContent = title;
  authMessage.textContent = message;
  authTitle.setAttribute("tabindex", "-1");
  authTitle.focus();
}

async function startTool() {
  try {
    const { authenticateEdCloudTool } = await import("./edcloud-tool-auth.js");

    // The returned session is intentionally not persisted or exposed. This
    // tool currently uses authentication only as its launch gate.
    await authenticateEdCloudTool({
      allowedLauncherOrigins: TRUSTED_LAUNCHER_ORIGINS,
      allowOpaqueLauncherOrigin: true,
    });
  } catch {
    showStartupError(
      "Authentication required",
      "Please open this tool from EdCloud. / Sila buka alat ini melalui EdCloud. / 请从 EdCloud 打开此工具。",
    );
    return;
  }

  try {
    await import("./app.js?v=1");
  } catch {
    showStartupError(
      "Unable to start the tool",
      "Please close this window and try again from EdCloud.",
    );
    return;
  }

  pageShell.hidden = false;
  forestFooter.hidden = false;
  const appTitle = pageShell.querySelector("h1");
  authGate.remove();

  if (appTitle) {
    appTitle.setAttribute("tabindex", "-1");
    appTitle.focus();
    appTitle.addEventListener(
      "blur",
      () => appTitle.removeAttribute("tabindex"),
      { once: true },
    );
  }
}

void startTool();

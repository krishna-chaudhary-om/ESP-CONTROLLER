// ── State ──────────────────────────────────────────────────────────
let heatOn   = false;
let vibOn    = false;
let connected = false;

// ── Log ────────────────────────────────────────────────────────────
function log(msg, type = "info") {
  const out = document.getElementById("logOut");
  const now = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.className = `log-line ${type}`;
  line.innerHTML = `<span class="log-ts">${now}</span> ${msg}`;
  out.prepend(line);
  if (out.children.length > 50) out.lastChild.remove();
}

// ── Connect (set ESP32 IP on server) ───────────────────────────────
async function connectESP() {
  const ip = document.getElementById("espIp").value.trim();
  if (!ip) { log("Enter ESP32 IP first", "warn"); return; }

  try {
    const r = await fetch("/api/esp-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    });
    const d = await r.json();
    if (d.ok) {
      log(`Connected to ESP32 at ${ip}`, "ok");
      setOnline(true);
    } else {
      log(d.error, "err");
    }
  } catch(e) {
    log("Server unreachable", "err");
  }
}

// ── Online / Offline UI ────────────────────────────────────────────
function setOnline(state) {
  connected = state;
  const dot   = document.getElementById("liveDot");
  const label = document.getElementById("liveLabel");
  dot.className   = "chip-dot " + (state ? "online" : "");
  label.textContent = state ? "CONNECTED" : "DISCONNECTED";
}

// ── Poll temp every 5s ─────────────────────────────────────────────
async function pollState() {
  try {
    const r = await fetch("/api/state");
    const d = await r.json();

    if (d.lastSeen) {
      const t = d.temp !== null ? parseFloat(d.temp).toFixed(1) : "--";
      document.getElementById("tempNum").textContent = t;
      setOnline(true);
    }
  } catch(e) {
    setOnline(false);
  }
}

// ── Heat ───────────────────────────────────────────────────────────
async function toggleHeat() {
  heatOn = document.getElementById("heatSwitch").checked;
  document.getElementById("heatState").textContent = `STATUS: ${heatOn ? "ON" : "OFF"}`;
  document.getElementById("tempSlider").disabled = !heatOn;

  try {
    await fetch(`/api/heat?state=${heatOn ? "on" : "off"}`);
    log(`Heating → ${heatOn ? "ON" : "OFF"}`, heatOn ? "ok" : "info");
  } catch(e) {
    log("Heat command failed", "err");
  }
}

function onTempSlide(val) {
  document.getElementById("tempNum").textContent = val;
}

async function commitTemp(val) {
  try {
    await fetch(`/api/temp?value=${val}`);
    log(`Target temp → ${val}°C`, "info");
  } catch(e) {
    log("Temp command failed", "err");
  }
}

function applyPreset(val) {
  const slider = document.getElementById("tempSlider");
  slider.value = val;
  onTempSlide(val);
  commitTemp(val);
  log(`Preset → ${val}°C`, "info");
}

// ── Vibration ──────────────────────────────────────────────────────
async function toggleVib() {
  vibOn = document.getElementById("vibSwitch").checked;
  document.getElementById("vibState").textContent = `STATUS: ${vibOn ? "ON" : "OFF"}`;

  try {
    await fetch(`/api/vib?state=${vibOn ? "on" : "off"}`);
    log(`Vibration → ${vibOn ? "ON" : "OFF"}`, vibOn ? "ok" : "info");
  } catch(e) {
    log("Vib command failed", "err");
  }
}

async function setMode(name, level) {
  // Auto-enable vib if not on
  if (!vibOn) {
    document.getElementById("vibSwitch").checked = true;
    vibOn = true;
    document.getElementById("vibState").textContent = "STATUS: ON";
  }

  try {
    await fetch(`/api/vib?state=on&level=${level}`);
    log(`Vib mode → ${name} (${level}%)`, "ok");
  } catch(e) {
    log("Vib command failed", "err");
  }
}

// ── Init ───────────────────────────────────────────────────────────
pollState();
setInterval(pollState, 5000);
log("Dashboard ready", "ok");
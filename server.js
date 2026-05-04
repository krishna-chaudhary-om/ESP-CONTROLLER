const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

let latestData = {
  temp: null,
  heat: false,
  vib: false,
  lastSeen: null,
};

let ESP32_IP = "172.31.97.22";

// ESP32 → sends temperature here
app.post("/api/sensor", (req, res) => {
  const { temp } = req.body;
  if (temp !== undefined) {
    latestData.temp = temp;
    latestData.lastSeen = new Date().toISOString();
    console.log(`[ESP32] Temp: ${temp}°C`);
  }
  res.json({ ok: true });
});

// Browser → get latest state
app.get("/api/state", (req, res) => {
  res.json(latestData);
});

// Browser → set ESP32 IP
app.post("/api/esp-ip", (req, res) => {
  const { ip } = req.body;
  if (ip) {
    ESP32_IP = ip;
    console.log(`[CONFIG] ESP32 IP set to ${ip}`);
    res.json({ ok: true, ip });
  } else {
    res.status(400).json({ error: "ip required" });
  }
});

// Proxy helper → forwards commands to ESP32
async function proxyToESP32(espPath, res) {
  if (!ESP32_IP) {
    console.error("[PROXY] No ESP32 IP set");
    return res.status(503).json({ error: "ESP32 IP not set — enter it on the dashboard and click CONNECT" });
  }
  try {
    const { default: fetch } = await import("node-fetch");
    const url = `http://${ESP32_IP}${espPath}`;
    console.log(`[PROXY] → ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const text = await r.text();
    console.log(`[PROXY] ← ${r.status} ${text}`);
    res.status(r.status).send(text);
  } catch (e) {
    if (e.name === "AbortError") {
      console.error("[PROXY] Timed out — ESP32 not responding");
      res.status(504).json({ error: "ESP32 timed out — is it on and connected to WiFi?" });
    } else {
      console.error("[PROXY] Error:", e.message);
      res.status(502).json({ error: "ESP32 unreachable — check IP and WiFi" });
    }
  }
}

// Heat relay control
app.get("/api/heat", async (req, res) => {
  const state = req.query.state;
  if (state !== "on" && state !== "off") {
    return res.status(400).json({ error: "state must be on or off" });
  }
  latestData.heat = state === "on";
  console.log(`[HEAT] Relay → ${state.toUpperCase()}`);
  await proxyToESP32(`/heat?state=${state}`, res);
});

// Target temperature
app.get("/api/temp", async (req, res) => {
  const value = parseInt(req.query.value);
  if (isNaN(value) || value < 20 || value > 40) {
    return res.status(400).json({ error: "temp value must be 20–40" });
  }
  console.log(`[TEMP] Target → ${value}°C`);
  await proxyToESP32(`/temp?value=${value}`, res);
});

// Vibration motor control
app.get("/api/vib", async (req, res) => {
  if (req.query.state) {
    latestData.vib = req.query.state === "on";
  }
  const qs = new URLSearchParams(req.query).toString();
  console.log(`[VIB] → ${qs}`);
  await proxyToESP32(`/vib?${qs}`, res);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅  Server running at http://127.0.0.1:${PORT}/index.html\n`);
});
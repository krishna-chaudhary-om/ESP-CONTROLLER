// ===== GLOBAL STATE =====
let ESP_IP = "";
let heatOn = false;
let vibOn = false;
let temp = 30;
let vibLevel = 50;
let vibMode = 'MED';
let pulse = null;

// ===== CONNECT TO ESP =====
function connectESP() {
  ESP_IP = document.getElementById("espIp").value.trim();

  if (!ESP_IP) {
    alert("Enter ESP IP first");
    return;
  }

  localStorage.setItem("esp_ip", ESP_IP);
  document.getElementById("liveLabel").textContent = "CONNECTED · " + ESP_IP;

  log("Connected to " + ESP_IP, "ok");

  // Try fetching status
  fetchStatus();
}

// ===== AUTO LOAD LAST IP =====
window.addEventListener('load', function () {
  let saved = localStorage.getItem("esp_ip");
  if (saved) {
    ESP_IP = saved;
    document.getElementById("espIp").value = saved;
    document.getElementById("liveLabel").textContent = "CONNECTED · " + saved;
    fetchStatus();
  }
});

// ===== URL BUILDER =====
function espUrl(path) {
  if (!ESP_IP) {
    alert("Connect to ESP first");
    throw new Error("ESP IP not set");
  }
  return "http://" + ESP_IP + path;
}

// ===== CLOCK =====
setInterval(() => {
  document.getElementById('liveClock').textContent =
    new Date().toLocaleTimeString('en-GB');
}, 1000);

// ===== LOG SYSTEM =====
function ts() {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function log(msg, type = "") {
  let d = document.getElementById('logOut');
  let el = document.createElement('div');
  el.className = 'log-line';
  el.innerHTML =
    `<span class="log-t">${ts()}</span><span class="log-m ${type}">${msg}</span>`;
  d.prepend(el);
  while (d.children.length > 30) d.removeChild(d.lastChild);
}

// ===== TOAST =====
function showToast(msg) {
  let t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ===== SEND REQUEST =====
function send(path, desc) {
  try {
    let url = espUrl(path);
    log("→ " + desc);

    fetch(url)
      .then(r => {
        if (r.ok) {
          log("✓ " + desc, "ok");
          showToast(desc);
        } else {
          log("✗ HTTP " + r.status, "err");
        }
      })
      .catch(e => {
        log("✗ " + e.message, "err");
        showToast("Error: " + e.message);
      });

  } catch (e) {
    log("✗ Not connected to ESP", "err");
  }
}

// ===== FETCH STATUS =====
function fetchStatus() {
  try {
    fetch(espUrl('/status'))
      .then(r => r.json())
      .then(data => {
        log("Device online", "ok");

        // restore heating
        if (data.heat !== undefined) {
          document.getElementById('heatSwitch').checked = data.heat;
          toggleHeat();
        }

        if (data.temp !== undefined) {
          document.getElementById('tempSlider').value = data.temp;
          onTempSlide(data.temp);
        }

        // restore vibration
        if (data.vib !== undefined) {
          document.getElementById('vibSwitch').checked = data.vib;
          toggleVib();
        }

      })
      .catch(() => {
        log("Device not reachable", "warn");
      });

  } catch (e) {}
}

// ===== HEATING CONTROL =====
function toggleHeat() {
  heatOn = document.getElementById('heatSwitch').checked;

  let card = document.getElementById('heatCard');
  let state = document.getElementById('heatState');
  let num = document.getElementById('tempNum');
  let slider = document.getElementById('tempSlider');
  let pills = document.querySelectorAll('.pill');

  if (heatOn) {
    card.classList.add('on-heat');
    state.textContent = 'ACTIVE — TARGET ' + temp + '°C';
    state.className = 'card-state on';

    num.textContent = temp;
    num.classList.add('active');

    slider.disabled = false;
    pills.forEach(p => p.classList.remove('disabled'));

    updatePillActive(temp);
    send('/heat?state=on', 'Heating ON');

  } else {
    card.classList.remove('on-heat');
    state.textContent = 'OFFLINE';
    state.className = 'card-state off';

    num.textContent = '--';
    num.classList.remove('active');

    slider.disabled = true;
    pills.forEach(p => {
      p.classList.remove('active');
      p.classList.add('disabled');
    });

    send('/heat?state=off', 'Heating OFF');
  }
}

// ===== TEMP CONTROL =====
function onTempSlide(v) {
  temp = parseInt(v);

  if (heatOn) {
    document.getElementById('tempNum').textContent = temp;
    document.getElementById('heatState').textContent =
      'ACTIVE — TARGET ' + temp + '°C';
    updatePillActive(temp);
  }
}

function commitTemp(v) {
  temp = parseInt(v);
  if (heatOn) send('/temp?value=' + temp, 'Temp set ' + temp + '°C');
}

function applyPreset(t) {
  if (!heatOn) return;
  document.getElementById('tempSlider').value = t;
  onTempSlide(t);
  commitTemp(t);
}

function updatePillActive(t) {
  document.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', parseInt(p.dataset.t) === t);
  });
}

// ===== VIBRATION CONTROL =====
function toggleVib() {
  vibOn = document.getElementById('vibSwitch').checked;

  let card = document.getElementById('vibCard');
  let state = document.getElementById('vibState');
  let btns = document.querySelectorAll('.mode-btn');

  if (vibOn) {
    card.classList.add('on-vib');
    state.textContent = 'RUNNING — ' + vibMode + ' ' + vibLevel + '%';
    state.className = 'card-state on';

    btns.forEach(b => b.classList.remove('disabled'));

    setMode(vibMode, vibLevel, false);
    startPulse();

    send('/vib?state=on', 'Vibration ON');

  } else {
    card.classList.remove('on-vib');
    state.textContent = 'OFFLINE';
    state.className = 'card-state off';

    btns.forEach(b => {
      b.classList.remove('active');
      b.classList.add('disabled');
    });

    stopPulse();
    send('/vib?state=off', 'Vibration OFF');
  }
}

function setMode(m, l, doSend = true) {
  if (!vibOn) return;

  vibMode = m;
  vibLevel = l;

  document.getElementById('vibState').textContent =
    'RUNNING — ' + m + ' ' + l + '%';

  let map = { LOW: 'mLow', MED: 'mMed', HIGH: 'mHigh', MAX: 'mMax' };

  document.querySelectorAll('.mode-btn').forEach(b =>
    b.classList.remove('active')
  );

  document.getElementById(map[m]).classList.add('active');

  if (doSend) send('/vib?level=' + l, 'Vibration ' + m);
}

// ===== PULSE VISUAL =====
function startPulse() {
  stopPulse();

  pulse = setInterval(() => {
    if (!vibOn) return;

    let bars = document.querySelectorAll('.pulse-bar');
    let active = Math.round(bars.length * (vibLevel / 100));

    bars.forEach((b, i) => {
      if (i < active) {
        b.style.height = (6 + Math.random() * 22) + 'px';
        b.classList.add('live');
      } else {
        b.style.height = '4px';
        b.classList.remove('live');
      }
    });

  }, 100);
}

function stopPulse() {
  if (pulse) clearInterval(pulse);
  pulse = null;

  document.querySelectorAll('.pulse-bar').forEach(b => {
    b.style.height = '4px';
    b.classList.remove('live');
  });
}

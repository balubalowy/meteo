/**
 * LOGIKA DASHBOARDU METEO BARTKA (SOB) - EKSTREMALNY UPGRADE v3
 * Kalkulatory ESSL IF-Scale, Wmax, LCL, DCP, STP, SCP, Wektor Corfidiego
 * oraz Archiwum Historycznych Nawałnic w Polsce (2002-2017)
 */

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  renderIFClassesTable();
  renderDamageEvaluator();
  renderThermoConcepts();
  renderRadarSignatures();
  renderSOBWarnings();
  renderHistoricalCases();
  initLiveCalculators();
  initLeafletMap();
});

// 1. Nawigacja Zakładek
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const tabViews = document.querySelectorAll(".tab-view");

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute("data-tab");

      navItems.forEach(n => n.classList.remove("active"));
      tabViews.forEach(v => v.classList.remove("active"));

      item.classList.add("active");
      const activeView = document.getElementById(`tab-${targetTab}`);
      if (activeView) activeView.classList.add("active");
    });
  });
}

// 2. Tabela Klas IF-Scale ESSL 2025
function renderIFClassesTable() {
  const container = document.getElementById("if-classes-table-body");
  if (!container || !METEO_DATA.ifScaleClasses) return;

  container.innerHTML = "";

  METEO_DATA.ifScaleClasses.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="if-badge" style="background:${getIFBadgeColor(item.code)}">${item.code}</span></td>
      <td><strong>${item.centralSpeedKmh} km/h</strong> <br><span style="font-size:0.75rem; color:var(--text-subtle)">(${item.rangeKmh})</span></td>
      <td><strong>${item.centralSpeedMs} m/s</strong> <br><span style="font-size:0.75rem; color:var(--text-subtle)">(${item.rangeMs})</span></td>
      <td>${item.centralSpeedKt} kt</td>
      <td>${item.desc}</td>
    `;
    container.appendChild(tr);
  });
}

function getIFBadgeColor(code) {
  const colors = {
    "IF0": "#10B981",
    "IF0.5": "#34D399",
    "IF1": "#FBBF24",
    "IF1.5": "#F59E0B",
    "IF2": "#EF4444",
    "IF2.5": "#DC2626",
    "IF3": "#B91C1C",
    "IF4": "#8B5CF6",
    "IF5": "#6D28D9"
  };
  return colors[code] || "#38BDF8";
}

// 3. Interaktywny Kalkulator Zniszczeń ESSL (Damage Evaluator)
function renderDamageEvaluator() {
  const selectDi = document.getElementById("eval-di-select");
  const selectSub = document.getElementById("eval-sub-select");
  const selectDod = document.getElementById("eval-dod-select");
  const resultBox = document.getElementById("eval-result-box");

  if (!selectDi || !selectSub || !selectDod) return;

  selectDi.innerHTML = METEO_DATA.damageIndicators.map(di => `
    <option value="${di.id}">${di.name}</option>
  `).join("");

  function updateSubclasses() {
    const currentDiId = selectDi.value;
    const diObj = METEO_DATA.damageIndicators.find(d => d.id === currentDiId);
    if (!diObj) return;

    selectSub.innerHTML = diObj.subclasses.map(s => `
      <option value="${s.code}">${s.label}</option>
    `).join("");

    calculateIFRating();
  }

  function calculateIFRating() {
    const subCode = selectSub.value;
    const dodVal = parseInt(selectDod.value) || 1;

    let rating = "IF1";

    if (subCode.startsWith("BS")) {
      if (subCode === "BSA") rating = (dodVal === 1) ? "IF0.5" : (dodVal === 2) ? "IF1.5" : "IF0";
      else if (subCode === "BSD") rating = (dodVal === 1) ? "IF2.5" : (dodVal === 2) ? "IF4" : "IF1.5";
      else rating = (dodVal === 1) ? "IF1.5" : (dodVal === 2) ? "IF2.5" : "IF1";
    } else if (subCode.startsWith("TR")) {
      if (subCode === "TRW") rating = (dodVal === 1) ? "IF0.5" : (dodVal === 2) ? "IF1.5" : "IF0";
      else if (subCode === "TRS") rating = (dodVal === 1) ? "IF1.5" : (dodVal === 2) ? "IF2.5" : "IF1";
      else rating = (dodVal === 1) ? "IF1" : (dodVal === 2) ? "IF2" : "IF0.5";
    } else {
      rating = (dodVal === 1) ? "IF1.5" : "IF2.5";
    }

    const classObj = METEO_DATA.ifScaleClasses.find(c => c.code === rating) || METEO_DATA.ifScaleClasses[2];

    resultBox.innerHTML = `
      <div style="font-size:0.85rem; color:var(--text-muted)">Wyznaczony stopień uszkodzenia ESSL:</div>
      <div style="display:flex; align-items:center; gap:0.75rem; margin:0.4rem 0">
        <span class="if-badge" style="background:${getIFBadgeColor(classObj.code)}; font-size:1.4rem; padding:0.4rem 0.8rem">${classObj.code}</span>
        <div>
          <div style="font-size:1.3rem; font-weight:700; color:var(--text-main)">~ ${classObj.centralSpeedKmh} km/h (${classObj.centralSpeedMs} m/s)</div>
          <div style="font-size:0.8rem; color:var(--text-subtle)">Zakres prędkości: ${classObj.rangeKmh} km/h (${classObj.centralSpeedKt} kt)</div>
        </div>
      </div>
      <div style="font-size:0.8rem; color:var(--text-muted); border-top:1px solid var(--border-card); padding-top:0.4rem; margin-top:0.4rem">
        <strong>Interpretacja ESSL:</strong> ${classObj.desc}
      </div>
    `;
  }

  selectDi.addEventListener("change", updateSubclasses);
  selectSub.addEventListener("change", calculateIFRating);
  selectDod.addEventListener("change", calculateIFRating);

  updateSubclasses();
}

// 4. Renderowanie Termodynamiki Zięby & Taszarka
function renderThermoConcepts() {
  const container = document.getElementById("thermo-concepts-grid");
  if (!container || !METEO_DATA.thermoConcepts) return;

  container.innerHTML = METEO_DATA.thermoConcepts.map(c => `
    <div class="card">
      <div class="card-title" style="color:var(--primary)">${c.name}</div>
      <div style="font-size:0.75rem; color:var(--purple); font-weight:700; margin-bottom:0.4rem">${c.type}</div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.6rem">${c.desc}</p>
      <div style="background:rgba(15,23,42,0.8); padding:0.4rem 0.6rem; border-radius:6px; font-family:monospace; font-size:0.8rem; color:var(--accent)">
        Wzór: ${c.formula}
      </div>
    </div>
  `).join("");
}

// 5. Renderowanie Sygnatur Radarowych Pilorza
function renderRadarSignatures() {
  const container = document.getElementById("radar-signatures-grid");
  if (!container || !METEO_DATA.radarSignatures) return;

  container.innerHTML = METEO_DATA.radarSignatures.map(r => `
    <div class="card" style="border-top:3px solid var(--primary)">
      <div class="card-title">${r.name}</div>
      <div style="font-size:0.75rem; color:var(--primary); font-weight:700; margin-bottom:0.4rem">Typ: ${r.type}</div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.6rem">${r.desc}</p>
      <div style="font-size:0.8rem; color:var(--danger)">
        <strong>Główne ryzyko:</strong> ${r.risk}
      </div>
    </div>
  `).join("");
}

// 6. Renderowanie Ostrzeżeń SOB / Skywarn PL
function renderSOBWarnings() {
  const container = document.getElementById("sob-warnings-grid");
  if (!container || !METEO_DATA.sobWarnings) return;

  container.innerHTML = METEO_DATA.sobWarnings.map(w => `
    <div class="card" style="border-left:4px solid ${w.color}">
      <div class="card-title" style="color:${w.color}">${w.level}</div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem">${w.desc}</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.8rem">
        <div><strong>Porywy wiatru:</strong> ${w.wind}</div>
        <div><strong>Średnica gradu:</strong> ${w.hail}</div>
        <div><strong>Intensywność opadu:</strong> ${w.rain}</div>
        <div><strong>Tornada / Derecho:</strong> ${w.tornado}</div>
      </div>
    </div>
  `).join("");
}

// 7. Archiwum Przypadków Historycznych (Derecho, Tornado, Grad)
function renderHistoricalCases() {
  const container = document.getElementById("historical-cases-grid");
  if (!container || !METEO_DATA.historicalCases) return;

  container.innerHTML = METEO_DATA.historicalCases.map(hc => `
    <div class="card" style="border:1px solid rgba(239,68,68,0.25); background:rgba(239,68,68,0.03)">
      <div class="card-title" style="color:var(--danger)">${hc.title}</div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.6rem">${hc.desc}</p>
      <div style="font-size:0.8rem; display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; border-top:1px solid var(--border-card); padding-top:0.5rem">
        <div><strong>Porywy max:</strong> ${hc.maxGust}</div>
        <div><strong>Parametr DCP:</strong> ${hc.dcp}</div>
        <div style="grid-column: span 2"><strong>Zasięg i Ścieżka:</strong> ${hc.track}</div>
        <div style="grid-column: span 2; color:var(--text-subtle)"><strong>Skutki:</strong> ${hc.impact}</div>
      </div>
    </div>
  `).join("");
}

// 8. Kalkulatory Na Żywo (Ww, Wmax, LCL, DCP, STP, SCP)
function initLiveCalculators() {
  // A. Kalkulator Wiatru
  const windVal = document.getElementById("calc-wind-val");
  const windUnit = document.getElementById("calc-wind-unit");
  const resKmh = document.getElementById("res-wind-kmh");
  const resMs = document.getElementById("res-wind-ms");
  const resKt = document.getElementById("res-wind-kt");

  function calcWind() {
    let val = parseFloat(windVal.value) || 0;
    let unit = windUnit.value;
    let kmh = 0;

    if (unit === "kmh") kmh = val;
    else if (unit === "ms") kmh = val * 3.6;
    else if (unit === "kt") kmh = val * 1.852;

    if (resKmh) resKmh.textContent = kmh.toFixed(1) + " km/h";
    if (resMs) resMs.textContent = (kmh / 3.6).toFixed(1) + " m/s";
    if (resKt) resKt.textContent = (kmh / 1.852).toFixed(1) + " kt";
  }

  if (windVal && windUnit) {
    windVal.addEventListener("input", calcWind);
    windUnit.addEventListener("change", calcWind);
    calcWind();
  }

  // B. Kalkulator Wmax
  const capeInput = document.getElementById("calc-cape-val");
  const wmaxResult = document.getElementById("res-wmax-val");

  function calcUpdraft() {
    let cape = parseFloat(capeInput.value) || 0;
    let wmax = Math.sqrt(2 * cape);
    let wmaxKmh = wmax * 3.6;

    if (wmaxResult) {
      wmaxResult.textContent = `${wmax.toFixed(1)} m/s (${wmaxKmh.toFixed(0)} km/h)`;
    }
  }

  if (capeInput) {
    capeInput.addEventListener("input", calcUpdraft);
    calcUpdraft();
  }

  // C. Kalkulator LCL
  const tempInput = document.getElementById("calc-lcl-temp");
  const tdInput = document.getElementById("calc-lcl-td");
  const lclResult = document.getElementById("res-lcl-height");

  function calcLCL() {
    let t = parseFloat(tempInput.value) || 0;
    let td = parseFloat(tdInput.value) || 0;
    let height = 125 * (t - td);
    if (height < 0) height = 0;

    if (lclResult) lclResult.textContent = Math.round(height) + " m n.p.g.";
  }

  if (tempInput && tdInput) {
    tempInput.addEventListener("input", calcLCL);
    tdInput.addEventListener("input", calcLCL);
    calcLCL();
  }

  // D. Kalkulator DCP (Derecho Composite Parameter)
  const dcapeIn = document.getElementById("calc-dcp-dcape");
  const mucapeIn = document.getElementById("calc-dcp-mucape");
  const dlsIn = document.getElementById("calc-dcp-dls");
  const meanwindIn = document.getElementById("calc-dcp-meanwind");
  const dcpRes = document.getElementById("res-dcp-val");

  function calcDCP() {
    if (!dcapeIn || !mucapeIn || !dlsIn || !meanwindIn || !dcpRes) return;
    let dcape = parseFloat(dcapeIn.value) || 0;
    let mucape = parseFloat(mucapeIn.value) || 0;
    let dlsKts = (parseFloat(dlsIn.value) || 0) * 1.94384; // m/s to kts
    let meanwindKts = (parseFloat(meanwindIn.value) || 0) * 1.94384;

    let dcp = (dcape / 980) * (mucape / 2000) * (dlsKts / 20) * (meanwindKts / 16);
    dcpRes.textContent = dcp.toFixed(2);
    if (dcp > 2) dcpRes.style.color = "var(--danger)";
    else if (dcp > 1) dcpRes.style.color = "var(--warning)";
    else dcpRes.style.color = "var(--accent)";
  }

  if (dcapeIn) {
    [dcapeIn, mucapeIn, dlsIn, meanwindIn].forEach(el => el.addEventListener("input", calcDCP));
    calcDCP();
  }
}

// 9. Interaktywna Mapa Leaflet
function initLeafletMap() {
  const mapElement = document.getElementById("leaflet-map");
  if (!mapElement || typeof L === "undefined") return;

  const map = L.map("leaflet-map").setView([52.0, 19.5], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors | Sieć Obserwatorów Burz'
  }).addTo(map);

  L.polygon([
    [51.0, 16.5],
    [52.8, 18.2],
    [52.4, 21.0],
    [50.5, 20.0]
  ], {
    color: "#EF4444",
    fillColor: "#EF4444",
    fillOpacity: 0.35,
    weight: 2
  }).addTo(map).bindPopup("<b>Stopień 2 (SOB):</b> Strefa silnych superkomórek burzowych.");

  const points = [
    { lat: 52.23, lon: 21.01, title: "Warszawa", desc: "Stacja Synoptyczna / SOB Center" },
    { lat: 50.06, lon: 19.94, title: "Kraków", desc: "Punkt Obserwacji Aerologicznej" },
    { lat: 51.11, lon: 17.03, title: "Wrocław", desc: "Stacja Aerologiczna 12425" }
  ];

  points.forEach(pt => {
    L.marker([pt.lat, pt.lon])
      .addTo(map)
      .bindPopup(`<b>${pt.title}</b><br>${pt.desc}`);
  });
}

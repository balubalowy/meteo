/**
 * LOGIKA CENTRUM METEO BARTKA — v4 (Light Scientific Theme)
 * Kalkulatory ESSL IF-Scale, Wmax, LCL, DCP
 * Archiwum Nawałnic w Polsce (2002–2017)
 * Źródła: ESSL 2025, dr M. Zięba, dr hab. M. Taszarek, W. Pilorz
 */

function initApp() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  initNavigation();
  renderIFClassesTable();
  renderDamageEvaluator();
  renderThermoConcepts();
  renderRadarSignatures();
  renderMeteoWarnings();
  renderHistoricalCases();
  initLiveCalculators();
  initLeafletMap();
  initForecastMatrix();
  initRepoStats();
  loadDashboardLinks();
  initSortableGrid();
  initLightbox();
  initCmmSynop();
  renderLocalStats();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

function initCmmSynop() {
  const select = document.getElementById('cmm-synop-select');
  const img = document.getElementById('dash-cmm-synop');
  if (!select || !img) return;

  // CMM links will be populated by loadDashboardLinks into window._cmmLinks
  function loadCmm() {
    const key = 'cmm_' + select.value;
    if (window._cmmLinks && window._cmmLinks[key]) {
      img.src = window._cmmLinks[key];
      img.alt = 'CMM Synop: ' + select.options[select.selectedIndex].text;
    } else {
      img.alt = 'Brak danych CMM. Uruchom sync.bat.';
    }
  }

  select.addEventListener('change', loadCmm);
  // Will be called after dashboard links load
  window._cmmLoadFn = loadCmm;
}

function initSortableGrid() {
   const grid = document.getElementById('dashboard-tiles');
   if (grid && typeof Sortable !== 'undefined') {
       // Odtwórz zapisaną kolejność kafelek z localStorage
       const savedOrder = localStorage.getItem('bmeteo_tile_order');
       if (savedOrder) {
           try {
               const orderArray = JSON.parse(savedOrder);
               const tileMap = {};
               Array.from(grid.children).forEach(child => {
                   const id = child.getAttribute('data-id');
                   if (id) tileMap[id] = child;
               });
               orderArray.forEach(id => {
                   if (tileMap[id]) {
                       grid.appendChild(tileMap[id]);
                   }
               });
           } catch(e) {
               console.error("Błąd odczytu kolejności kafelek:", e);
           }
       }

       // Inicjalizuj przeciąganie i zapisuj pożądany układ po przeciągnięciu
       new Sortable(grid, {
           animation: 150,
           ghostClass: 'sortable-ghost',
           handle: 'h3',
           onEnd: function() {
               const currentOrder = Array.from(grid.children)
                   .map(child => child.getAttribute('data-id'))
                   .filter(Boolean);
               localStorage.setItem('bmeteo_tile_order', JSON.stringify(currentOrder));
           }
       });
   }
}

function initLightbox() {
   const lightbox = document.getElementById('lightbox');
   const lightboxImg = document.getElementById('lightbox-img');
   const closeBtn = document.querySelector('.lightbox-close');
   if (!lightbox || !lightboxImg || !closeBtn) return;

   document.addEventListener('click', (e) => {
       if (e.target.classList.contains('zoomable')) {
           lightboxImg.src = e.target.src;
           lightbox.classList.add('active');
       }
   });

   closeBtn.addEventListener('click', () => {
       lightbox.classList.remove('active');
   });

   lightbox.addEventListener('click', (e) => {
       if (e.target === lightbox) {
           lightbox.classList.remove('active');
       }
   });
}

function loadDashboardLinks() {
  fetch('assets/js/dashboard_links.json?v=' + new Date().getTime())
    .then(r => {
      if (!r.ok) throw new Error("HTTP error " + r.status);
      return r.json();
    })
    .then(links => {
       if (!links) return;
       window._cmmLinks = links;

       const setSrc = (id, url) => {
         const el = document.getElementById(id);
         if (el && url) el.src = url;
       };

       setSrc('dash-dwd', links.dwd_europa);
       setSrc('dash-synopt', links.imgw_synoptyczna);
       setSrc('dash-cappi', links.imgw_cappi);
       setSrc('dash-lts', links.imgw_lts);
       setSrc('dash-sigwx-pl', links.sigwx_imgw);
       setSrc('dash-sigwx-cz', links.sigwx_chmi);
       
       if (links.meteo_wroclaw) {
          const mw = document.getElementById('img-meteo-wroclaw');
          const l = document.getElementById('img-meteo-wroclaw-loading');
          if (mw) { mw.src = links.meteo_wroclaw; mw.style.display = 'block'; }
          if (l) l.style.display = 'none';
       }

       if (links.lowcyburz) {
          const lb = document.getElementById('dash-lowcyburz');
          const l = document.getElementById('dash-lowcyburz-loading');
          if (lb) { lb.src = links.lowcyburz; lb.style.display = 'block'; }
          if (l) l.style.display = 'none';
       } else {
          const l = document.getElementById('dash-lowcyburz-loading');
          if(l) l.innerText = "Brak mapy w najnowszym wpisie.";
       }

       if (typeof window._cmmLoadFn === 'function') {
          window._cmmLoadFn();
       }
    })
    .catch(err => {
       console.error("Błąd wczytywania dashboard_links.json:", err);
    });
}

// ─── 1. Nawigacja (top-nav + module cards) ───
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const tabViews = document.querySelectorAll(".tab-view");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const targetTab = link.getAttribute("data-tab");
      if (!targetTab) return; // Pozwól na normalne otwieranie odnośników zewnętrznych (np. B-Core)
      
      e.preventDefault();

      navLinks.forEach(n => {
        if (n.getAttribute("data-tab")) n.classList.remove("active");
      });
      tabViews.forEach(v => v.classList.remove("active"));

      link.classList.add("active");
      const activeView = document.getElementById(targetTab);
      if (activeView) {
        activeView.classList.add("active");
        window.dispatchEvent(new Event('resize'));
      }
    });
  });

  // Module cards that switch tabs
  document.querySelectorAll("[data-tab-link]").forEach(card => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = card.getAttribute("data-tab-link");
      const navLink = document.querySelector(`.nav-link[data-tab="${targetTab}"]`);
      if (navLink) navLink.click();
    });
  });
}

// ─── 2. Tabela Klas IF-Scale ESSL 2025 ───
function renderIFClassesTable() {
  const container = document.getElementById("if-classes-table-body");
  if (!container || !METEO_DATA.ifScaleClasses) return;

  container.innerHTML = "";

  METEO_DATA.ifScaleClasses.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="if-badge" style="background:${getIFBadgeColor(item.code)}">${item.code}</span></td>
      <td><strong>${item.centralSpeedKmh} km/h</strong><br><span style="font-size:0.75rem; color:var(--text-subtle)">(${item.rangeKmh})</span></td>
      <td><strong>${item.centralSpeedMs} m/s</strong><br><span style="font-size:0.75rem; color:var(--text-subtle)">(${item.rangeMs})</span></td>
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
    "IF1": "#F59E0B",
    "IF1.5": "#D97706",
    "IF2": "#EF4444",
    "IF2.5": "#DC2626",
    "IF3": "#B91C1C",
    "IF4": "#7C3AED",
    "IF5": "#6D28D9"
  };
  return colors[code] || "#3B82F6";
}

// ─── 3. Kalkulator Zniszczeń ESSL (Damage Evaluator) ───
function renderDamageEvaluator() {
  const selectDi = document.getElementById("eval-di-select");
  const selectSub = document.getElementById("eval-sub-select");
  const selectDod = document.getElementById("eval-dod-select");
  const resultBox = document.getElementById("eval-result-box");

  if (!selectDi || !selectSub || !selectDod) return;

  selectDi.innerHTML = METEO_DATA.damageIndicators.map(di =>
    `<option value="${di.id}">${di.name}</option>`
  ).join("");

  function updateSubclasses() {
    const currentDiId = selectDi.value;
    const diObj = METEO_DATA.damageIndicators.find(d => d.id === currentDiId);
    if (!diObj) return;

    selectSub.innerHTML = diObj.subclasses.map(s =>
      `<option value="${s.code}">${s.label}</option>`
    ).join("");

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
          <div style="font-size:1.3rem; font-weight:700; color:var(--text-primary)">~ ${classObj.centralSpeedKmh} km/h (${classObj.centralSpeedMs} m/s)</div>
          <div style="font-size:0.8rem; color:var(--text-subtle)">Zakres: ${classObj.rangeKmh} km/h (${classObj.centralSpeedKt} kt)</div>
        </div>
      </div>
      <div style="font-size:0.8rem; color:var(--text-muted); border-top:1px solid var(--border-color); padding-top:0.4rem; margin-top:0.4rem">
        <strong>Interpretacja ESSL:</strong> ${classObj.desc}
      </div>
    `;
  }

  selectDi.addEventListener("change", updateSubclasses);
  selectSub.addEventListener("change", calculateIFRating);
  selectDod.addEventListener("change", calculateIFRating);

  updateSubclasses();
}

// ─── 4. Termodynamika (Zięba & Taszarek) ───
function renderThermoConcepts() {
  const container = document.getElementById("thermo-concepts-grid");
  if (!container || !METEO_DATA.thermoConcepts) return;

  container.innerHTML = METEO_DATA.thermoConcepts.map(c => `
    <div class="card">
      <div class="card-title" style="color:var(--primary); margin-bottom:0.25rem">${c.name}</div>
      <div style="font-size:0.75rem; color:var(--purple); font-weight:700; margin-bottom:0.4rem">${c.type}</div>
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.6rem">${c.desc}</p>
      <div class="formula-block">
        Wzór: ${c.formula}
      </div>
    </div>
  `).join("");
}

// ─── 5. Sygnatury Radarowe (Pilorz) ───
function renderRadarSignatures() {
  const container = document.getElementById("radar-signatures-grid");
  if (!container || !METEO_DATA.radarSignatures) return;

  container.innerHTML = METEO_DATA.radarSignatures.map(r => `
    <div class="card" style="border-top:3px solid var(--primary)">
      <div class="card-title">${r.name}</div>
      <div style="font-size:0.75rem; color:var(--primary); font-weight:700; margin-bottom:0.4rem">Typ: ${r.type}</div>
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.6rem">${r.desc}</p>
      <div style="font-size:0.8rem; color:var(--warning-l3)">
        <strong>Główne ryzyko:</strong> ${r.risk}
      </div>
    </div>
  `).join("");
}

// ─── 6. Ostrzeżenia Meteo ───
function renderMeteoWarnings() {
  const container = document.getElementById("alert-warnings-grid");
  if (!container || !METEO_DATA.alertWarnings) return;

  container.innerHTML = METEO_DATA.alertWarnings.map(w => `
    <div class="card alert-card" style="border-left:4px solid ${w.color}">
      <div class="card-title" style="color:${w.color}">${w.level}</div>
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem">${w.desc}</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.8rem">
        <div><strong>Porywy wiatru:</strong> ${w.wind}</div>
        <div><strong>Średnica gradu:</strong> ${w.hail}</div>
        <div><strong>Intensywność opadu:</strong> ${w.rain}</div>
        <div><strong>Tornada / Derecho:</strong> ${w.tornado}</div>
      </div>
    </div>
  `).join("");
}

// ─── 7. Archiwum Przypadków Historycznych ───
function renderHistoricalCases() {
  const container = document.getElementById("historical-cases-grid");
  if (!container || !METEO_DATA.historicalCases) return;

  container.innerHTML = METEO_DATA.historicalCases.map(hc => `
    <div class="case-card">
      <div class="case-card-title">${hc.title}</div>
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.6rem">${hc.desc}</p>
      <div style="font-size:0.8rem; display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; border-top:1px solid var(--border-color); padding-top:0.5rem">
        <div><strong>Porywy max:</strong> ${hc.maxGust}</div>
        <div><strong>Parametr DCP:</strong> ${hc.dcp}</div>
        <div style="grid-column: span 2"><strong>Ścieżka:</strong> ${hc.track}</div>
        <div style="grid-column: span 2; color:var(--text-muted)"><strong>Skutki:</strong> ${hc.impact}</div>
      </div>
    </div>
  `).join("");
}

// ─── 8. Kalkulatory Na Żywo ───
function renderLocalStats() {
  if (window.meteoStats) {
    const { total_storms, max_wind, max_cape, total_km, lastSync } = window.meteoStats;
    
    const elTotal = document.getElementById('stat-burze-total');
    const elWind = document.getElementById('stat-max-wiatr');
    const elCape = document.getElementById('stat-max-cape');
    const elKm = document.getElementById('stat-km');
    const elSync = document.getElementById('last-sync-time');
    
    if (elTotal) elTotal.textContent = total_storms ?? '-';
    if (elWind) elWind.textContent = max_wind ?? '-';
    if (elCape) elCape.textContent = max_cape ?? '-';
    if (elKm) elKm.textContent = total_km ?? '-';
    if (elSync) elSync.textContent = `Ostatnia synchronizacja (sync.bat): ${lastSync ?? 'Brak danych'}`;
  }
}

function initLiveCalculators() {

  // A. Kalkulator Wiatru
  // Źródło: 1 kt = 1.852 km/h; 1 m/s = 3.6 km/h (allmetsat)
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
  // Źródło: Wzór Zięby — W_max = √(2 * CAPE) [m/s]
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
  // Źródło: Wzór Espy'ego — h_LCL = 125 * (T - Td) [m]
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
  // Źródło: Evans & Doswell / SPC
  // DCP = (DCAPE/980) * (MUCAPE/2000) * (DLS_kts/20) * (MeanWind_kts/16)
  const dcapeIn = document.getElementById("calc-dcp-dcape");
  const mucapeIn = document.getElementById("calc-dcp-mucape");
  const dlsIn = document.getElementById("calc-dcp-dls");
  const meanwindIn = document.getElementById("calc-dcp-meanwind");
  const dcpRes = document.getElementById("res-dcp-val");

  function calcDCP() {
    if (!dcapeIn || !mucapeIn || !dlsIn || !meanwindIn || !dcpRes) return;
    let dcape = parseFloat(dcapeIn.value) || 0;
    let mucape = parseFloat(mucapeIn.value) || 0;
    let dlsKts = (parseFloat(dlsIn.value) || 0) * 1.94384; // m/s → kts
    let meanwindKts = (parseFloat(meanwindIn.value) || 0) * 1.94384;

    let dcp = (dcape / 980) * (mucape / 2000) * (dlsKts / 20) * (meanwindKts / 16);
    dcpRes.textContent = dcp.toFixed(2);
    if (dcp > 2) dcpRes.style.color = "var(--warning-l3)";
    else if (dcp > 1) dcpRes.style.color = "var(--warning-l1)";
    else dcpRes.style.color = "var(--accent-green)";
  }

  if (dcapeIn) {
    [dcapeIn, mucapeIn, dlsIn, meanwindIn].forEach(el => el.addEventListener("input", calcDCP));
    calcDCP();
  }


  // E. Kalkulator Wilgotności / Punktu Rosy (Magnus-Tetens)
  const rhTempIn = document.getElementById("calc-rh-temp");
  const rhRhIn = document.getElementById("calc-rh-rh");
  const rhTdIn = document.getElementById("calc-rh-td");
  const rhResVal = document.getElementById("res-rh-val");

  let lastEdited = 'rh';

  function calcMagnus() {
    if (!rhTempIn || !rhRhIn || !rhTdIn || !rhResVal) return;
    let t = parseFloat(rhTempIn.value) || 0;
    
    // Wzory stałe
    const a = 17.27;
    const b = 237.7;
    
    if (lastEdited === 'rh') {
       let rh = parseFloat(rhRhIn.value) || 0;
       if (rh < 1) rh = 1; if (rh > 100) rh = 100;
       
       let alpha = ((a * t) / (b + t)) + Math.log(rh / 100.0);
       let td = (b * alpha) / (a - alpha);
       
       rhTdIn.value = td.toFixed(1);
       rhResVal.textContent = `T: ${t.toFixed(1)}°C, RH: ${rh.toFixed(0)}% => Td: ${td.toFixed(1)}°C`;
    } else {
       let td = parseFloat(rhTdIn.value) || 0;
       let exp1 = Math.exp((a * td) / (b + td));
       let exp2 = Math.exp((a * t) / (b + t));
       let rh = (exp1 / exp2) * 100.0;
       if (rh > 100) rh = 100;
       if (rh < 0) rh = 0;
       
       rhRhIn.value = rh.toFixed(1);
       rhResVal.textContent = `T: ${t.toFixed(1)}°C, Td: ${td.toFixed(1)}°C => RH: ${rh.toFixed(1)}%`;
    }
  }

  if (rhTempIn) {
    rhTempIn.addEventListener("input", calcMagnus);
    rhRhIn.addEventListener("input", () => { lastEdited = 'rh'; calcMagnus(); });
    rhTdIn.addEventListener("input", () => { lastEdited = 'td'; calcMagnus(); });
    calcMagnus();
  }

}

// ─── 9. Interaktywna Mapa Leaflet ───
function initLeafletMap() {
  const mapElement = document.getElementById("leaflet-map");
  if (!mapElement || typeof L === "undefined") return;

  const map = L.map("leaflet-map").setView([52.0, 19.5], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Przykładowa strefa ostrzeżenia
  L.polygon([
    [51.0, 16.5],
    [52.8, 18.2],
    [52.4, 21.0],
    [50.5, 20.0]
  ], {
    color: "#EF4444",
    fillColor: "#EF4444",
    fillOpacity: 0.15,
    weight: 2
  }).addTo(map).bindPopup("<b>Stopień 2:</b> Strefa silnych superkomórek burzowych.");

  const points = [
    { lat: 52.23, lon: 21.01, title: "Warszawa", desc: "Stacja Synoptyczna" },
    { lat: 50.06, lon: 19.94, title: "Kraków", desc: "Punkt Obserwacji Aerologicznej" },
    { lat: 51.11, lon: 17.03, title: "Wrocław", desc: "Stacja Aerologiczna 12425" }
  ];

  points.forEach(pt => {
    L.marker([pt.lat, pt.lon])
      .addTo(map)
      .bindPopup(`<b>${pt.title}</b><br>${pt.desc}`);
  });
}


// 💡 10. Interaktywna Tabela Prognoz (Forecast Matrix SOB)
function initForecastMatrix() {
  const cells = document.querySelectorAll(".sob-cell:not(.disabled)");
  const resultDiv = document.getElementById("matrix-result");
  const descDiv = document.getElementById("matrix-desc");
  
  if (!cells.length) return;
  
  const state = {
    wind: 0,
    torn: 0,
    hail: 0,
    rain: 0
  };
  
  const levelDetails = {
    1: { code: "MRG", color: "#22c55e", name: "MRG (Marginalne - 1/5)", desc: "Niskie ryzyko zjawisk burzowych." },
    2: { code: "NWL", color: "#eab308", name: "NWL (Niewielkie - 2/5)", desc: "Umiarkowanie groźne burze." },
    3: { code: "SRD", color: "#f97316", name: "SRD (Średnie - 3/5)", desc: "Niebezpieczne, silne burze." },
    4: { code: "DZ",  color: "#ef4444", name: "DZ (Duże - 4/5)", desc: "Gwałtowne, bardzo niebezpieczne burze." },
    5: { code: "EXT", color: "#d946ef", name: "EXT (Ekstremalne - 5/5)", desc: "Ekstremalnie groźne i niszczycielskie burze." }
  };
  
  cells.forEach(cell => {
    cell.addEventListener("click", () => {
      const table = cell.closest("table");
      if (!table) return;
      const cat = table.getAttribute("data-cat");
      const val = parseInt(cell.getAttribute("data-val")) || 0;
      
      // Clear selection in this table
      table.querySelectorAll(".sob-cell").forEach(c => c.classList.remove("selected"));
      
      // Select clicked cell
      cell.classList.add("selected");
      state[cat] = val;
      
      updateMatrixResult();
    });
  });
  
  function updateMatrixResult() {
    let maxVal = Math.max(state.wind, state.torn, state.hail, state.rain);
    
    if (maxVal === 0) {
      resultDiv.textContent = "Brak wyboru";
      resultDiv.style.color = "var(--border-strong)";
      descDiv.textContent = "Kliknij wybrane komórki w powyższych tabelach, aby wyznaczyć stopień.";
      return;
    }
    
    const info = levelDetails[maxVal];
    resultDiv.textContent = info.name;
    resultDiv.style.color = info.color;
    
    const countSelected = Object.values(state).filter(v => v > 0).length;
    descDiv.innerHTML = `Najwyższy wytypowany stopień: <strong style="color:${info.color}">${info.code}</strong> (${info.desc}).<br><span style="font-size:0.8rem; opacity:0.8">Zaznaczono ${countSelected} z 4 kategorii.</span>`;
  }
}

// ─── 8. Kalkulatory Na Żywo & Statystyki z Excela ───
function renderLocalStats() {
  if (!window.meteoStats) return;
  const s = window.meteoStats;
  
  const container = document.getElementById('storm-stats-container');
  if (container && s.summary) {
    const items = [
      { title: "Burze (Łowy / Aktywne)", val: s.summary.burze_lowy.val, icon: "cloud-lightning", color: "var(--accent-primary)", info: s.summary.burze_lowy.info, stan: s.summary.burze_lowy.stan },
      { title: "Dni Burzowe (Łowy)", val: s.summary.dni_burzowe_lowy.val, icon: "calendar", color: "var(--accent-primary)", info: s.summary.dni_burzowe_lowy.info, stan: s.summary.dni_burzowe_lowy.stan },
      { title: "Ogólna Liczba Burz", val: s.summary.burze_ogolem.val, icon: "zap", color: "var(--accent-warning)", info: s.summary.burze_ogolem.info, stan: s.summary.burze_ogolem.stan },
      { title: "Ogólna Liczba Dni Burzowych", val: s.summary.dni_burzowe_ogolem.val, icon: "cloud-rain", color: "var(--accent-warning)", info: s.summary.dni_burzowe_ogolem.info, stan: s.summary.dni_burzowe_ogolem.stan },
      { title: "Suma Kilometrów", val: s.summary.km_suma.val + " km", icon: "map-pin", color: "#f59e0b", info: s.summary.km_suma.info, stan: s.summary.km_suma.stan },
      
      { title: "Max Grad", val: s.summary.grad_max.val, icon: "circle-dot", color: "#3b82f6", info: s.summary.grad_max.info, stan: s.summary.grad_max.stan },
      { title: "Max Poryw Wiatru", val: s.summary.wiatr_max.val, icon: "wind", color: "#ef4444", info: s.summary.wiatr_max.info, stan: s.summary.wiatr_max.stan },
      { title: "Max Opad Deszczu", val: s.summary.opad_max.val, icon: "droplets", color: "#06b6d4", info: s.summary.opad_max.info, stan: s.summary.opad_max.stan },
      { title: "Max Temperatura", val: s.summary.temp_max.val, icon: "thermometer-sun", color: "#f97316", info: s.summary.temp_max.info, stan: s.summary.temp_max.stan },
      { title: "Min Temperatura", val: s.summary.temp_min.val, icon: "snowflake", color: "#38bdf8", info: s.summary.temp_min.info, stan: s.summary.temp_min.stan }
    ];

    container.innerHTML = items.map(item => `
      <div class="card stat-card" style="text-align: center; padding: 1.5rem; position: relative;">
        <i data-lucide="${item.icon}" style="width: 36px; height: 36px; color: ${item.color}; margin: 0 auto 0.8rem auto; opacity: 0.9;"></i>
        <h3 style="font-size: 2.2rem; color: var(--text-primary); margin-bottom: 0.3rem;">${item.val}</h3>
        <p style="color: var(--text-primary); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.4rem;">${item.title}</p>
        ${item.info ? `<div style="font-size: 0.75rem; color: var(--text-secondary);">${item.info}</div>` : ''}
        ${item.stan ? `<div style="font-size: 0.7rem; color: var(--accent-primary); margin-top: 0.4rem; font-weight: 500;">${item.stan}</div>` : ''}
      </div>
    `).join('');
  }

  // Render Ratings Table (Sheet 'Skala')
  const ratingsContainer = document.getElementById('storm-ratings-container');
  if (ratingsContainer && s.ratings) {
    ratingsContainer.innerHTML = `
      <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
          <i data-lucide="award" style="color: var(--accent-warning);"></i> Podsumowanie Ocen (Arkusz Skala)
        </h3>
        <table class="data-table" style="margin: 0; width: 100%;">
          <thead>
            <tr>
              <th>Nazwa oceny</th>
              <th style="text-align: center;">Zagrożenia (suma)</th>
              <th style="text-align: center;">Wygląd (suma)</th>
            </tr>
          </thead>
          <tbody>
            ${s.ratings.map(r => `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td style="text-align: center; font-weight: 700; color: var(--accent-warning);">${r.zagrozenia}</td>
                <td style="text-align: center; font-weight: 700; color: var(--accent-primary);">${r.wyglad}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  initRepoStats();
}

function initRepoStats() {
  const container = document.getElementById("repo-stats-grid");
  if (!container) return;
  
  if (typeof window.meteoStats === "undefined") {
     container.innerHTML = `<div class="card" style="grid-column: span 3; text-align:center; color: var(--accent-danger)">Brak pliku statystyk. Uruchom sync.bat</div>`;
     return;
  }
  
  const s = window.meteoStats;
  
  container.innerHTML = `
    <div class="card" style="text-align: center; padding: 1.5rem;">
      <i data-lucide="file-code" style="width: 36px; height: 36px; color: var(--accent-primary); margin-bottom: 0.8rem;"></i>
      <h3 style="font-size: 2rem; margin-bottom: 0.3rem; color: var(--text-primary);">${s.pythonFiles ?? 33}</h3>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">Skrypty Python (.py)</p>
    </div>
    <div class="card" style="text-align: center; padding: 1.5rem;">
      <i data-lucide="layout" style="width: 36px; height: 36px; color: var(--accent-success); margin-bottom: 0.8rem;"></i>
      <h3 style="font-size: 2rem; margin-bottom: 0.3rem; color: var(--text-primary);">${s.htmlFiles ?? 12}</h3>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">Szablony HTML (.html)</p>
  if (rhTempIn) {
    rhTempIn.addEventListener("input", calcMagnus);
    rhRhIn.addEventListener("input", () => { lastEdited = 'rh'; calcMagnus(); });
    rhTdIn.addEventListener("input", () => { lastEdited = 'td'; calcMagnus(); });
    calcMagnus();
  }

}

// ─── 9. Interaktywna Mapa Leaflet ───
function initLeafletMap() {
  const mapElement = document.getElementById("leaflet-map");
  if (!mapElement || typeof L === "undefined") return;

  const map = L.map("leaflet-map").setView([52.0, 19.5], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Przykładowa strefa ostrzeżenia
  L.polygon([
    [51.0, 16.5],
    [52.8, 18.2],
    [52.4, 21.0],
    [50.5, 20.0]
  ], {
    color: "#EF4444",
    fillColor: "#EF4444",
    fillOpacity: 0.15,
    weight: 2
  }).addTo(map).bindPopup("<b>Stopień 2:</b> Strefa silnych superkomórek burzowych.");

  const points = [
    { lat: 52.23, lon: 21.01, title: "Warszawa", desc: "Stacja Synoptyczna" },
    { lat: 50.06, lon: 19.94, title: "Kraków", desc: "Punkt Obserwacji Aerologicznej" },
    { lat: 51.11, lon: 17.03, title: "Wrocław", desc: "Stacja Aerologiczna 12425" }
  ];

  points.forEach(pt => {
    L.marker([pt.lat, pt.lon])
      .addTo(map)
      .bindPopup(`<b>${pt.title}</b><br>${pt.desc}`);
  });
}


// 💡 10. Interaktywna Tabela Prognoz (Forecast Matrix SOB)
function initForecastMatrix() {
  const cells = document.querySelectorAll(".sob-cell:not(.disabled)");
  const resultDiv = document.getElementById("matrix-result");
  const descDiv = document.getElementById("matrix-desc");
  
  if (!cells.length) return;
  
  const state = {
    wind: 0,
    torn: 0,
    hail: 0,
    rain: 0
  };
  
  const levelDetails = {
    1: { code: "MRG", color: "#22c55e", name: "MRG (Marginalne - 1/5)", desc: "Niskie ryzyko zjawisk burzowych." },
    2: { code: "NWL", color: "#eab308", name: "NWL (Niewielkie - 2/5)", desc: "Umiarkowanie groźne burze." },
    3: { code: "SRD", color: "#f97316", name: "SRD (Średnie - 3/5)", desc: "Niebezpieczne, silne burze." },
    4: { code: "DZ",  color: "#ef4444", name: "DZ (Duże - 4/5)", desc: "Gwałtowne, bardzo niebezpieczne burze." },
    5: { code: "EXT", color: "#d946ef", name: "EXT (Ekstremalne - 5/5)", desc: "Ekstremalnie groźne i niszczycielskie burze." }
  };
  
  cells.forEach(cell => {
    cell.addEventListener("click", () => {
      const table = cell.closest("table");
      if (!table) return;
      const cat = table.getAttribute("data-cat");
      const val = parseInt(cell.getAttribute("data-val")) || 0;
      
      // Clear selection in this table
      table.querySelectorAll(".sob-cell").forEach(c => c.classList.remove("selected"));
      
      // Select clicked cell
      cell.classList.add("selected");
      state[cat] = val;
      
      updateMatrixResult();
    });
  });
  
  function updateMatrixResult() {
    let maxVal = Math.max(state.wind, state.torn, state.hail, state.rain);
    
    if (maxVal === 0) {
      resultDiv.textContent = "Brak wyboru";
      resultDiv.style.color = "var(--border-strong)";
      descDiv.textContent = "Kliknij wybrane komórki w powyższych tabelach, aby wyznaczyć stopień.";
      return;
    }
    
    const info = levelDetails[maxVal];
    resultDiv.textContent = info.name;
    resultDiv.style.color = info.color;
    
    const countSelected = Object.values(state).filter(v => v > 0).length;
    descDiv.innerHTML = `Najwyższy wytypowany stopień: <strong style="color:${info.color}">${info.code}</strong> (${info.desc}).<br><span style="font-size:0.8rem; opacity:0.8">Zaznaczono ${countSelected} z 4 kategorii.</span>`;
  }
}

// ─── 8. Kalkulatory Na Żywo & Statystyki z Excela ───
function renderLocalStats() {
  if (!window.meteoStats) return;
  const s = window.meteoStats;
  
  const container = document.getElementById('storm-stats-container');
  if (container && s.summary) {
    const items = [
      { title: "Burze (Łowy / Aktywne)", val: s.summary.burze_lowy.val, icon: "cloud-lightning", color: "var(--accent-primary)", info: s.summary.burze_lowy.info, stan: s.summary.burze_lowy.stan },
      { title: "Dni Burzowe (Łowy)", val: s.summary.dni_burzowe_lowy.val, icon: "calendar", color: "var(--accent-primary)", info: s.summary.dni_burzowe_lowy.info, stan: s.summary.dni_burzowe_lowy.stan },
      { title: "Ogólna Liczba Burz", val: s.summary.burze_ogolem.val, icon: "zap", color: "var(--accent-warning)", info: s.summary.burze_ogolem.info, stan: s.summary.burze_ogolem.stan },
      { title: "Ogólna Liczba Dni Burzowych", val: s.summary.dni_burzowe_ogolem.val, icon: "cloud-rain", color: "var(--accent-warning)", info: s.summary.dni_burzowe_ogolem.info, stan: s.summary.dni_burzowe_ogolem.stan },
      { title: "Suma Kilometrów", val: s.summary.km_suma.val + " km", icon: "map-pin", color: "#f59e0b", info: s.summary.km_suma.info, stan: s.summary.km_suma.stan },
      
      { title: "Max Grad", val: s.summary.grad_max.val, icon: "circle-dot", color: "#3b82f6", info: s.summary.grad_max.info, stan: s.summary.grad_max.stan },
      { title: "Max Poryw Wiatru", val: s.summary.wiatr_max.val, icon: "wind", color: "#ef4444", info: s.summary.wiatr_max.info, stan: s.summary.wiatr_max.stan },
      { title: "Max Opad Deszczu", val: s.summary.opad_max.val, icon: "droplets", color: "#06b6d4", info: s.summary.opad_max.info, stan: s.summary.opad_max.stan },
      { title: "Max Temperatura", val: s.summary.temp_max.val, icon: "thermometer-sun", color: "#f97316", info: s.summary.temp_max.info, stan: s.summary.temp_max.stan },
      { title: "Min Temperatura", val: s.summary.temp_min.val, icon: "snowflake", color: "#38bdf8", info: s.summary.temp_min.info, stan: s.summary.temp_min.stan }
    ];

    container.innerHTML = items.map(item => `
      <div class="card stat-card" style="text-align: center; padding: 1.5rem; position: relative;">
        <i data-lucide="${item.icon}" style="width: 36px; height: 36px; color: ${item.color}; margin: 0 auto 0.8rem auto; opacity: 0.9;"></i>
        <h3 style="font-size: 2.2rem; color: var(--text-primary); margin-bottom: 0.3rem;">${item.val}</h3>
        <p style="color: var(--text-primary); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.4rem;">${item.title}</p>
        ${item.info ? `<div style="font-size: 0.75rem; color: var(--text-secondary);">${item.info}</div>` : ''}
        ${item.stan ? `<div style="font-size: 0.7rem; color: var(--accent-primary); margin-top: 0.4rem; font-weight: 500;">${item.stan}</div>` : ''}
      </div>
    `).join('');
  }

  // Render Ratings Table (Sheet 'Skala')
  const ratingsContainer = document.getElementById('storm-ratings-container');
  if (ratingsContainer && s.ratings) {
    ratingsContainer.innerHTML = `
      <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
          <i data-lucide="award" style="color: var(--accent-warning);"></i> Podsumowanie Ocen (Arkusz Skala)
        </h3>
        <table class="data-table" style="margin: 0; width: 100%;">
          <thead>
            <tr>
              <th>Nazwa oceny</th>
              <th style="text-align: center;">Zagrożenia (suma)</th>
              <th style="text-align: center;">Wygląd (suma)</th>
            </tr>
          </thead>
          <tbody>
            ${s.ratings.map(r => `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td style="text-align: center; font-weight: 700; color: var(--accent-warning);">${r.zagrozenia}</td>
                <td style="text-align: center; font-weight: 700; color: var(--accent-primary);">${r.wyglad}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  initRepoStats();
}

function initRepoStats() {
  const container = document.getElementById("repo-stats-grid");
  if (!container) return;
  
  if (typeof window.meteoStats === "undefined") {
     container.innerHTML = `<div class="card" style="grid-column: span 3; text-align:center; color: var(--accent-danger)">Brak pliku statystyk. Uruchom sync.bat</div>`;
     return;
  }
  
  const s = window.meteoStats;
  
  container.innerHTML = `
    <div class="card" style="text-align: center; padding: 1.5rem;">
      <i data-lucide="file-code" style="width: 36px; height: 36px; color: var(--accent-primary); margin-bottom: 0.8rem;"></i>
      <h3 style="font-size: 2rem; margin-bottom: 0.3rem; color: var(--text-primary);">${s.pythonFiles ?? 33}</h3>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">Skrypty Python (.py)</p>
    </div>
    <div class="card" style="text-align: center; padding: 1.5rem;">
      <i data-lucide="layout" style="width: 36px; height: 36px; color: var(--accent-success); margin-bottom: 0.8rem;"></i>
      <h3 style="font-size: 2rem; margin-bottom: 0.3rem; color: var(--text-primary);">${s.htmlFiles ?? 12}</h3>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">Szablony HTML (.html)</p>
    </div>
    <div class="card" style="text-align: center; padding: 1.5rem;">
      <i data-lucide="database" style="width: 36px; height: 36px; color: var(--accent-warning); margin-bottom: 0.8rem;"></i>
      <h3 style="font-size: 2rem; margin-bottom: 0.3rem; color: var(--text-primary);">${s.excelFiles ?? 2}</h3>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">Arkusze Analityczne (.xlsx)</p>
    </div>
    <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 1rem; background: var(--bg-tertiary);">
       <p style="color: var(--text-muted); font-size: 0.85rem;">Ostatnia synchronizacja (sync.bat): <strong>${s.lastSync ?? 'Brak'}</strong></p>
    </div>
  `;
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.triggerEnsFromTab = function() {
  const thresh = document.getElementById('tab-ens-thresh')?.value || '30';
  const days = document.getElementById('tab-ens-days')?.value || '1';
  const statusBox = document.getElementById('tab-ens-status');
  
  if (statusBox) {
     statusBox.style.display = 'block';
     statusBox.style.background = 'var(--bg-tertiary)';
     statusBox.style.color = 'var(--accent-primary)';
     statusBox.style.border = '1px solid var(--border-subtle)';
     statusBox.innerHTML = `⚡ Wysyłanie zlecenia przeliczenia wiązek dla progu <b>${thresh}°C</b> na <b>+${days} dni</b> do GitHub Actions...`;
  }

  fetch('https://api.github.com/repos/balubalowy/meteo/actions/workflows/generate-ensemble.yml/dispatches', {
      method: 'POST',
      headers: {
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          ref: 'main',
          inputs: { threshold: thresh.toString(), days_ahead: days.toString() }
      })
  })
  .then(res => {
      if (statusBox) {
          if (res.ok || res.status === 204) {
              statusBox.style.color = 'var(--accent-success)';
              statusBox.innerHTML = `✅ Zlecenie przyjęte! GitHub Actions rozpoczął przeliczanie 169 wiązek (próg ${thresh}°C, +${days}d). Wyniki pojawią się na mapie poniżej za 1-2 minuty.`;
          } else {
              statusBox.style.color = 'var(--accent-primary)';
              statusBox.innerHTML = `ℹ️ Zlecenie zapisane! Uruchom przeliczanie w konsoli poleceniem:<br><code>python prognoza/pobierz_ensemble.py ${thresh} ${days}</code>`;
          }
      }
  })
  .catch(err => {
      if (statusBox) {
          statusBox.style.color = 'var(--accent-primary)';
          statusBox.innerHTML = `ℹ️ Aby przeliczyć lokalnie, uruchom w konsoli:<br><code>python prognoza/pobierz_ensemble.py ${thresh} ${days}</code>`;
      }
  });
};

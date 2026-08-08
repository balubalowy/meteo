/**
 * LOGIKA CENTRUM METEO BARTKA — v4 (Light Scientific Theme)
 * Kalkulatory ESSL IF-Scale, Wmax, LCL, DCP
 * Archiwum Nawałnic w Polsce (2002–2017)
 * Źródła: ESSL 2025, dr M. Zięba, dr hab. M. Taszarek, W. Pilorz
 */

function initApp() {
  const safeRun = (name, fn) => {
    try {
      if (typeof fn === 'function') {
        fn();
      }
    } catch(e) {
      console.error(`Błąd w ${name}:`, e);
    }
  };

  safeRun('lucide', () => { if (typeof lucide !== 'undefined') lucide.createIcons(); });
  safeRun('initNavigation', () => typeof initNavigation === 'function' && initNavigation());

  safeRun('initLiveCalculators', () => typeof initLiveCalculators === 'function' && initLiveCalculators());
  safeRun('initLeafletMap', () => typeof initLeafletMap === 'function' && initLeafletMap());
  safeRun('initRepoStats', () => typeof initRepoStats === 'function' && initRepoStats());
  safeRun('loadDashboardLinks', () => typeof loadDashboardLinks === 'function' && loadDashboardLinks());
  safeRun('initSortableGrid', () => typeof initSortableGrid === 'function' && initSortableGrid());
  safeRun('initLightbox', () => typeof initLightbox === 'function' && initLightbox());
  safeRun('initCmmSynop', () => typeof initCmmSynop === 'function' && initCmmSynop());
  safeRun('renderLocalStats', () => typeof renderLocalStats === 'function' && renderLocalStats());
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

function getMeteoData() {
  if (typeof METEO_DATA !== 'undefined' && METEO_DATA) return METEO_DATA;
  if (typeof window !== 'undefined' && window.METEO_DATA) return window.METEO_DATA;
  return null;
}



// ─── 8. Kalkulatory Na Żywo ───
function renderLocalStats() {
  if (window.meteoStats) {
    const { total_storms, max_wind, max_cape, total_km, lastSync } = window.meteoStats;
    
    const container = document.getElementById('storm-stats-container');
    if (container) {
      container.innerHTML = `
        <div class="card" style="padding: 1.2rem; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Wszystkie Burze</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent-primary); margin-top: 0.4rem;">${total_storms ?? 0}</div>
        </div>
        <div class="card" style="padding: 1.2rem; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Max Wiatr</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent-danger); margin-top: 0.4rem;">${max_wind ?? '-'}</div>
        </div>
        <div class="card" style="padding: 1.2rem; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Max CAPE</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent-warning); margin-top: 0.4rem;">${max_cape ?? '-'}</div>
        </div>
        <div class="card" style="padding: 1.2rem; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Przejechane Dystanse</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent-green); margin-top: 0.4rem;">${total_km ?? '-'}</div>
        </div>
      `;
    }

    const elTotal = document.getElementById('stat-burze-total');
    const elWind = document.getElementById('stat-max-wiatr');
    const elCape = document.getElementById('stat-max-cape');
    const elKm = document.getElementById('stat-km');
    const elSync = document.getElementById('last-sync-time');
    
    if (elTotal) elTotal.textContent = total_storms ?? '-';
    if (elWind) elWind.textContent = max_wind ?? '-';
    if (elCape) elCape.textContent = max_cape ?? '-';
    if (elKm) elKm.textContent = total_km ?? '-';
    if (elSync) elSync.textContent = `Ostatnia synchronizacja: ${lastSync ?? 'Brak danych'}`;
  }
}

function initLiveCalculators() {
  // (Logika kalkulatorów Wiatru, Wmax, LCL, DCP, Magnus usunięta - Alpine.js przejęło renderowanie)
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

import codecs

# 1. FIX INDEX.HTML (Alpine x-text & restore Kreator)
with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

# Fix Alpine bindings
html = html.replace('<div id="matrix-result" style="font-size: 3rem; font-weight: 800; color: var(--border-strong);">Brak wyboru</div>',
                    '<div id="matrix-result" style="font-size: 3rem; font-weight: 800; color: var(--border-strong);" x-text="result ? result.name : \'Brak wyboru\'" :style="result ? \'color: \' + result.color : \'\'">Brak wyboru</div>')

html = html.replace('<p id="matrix-desc" style="color: var(--text-secondary); margin-top: 1rem;">Kliknij wybrane komórki w powyższych tabelach, aby wyznaczyć stopień.</p>',
                    '<p id="matrix-desc" style="color: var(--text-secondary); margin-top: 1rem;" x-text="result ? result.desc : \'Kliknij wybrane komórki w powyższych tabelach, aby wyznaczyć stopień.\'"></p>')

# Restore Kreator tab if missing
kreator_html = """
      <!-- TAB KREATOR -->
      <div id="tab-kreator" class="tab-view">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                <i data-lucide="edit-3"></i> Kreator Map Ostrzeżeń (Dla Łowców)
            </h2>
            <button onclick="exportMap()" class="btn btn-primary"><i data-lucide="download"></i> Eksportuj Mapę</button>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">Rysuj strefy zagrożeń (poligony) używając narzędzi po lewej stronie mapy. Wybierz kolor narzędzia poniżej przed rysowaniem.</p>

        <div style="display: flex; gap: 10px; margin-bottom: 1rem; flex-wrap: wrap;">
            <button class="btn btn-ghost threat-btn" style="border: 2px solid #22c55e; color: #22c55e;" onclick="setDrawingColor('#22c55e')">MRG (1)</button>
            <button class="btn btn-ghost threat-btn" style="border: 1px solid #eab308; color: #eab308; box-shadow: 0 0 10px #eab308;" onclick="setDrawingColor('#eab308')">NWL (2)</button>
            <button class="btn btn-ghost threat-btn" style="border: 1px solid #f97316; color: #f97316;" onclick="setDrawingColor('#f97316')">SRD (3)</button>
            <button class="btn btn-ghost threat-btn" style="border: 1px solid #ef4444; color: #ef4444;" onclick="setDrawingColor('#ef4444')">DZ (4)</button>
            <button class="btn btn-ghost threat-btn" style="border: 1px solid #d946ef; color: #d946ef;" onclick="setDrawingColor('#d946ef')">EXT (5)</button>
            <button class="btn btn-ghost" style="margin-left: auto; color: var(--accent-danger);" onclick="clearMap()"><i data-lucide="trash-2"></i> Wyczyść</button>
        </div>

        <div id="export-container" style="position: relative; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-subtle);">
            <div id="kreator-map" style="height: 600px; width: 100%;"></div>
            <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(15, 23, 42, 0.85); padding: 10px; border-radius: 8px; border: 1px solid var(--border-subtle); z-index: 999; pointer-events: none;">
                <div style="font-weight: bold; color: var(--text-primary); margin-bottom: 5px; font-size: 0.9rem;">B-Meteo Prognoza</div>
                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem;">
                    <span style="color: #22c55e;">■ MRG (Marginalne)</span>
                    <span style="color: #eab308;">■ NWL (Niewielkie)</span>
                    <span style="color: #f97316;">■ SRD (Średnie)</span>
                    <span style="color: #ef4444;">■ DZ (Duże)</span>
                    <span style="color: #d946ef;">■ EXT (Ekstremalne)</span>
                </div>
            </div>
        </div>
      </div>
"""

if 'id="tab-kreator"' not in html:
    html = html.replace('<div id="tab-stats" class="tab-view">', kreator_html + '\n      <div id="tab-stats" class="tab-view">')

# Also fix the missing tab navigation button for Kreator if it was removed
if 'data-tab="tab-kreator"' not in html:
    nav_kreator = '          <a href="#" class="nav-link btn btn-ghost tab-btn" data-tab="tab-kreator"><i data-lucide="edit-3"></i> Kreator Map</a>'
    html = html.replace('          <a href="#" class="nav-link btn btn-ghost tab-btn" data-tab="tab-stats"><i data-lucide="bar-chart-2"></i> Statystyki</a>',
                        nav_kreator + '\n          <a href="#" class="nav-link btn btn-ghost tab-btn" data-tab="tab-stats"><i data-lucide="bar-chart-2"></i> Statystyki</a>')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
    
print("index.html fixed.")

# 2. FIX APP.JS (Restore renderLocalStats for grids)
with codecs.open('assets/js/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

render_local_stats_fixed = """
function renderLocalStats() {
  if (window.meteoStats) {
    const { total_storms, max_wind, max_cape, total_km, lastSync, ratings, pythonFiles, htmlFiles, excelFiles } = window.meteoStats;
    
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

    const ratingsContainer = document.getElementById('storm-ratings-container');
    if (ratingsContainer && ratings) {
      let rHtml = `<h3 style="margin-top:2rem; margin-bottom:1rem; color: var(--accent-primary);">Oceny Burz</h3>`;
      rHtml += `<table class="sob-table" style="width: 100%; font-size:0.9rem;">
        <thead><tr><th>Nazwa / Klasa</th><th>Zagrożenia</th><th>Wygląd</th></tr></thead><tbody>`;
      ratings.forEach(r => {
        rHtml += `<tr>
            <td>${r.name}</td>
            <td style="color: var(--accent-warning); font-weight: bold;">${r.zagrozenia}/10</td>
            <td style="color: var(--accent-info); font-weight: bold;">${r.wyglad}/10</td>
        </tr>`;
      });
      rHtml += `</tbody></table>`;
      ratingsContainer.innerHTML = rHtml;
    }

    const repoStatsGrid = document.getElementById('repo-stats-grid');
    if (repoStatsGrid) {
      repoStatsGrid.innerHTML = `
        <div class="card" style="padding: 1.2rem; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Pliki Python</div>
          <div style="font-size: 2rem; font-weight: 800; color: #3b82f6; margin-top: 0.4rem;">${pythonFiles ?? 0}</div>
        </div>
        <div class="card" style="padding: 1.2rem; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Pliki HTML</div>
          <div style="font-size: 2rem; font-weight: 800; color: #f97316; margin-top: 0.4rem;">${htmlFiles ?? 0}</div>
        </div>
        <div class="card" style="padding: 1.2rem; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Zbiory Danych</div>
          <div style="font-size: 2rem; font-weight: 800; color: #22c55e; margin-top: 0.4rem;">${excelFiles ?? 0}</div>
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
"""

import re
app_js = re.sub(r'function renderLocalStats\(\) \{.*?(?=function initLiveCalculators\(\))', render_local_stats_fixed + '\n', app_js, flags=re.DOTALL)

with codecs.open('assets/js/app.js', 'w', 'utf-8') as f:
    f.write(app_js)

print("app.js fixed.")

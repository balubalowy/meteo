import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Libraries to <head>
# Need to check if html2canvas or geoman is already there. If not, add before </head>
libs = '''
    <!-- Kreator Map -->
    <link rel="stylesheet" href="https://unpkg.com/@geoman-io/leaflet-geoman-free@latest/dist/leaflet-geoman.css" />
    <script src="https://unpkg.com/@geoman-io/leaflet-geoman-free@latest/dist/leaflet-geoman.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
'''
if 'leaflet-geoman.css' not in html:
    html = html.replace('</head>', libs + '\n</head>')

# 2. Add Tab Button to Navigation
nav_btn = '<a href="#" class="nav-link btn btn-ghost tab-btn" data-tab="tab-kreator"><i data-lucide="edit-3"></i> Kreator</a>'
if 'data-tab="tab-kreator"' not in html:
    # Insert before `<a href="https://balubalowy.github.io/system/"`
    html = html.replace('<a href="https://balubalowy.github.io/system/"', nav_btn + '\n          <a href="https://balubalowy.github.io/system/"')

# 3. Add Tab Content
kreator_tab = '''
      <div id="tab-kreator" class="tab-view">
         <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px;"><i data-lucide="edit-3"></i> Kreator Prognoz i Ostrzeżeń</h2>
         <div class="kreator-container" style="display: flex; gap: 1rem; height: 75vh;">
            
            <div class="kreator-sidebar card" style="width: 250px; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; z-index: 10;">
               <h3 style="font-size: 1.1rem; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">Narzędzia i Kolory</h3>
               
               <div class="color-picker">
                  <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Wybierz Stopień (Zdefiniuje Pędzel):</p>
                  
                  <button class="btn threat-btn" style="width: 100%; text-align: left; background: rgba(59,130,246,0.1); border: 1px solid #3b82f6; color: #3b82f6;" onclick="setDrawingColor('#3b82f6')">
                     <span style="display:inline-block;width:12px;height:12px;background:#3b82f6;border-radius:50%;margin-right:5px;"></span> MRG / Burze
                  </button>
                  
                  <button class="btn threat-btn" style="width: 100%; text-align: left; background: rgba(251,191,36,0.1); border: 1px solid #fbbf24; color: #fbbf24; margin-top:0.5rem;" onclick="setDrawingColor('#fbbf24')">
                     <span style="display:inline-block;width:12px;height:12px;background:#fbbf24;border-radius:50%;margin-right:5px;"></span> 1 Stopień
                  </button>

                  <button class="btn threat-btn" style="width: 100%; text-align: left; background: rgba(245,158,11,0.1); border: 1px solid #f59e0b; color: #f59e0b; margin-top:0.5rem;" onclick="setDrawingColor('#f59e0b')">
                     <span style="display:inline-block;width:12px;height:12px;background:#f59e0b;border-radius:50%;margin-right:5px;"></span> 2 Stopień
                  </button>

                  <button class="btn threat-btn" style="width: 100%; text-align: left; background: rgba(239,68,68,0.1); border: 1px solid #ef4444; color: #ef4444; margin-top:0.5rem;" onclick="setDrawingColor('#ef4444')">
                     <span style="display:inline-block;width:12px;height:12px;background:#ef4444;border-radius:50%;margin-right:5px;"></span> 3 Stopień
                  </button>

                  <button class="btn threat-btn" style="width: 100%; text-align: left; background: rgba(139,92,246,0.1); border: 1px solid #8b5cf6; color: #8b5cf6; margin-top:0.5rem;" onclick="setDrawingColor('#8b5cf6')">
                     <span style="display:inline-block;width:12px;height:12px;background:#8b5cf6;border-radius:50%;margin-right:5px;"></span> NW / EXTREME
                  </button>
               </div>

               <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-top: 0.5rem;">
                 Wybierz kolor powyżej, a następnie użyj paska narzędzi na mapie, aby narysować obszar (poligon). Możesz rysować wielokrotnie i dowolnie nachodzić na siebie.
               </p>
               
               <div style="margin-top: auto; display:flex; flex-direction: column; gap: 0.5rem;">
                  <button class="btn btn-primary" style="width: 100%; justify-content:center;" onclick="exportMap()">
                     <i data-lucide="download"></i> Zapisz Prognozę
                  </button>
                  <button class="btn btn-ghost" style="width: 100%; justify-content:center; color: var(--danger);" onclick="clearMap()">
                     <i data-lucide="trash-2"></i> Wyczyść Mapę
                  </button>
               </div>
            </div>
            
            <div class="card" style="flex: 1; position: relative; border-radius: var(--radius-sm); padding: 0; overflow: hidden;" id="export-container">
               <div id="kreator-map" style="width: 100%; height: 100%; z-index: 1;"></div>
               <div id="map-watermark" style="position: absolute; bottom: 15px; right: 15px; z-index: 1000; background: rgba(15,23,42,0.8); color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; border-left: 3px solid var(--accent-primary); pointer-events: none; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                  B-Meteo Forecast
               </div>
            </div>
         </div>
      </div>
'''
if 'id="tab-kreator"' not in html:
    # Insert right before </div><!-- Main Content End -->
    # The last tab is tab-stacje
    insert_point = '</div>\n  </div>\n  \n  <!-- Zewnętrzne pliki JS -->'
    if insert_point in html:
        html = html.replace(insert_point, '</div>\n' + kreator_tab + '\n  </div>\n  \n  <!-- Zewnętrzne pliki JS -->')
    else:
        # Fallback regex
        html = re.sub(r'(</div>\s*</div>\s*<!-- Zewnętrzne pliki JS -->)', r'</div>\n' + kreator_tab + r'\n\1', html)

# 4. Add the JavaScript logic for the Kreator map
kreator_js = '''
<script>
  let kMap = null;
  let currentColor = '#fbbf24';

  function initKreator() {
      if(kMap) return; // already initialized
      // Dark map from CartoDB
      kMap = L.map('kreator-map').setView([52.069, 19.480], 6);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
      }).addTo(kMap);

      // Add Polish borders (GeoJSON) - we will fetch a simple border from a public repo if possible, or just use the base map.
      // The CartoDB Dark map shows borders nicely anyway.

      // Add Geoman controls
      kMap.pm.addControls({
          position: 'topleft',
          drawMarker: false,
          drawCircleMarker: false,
          drawPolyline: false,
          drawRectangle: false,
          drawPolygon: true,
          drawCircle: false,
          editMode: true,
          dragMode: true,
          cutPolygon: false,
          removalMode: true,
      });

      // Global Path Options
      kMap.pm.setPathOptions({
          color: currentColor,
          fillColor: currentColor,
          fillOpacity: 0.4,
          weight: 2
      });

      // Update options on draw start
      kMap.on('pm:drawstart', (e) => {
          kMap.pm.setPathOptions({
              color: currentColor,
              fillColor: currentColor,
              fillOpacity: 0.4,
              weight: 2
          });
      });
  }

  function setDrawingColor(color) {
      currentColor = color;
      if (kMap) {
          kMap.pm.setPathOptions({
              color: currentColor,
              fillColor: currentColor,
              fillOpacity: 0.4,
              weight: 2
          });
      }
      
      // Highlight selected button
      const btns = document.querySelectorAll('.threat-btn');
      btns.forEach(b => {
          b.style.boxShadow = 'none';
          b.style.borderWidth = '1px';
      });
      event.currentTarget.style.boxShadow = '0 0 10px ' + color;
      event.currentTarget.style.borderWidth = '2px';
  }

  function clearMap() {
      if(!kMap) return;
      if(confirm('Na pewno wyczyścić całą mapę?')) {
          kMap.eachLayer(function(layer){
              // Do not remove the tile layer
              if(layer instanceof L.Path) {
                  kMap.removeLayer(layer);
              }
          });
      }
  }

  function exportMap() {
      const container = document.getElementById('export-container');
      
      // Temporarily hide Leaflet controls for cleaner export
      const controls = document.querySelector('.leaflet-control-container');
      if (controls) controls.style.display = 'none';

      html2canvas(container, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#0f172a'
      }).then(canvas => {
          // Show controls again
          if (controls) controls.style.display = 'block';

          // Trigger download
          const link = document.createElement('a');
          link.download = 'b-meteo-forecast.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
      });
  }

  // Hook into the tab switcher to init map when the Kreator tab is opened
  document.addEventListener('DOMContentLoaded', () => {
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
              const tabId = e.currentTarget.getAttribute('data-tab');
              if (tabId === 'tab-kreator') {
                  setTimeout(() => {
                      initKreator();
                      if(kMap) kMap.invalidateSize(); // Fix map rendering issues when hidden
                  }, 100);
              }
          });
      });
  });
</script>
'''
if 'initKreator()' not in html:
    html = html.replace('</body>', kreator_js + '\n</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

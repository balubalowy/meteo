import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. FIX BACKGROUNDS
html = html.replace('alt="Zagrożenia" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-tertiary);"', 'alt="Zagrożenia" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: #ffffff;"')
html = html.replace('alt="Mapa Burzowa" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-tertiary);"', 'alt="Mapa Burzowa" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: #ffffff;"')

# 2. ADD CMM OPTIONS
cmm_select_new = '''<select id="cmm-synop-select" class="form-select" style="width: auto; padding: 2px 6px; font-size: 0.75rem;">
                <option value="temp">Temperatura</option>
                <option value="temp_min">Temp. Min</option>
                <option value="temp_max">Temp. Max</option>
                <option value="temp_grunt">Temp. Grunt</option>
                <option value="temp_odcz">Temp. Odczuw.</option>
                <option value="temp_srednia">Temp. Średnia</option>
                <option value="opad">Opad 24h</option>
                <option value="wiatr">Wiatr</option>
                <option value="poryw">Wiatr porywy</option>
                <option value="wilgotnosc">Wilgotność</option>
                <option value="cisnienie">Ciśnienie</option>
                <option value="cisn_zmiana">Zmiana ciśnienia</option>
                <option value="zachmurzenie">Zachmurzenie</option>
                <option value="widzialnosc">Widzialność</option>
                <option value="uslonecznienie">Usłonecznienie</option>
                <option value="podstawa">Podstawa chmur</option>
              </select>'''
html = re.sub(r'<select id="cmm-synop-select".*?</select>', cmm_select_new, html, flags=re.DOTALL)

# 3. REPLACE CMM IMG WITH FALLBACK STRUCTURE
img_regex = r'<img id="dash-cmm-synop".*?>'
img_replacement = '''
            <div id="cmm-map-container" style="position: relative; width: 100%; min-height: 300px; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-tertiary);">
              <img id="dash-cmm-synop" class="zoomable" src="https://danepubliczne.imgw.pl/datastore/getfiledown/Oper/CMM_mapy/synop/TEMPERATURA_2026080808.png" alt="CMM Synop" style="width: 100%; display: block;" onerror="fallbackCmmMap()">
              <div id="cmm-leaflet-map" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;"></div>
              <div id="cmm-map-loading" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; z-index: 20; font-weight: bold; background: rgba(0,0,0,0.7); padding: 5px 10px; border-radius: 4px;">Pobieranie API...</div>
            </div>
'''
if 'fallbackCmmMap' not in html:
    html = re.sub(img_regex, img_replacement, html, count=1)

# 4. APPEND SCRIPT
script_code = '''
<!-- FALLBACK CMM API SCRIPT -->
<script>
  let cmmMapInstance = null;
  let cmmMeteoDataCache = null;
  let cmmSynopDataCache = null;

  window.fallbackCmmMap = function() {
    console.log("Obraz CMM niedostępny. Fallback do API IMGW...");
    const imgEl = document.getElementById('dash-cmm-synop');
    if(imgEl) imgEl.style.display = 'none';
    
    document.getElementById('cmm-leaflet-map').style.display = 'block';
    document.getElementById('cmm-map-loading').style.display = 'block';

    if (!cmmMapInstance) {
      cmmMapInstance = L.map('cmm-leaflet-map').setView([52.0, 19.2], 6);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB | API IMGW'
      }).addTo(cmmMapInstance);
      setTimeout(() => { cmmMapInstance.invalidateSize(); }, 100);
    }
    
    if (cmmMeteoDataCache && cmmSynopDataCache) {
        document.getElementById('cmm-map-loading').style.display = 'none';
        renderCmmMapData();
        return;
    }

    Promise.all([
      fetch('https://danepubliczne.imgw.pl/api/data/meteo/').then(r => r.json()).catch(() => []),
      fetch('https://danepubliczne.imgw.pl/api/data/synop').then(r => r.json()).catch(() => [])
    ]).then(([meteo, synop]) => {
      document.getElementById('cmm-map-loading').style.display = 'none';
      cmmMeteoDataCache = meteo;
      cmmSynopDataCache = synop;
      renderCmmMapData();
    });
  };

  window.renderCmmMapData = function() {
    if (!cmmMapInstance || !cmmMeteoDataCache) return;
    
    cmmMapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        cmmMapInstance.removeLayer(layer);
      }
    });

    const param = document.getElementById('cmm-synop-select').value;
    
    const coords = {};
    cmmMeteoDataCache.forEach(m => {
      if(m.nazwa_stacji && m.lat && m.lon) {
         let nazwa = m.nazwa_stacji.toUpperCase();
         coords[nazwa] = { lat: parseFloat(m.lat), lon: parseFloat(m.lon) };
      }
    });

    const mergedData = [];
    if(cmmSynopDataCache) {
      cmmSynopDataCache.forEach(s => {
        let nazwa = s.stacja ? s.stacja.toUpperCase() : "";
        if (coords[nazwa]) {
          mergedData.push({
            nazwa: s.stacja,
            lat: coords[nazwa].lat,
            lon: coords[nazwa].lon,
            temp: parseFloat(s.temperatura),
            wiatr: parseFloat(s.predkosc_wiatru),
            cisnienie: parseFloat(s.cisnienie),
            opad: parseFloat(s.suma_opadu),
            wilgotnosc: parseFloat(s.wilgotnosc_wzgledna)
          });
        }
      });
    }

    mergedData.forEach(st => {
      let val = null;
      let suffix = '';
      let color = '#3b82f6';
      
      if (param.includes('temp')) { val = st.temp; suffix = '°C'; color = val >= 20 ? '#ef4444' : (val < 10 ? '#3b82f6' : '#eab308'); }
      else if (param.includes('wiatr') || param === 'poryw') { val = st.wiatr; suffix = ' m/s'; color = val > 10 ? '#ef4444' : '#64748b'; }
      else if (param.includes('cisn')) { val = st.cisnienie; suffix = ' hPa'; color = '#10b981'; }
      else if (param.includes('opad')) { val = st.opad; suffix = ' mm'; color = '#06b6d4'; }
      else if (param.includes('wilgotnosc')) { val = st.wilgotnosc; suffix = '%'; color = '#8b5cf6'; }
      else if (param.includes('uslonecznienie') || param.includes('podstawa') || param.includes('zachmurzenie') || param.includes('widzialnosc')) {
         // Fallback dla brakujących z API na temperaturę (dla ułatwienia) by mapa nie była pusta
         val = st.temp; suffix = '°C'; color = '#94a3b8';
      }
      
      if (val !== null && !isNaN(val)) {
        const iconHtml = `<div style="background: rgba(255,255,255,0.9); border: 2px solid ${color}; color: #1e293b; font-weight: bold; padding: 2px 4px; border-radius: 6px; font-size: 11px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.3); text-align: center; line-height:1.1;">${val}${suffix}<br><span style="font-size: 8px; color: #64748b;">${st.nazwa}</span></div>`;
        const divIcon = L.divIcon({
          className: 'custom-cmm-icon',
          html: iconHtml,
          iconSize: [60, 26],
          iconAnchor: [30, 13]
        });
        L.marker([st.lat, st.lon], { icon: divIcon }).addTo(cmmMapInstance);
      }
    });
  };

  // Dodajemy nasłuchiwacz, by obraz załadowany poprawnie ukrywał fallback
  setTimeout(() => {
    const sel = document.getElementById('cmm-synop-select');
    if(sel) {
      sel.addEventListener('change', () => {
        const img = document.getElementById('dash-cmm-synop');
        if(img) {
           img.style.display = 'block';
           img.onload = () => {
             const m = document.getElementById('cmm-leaflet-map');
             if(m) m.style.display = 'none';
           };
        }
        // Jeżeli w tym momencie włączona jest mapa fallbackowa, zaktualizujmy markery!
        if(document.getElementById('cmm-leaflet-map') && document.getElementById('cmm-leaflet-map').style.display === 'block') {
            if(window.renderCmmMapData) window.renderCmmMapData();
        }
      });
    }
  }, 1500);
</script>
</body>
'''

if '<!-- FALLBACK CMM API SCRIPT -->' not in html:
    html = html.replace('</body>', script_code)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Dynamic CMM Fallback injected successfully.')

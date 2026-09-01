// js/map/synop.js - Pobieranie i renderowanie danych telemetrycznych IMGW oraz stacji SYNOP

let imgwLiveCache = null;
let imgwLiveCacheTime = 0;
let stationsLayerGroup = null;
window.idwOverlay = null;

const DEFAULT_ZMIENNE = {
    "temp":     { "nazwa": "Temperatura", "cmin": -40, "cmax": 50, "unit": "°C" },
    "grunt":    { "nazwa": "Temp. Gruntu", "cmin": -40, "cmax": 50, "unit": "°C" },
    "wiatr":    { "nazwa": "Poryw Wiatru", "cmin": 0, "cmax": 259, "unit": "km/h" },
    "wiatr_sr": { "nazwa": "Śr. Wiatr", "cmin": 0, "cmax": 259, "unit": "km/h" },
    "wilg":     { "nazwa": "Wilgotność", "cmin": 0, "cmax": 100, "unit": "%" },
    "rosy":     { "nazwa": "Punkt Rosy", "cmin": -10, "cmax": 28, "unit": "°C" },
    "lcl":      { "nazwa": "Podstawa Chmur (LCL)", "cmin": 0, "cmax": 3000, "unit": "m" },
    "synop":    { "nazwa": "Model Synoptyczny", "cmin": -40, "cmax": 50, "unit": "°C" },
    "cisnienie": { "nazwa": "Ciśnienie", "cmin": 980, "cmax": 1040, "unit": "hPa" }
};

function getColorscaleForZmienna(z) {
    if (z === 'cisnienie') return window.DEFAULT_PRESSURE_COLORSCALE;
    if (z === 'wiatr' || z === 'wiatr_sr') return window.DEFAULT_WIND_COLORSCALE;
    if (z === 'wilg') return window.DEFAULT_HUMIDITY_COLORSCALE;
    if (z === 'rosy') return window.DEFAULT_DEW_COLORSCALE;
    if (z === 'lcl') return window.DEFAULT_LCL_COLORSCALE;
    return window.DEFAULT_TEMP_COLORSCALE;
}

async function getIMGWLiveData() {
    const now = Date.now();
    if (imgwLiveCache && (now - imgwLiveCacheTime < 60000)) return imgwLiveCache;
    
    const loadingEl = document.getElementById('imgw-loading');
    if (loadingEl) { loadingEl.style.display = 'flex'; loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Pobieranie danych z IMGW (Live)...'; }
    
    try {
        const [resMeteo, resSynop] = await Promise.all([fetch('https://danepubliczne.imgw.pl/api/data/meteo/'), fetch('https://danepubliczne.imgw.pl/api/data/synop')]);
        const [rawData, synopData] = await Promise.all([resMeteo.json(), resSynop.json()]);
        
        const dataObj = { 'temp': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] }, 'cisnienie': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] }, 'wiatr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] }, 'wiatr_sr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] }, 'rosy': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] }, 'lcl': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] }, 'wilg': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] }, 'grunt': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] }, 'synop': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] } };

        for (let st of synopData) {
            const pVal = parseFloat(st.cisnienie);
            const coord = window.SYNOP_STATIONS_COORDS?.[st.id_stacji];
            if (!isNaN(pVal) && pVal && coord) {
                dataObj['cisnienie'].pt_lats.push(coord.lat); dataObj['cisnienie'].pt_lons.push(coord.lon); dataObj['cisnienie'].pt_vals.push(pVal); dataObj['cisnienie'].pt_txts.push(pVal.toFixed(1));
                dataObj['cisnienie'].pt_hov.push(`<b>${coord.name || st.stacja}</b> (SYNOP)<br>Ciśnienie: <b>${pVal.toFixed(1)} hPa</b><br>Temp: ${st.temperatura || '-'}°C, Wilgotność: ${st.wilgotnosc_wzgledna || '-'}%`);
            }
        }

        for (let st of rawData) {
            const lat = parseFloat(st.lat), lon = parseFloat(st.lon);
            if (isNaN(lat) || isNaN(lon)) continue;
            const temp = parseFloat(st.temperatura_powietrza), temp_g = parseFloat(st.temperatura_gruntu), wilg = parseFloat(st.wilgotnosc_wzgledna), w_sr = parseFloat(st.wiatr_srednia_predkosc);
            const porywy = [parseFloat(st.wiatr_poryw_10min), parseFloat(st.wiatr_predkosc_maksymalna)].filter(v => !isNaN(v)).map(v => v * 3.6);
            const w_por = porywy.length ? Math.max(...porywy) : NaN;
            const dew = window.calculateDewPoint ? window.calculateDewPoint(temp, wilg) : null;
            const lcl = (dew !== null && window.calculateLCL) ? window.calculateLCL(temp, dew) : NaN;

            const add = (k, v, txt, hov) => {
                if (v !== null && !isNaN(v)) { dataObj[k].pt_lats.push(lat); dataObj[k].pt_lons.push(lon); dataObj[k].pt_vals.push(v); dataObj[k].pt_txts.push(txt); dataObj[k].pt_hov.push(`<b>${st.nazwa_stacji}</b><br>${hov}`); }
            };
            add('temp', temp, temp?.toFixed(1) + '°', `Temp: ${temp?.toFixed(1)}°C`);
            add('grunt', temp_g, temp_g?.toFixed(1) + '°', `Temp. Gruntu: ${temp_g?.toFixed(1)}°C`);
            add('wilg', wilg, wilg?.toFixed(0) + '%', `Wilgotność: ${wilg?.toFixed(0)}%`);
            add('rosy', dew, dew?.toFixed(1) + '°', `Punkt Rosy: ${dew?.toFixed(1)}°C`);
            add('lcl', lcl, !isNaN(lcl) ? (lcl + 'm') : '', `Podstawa Chmur (LCL): ${lcl} m`);
            add('wiatr', w_por, !isNaN(w_por) ? (w_por.toFixed(0) + ' km/h') : '', `Poryw: ${w_por?.toFixed(0)} km/h`);
            add('wiatr_sr', !isNaN(w_sr) ? w_sr * 3.6 : NaN, !isNaN(w_sr) ? ((w_sr*3.6).toFixed(0) + ' km/h') : '', `Śr. wiatr: ${(w_sr*3.6)?.toFixed(0)} km/h`);
        }

        imgwLiveCache = dataObj; imgwLiveCacheTime = now; return dataObj;
    } catch(err) { console.error('Błąd IMGW Live:', err); return null; }
    finally { if (loadingEl) loadingEl.style.display = 'none'; }
}

window.renderIMGW = async function() {
    if (!window.premiumMap) return;
    const zmienna = document.getElementById('imgw-zmienna')?.value || 'temp';
    const drawIso = document.getElementById('chk-iso')?.checked ?? true;
    const drawPts = document.getElementById('chk-pt')?.checked ?? true;
    const drawTxt = document.getElementById('chk-txt')?.checked ?? true;
    const stepVal = document.getElementById('iso-step')?.value === 'auto' ? null : parseFloat(document.getElementById('iso-step')?.value);
    
    const cfg = DEFAULT_ZMIENNE[zmienna] || DEFAULT_ZMIENNE['temp'];
    const scale = getColorscaleForZmienna(zmienna);
    const liveData = await getIMGWLiveData();
    if (!liveData || !liveData[zmienna]) return;
    const data = liveData[zmienna];

    if (window.MAP_LAYERS?.['inter']?.visible && data.pt_lats.length >= 3) {
        const dataUrl = window.generateIDWImage(data.pt_lats, data.pt_lons, data.pt_vals, scale, cfg.cmin, cfg.cmax, drawIso, stepVal);
        const op = (window.MAP_LAYERS['inter'].opacity || 70) / 100.0;
        if (window.idwOverlay) { window.idwOverlay.setUrl(dataUrl); window.idwOverlay.setOpacity(op); }
        else { window.idwOverlay = L.imageOverlay(dataUrl, [[48.5, 13.5], [55.5, 24.5]], { opacity: op, pane: 'weatherPane' }).addTo(window.premiumMap); }
    } else if (window.idwOverlay) { window.premiumMap.removeLayer(window.idwOverlay); window.idwOverlay = null; }

    if (!stationsLayerGroup) stationsLayerGroup = L.layerGroup([], { pane: 'stationsPane' }).addTo(window.premiumMap);
    stationsLayerGroup.clearLayers();

    if (window.MAP_LAYERS?.['stations']?.visible && (drawPts || drawTxt)) {
        for (let i = 0; i < data.pt_lats.length; i++) {
            if (drawPts) {
                const marker = L.circleMarker([data.pt_lats[i], data.pt_lons[i]], { radius: 3.5, fillColor: '#38bdf8', color: '#0f172a', weight: 1, fillOpacity: 0.9, pane: 'stationsPane' });
                marker.bindPopup(data.pt_hov[i]); stationsLayerGroup.addLayer(marker);
            }
            if (drawTxt && data.pt_txts[i]) {
                const textIcon = L.divIcon({ className: 'station-val-label', html: `<div style="font-size: 10px; font-weight: 700; color: #ffffff; text-shadow: 0 0 2px #000, 0 0 4px #000; transform: translate(-50%, -18px);">${data.pt_txts[i]}</div>`, iconSize: [0, 0] });
                stationsLayerGroup.addLayer(L.marker([data.pt_lats[i], data.pt_lons[i]], { icon: textIcon, pane: 'labelsPane', interactive: false }));
            }
        }
    }
};

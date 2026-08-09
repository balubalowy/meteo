// cmm-map.js
// Fallback dla mapy CMM IMGW, pobierający dane bezpośrednio z API

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
        cmmMapInstance = L.map('cmm-leaflet-map').setView([52.0, 19.2], 5);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB | API IMGW'
        }).addTo(cmmMapInstance);
        setTimeout(() => { cmmMapInstance.invalidateSize(); }, 100);
    }
    
    if (cmmMeteoDataCache && cmmSynopDataCache) {
        document.getElementById('cmm-map-loading').style.display = 'none';
        window.renderCmmMapData();
        return;
    }

    Promise.all([
        fetch('https://danepubliczne.imgw.pl/api/data/meteo/').then(r => r.json()).catch(() => []),
        fetch('https://danepubliczne.imgw.pl/api/data/synop').then(r => r.json()).catch(() => [])
    ]).then(([meteo, synop]) => {
        document.getElementById('cmm-map-loading').style.display = 'none';
        cmmMeteoDataCache = meteo;
        cmmSynopDataCache = synop;
        window.renderCmmMapData();
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
            val = st.temp; suffix = '°C'; color = '#94a3b8';
        }
        
        if (val !== null && !isNaN(val)) {
            const iconHtml = `<div style="
                background: ${color}ee; 
                color: #ffffff; 
                font-weight: 600; 
                padding: 4px 6px; 
                border-radius: 6px; 
                font-size: 11px; 
                white-space: nowrap; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.4); 
                text-align: center; 
                line-height: 1.1;
                backdrop-filter: blur(2px);
                border: 1px solid rgba(255,255,255,0.25);
            ">
                <span style="font-size: 13px;">${val}</span><span style="font-size: 9px; margin-left: 1px;">${suffix}</span><br>
                <span style="font-size: 8px; font-weight: 500; opacity: 0.9;">${st.nazwa}</span>
            </div>`;
            const divIcon = L.divIcon({
                className: 'custom-cmm-icon',
                html: iconHtml,
                iconSize: null, // Pozwala HTML automatycznie dopasować szerokość
                iconAnchor: [20, 16] // Delikatne wyśrodkowanie
            });
            L.marker([st.lat, st.lon], { icon: divIcon }).addTo(cmmMapInstance);
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
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
                if(document.getElementById('cmm-leaflet-map') && document.getElementById('cmm-leaflet-map').style.display === 'block') {
                    if(window.renderCmmMapData) window.renderCmmMapData();
                }
            });
        }
    }, 1500);

    // Sprawdzamy czy obrazek załadował się z błędem zanim JS zdążył się uruchomić
    if (window._cmmFallbackTriggered) {
        window.fallbackCmmMap();
    }
});

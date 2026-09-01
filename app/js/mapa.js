// js/mapa.js - Główny koordynator mapy synoptycznej

window.initMapa = function() {
    setTimeout(() => {
        if (!document.getElementById('premium-map')) return;
        if (window.premiumMap) window.premiumMap.remove();

        const map = L.map('premium-map', { center: [51.9194, 19.1451], zoom: 6, zoomControl: false });
        window.premiumMap = map;
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // 1. Z-Index Panes (Precyzyjne zarządzanie warstwami)
        map.createPane('basePane');          map.getPane('basePane').style.zIndex = 200;
        map.createPane('satellitePane');     map.getPane('satellitePane').style.zIndex = 240;
        map.createPane('satelliteNightPane');map.getPane('satelliteNightPane').style.zIndex = 250;
        map.createPane('weatherPane');       map.getPane('weatherPane').style.zIndex = 270;
        map.createPane('radarPane');         map.getPane('radarPane').style.zIndex = 300;
        map.createPane('boundariesPane');    map.getPane('boundariesPane').style.zIndex = 330;
        map.createPane('lightningPane');     map.getPane('lightningPane').style.zIndex = 360;
        map.createPane('drawingsPane');      map.getPane('drawingsPane').style.zIndex = 390;
        map.createPane('stationsPane');      map.getPane('stationsPane').style.zIndex = 420;
        map.createPane('labelsPane');        map.getPane('labelsPane').style.zIndex = 650;
        map.getPane('labelsPane').style.pointerEvents = 'none';

        // 2. Podkład bazowy ciemny (CartoDB Dark Raster bez znaku wodnego)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png', {
            subdomains: 'abcd', attribution: '© CartoDB / OSM', pane: 'basePane', maxZoom: 19
        }).addTo(map);

        // 3. Satelita EUMETSAT (WMS)
        const satDayLayer = L.tileLayer.wms('https://view.eumetsat.int/geoserver/ows', {
            layers: 'msg_fes:rgb_eview', format: 'image/png', transparent: true,
            opacity: 0.65, pane: 'satellitePane', maxNativeZoom: 7, maxZoom: 18, attribution: '© EUMETSAT HRV'
        });

        const satNightLayer = L.tileLayer.wms('https://view.eumetsat.int/geoserver/ows', {
            layers: 'mtg_fd:ir105_hrfi', format: 'image/png', transparent: true,
            opacity: 0.60, pane: 'satelliteNightPane', maxNativeZoom: 7, maxZoom: 18, attribution: '© EUMETSAT MTG-IR'
        });

        // 4. Granice i Pioruny
        const boundariesGroup = L.layerGroup([], { pane: 'boundariesPane' });
        const lightningGroup = L.layerGroup([], { pane: 'lightningPane' });

        fetch('radar/geo/poland_hires.geojson')
            .then(res => res.json())
            .then(geo => {
                L.geoJSON(geo, {
                    style: { color: '#64748b', weight: 1.5, fillOpacity: 0 },
                    pane: 'boundariesPane'
                }).addTo(boundariesGroup);
            })
            .catch(() => {});

        // 5. Inicjalizacja podmodułów
        if (window.setupDrawingTools) window.setupDrawingTools(map);
        if (window.initLayers) window.initLayers(map, satDayLayer, satNightLayer, lightningGroup, boundariesGroup);
        if (window.initRadarController) window.initRadarController(map, satDayLayer, satNightLayer);
        if (window.renderIMGW) window.renderIMGW();

        map.invalidateSize();
    }, 100);
};

// Aliases for global inline handlers
window.renderIMGW = window.renderIMGW;
window.setRadarSource = window.setRadarSource;

window.addEventListener('bmeteo-authenticated', () => {
    if (document.getElementById('tab-mapa')?.classList.contains('active')) {
        window.initMapa();
    }
});

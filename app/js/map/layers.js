// js/map/layers.js - Zarządzanie warstwami mapy, kolejnością, przezroczystością i widokiem

let mapInstance = null;
let satDayLayer = null;
let satNightLayer = null;
let lightningGroup = null;
let boundariesGroup = null;

window.MAP_LAYERS = {
    'drawings':   { id: 'drawings',   name: 'Kreator Ostrzeżeń',     visible: false, opacity: 100, pane: 'drawingsPane' },
    'stations':   { id: 'stations',   name: 'Stacje i Pomiary IMGW', visible: true,  opacity: 100, pane: 'stationsPane' },
    'boundaries': { id: 'boundaries', name: 'Granice',               visible: true,  opacity: 100, pane: 'boundariesPane' },
    'lightning':  { id: 'lightning',  name: 'Wyładowania (Live)',    visible: false, opacity: 95,  pane: 'lightningPane' },
    'radar':      { id: 'radar',      name: 'Radar Opadów',          visible: false, opacity: 87,  pane: 'radarPane' },
    'sat_day':    { id: 'sat_day',    name: 'Satelita Dzienny (HRV)', visible: false, opacity: 100, pane: 'satellitePane' },
    'inter':      { id: 'inter',      name: 'Interpolacja IMGW',     visible: true,  opacity: 70,  pane: 'weatherPane' },
    'sat_night':  { id: 'sat_night',  name: 'Satelita Nocny (IR)',   visible: false, opacity: 60,  pane: 'satelliteNightPane' }
};

window.layerOrder = ['drawings', 'stations', 'boundaries', 'lightning', 'radar', 'sat_day', 'inter', 'sat_night'];

try {
    const savedLayers = localStorage.getItem('meteo_map_layers');
    const savedOrder = localStorage.getItem('meteo_map_order');
    if (savedLayers) {
        const parsed = JSON.parse(savedLayers);
        Object.keys(parsed).forEach(k => {
            if (window.MAP_LAYERS[k]) {
                window.MAP_LAYERS[k].visible = parsed[k].visible;
                window.MAP_LAYERS[k].opacity = parsed[k].opacity;
            }
        });
    }
    if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        if (Array.isArray(parsedOrder) && parsedOrder.length === window.layerOrder.length) {
            window.layerOrder = parsedOrder;
        }
    }
} catch(e) {}

function saveLayerState() {
    try {
        localStorage.setItem('meteo_map_layers', JSON.stringify(window.MAP_LAYERS));
        localStorage.setItem('meteo_map_order', JSON.stringify(window.layerOrder));
    } catch(e) {}
}

window.applyLayerOrder = function() {
    if (!mapInstance) return;
    const total = window.layerOrder.length;
    window.layerOrder.forEach((key, idx) => {
        const item = window.MAP_LAYERS[key];
        if (item && item.pane && mapInstance.getPane(item.pane)) {
            const z = 240 + (total - idx) * 30;
            mapInstance.getPane(item.pane).style.zIndex = z;
        }
    });
    saveLayerState();
};

window.moveLayer = function(key, dir) {
    const idx = window.layerOrder.indexOf(key);
    if (idx === -1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= window.layerOrder.length) return;
    
    const tmp = window.layerOrder[idx];
    window.layerOrder[idx] = window.layerOrder[targetIdx];
    window.layerOrder[targetIdx] = tmp;
    
    window.applyLayerOrder();
    window.renderLayerManagerUI();
};

window.toggleLayer = function(key, isChecked) {
    if (!window.MAP_LAYERS[key] || !mapInstance) return;
    window.MAP_LAYERS[key].visible = isChecked;
    saveLayerState();
    
    if (key === 'sat_day') {
        if (isChecked) {
            if (!mapInstance.hasLayer(satDayLayer)) mapInstance.addLayer(satDayLayer);
            window.syncSatelliteTime(Date.now() / 1000);
        } else {
            if (mapInstance.hasLayer(satDayLayer)) mapInstance.removeLayer(satDayLayer);
        }
    } else if (key === 'sat_night') {
        if (isChecked) {
            if (!mapInstance.hasLayer(satNightLayer)) mapInstance.addLayer(satNightLayer);
            window.syncSatelliteTime(Date.now() / 1000);
        } else {
            if (mapInstance.hasLayer(satNightLayer)) mapInstance.removeLayer(satNightLayer);
        }
    } else if (key === 'boundaries') {
        if (isChecked) { if (!mapInstance.hasLayer(boundariesGroup)) mapInstance.addLayer(boundariesGroup); }
        else { if (mapInstance.hasLayer(boundariesGroup)) mapInstance.removeLayer(boundariesGroup); }
    } else if (key === 'lightning') {
        if (isChecked) {
            if (!mapInstance.hasLayer(lightningGroup)) mapInstance.addLayer(lightningGroup);
        } else {
            if (mapInstance.hasLayer(lightningGroup)) mapInstance.removeLayer(lightningGroup);
        }
    } else if (key === 'radar') {
        const radarOverlay = window.getRadarOverlay ? window.getRadarOverlay() : null;
        if (isChecked) {
            if (radarOverlay && !mapInstance.hasLayer(radarOverlay)) mapInstance.addLayer(radarOverlay);
            else if (window.showRadarFrame) window.showRadarFrame(document.getElementById('rv-slider')?.value || 0);
        } else {
            if (radarOverlay && mapInstance.hasLayer(radarOverlay)) mapInstance.removeLayer(radarOverlay);
        }
    } else if (key === 'inter' || key === 'stations') {
        if (window.renderIMGW) window.renderIMGW();
    }
};

window.setLayerOpacity = function(key, val) {
    const op = parseInt(val) / 100.0;
    if (window.MAP_LAYERS[key]) window.MAP_LAYERS[key].opacity = parseInt(val);
    saveLayerState();
    
    if (key === 'sat_day' && satDayLayer) satDayLayer.setOpacity(op);
    else if (key === 'sat_night' && satNightLayer) satNightLayer.setOpacity(op);
    else if (key === 'boundaries' && boundariesGroup) {
        boundariesGroup.eachLayer(l => { if (l.setStyle) l.setStyle({ opacity: op }); });
    } else if (key === 'radar') {
        const radarOverlay = window.getRadarOverlay ? window.getRadarOverlay() : null;
        if (radarOverlay) radarOverlay.setOpacity(op);
    } else if (key === 'inter') {
        if (window.idwOverlay) window.idwOverlay.setOpacity(op);
    }
};

window.renderLayerManagerUI = function() {
    const container = document.getElementById('layer-manager-list');
    if (!container) return;
    
    container.innerHTML = window.layerOrder.map((key, idx) => {
        const item = window.MAP_LAYERS[key];
        if (!item) return '';
        const isTop = idx === 0;
        const isBottom = idx === window.layerOrder.length - 1;
        return `
            <div class="layer-item-card" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 7px 10px; display: flex; flex-direction: column; gap: 5px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; margin: 0; color: var(--text-primary);">
                        <input type="checkbox" ${item.visible ? 'checked' : ''} onchange="window.toggleLayer('${key}', this.checked)">
                        <span>${item.name}</span>
                    </label>
                    <div style="display: flex; gap: 3px;">
                        <button class="btn btn-ghost" style="padding: 2px 6px; font-size: 0.75rem; border: 1px solid var(--border-subtle);" title="Przesuń wyżej" onclick="window.moveLayer('${key}', 'up')" ${isTop ? 'disabled style="opacity:0.25; cursor:default;"' : ''}>▲</button>
                        <button class="btn btn-ghost" style="padding: 2px 6px; font-size: 0.75rem; border: 1px solid var(--border-subtle);" title="Przesuń niżej" onclick="window.moveLayer('${key}', 'down')" ${isBottom ? 'disabled style="opacity:0.25; cursor:default;"' : ''}>▼</button>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: var(--text-muted);">
                    <span style="min-width: 42px;">Krycie:</span>
                    <input type="range" min="0" max="100" value="${item.opacity}" oninput="window.setLayerOpacity('${key}', this.value); document.getElementById('lbl-op-${key}').textContent = this.value + '%'" style="flex: 1; accent-color: var(--accent-primary); height: 4px;">
                    <span id="lbl-op-${key}" style="width: 32px; text-align: right;">${item.opacity}%</span>
                </div>
            </div>
        `;
    }).join('');
};

window.toggleMapFullscreen = function() {
    const container = document.querySelector('.map-dashboard-container');
    const fsBtn = document.getElementById('map-fs-btn');
    if (!container) return;

    const isFs = container.classList.toggle('map-fullscreen');
    if (isFs) {
        if (fsBtn) fsBtn.innerHTML = '<i data-lucide="minimize" style="width: 15px; height: 15px;"></i> <span id="map-fs-text">Zamknij Pełny Ekran</span>';
        if (container.requestFullscreen && !document.fullscreenElement) container.requestFullscreen().catch(() => {});
    } else {
        if (fsBtn) fsBtn.innerHTML = '<i data-lucide="maximize" style="width: 15px; height: 15px;"></i> <span id="map-fs-text">Pełny Ekran</span>';
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => { if (mapInstance) mapInstance.invalidateSize(); }, 150);
};

window.toggleMapSidebar = function() {
    const sidebar = document.getElementById('map-sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    if (!sidebar) return;

    const isHidden = sidebar.classList.toggle('sidebar-collapsed');
    if (icon) icon.setAttribute('data-lucide', isHidden ? 'panel-left-open' : 'panel-left-close');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => { if (mapInstance) mapInstance.invalidateSize(); }, 150);
};

window.initLayers = function(map, satDay, satNight, lightning, boundaries) {
    mapInstance = map;
    satDayLayer = satDay;
    satNightLayer = satNight;
    lightningGroup = lightning;
    boundariesGroup = boundaries;

    if (window.MAP_LAYERS['boundaries']?.visible) {
        boundariesGroup.addTo(mapInstance);
    }

    window.applyLayerOrder();
    window.renderLayerManagerUI();
};

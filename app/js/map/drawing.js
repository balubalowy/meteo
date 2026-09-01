// js/map/drawing.js - Narzędzia rysowania frontów i symboli meteorologicznych

const FRONT_ICONS = {
    front_chlodny: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 L 10 0 L 20 10 Z" fill="#3b82f6"/></svg>',
    front_cieply: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 A 10 10 0 0 1 20 10 Z" fill="#ef4444"/></svg>',
    front_zokludowany: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 L 10 0 L 20 10 Z" fill="#d946ef"/></svg>',
    zbieznosc: '<svg viewBox="0 0 10 10" style="width:10px;height:10px;"><path d="M 10 10 L 0 0" stroke="#f97316" stroke-width="2" fill="none"/></svg>'
};

const SYMBOL_ICONS = {
    wyz: { color: '#3b82f6', text: 'W' },
    niz: { color: '#ef4444', text: 'N' },
    burza: { color: '#ef4444', text: '☈' },
    deszcz: { color: '#22c55e', text: '●' },
    snieg: { color: '#3b82f6', text: '✱' },
    mgla: { color: '#eab308', text: '≡' }
};

window.setupDrawingTools = function(map) {
    if (!map || !map.pm) return;

    map.pm.addControls({ position: 'topleft', drawCircleMarker: false, drawPolyline: false, drawRectangle: false, drawCircle: false, editMode: true, dragMode: true, cutPolygon: false, removalMode: true });
    map.pm.setGlobalOptions({ pathOptions: { color: '#ef4444', weight: 3, fillOpacity: 0.4 } });
    window.currentDrawingMode = 'polygon';

    map.on('pm:create', e => {
        const layer = e.layer;
        const mode = window.currentDrawingMode;

        if (mode === 'front_chlodny' || mode === 'front_chlodny_2' || mode === 'front_cieply' || mode === 'front_zokludowany' || mode === 'zbieznosc') {
            const svg = FRONT_ICONS[mode === 'front_chlodny_2' ? 'front_chlodny' : mode];
            layer._myDecorator = L.polylineDecorator(layer, {
                patterns: [{ offset: 15, repeat: 40, symbol: L.Symbol.marker({
                    rotate: true,
                    markerOptions: { icon: L.divIcon({ className: 'front-icon', html: svg, iconSize: [20, 10], iconAnchor: [10, 10] }) }
                })}]
            }).addTo(map);
        } else if (mode === 'strzalka') {
            layer._myDecorator = L.polylineDecorator(layer, {
                patterns: [{ offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({ pixelSize: 18, polygon: true, pathOptions: { color: '#a8a29e', fillColor: '#a8a29e', fillOpacity: 1 } }) }]
            }).addTo(map);
        } else if (SYMBOL_ICONS[mode]) {
            const s = SYMBOL_ICONS[mode];
            layer.setIcon(L.divIcon({
                className: 'meteo-symbol-icon',
                html: `<div style="color: ${s.color}; font-size: 30px; font-weight: bold; text-shadow: 0 0 4px white, 0 0 4px white; transform: translate(-50%, -50%);">${s.text}</div>`,
                iconSize: [0, 0]
            }));
        }

        layer.on('click', () => {
            if (map.pm.globalRemovalModeEnabled()) {
                map.removeLayer(layer);
                if (layer._myDecorator) map.removeLayer(layer._myDecorator);
            }
        });
        layer.on('pm:remove', () => { if (layer._myDecorator) map.removeLayer(layer._myDecorator); });
    });
};

window.setDrawingColor = function(color) {
    if (!window.premiumMap?.pm) return;
    window.currentDrawingMode = 'polygon';
    window.premiumMap.pm.setGlobalOptions({ pathOptions: { color: color, weight: 3, fillOpacity: 0.4, dashArray: '' } });
    window.premiumMap.pm.enableDraw('Polygon');
};

window.setDrawingMode = function(mode) {
    if (!window.premiumMap?.pm) return;
    window.currentDrawingMode = mode;
    const modeConfigs = {
        zbieznosc: { color: '#f97316', weight: 3, fillOpacity: 0, dashArray: '', type: 'Line' },
        front_chlodny: { color: '#3b82f6', weight: 3, fillOpacity: 0, dashArray: '', type: 'Line' },
        front_chlodny_2: { color: '#3b82f6', weight: 3, fillOpacity: 0, dashArray: '8, 8', type: 'Line' },
        front_cieply: { color: '#ef4444', weight: 3, fillOpacity: 0, dashArray: '', type: 'Line' },
        front_zokludowany: { color: '#d946ef', weight: 3, fillOpacity: 0, dashArray: '', type: 'Line' },
        strzalka: { color: '#a8a29e', weight: 4, fillOpacity: 0, dashArray: '', type: 'Line' },
        kolko: { color: '#22c55e', weight: 3, fillOpacity: 0.3, dashArray: '', type: 'Circle' }
    };

    if (modeConfigs[mode]) {
        const c = modeConfigs[mode];
        window.premiumMap.pm.setGlobalOptions({ pathOptions: { color: c.color, weight: c.weight, fillOpacity: c.fillOpacity, dashArray: c.dashArray } });
        window.premiumMap.pm.enableDraw(c.type);
    } else if (SYMBOL_ICONS[mode]) {
        window.premiumMap.pm.enableDraw('Marker');
    }
};

window.clearMap = function() {
    if (!window.premiumMap) return;
    window.premiumMap.eachLayer(layer => {
        if ((layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Circle || layer instanceof L.Marker) && !layer._url && layer.options.icon?.options?.className !== 'leaflet-div-icon leaflet-editing-icon') {
            window.premiumMap.removeLayer(layer);
            if (layer._myDecorator) window.premiumMap.removeLayer(layer._myDecorator);
        }
    });
};

window.exportMap = function() {
    alert('Eksport mapy: użyj zrzutu ekranu lub narzędzia systemowego (obsługa html2canvas w opracowaniu).');
};

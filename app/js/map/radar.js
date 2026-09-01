// js/map/radar.js - Kontroler klatek radaru opadów (IMGW CMAX / RainViewer) oraz synchronizacja satelity EUMETSAT

const IMGW_RADAR_BOUNDS = [[48.8, 13.8], [55.2, 24.5]];

let activeRadarSource = 'imgw';
let imgwFrames = [];
let radarFrames = [];
let currentFrame = 0;
let animationTimer = null;
let imgwRadarOverlay = null;
let radarTileLayer = null;
let radarHost = "https://tilecache.rainviewer.com";
let lastSatSyncTime = null;

let satDayLayer = null;
let satNightLayer = null;

function generateImgwRadarFrames() {
    const frames = [];
    const now = new Date();
    const min = Math.floor(now.getUTCMinutes() / 5) * 5;
    now.setUTCMinutes(min, 0, 0);

    for (let i = 11; i >= 0; i--) {
        const frameTime = new Date(now.getTime() - (i * 5 * 60 * 1000));
        const y = frameTime.getUTCFullYear();
        const m = String(frameTime.getUTCMonth() + 1).padStart(2, '0');
        const d = String(frameTime.getUTCDate()).padStart(2, '0');
        const h = String(frameTime.getUTCHours()).padStart(2, '0');
        const mn = String(frameTime.getUTCMinutes()).padStart(2, '0');
        
        const timestampStr = `${y}${m}${d}${h}${mn}`;
        const localLabel = frameTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        
        frames.push({
            time: Math.floor(frameTime.getTime() / 1000),
            label: localLabel,
            url: `https://danepubliczne.imgw.pl/datastore/getfiledown/Arch/Met/Biez/Radar/cmax_${timestampStr}0000dBZ.cmax.png`
        });
    }
    return frames;
}

window.syncSatelliteTime = function(timeUnixSec) {
    if (!timeUnixSec) return;
    const isSatDay = window.MAP_LAYERS && window.MAP_LAYERS['sat_day'] && window.MAP_LAYERS['sat_day'].visible;
    const isSatNight = window.MAP_LAYERS && window.MAP_LAYERS['sat_night'] && window.MAP_LAYERS['sat_night'].visible;
    if (!isSatDay && !isSatNight) return;

    const d = new Date(timeUnixSec * 1000);
    const min15 = Math.floor(d.getUTCMinutes() / 15) * 15;
    d.setUTCMinutes(min15, 0, 0);
    const timeStr = d.toISOString().replace('.000Z', 'Z');

    if (lastSatSyncTime === timeStr) return;
    lastSatSyncTime = timeStr;

    if (isSatDay && satDayLayer) satDayLayer.setParams({ time: timeStr });
    if (isSatNight && satNightLayer) satNightLayer.setParams({ time: timeStr });
};

window.showRadarFrame = function(index) {
    if (!window.premiumMap) return;
    currentFrame = parseInt(index);
    const timeEl = document.getElementById('rv-time');
    const opacity = (window.MAP_LAYERS && window.MAP_LAYERS['radar'] && window.MAP_LAYERS['radar'].opacity !== undefined) ? (window.MAP_LAYERS['radar'].opacity / 100.0) : 0.87;

    if (activeRadarSource === 'imgw') {
        if (!imgwFrames[currentFrame]) return;
        const frame = imgwFrames[currentFrame];
        
        if (!imgwRadarOverlay) {
            imgwRadarOverlay = L.imageOverlay(frame.url, IMGW_RADAR_BOUNDS, {
                opacity: opacity,
                pane: 'radarPane'
            });
        } else {
            imgwRadarOverlay.setUrl(frame.url);
            imgwRadarOverlay.setOpacity(opacity);
        }

        if (window.MAP_LAYERS && window.MAP_LAYERS['radar'].visible) {
            if (!window.premiumMap.hasLayer(imgwRadarOverlay)) imgwRadarOverlay.addTo(window.premiumMap);
        }
        if (timeEl) timeEl.textContent = frame.label;
        window.syncSatelliteTime(frame.time);
    } else {
        if (!radarFrames[currentFrame]) return;
        const frame = radarFrames[currentFrame];
        
        if (!radarTileLayer) {
            radarTileLayer = L.tileLayer(`${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
                opacity: opacity, 
                pane: 'radarPane',
                maxZoom: 18,
                maxNativeZoom: 8
            });
        } else {
            radarTileLayer.setUrl(`${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`);
            radarTileLayer.setOpacity(opacity);
        }

        if (window.MAP_LAYERS && window.MAP_LAYERS['radar'].visible) {
            if (!window.premiumMap.hasLayer(radarTileLayer)) radarTileLayer.addTo(window.premiumMap);
        }
        if (timeEl) timeEl.textContent = new Date(frame.time * 1000).toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});
        window.syncSatelliteTime(frame.time);
    }
};

window.setRadarSource = function(src) {
    activeRadarSource = src;
    const btnImgw = document.getElementById('radar-src-imgw');
    const btnRv = document.getElementById('radar-src-rv');
    
    if (src === 'imgw') {
        if (btnImgw) { btnImgw.className = 'btn btn-primary'; }
        if (btnRv) { btnRv.className = 'btn btn-ghost'; btnRv.style.border = '1px solid var(--border-subtle)'; }
        if (radarTileLayer && window.premiumMap.hasLayer(radarTileLayer)) window.premiumMap.removeLayer(radarTileLayer);
        imgwFrames = generateImgwRadarFrames();
    } else {
        if (btnRv) { btnRv.className = 'btn btn-primary'; }
        if (btnImgw) { btnImgw.className = 'btn btn-ghost'; btnImgw.style.border = '1px solid var(--border-subtle)'; }
        if (imgwRadarOverlay && window.premiumMap.hasLayer(imgwRadarOverlay)) window.premiumMap.removeLayer(imgwRadarOverlay);
    }
    
    const slider = document.getElementById('rv-slider');
    if (slider) {
        slider.max = (src === 'imgw' ? imgwFrames.length : radarFrames.length) - 1;
        slider.value = slider.max;
    }
    window.showRadarFrame(slider ? slider.value : 0);
};

window.initRadarController = function(map, satDay, satNight) {
    satDayLayer = satDay;
    satNightLayer = satNight;
    imgwFrames = generateImgwRadarFrames();

    fetch("https://api.rainviewer.com/public/weather-maps.json")
        .then(res => res.json())
        .then(data => {
            radarHost = data.host;
            radarFrames = data.radar.past;
        })
        .catch(err => console.warn('Błąd ładowania RainViewer API:', err));

    window.setRadarSource('imgw');

    const rvSlider = document.getElementById('rv-slider');
    if (rvSlider) rvSlider.addEventListener('input', e => window.showRadarFrame(parseInt(e.target.value)));
    
    const rvPlayBtn = document.getElementById('rv-play-btn');
    if (rvPlayBtn) {
        rvPlayBtn.addEventListener('click', e => {
            const btn = e.currentTarget;
            if (animationTimer) {
                clearInterval(animationTimer); animationTimer = null;
                btn.innerHTML = '<i data-lucide="play"></i>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                btn.innerHTML = '<i data-lucide="pause"></i>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
                animationTimer = setInterval(() => {
                    const slider = document.getElementById('rv-slider');
                    if (!slider) return;
                    let next = parseInt(slider.value) + 1;
                    if (next > parseInt(slider.max)) next = 0;
                    slider.value = next;
                    window.showRadarFrame(next);
                }, 650);
            }
        });
    }
};

window.getRadarOverlay = function() {
    return activeRadarSource === 'imgw' ? imgwRadarOverlay : radarTileLayer;
};

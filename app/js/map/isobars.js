// js/map/isobars.js - Interpolacja przestrzenna IDW i generowanie izobar

// Transformacja szerokości geograficznej do Web Mercator Y (eliminuje przesunięcie na północ)
function latToMercY(lat) {
    const rad = lat * Math.PI / 180.0;
    return Math.log(Math.tan(Math.PI / 4.0 + rad / 2.0));
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0,0,0];
}

function getColorRGBA(val, scale, cmin, cmax, alpha = 160) {
    if(val === null || isNaN(val)) return [0,0,0,0];
    let norm = (val - cmin) / (cmax - cmin);
    if (norm < 0) norm = 0;
    if (norm > 1) norm = 1;
    
    // Płynna interpolacja liniowa pomiędzy progami skali
    for(let i = 0; i < scale.length - 1; i++) {
        const stop1 = scale[i];
        const stop2 = scale[i+1];
        if(norm >= stop1[0] && norm <= stop2[0]) {
            const span = stop2[0] - stop1[0];
            const t = span > 0 ? (norm - stop1[0]) / span : 0;
            const rgb1 = hexToRgb(stop1[1]);
            const rgb2 = hexToRgb(stop2[1]);
            const r = Math.round(rgb1[0] + t * (rgb2[0] - rgb1[0]));
            const g = Math.round(rgb1[1] + t * (rgb2[1] - rgb1[1]));
            const b = Math.round(rgb1[2] + t * (rgb2[2] - rgb1[2]));
            return [r, g, b, alpha];
        }
    }
    const rgb = hexToRgb(scale[scale.length-1][1]);
    return [rgb[0], rgb[1], rgb[2], alpha];
}

// Precyzyjny obrys granic Polski (189 punktów w projekcji WGS84)
const POLAND_POLY_COORDS = [
    [18.8332, 49.5103], [18.7884, 49.6686], [18.6177, 49.7139], [18.5592, 49.9072], [18.2925, 49.9078], [18.0024, 50.0468], [18.0324, 50.0028],
    [17.8394, 49.9736], [17.732, 50.0949], [17.6328, 50.1063], [17.5894, 50.1632], [17.7476, 50.2175], [17.708, 50.311], [17.6295, 50.2621],
    [17.4242, 50.2406], [17.1876, 50.3785], [16.893, 50.4329], [16.8659, 50.4084], [17.0148, 50.2185], [16.8177, 50.1868], [16.6606, 50.093],
    [16.3437, 50.3699], [16.2625, 50.3644], [16.1996, 50.4063], [16.2112, 50.4513], [16.3526, 50.4928], [16.4259, 50.5676], [16.3316, 50.644],
    [16.0865, 50.6468], [15.982, 50.6036], [15.9715, 50.6786], [15.8482, 50.6752], [15.7922, 50.7427], [15.6843, 50.7314], [15.4418, 50.8002],
    [15.3561, 50.7755], [15.2561, 50.8999], [15.2698, 50.9527], [15.1444, 51.0116], [15.1079, 50.981], [15.004, 51.0207], [14.961, 50.9927],
    [14.9966, 50.9592], [14.9821, 50.8591], [14.8104, 50.8584], [14.9553, 51.064], [15.0195, 51.2717], [14.9638, 51.3284], [14.9451, 51.4492],
    [14.71, 51.5302], [14.7325, 51.6583], [14.5858, 51.8039], [14.6871, 51.9119], [14.7614, 52.0767], [14.6864, 52.121], [14.7124, 52.2359],
    [14.5842, 52.2912], [14.5454, 52.3822], [14.5398, 52.4219], [14.6323, 52.4967], [14.6091, 52.5178], [14.6448, 52.5769], [14.1239, 52.8507],
    [14.165, 52.8957], [14.1445, 52.9599], [14.3433, 53.0486], [14.3807, 53.1899], [14.4416, 53.2518], [14.3042, 53.5085], [14.2639, 53.7],
    [14.3049, 53.7126], [14.2942, 53.7491], [14.531, 53.6578], [14.5906, 53.5984], [14.6238, 53.6528], [14.5449, 53.704], [14.5759, 53.7695],
    [14.6238, 53.7695], [14.6306, 53.8515], [14.5871, 53.8126], [14.5759, 53.8548], [14.4412, 53.8696], [14.4319, 53.9062], [14.363, 53.8794],
    [14.4053, 53.8442], [14.3189, 53.8182], [14.1753, 53.9065], [14.2101, 53.9385], [14.4067, 53.9218], [14.7819, 54.0346], [15.8597, 54.25],
    [16.1792, 54.263], [16.2152, 54.2996], [16.1377, 54.2903], [16.3239, 54.3499], [16.2816, 54.3586], [16.5696, 54.5572], [16.94, 54.606],
    [17.3374, 54.749], [18.1524, 54.8383], [18.3395, 54.8335], [18.7517, 54.6901], [18.8353, 54.6031], [18.7078, 54.7012], [18.4563, 54.7877],
    [18.4131, 54.7465], [18.4759, 54.6401], [18.523, 54.6466], [18.5881, 54.4337], [18.8859, 54.3502], [19.3772, 54.3776], [19.6095, 54.4567],
    [22.6984, 54.3429], [22.8376, 54.4009], [22.9627, 54.3817], [23.0416, 54.341], [23.0501, 54.2948], [23.316, 54.2363], [23.449, 54.1549],
    [23.4962, 54.0446], [23.4587, 53.9816], [23.5909, 53.6113], [23.8006, 53.2425], [23.8937, 53.152], [23.8593, 53.068], [23.9113, 53.0051],
    [23.9225, 52.7426], [23.869, 52.67], [23.3923, 52.5096], [23.1656, 52.2894], [23.1897, 52.2405], [23.4877, 52.1816], [23.5125, 52.1244],
    [23.6375, 52.0845], [23.6764, 51.9941], [23.5946, 51.8433], [23.6175, 51.7865], [23.5523, 51.7366], [23.5434, 51.5927], [23.6976, 51.4044],
    [23.6352, 51.3047], [23.8636, 51.1483], [23.9117, 51.0068], [23.9793, 50.9375], [24.1432, 50.8564], [23.9576, 50.808], [24.081, 50.713],
    [24.1077, 50.5408], [24.0107, 50.4928], [23.9813, 50.4048], [23.6822, 50.3682], [23.1015, 49.9571], [22.6658, 49.5674], [22.6409, 49.5288],
    [22.7378, 49.2754], [22.6817, 49.1612], [22.8534, 49.0848], [22.8553, 48.994], [22.0408, 49.1975], [21.9284, 49.3308], [21.8196, 49.3772],
    [21.7576, 49.3489], [21.6012, 49.4265], [21.4279, 49.4098], [21.2605, 49.4494], [21.1941, 49.4006], [21.0688, 49.4192], [21.0333, 49.3997],
    [21.0725, 49.3572], [20.919, 49.2903], [20.6895, 49.4005], [20.544, 49.3708], [20.3177, 49.3916], [20.2844, 49.3386], [20.1359, 49.3089],
    [20.0505, 49.1732], [19.9379, 49.2251], [19.7607, 49.1942], [19.8086, 49.2709], [19.7693, 49.3931], [19.627, 49.4019], [19.6348, 49.4413],
    [19.5568, 49.4539], [19.4573, 49.5981], [19.2341, 49.5072], [19.1417, 49.3942], [18.9623, 49.3892], [18.9611, 49.4928], [18.8332, 49.5103]
];

window.generateIDWImage = function(lats, lons, vals, scale, cmin, cmax, drawIso, stepVal = null) {
    const w = 360, h = 270;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w; 
    offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d');
    const imgData = offCtx.createImageData(w, h);
    const valGrid = new Float32Array(w * h);
    
    const minLat = 48.5, maxLat = 55.5;
    const minLon = 13.5, maxLon = 24.5;
    const minMercY = latToMercY(minLat);
    const maxMercY = latToMercY(maxLat);
    
    const pts = [];
    for(let i=0; i<lats.length; i++) {
        const px = ((lons[i] - minLon) / (maxLon - minLon)) * w;
        const py = (1 - (latToMercY(lats[i]) - minMercY) / (maxMercY - minMercY)) * h;
        pts.push({x: px, y: py, v: vals[i]});
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let num = 0, den = 0;
            for(let i=0; i<pts.length; i++) {
                const dx = x - pts[i].x;
                const dy = y - pts[i].y;
                let d2 = dx*dx + dy*dy;
                if(d2 < 0.5) d2 = 0.5;
                const weight = 1.0 / (d2 * d2);
                num += weight * pts[i].v;
                den += weight;
            }
            const val = num / den;
            const idx = (y * w + x);
            valGrid[idx] = val;
            
            const rgba = getColorRGBA(val, scale, cmin, cmax);
            const pIdx = idx * 4;
            imgData.data[pIdx] = rgba[0];
            imgData.data[pIdx+1] = rgba[1];
            imgData.data[pIdx+2] = rgba[2];
            imgData.data[pIdx+3] = rgba[3]; 
        }
    }
    
    const isoLabels = [];
    if (drawIso) {
        const step = (stepVal && !isNaN(stepVal) && stepVal > 0) ? stepVal : ((cmax - cmin) / 15);
        for (let y = 0; y < h - 1; y++) {
            for (let x = 0; x < w - 1; x++) {
                const idx = y * w + x;
                const v1 = valGrid[idx];
                const v2 = valGrid[idx + 1];
                const v3 = valGrid[idx + w];
                
                const q1 = Math.floor(v1 / step);
                const q2 = Math.floor(v2 / step);
                const q3 = Math.floor(v3 / step);

                if (q1 !== q2 || q1 !== q3) {
                    const pIdx = idx * 4;
                    imgData.data[pIdx] = 15;
                    imgData.data[pIdx+1] = 23;
                    imgData.data[pIdx+2] = 42;
                    imgData.data[pIdx+3] = 220; // Wyraźna linia izobary
                    
                    if (x > 20 && x < w - 20 && y > 20 && y < h - 20 && x % 55 === 0 && y % 45 === 0) {
                        const roundedVal = (Math.round(v1 / step) * step).toFixed(step < 1 ? 1 : 0);
                        isoLabels.push({ x, y, text: roundedVal });
                    }
                }
            }
        }
    }
    
    offCtx.putImageData(imgData, 0, 0);

    if (drawIso && isoLabels.length > 0) {
        offCtx.font = 'bold 9px monospace';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        for (let lbl of isoLabels) {
            offCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            offCtx.fillRect(lbl.x - 14, lbl.y - 6, 28, 12);
            offCtx.fillStyle = '#ffffff';
            offCtx.fillText(lbl.text, lbl.x, lbl.y);
        }
    }

    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = w;
    mainCanvas.height = h;
    const mainCtx = mainCanvas.getContext('2d');

    mainCtx.beginPath();
    for (let i = 0; i < POLAND_POLY_COORDS.length; i++) {
        const [pLon, pLat] = POLAND_POLY_COORDS[i];
        const px = ((pLon - minLon) / (maxLon - minLon)) * w;
        const py = (1 - (latToMercY(pLat) - minMercY) / (maxMercY - minMercY)) * h;
        if (i === 0) mainCtx.moveTo(px, py);
        else mainCtx.lineTo(px, py);
    }
    mainCtx.closePath();
    mainCtx.clip();

    mainCtx.drawImage(offCanvas, 0, 0);
    return mainCanvas.toDataURL();
};

window.calculateDewPoint = function(T, RH) {
    if (T === null || RH === null || isNaN(T) || isNaN(RH)) return null;
    const a = 17.27, b = 237.7;
    const alpha = ((a * T) / (b + T)) + Math.log(RH / 100.0);
    return ((b * alpha) / (a - alpha));
};

window.calculateLCL = function(T, Td) {
    if (T === null || Td === null || isNaN(T) || isNaN(Td)) return null;
    return Math.max(0, 125 * (T - Td));
};

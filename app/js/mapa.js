window.initMapa = function() {
    setTimeout(() => {
        if (window.premiumMap) window.premiumMap.remove();

        const map = L.map('premium-map', { center: [51.9194, 19.1451], zoom: 6, zoomControl: false });
        window.premiumMap = map;
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // KROK 1: MAP PANES (Miasta na wierzchu)
        map.createPane('basePane');
        map.getPane('basePane').style.zIndex = 200;
        
        map.createPane('weatherPane');
        map.getPane('weatherPane').style.zIndex = 300;
        
        map.createPane('labelsPane');
        map.getPane('labelsPane').style.zIndex = 650;
        map.getPane('labelsPane').style.pointerEvents = 'none';

        // Geoman Setup (Kreator)
        if(map.pm) {
            map.pm.addControls({
                position: 'topleft',
                drawCircleMarker: false,
                drawPolyline: false,
                drawRectangle: false,
                drawCircle: false,
                editMode: true,
                dragMode: true,
                cutPolygon: false,
                removalMode: true,
            });
            
            map.pm.setGlobalOptions({
                pathOptions: { color: '#ef4444', weight: 3, fillOpacity: 0.4 }
            });

            map.on('pm:create', e => {
                const layer = e.layer;
                layer.on('click', () => {
                    if (map.pm.globalRemovalModeEnabled()) {
                        map.removeLayer(layer);
                    }
                });
            });
        }
        
        window.setDrawingColor = function(color) {
            if(map.pm) {
                map.pm.setGlobalOptions({ pathOptions: { color: color, weight: 3, fillOpacity: 0.4 } });
                map.pm.enableDraw('Polygon');
            }
        };
        
        window.clearMap = function() {
            if(!map) return;
            map.eachLayer(layer => {
                if (layer instanceof L.Polygon && !layer._url) map.removeLayer(layer);
            });
        };
        
        window.exportMap = function() {
            alert('Funkcja eksportu wymaga html2canvas i odpowiedniego skonfigurowania proxy dla kafelków mapy. (Do zaimplementowania w kolejnym kroku)');
        };

        window.openEnsembleModal = function() {
            const modal = document.getElementById('ensemble-modal');
            modal.style.display = 'block';
            
            const thresh = document.getElementById('ens-thresh').value;
            const days = document.getElementById('ens-days').value;
            
            // Wgrywamy iframe z prognozą
            const container = document.getElementById('ensemble-iframe-container');
            container.innerHTML = `<iframe src="prognoza/dashboard.html?v=3&thresh=${thresh}&days=${days}" style="width: 100%; height: 100%; border: none;"></iframe>`;
        };

        // Warstwa bazowa (Tylko lądy/wody, bez napisów)
        const darkBase = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', { 
            maxZoom: 20, pane: 'basePane' 
        });
        
        // Warstwa górna (Tylko Etykiety miast)
        const darkLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { 
            maxZoom: 20, pane: 'labelsPane' 
        });

        const lightBase = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', { 
            maxZoom: 20, pane: 'basePane' 
        });
        const lightLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', { 
            maxZoom: 20, pane: 'labelsPane' 
        });

        // Tło dla etykiet żeby były czytelne niezależnie od interpolacji
        map.getPane('labelsPane').style.filter = 'drop-shadow(0px 0px 3px rgba(255,255,255,0.8)) drop-shadow(0px 0px 1px rgba(0,0,0,1))';

        const basemaps = {
            "Ciemny (Dark)": L.layerGroup([darkBase, darkLabels]),
            "Jasny (Voyager)": L.layerGroup([lightBase, lightLabels])
        };
        basemaps["Ciemny (Dark)"].addTo(map);

        // ----------------------------------------------------
        // RAINVIEWER RADAR
        // ----------------------------------------------------
        let radarLayers = [], timestamps = [], currentFrame = 0, animationTimer = null;
        
        fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then(res => res.json())
            .then(data => {
                timestamps = data.radar.past.map(t => t.time).concat(data.radar.nowcast.map(t => t.time));
                document.getElementById('rv-slider').max = timestamps.length - 1;
                document.getElementById('rv-slider').value = timestamps.length - 1;

                timestamps.forEach((time, index) => {
                    const layer = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${time}/256/{z}/{x}/{y}/2/1_1.png`, {
                        opacity: index === timestamps.length - 1 ? 0.7 : 0, pane: 'weatherPane'
                    }).addTo(map);
                    radarLayers.push(layer);
                });
                if(timestamps.length) updateTimeDisplay(timestamps.length - 1);
            });

        function updateTimeDisplay(index) {
            if(!timestamps[index]) return;
            document.getElementById('rv-time').textContent = new Date(timestamps[index] * 1000).toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});
        }

        function showFrame(index) {
            radarLayers.forEach((layer, i) => layer.setOpacity(i === parseInt(index) ? 0.7 : 0));
            updateTimeDisplay(index);
        }

        document.getElementById('rv-slider').addEventListener('input', e => showFrame(currentFrame = parseInt(e.target.value)));
        document.getElementById('rv-play-btn').addEventListener('click', e => {
            const btn = e.currentTarget;
            if (animationTimer) {
                clearInterval(animationTimer); animationTimer = null;
                btn.innerHTML = '<i data-lucide="play"></i>';
            } else {
                btn.innerHTML = '<i data-lucide="pause"></i>';
                if(currentFrame >= radarLayers.length - 1) currentFrame = 0;
                animationTimer = setInterval(() => {
                    currentFrame = currentFrame >= radarLayers.length - 1 ? 0 : currentFrame + 1;
                    document.getElementById('rv-slider').value = currentFrame;
                    showFrame(currentFrame);
                }, 500);
            }
            lucide.createIcons();
        });

        // ----------------------------------------------------
        // IMGW DATA (Firebase + IDW Interpolation)
        // ----------------------------------------------------
        let imgwData = null;
        let idwOverlay = null;
        const imgwLayerGroup = L.layerGroup().addTo(map);
        
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0,0,0];
        }

        function getColorRGBA(val, scale, cmin, cmax) {
            if(val === null || isNaN(val)) return [0,0,0,0];
            let norm = (val - cmin) / (cmax - cmin);
            if (norm < 0) norm = 0;
            if (norm > 1) norm = 1;
            
            let colorHex = scale[scale.length-1][1];
            for(let i = 0; i < scale.length - 1; i++) {
                if(norm >= scale[i][0] && norm <= scale[i+1][0]) {
                    colorHex = scale[i][1];
                    break;
                }
            }
            const rgb = hexToRgb(colorHex);
            return [rgb[0], rgb[1], rgb[2], 160];
        }

        function generateIDWImage(lats, lons, vals, scale, cmin, cmax, drawIso) {
            const canvas = document.createElement('canvas');
            canvas.width = 240; 
            canvas.height = 160;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(canvas.width, canvas.height);
            const valGrid = new Float32Array(canvas.width * canvas.height);
            
            const minLat = 48.5, maxLat = 55.5;
            const minLon = 13.5, maxLon = 24.5;
            
            const radiusScale = parseFloat(document.getElementById('radius-bg').value) || 15;
            const maxD2 = radiusScale * radiusScale; // kwadrat promienia, wpływa na gładkość
            
            const pts = [];
            for(let i=0; i<lats.length; i++) {
                const px = ((lons[i] - minLon) / (maxLon - minLon)) * canvas.width;
                const py = (1 - (lats[i] - minLat) / (maxLat - minLat)) * canvas.height;
                pts.push({x: px, y: py, v: vals[i]});
            }

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    let num = 0, den = 0;
                    for(let i=0; i<pts.length; i++) {
                        const dx = x - pts[i].x;
                        const dy = y - pts[i].y;
                        let d2 = dx*dx + dy*dy;
                        if(d2 < 0.5) d2 = 0.5;
                        const w = 1.0 / (d2 * d2);
                        num += w * pts[i].v;
                        den += w;
                    }
                    const val = num / den;
                    const idx = (y * canvas.width + x);
                    valGrid[idx] = val;
                    
                    const rgba = getColorRGBA(val, scale, cmin, cmax);
                    
                    const pIdx = idx * 4;
                    imgData.data[pIdx] = rgba[0];
                    imgData.data[pIdx+1] = rgba[1];
                    imgData.data[pIdx+2] = rgba[2];
                    imgData.data[pIdx+3] = rgba[3]; 
                }
            }
            
            if (drawIso) {
                const step = (cmax - cmin) / 15; // np. co ~2 stopnie dla temp
                for (let y = 0; y < canvas.height - 1; y++) {
                    for (let x = 0; x < canvas.width - 1; x++) {
                        const idx = y * canvas.width + x;
                        const v1 = valGrid[idx];
                        const v2 = valGrid[idx + 1];
                        const v3 = valGrid[idx + canvas.width];
                        
                        if (Math.floor(v1 / step) !== Math.floor(v2 / step) || Math.floor(v1 / step) !== Math.floor(v3 / step)) {
                            const pIdx = idx * 4;
                            imgData.data[pIdx] = 0;
                            imgData.data[pIdx+1] = 0;
                            imgData.data[pIdx+2] = 0;
                            imgData.data[pIdx+3] = 120; // lekko przezroczyste czarne linie
                        }
                    }
                }
            }
            
            ctx.putImageData(imgData, 0, 0);
            return canvas.toDataURL();
        }

        function calculateDewPoint(temp_c, rh_pct) {
            if(temp_c == null || rh_pct == null || rh_pct <= 0) return null;
            const a = 17.27, b = 237.7;
            const alpha = (a * temp_c) / (b + temp_c) + Math.log(rh_pct / 100.0);
            return (b * alpha) / (a - alpha);
        }

        let imgwLiveCache = null;
        let imgwLiveCacheTime = 0;

        async function getIMGWLiveData() {
            const now = Date.now();
            if(imgwLiveCache && (now - imgwLiveCacheTime < 60000)) return imgwLiveCache; // 1 min cache
            
            document.getElementById('imgw-loading').style.display = 'flex';
            document.getElementById('imgw-loading').innerHTML = '<i data-lucide="loader" class="spin"></i> Pobieranie danych z IMGW (Live)...';
            
            try {
                const res = await fetch('https://danepubliczne.imgw.pl/api/data/meteo/');
                const rawData = await res.json();
                
                const dataObj = {
                    'temp': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] },
                    'wiatr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] },
                    'wiatr_sr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] },
                    'rosy': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] },
                    'wilg': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] },
                    'grunt': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] },
                    'synop': { pt_lats: [], pt_lons: [], pt_vals: [], pt_txts: [], pt_hov: [] }
                };

                for(let st of rawData) {
                    const lat = parseFloat(st.lat);
                    const lon = parseFloat(st.lon);
                    if(isNaN(lat) || isNaN(lon)) continue;
                    const nazwa = st.nazwa_stacji;

                    const temp = parseFloat(st.temperatura_powietrza);
                    const temp_t = st.temperatura_powietrza_data;
                    const temp_grunt = parseFloat(st.temperatura_gruntu);
                    const grunt_t = st.temperatura_gruntu_data;
                    const wilg = parseFloat(st.wilgotnosc_wzgledna);
                    const wilg_t = st.wilgotnosc_wzgledna_data;
                    const wiatr_sr = parseFloat(st.wiatr_srednia_predkosc);
                    const wiatr_sr_t = st.wiatr_srednia_predkosc_data;
                    const wiatr_poryw = parseFloat(st.wiatr_poryw_10min);
                    const wiatr_max = parseFloat(st.wiatr_predkosc_maksymalna);
                    
                    // Weź nowszy czas z porywów
                    const wiatr_por_t = st.wiatr_poryw_10min_data || st.wiatr_predkosc_maksymalna_data;
                    
                    const formatTime = (dateStr) => {
                        if(!dateStr) return '';
                        const parts = dateStr.split(' ');
                        if(parts.length > 1) return ` <span style="font-size:0.75rem; color:#a1a1aa;">(${parts[1].substring(0, 5)})</span>`;
                        return '';
                    };
                    
                    const dewPoint = calculateDewPoint(temp, wilg);
                    
                    const porywy = [wiatr_poryw, wiatr_max].filter(v => !isNaN(v)).map(v => v * 3.6);
                    const wiatr_poryw_kmh = porywy.length ? Math.max(...porywy) : NaN;
                    const wiatr_sr_kmh = !isNaN(wiatr_sr) ? wiatr_sr * 3.6 : NaN;

                    const addData = (zmienna, val, txt, hov) => {
                        if(isNaN(val)) return;
                        dataObj[zmienna].pt_lats.push(lat);
                        dataObj[zmienna].pt_lons.push(lon);
                        dataObj[zmienna].pt_vals.push(val);
                        dataObj[zmienna].pt_txts.push(txt);
                        dataObj[zmienna].pt_hov.push(`<b>${nazwa}</b><br>${hov}`);
                    };

                    addData('temp', temp, temp?.toFixed(1) + '°', `Temperatura: ${temp?.toFixed(1)}°C${formatTime(temp_t)}`);
                    addData('grunt', temp_grunt, temp_grunt?.toFixed(1) + '°', `Temp. Gruntu: ${temp_grunt?.toFixed(1)}°C${formatTime(grunt_t)}`);
                    addData('wilg', wilg, wilg?.toFixed(0) + '%', `Wilgotność: ${wilg?.toFixed(0)}%${formatTime(wilg_t)}`);
                    addData('rosy', dewPoint, dewPoint?.toFixed(1) + '°', `Punkt Rosy: ${dewPoint?.toFixed(1)}°C${formatTime(temp_t)}`);
                    addData('wiatr', wiatr_poryw_kmh, wiatr_poryw_kmh?.toFixed(0), `Poryw Wiatru: ${wiatr_poryw_kmh?.toFixed(0)} km/h${formatTime(wiatr_por_t)}`);
                    addData('wiatr_sr', wiatr_sr_kmh, wiatr_sr_kmh?.toFixed(0), `Wiatr (Śr): ${wiatr_sr_kmh?.toFixed(0)} km/h${formatTime(wiatr_sr_t)}`);
                    
                    // synop: display temp as value, but text contains more info
                    if(!isNaN(temp) && !isNaN(wiatr_sr_kmh) && !isNaN(wilg)) {
                        addData('synop', temp, temp?.toFixed(1) + '°', `Temp: ${temp?.toFixed(1)}°C${formatTime(temp_t)}<br>Wiatr: ${wiatr_poryw_kmh?.toFixed(0)} km/h${formatTime(wiatr_por_t)}<br>Wilg: ${wilg}%${formatTime(wilg_t)}`);
                    }
                }
                
                imgwLiveCache = dataObj;
                imgwLiveCacheTime = now;
                document.getElementById('imgw-loading').style.display = 'none';
                return imgwLiveCache;
            } catch (err) {
                console.error("Błąd IMGW Live API:", err);
                document.getElementById('imgw-loading').innerHTML = "Błąd pobierania danych IMGW API.";
                return null;
            }
        }

        window.renderIMGW = async function() {
            const okres = document.getElementById('imgw-okres').value;
            const zmienna = document.getElementById('imgw-zmienna').value;
            
            let data = null;
            
            if (okres === 'now') {
                const liveDataObj = await getIMGWLiveData();
                if(liveDataObj) {
                    data = liveDataObj[zmienna];
                }
            } else {
                // Historia Firebase
                if(!imgwData || !imgwData.MAP_DATA) return;
                const ds = imgwData.MAP_DATA[zmienna];
                if(ds && ds[okres]) data = ds[okres];
            }

            if(!data) return;

            imgwLayerGroup.clearLayers();
            if(idwOverlay) {
                map.removeLayer(idwOverlay);
                idwOverlay = null;
            }
            
            // ZInfo setup
            const zInfo = imgwData && imgwData.ZMIENNE ? imgwData.ZMIENNE[zmienna] : null;
            
            let scale;
            if (zInfo && zInfo.cscale && imgwData.COLORS[zInfo.cscale]) {
                scale = imgwData.COLORS[zInfo.cscale];
            } else {
                // Hardcoded scales based on variable if ZMIENNE not loaded yet
                if (zmienna.includes('temp') || zmienna === 'rosy' || zmienna === 'grunt' || zmienna === 'synop') {
                    scale = [[0,"#0000ff"],[0.25,"#00ffff"],[0.5,"#00ff00"],[0.75,"#ffff00"],[1,"#ff0000"]];
                } else if (zmienna.includes('wiatr')) {
                    scale = [[0,"#ffffff"],[0.2,"#a1dab4"],[0.4,"#41b6c4"],[0.6,"#2c7fb8"],[1,"#253494"]];
                } else if (zmienna === 'wilg') {
                    scale = [[0,"#ffffcc"],[0.5,"#41b6c4"],[1,"#0c2c84"]];
                } else {
                    scale = [[0, '#000000'], [1, '#ffffff']];
                }
            }
            
            const cmin = zInfo && zInfo.cmin !== undefined ? zInfo.cmin : (zmienna === 'wilg' ? 0 : -20);
            const cmax = zInfo && zInfo.cmax !== undefined ? zInfo.cmax : (zmienna === 'wilg' ? 100 : 40);
            
            const showTxt = document.getElementById('chk-txt').checked;
            const showPt = document.getElementById('chk-pt').checked;
            const showInter = document.getElementById('chk-inter').checked;
            const showIso = document.getElementById('chk-iso') ? document.getElementById('chk-iso').checked : false;
            const opacityBg = parseInt(document.getElementById('opa-bg').value) / 100;
            
            if(data.pt_lats && (showTxt || showPt)) {
                for(let i=0; i<data.pt_lats.length; i++) {
                    let htmlContent = '';
                    if(showTxt) htmlContent += `<div style="text-shadow: 0 0 3px black, 0 0 3px black; font-weight: bold;">${data.pt_txts[i]}</div>`;
                    if(showPt) htmlContent += `<div style="width:6px;height:6px;background:white;border-radius:50%;margin:2px auto;box-shadow:0 0 2px black;"></div>`;
                    
                    const icon = L.divIcon({
                        className: 'imgw-station-marker',
                        html: htmlContent,
                        iconSize: [30, 25],
                        iconAnchor: [15, 12]
                    });
                    
                    L.marker([data.pt_lats[i], data.pt_lons[i]], {icon: icon})
                     .bindTooltip(data.pt_hov[i])
                     .addTo(imgwLayerGroup);
                }
            }
            
            if(data.pt_lats && data.pt_lats.length > 5 && showInter) {
                const dataUrl = generateIDWImage(data.pt_lats, data.pt_lons, data.pt_vals, scale, cmin, cmax, showIso);
                const bounds = [[48.5, 13.5], [55.5, 24.5]];
                idwOverlay = L.imageOverlay(dataUrl, bounds, { opacity: opacityBg, pane: 'weatherPane' }).addTo(map);
            }
        }

        // Trigger fetches (handled by HTML onchange)
        
        // Fetch history data in the background just in case they select max/min
        fetch('https://meteo-bbe28-default-rtdb.europe-west1.firebasedatabase.app/imgw_map_data.json')
            .then(res => res.json())
            .then(data => {
                imgwData = data;
                // Don't hide loading yet if 'now' is selected, getIMGWLiveData will handle it
                if(document.getElementById('imgw-okres').value !== 'now') {
                    document.getElementById('imgw-loading').style.display = 'none';
                    window.renderIMGW();
                } else {
                    window.renderIMGW();
                }
            })
            .catch(err => console.error("Błąd IMGW Firebase:", err));

        // Initial render for 'now'
        window.renderIMGW();

        L.control.layers(
            basemaps,
            {"Stacje IMGW": imgwLayerGroup},
            {position: 'topright'}
        ).addTo(map);

        lucide.createIcons();
        setTimeout(() => map.invalidateSize(), 500);
    }, 200);
};
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
        
        map.createPane('radarPane');
        map.getPane('radarPane').style.zIndex = 400;
        
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

            window.currentDrawingMode = 'polygon';

            map.on('pm:create', e => {
                const layer = e.layer;
                
                if (window.currentDrawingMode === 'front_chlodny') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 40, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-chlodny-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 L 10 0 L 20 10 Z" fill="#3b82f6"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'front_chlodny_2') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 40, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-chlodny-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 L 10 0 L 20 10 Z" fill="#3b82f6"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'front_cieply') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 40, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-cieply-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 A 10 10 0 0 1 20 10 Z" fill="#ef4444"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'front_zokludowany') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 60, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-zokl-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 L 10 0 L 20 10 Z" fill="#d946ef"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })},
                            { offset: 45, repeat: 60, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-zokl-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 A 10 10 0 0 1 20 10 Z" fill="#d946ef"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'zbieznosc') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 10, repeat: 20, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'zbieznosc-icon',
                                        html: '<svg viewBox="0 0 10 10" style="width:10px;height:10px;"><path d="M 10 10 L 0 0" stroke="#f97316" stroke-width="2" fill="none"/></svg>',
                                        iconSize: [10, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'strzalka') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 18, polygon: true, pathOptions: {stroke: true, color: '#a8a29e', fillColor: '#a8a29e', fillOpacity: 1}}) }
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'wyz') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-wyz',
                        html: '<div style="color: #3b82f6; font-weight: bold; font-family: sans-serif; font-size: 32px; text-shadow: 0px 0px 4px white, 0px 0px 4px white; transform: translate(-50%, -50%);">W</div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'niz') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-niz',
                        html: '<div style="color: #ef4444; font-weight: bold; font-family: sans-serif; font-size: 32px; text-shadow: 0px 0px 4px white, 0px 0px 4px white; transform: translate(-50%, -50%);">N</div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'burza') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-burza',
                        html: '<div style="color: #ef4444; font-size: 32px; text-shadow: 0px 0px 4px white; transform: translate(-50%, -50%);">☈</div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'deszcz') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-deszcz',
                        html: '<div style="color: #22c55e; font-size: 32px; font-weight: bold; text-shadow: 0px 0px 4px white; transform: translate(-50%, -50%);">●</div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'snieg') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-snieg',
                        html: '<div style="color: #3b82f6; font-size: 32px; text-shadow: 0px 0px 4px white; transform: translate(-50%, -50%);">✱</div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'mgla') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-mgla',
                        html: '<div style="color: #eab308; font-size: 32px; font-weight: bold; text-shadow: 0px 0px 4px white; transform: translate(-50%, -50%);">≡</div>',
                        iconSize: [0, 0]
                    }));
                }
                
                layer.on('click', () => {
                    if (map.pm.globalRemovalModeEnabled()) {
                        map.removeLayer(layer);
                        if(layer._myDecorator) map.removeLayer(layer._myDecorator);
                    }
                });
                
                layer.on('pm:remove', () => {
                    if(layer._myDecorator) map.removeLayer(layer._myDecorator);
                });
            });
        }
        
        window.setDrawingColor = function(color) {
            if(map.pm) {
                window.currentDrawingMode = 'polygon';
                map.pm.setGlobalOptions({ pathOptions: { color: color, weight: 3, fillOpacity: 0.4, dashArray: '' } });
                map.pm.enableDraw('Polygon');
            }
        };

        window.setDrawingMode = function(mode) {
            if(!map.pm) return;
            window.currentDrawingMode = mode;
            if(mode === 'zbieznosc') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#f97316', weight: 3, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_chlodny') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#3b82f6', weight: 3, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_chlodny_2') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#3b82f6', weight: 3, fillOpacity: 0, dashArray: '8, 8' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_cieply') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#ef4444', weight: 3, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_zokludowany') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#d946ef', weight: 3, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'strzalka') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#a8a29e', weight: 4, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'kolko') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#22c55e', weight: 3, fillOpacity: 0.3, dashArray: '' } });
                map.pm.enableDraw('Circle');
            } else if(['wyz', 'niz', 'burza', 'deszcz', 'snieg', 'mgla'].includes(mode)) {
                map.pm.enableDraw('Marker');
            }
        };
        
        window.clearMap = function() {
            if(!map) return;
            map.eachLayer(layer => {
                if ((layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Circle || layer instanceof L.Marker) && !layer._url && layer.options.icon?.options?.className !== 'leaflet-div-icon leaflet-editing-icon') {
                    map.removeLayer(layer);
                    if(layer._myDecorator) map.removeLayer(layer._myDecorator);
                }
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
        
        const lightBase = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', { 
            maxZoom: 20, pane: 'basePane' 
        });

        // Własna warstwa z głównymi miastami (zamiast brzydkich z CartoDB)
        const majorCities = [
            { name: "Warszawa", lat: 52.2297, lon: 21.0122 },
            { name: "Kraków", lat: 50.0647, lon: 19.9450 },
            { name: "Łódź", lat: 51.7592, lon: 19.4560 },
            { name: "Wrocław", lat: 51.1079, lon: 17.0385 },
            { name: "Poznań", lat: 52.4064, lon: 16.9252 },
            { name: "Gdańsk", lat: 54.3520, lon: 18.6466 },
            { name: "Szczecin", lat: 53.4285, lon: 14.5528 },
            { name: "Bydgoszcz", lat: 53.1235, lon: 18.0084 },
            { name: "Lublin", lat: 51.2465, lon: 22.5684 },
            { name: "Białystok", lat: 53.1325, lon: 23.1688 },
            { name: "Katowice", lat: 50.2649, lon: 19.0238 },
            { name: "Rzeszów", lat: 50.0412, lon: 21.9991 },
            { name: "Olsztyn", lat: 53.7799, lon: 20.4942 },
            { name: "Kielce", lat: 50.8661, lon: 20.6286 },
            { name: "Opole", lat: 50.6711, lon: 17.9253 },
            { name: "Zielona Góra", lat: 51.9355, lon: 15.5062 },
            { name: "Toruń", lat: 53.0137, lon: 18.5984 },
            { name: "Gorzów Wlkp.", lat: 52.7368, lon: 15.2288 }
        ];

        const cityLabelsGroup = L.layerGroup();
        majorCities.forEach(city => {
            const icon = L.divIcon({
                className: 'custom-city-label',
                html: `<div style="font-weight: bold; font-size: 0.85rem; color: white; text-shadow: 0 0 3px black, 0 0 4px black, 0 0 5px black; white-space: nowrap; pointer-events: none;">${city.name}</div>`,
                iconSize: [80, 20],
                iconAnchor: [40, 10]
            });
            L.marker([city.lat, city.lon], {icon: icon, interactive: false}).addTo(cityLabelsGroup);
        });

        const basemaps = {
            "Ciemny (Dark)": L.layerGroup([darkBase, cityLabelsGroup]),
            "Jasny (Voyager)": L.layerGroup([lightBase, cityLabelsGroup])
        };
        basemaps["Ciemny (Dark)"].addTo(map);

        // ----------------------------------------------------
        // RAINVIEWER RADAR
        // ----------------------------------------------------
        let radarLayers = [], timestamps = [], currentFrame = 0, animationTimer = null;
        
        fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then(res => res.json())
            .then(data => {
                const host = data.host;
                timestamps = data.radar.past.concat(data.radar.nowcast);
                document.getElementById('rv-slider').max = timestamps.length - 1;
                document.getElementById('rv-slider').value = timestamps.length - 1;

                timestamps.forEach((frame, index) => {
                    const layer = L.tileLayer(`${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
                        opacity: index === timestamps.length - 1 ? 0.7 : 0, 
                        pane: 'radarPane',
                        maxZoom: 20,
                        maxNativeZoom: 12
                    }).addTo(map);
                    radarLayers.push(layer);
                });
                if(timestamps.length) updateTimeDisplay(timestamps.length - 1);
            });

        function updateTimeDisplay(index) {
            if(!timestamps[index]) return;
            document.getElementById('rv-time').textContent = new Date(timestamps[index].time * 1000).toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});
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

        // Uproszczony obrys granic Polski do maskowania interpolacji (Canvas clip)
        const POLAND_POLY_COORDS = [
            [19.443, 49.609], [19.362, 49.536], [19.234, 49.511], [19.188, 49.41], [18.98, 49.395], [18.972, 49.504], [18.837, 49.524],
            [18.805, 49.679], [18.625, 49.722], [18.575, 49.915], [18.322, 49.916], [18.035, 50.066], [18.009, 50.031], [18.046, 50.016],
            [17.869, 49.972], [17.705, 50.114], [17.65, 50.111], [17.601, 50.17], [17.759, 50.207], [17.713, 50.323], [17.617, 50.267],
            [17.35, 50.264], [17.34, 50.323], [17.248, 50.332], [17.204, 50.386], [16.908, 50.449], [16.86, 50.411], [17.003, 50.302],
            [17.028, 50.23], [16.847, 50.207], [16.704, 50.096], [16.58, 50.143], [16.548, 50.23], [16.361, 50.38], [16.287, 50.368],
            [16.198, 50.429], [16.445, 50.58], [16.343, 50.661], [16.234, 50.671], [16.188, 50.627], [16.104, 50.663], [16.006, 50.606],
            [15.989, 50.685], [15.861, 50.674], [15.814, 50.755], [15.706, 50.737], [15.439, 50.809], [15.375, 50.778], [15.368, 50.838],
            [15.277, 50.891], [15.274, 50.98], [15.189, 50.98], [15.172, 51.02], [14.985, 51.011], [15.002, 50.869], [14.823, 50.871],
            [14.965, 51.05], [15.037, 51.258], [14.947, 51.472], [14.729, 51.531], [14.758, 51.66], [14.591, 51.82], [14.694, 51.901],
            [14.758, 52.067], [14.682, 52.117], [14.715, 52.237], [14.576, 52.289], [14.535, 52.394], [14.633, 52.49], [14.605, 52.528],
            [14.64, 52.57], [14.124, 52.845], [14.162, 52.888], [14.144, 52.961], [14.352, 53.059], [14.377, 53.202], [14.45, 53.26],
            [14.306, 53.544], [14.284, 53.772], [14.208, 53.916], [14.409, 53.92], [15.286, 54.147], [16.102, 54.274], [16.53, 54.541],
            [16.89, 54.592], [17.263, 54.734], [17.968, 54.832], [18.329, 54.835], [18.733, 54.682], [18.829, 54.608], [18.451, 54.78],
            [18.396, 54.746], [18.542, 54.585], [18.58, 54.438], [18.88, 54.348], [19.307, 54.363], [19.638, 54.459], [21.446, 54.318],
            [22.642, 54.354], [22.888, 54.409], [23.476, 54.163], [23.529, 54.066], [23.481, 53.999], [23.549, 53.768], [23.799, 53.274],
            [23.917, 53.157], [23.872, 53.082], [23.946, 52.959], [23.939, 52.713], [23.756, 52.614], [23.467, 52.549], [23.178, 52.283],
            [23.2, 52.23], [23.507, 52.174], [23.654, 52.071], [23.689, 51.992], [23.612, 51.917], [23.602, 51.833], [23.64, 51.805],
            [23.527, 51.73], [23.565, 51.534], [23.67, 51.483], [23.651, 51.446], [23.701, 51.41], [23.646, 51.292], [23.858, 51.158],
            [23.97, 50.951], [24.145, 50.87], [23.957, 50.794], [24.087, 50.669], [24.035, 50.445], [23.727, 50.388], [23.279, 50.1],
            [22.641, 49.53], [22.747, 49.36], [22.715, 49.227], [22.747, 49.217], [22.707, 49.175], [22.893, 49.095], [22.892, 49.008],
            [22.225, 49.153], [22.03, 49.225], [21.961, 49.349], [21.84, 49.392], [21.778, 49.356], [21.631, 49.447], [21.434, 49.412],
            [21.277, 49.461], [21.192, 49.401], [21.124, 49.437], [21.047, 49.417], [21.094, 49.365], [20.94, 49.299], [20.723, 49.42],
            [20.576, 49.376], [20.325, 49.403], [20.314, 49.343], [20.146, 49.318], [20.076, 49.179], [19.982, 49.232], [19.795, 49.198],
            [19.758, 49.216], [19.823, 49.277], [19.791, 49.411], [19.639, 49.409], [19.529, 49.573], [19.443, 49.609]
        ];

        function generateIDWImage(lats, lons, vals, scale, cmin, cmax, drawIso) {
            const w = 260, h = 180;
            const offCanvas = document.createElement('canvas');
            offCanvas.width = w; 
            offCanvas.height = h;
            const offCtx = offCanvas.getContext('2d');
            const imgData = offCtx.createImageData(w, h);
            const valGrid = new Float32Array(w * h);
            
            const minLat = 48.5, maxLat = 55.5;
            const minLon = 13.5, maxLon = 24.5;
            
            const pts = [];
            for(let i=0; i<lats.length; i++) {
                const px = ((lons[i] - minLon) / (maxLon - minLon)) * w;
                const py = (1 - (lats[i] - minLat) / (maxLat - minLat)) * h;
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
            
            if (drawIso) {
                const step = (cmax - cmin) / 15;
                for (let y = 0; y < h - 1; y++) {
                    for (let x = 0; x < w - 1; x++) {
                        const idx = y * w + x;
                        const v1 = valGrid[idx];
                        const v2 = valGrid[idx + 1];
                        const v3 = valGrid[idx + w];
                        
                        if (Math.floor(v1 / step) !== Math.floor(v2 / step) || Math.floor(v1 / step) !== Math.floor(v3 / step)) {
                            const pIdx = idx * 4;
                            imgData.data[pIdx] = 0;
                            imgData.data[pIdx+1] = 0;
                            imgData.data[pIdx+2] = 0;
                            imgData.data[pIdx+3] = 120;
                        }
                    }
                }
            }
            
            offCtx.putImageData(imgData, 0, 0);

            // Główny canvas z precyzyjnym przycięciem (clip) ściśle do konturów Polski
            const mainCanvas = document.createElement('canvas');
            mainCanvas.width = w;
            mainCanvas.height = h;
            const mainCtx = mainCanvas.getContext('2d');

            mainCtx.beginPath();
            for (let i = 0; i < POLAND_POLY_COORDS.length; i++) {
                const [pLon, pLat] = POLAND_POLY_COORDS[i];
                const px = ((pLon - minLon) / (maxLon - minLon)) * w;
                const py = (1 - (pLat - minLat) / (maxLat - minLat)) * h;
                if (i === 0) mainCtx.moveTo(px, py);
                else mainCtx.lineTo(px, py);
            }
            mainCtx.closePath();
            mainCtx.clip(); // Maskowanie: poza Polską piksele pozostają w 100% przezroczyste

            mainCtx.drawImage(offCanvas, 0, 0);
            return mainCanvas.toDataURL();
        }

        // Zarządzanie kolejnością warstw (Z-Index Panes)
        window.setLayerPriority = function(layerName, position) {
            const zValues = {
                'inter': position === 'top' ? 420 : 300,
                'radar': position === 'top' ? 430 : 350,
                'drawings': position === 'top' ? 480 : 380
            };
            if (layerName === 'radar' && map.getPane('radarPane')) {
                map.getPane('radarPane').style.zIndex = zValues['radar'];
            } else if (layerName === 'inter' && map.getPane('weatherPane')) {
                map.getPane('weatherPane').style.zIndex = zValues['inter'];
            }
        };

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
                    'temp': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'wiatr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'wiatr_sr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'rosy': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'wilg': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'grunt': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'synop': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] }
                };

                for(let st of rawData) {
                    const lat = parseFloat(st.lat);
                    const lon = parseFloat(st.lon);
                    if(isNaN(lat) || isNaN(lon)) continue;
                    const nazwa = st.nazwa_stacji;
                    
                    const isDataValid = (dateStr) => {
                        if(!dateStr) return false;
                        const parts = dateStr.split(/[- :]/);
                        if (parts.length < 6) return false;
                        const dataDate = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]));
                        const diffHours = (Date.now() - dataDate.getTime()) / (1000 * 60 * 60);
                        return diffHours <= 3.5 && diffHours >= -1; // tolerancja dla spóźnionych stacji
                    };

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
                    
                    const wiatr_kier = parseFloat(st.wiatr_kierunek);
                    
                    // Weź nowszy czas z porywów
                    const wiatr_por_t = st.wiatr_poryw_10min_data || st.wiatr_predkosc_maksymalna_data;
                    
                    const formatTime = (dateStr) => {
                        if(!dateStr) return '';
                        const parts = dateStr.split(/[- :]/);
                        if(parts.length >= 6) {
                            const utcDate = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]));
                            const localTime = utcDate.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'});
                            return ` <span style="font-size:0.75rem; color:#a1a1aa;">(${localTime})</span>`;
                        }
                        return '';
                    };
                    
                    const dewPoint = calculateDewPoint(temp, wilg);
                    
                    const porywy = [wiatr_poryw, wiatr_max].filter(v => !isNaN(v)).map(v => v * 3.6);
                    const wiatr_poryw_kmh = porywy.length ? Math.max(...porywy) : NaN;
                    const wiatr_sr_kmh = !isNaN(wiatr_sr) ? wiatr_sr * 3.6 : NaN;

                    const addData = (zmienna, val, txt, hov, dir, t_str, extra) => {
                        if(isNaN(val) || !isDataValid(t_str)) return;
                        dataObj[zmienna].pt_lats.push(lat);
                        dataObj[zmienna].pt_lons.push(lon);
                        dataObj[zmienna].pt_vals.push(val);
                        dataObj[zmienna].pt_dirs.push(dir !== undefined ? dir : null);
                        dataObj[zmienna].pt_txts.push(txt);
                        dataObj[zmienna].pt_hov.push(`<b>${nazwa}</b><br>${hov}`);
                        if(extra) {
                            if(!dataObj[zmienna].pt_extras) dataObj[zmienna].pt_extras = [];
                            dataObj[zmienna].pt_extras.push(extra);
                        }
                    };

                    addData('temp', temp, temp?.toFixed(1) + '°', `Temperatura: ${temp?.toFixed(1)}°C${formatTime(temp_t)}`, undefined, temp_t);
                    addData('grunt', temp_grunt, temp_grunt?.toFixed(1) + '°', `Temp. Gruntu: ${temp_grunt?.toFixed(1)}°C${formatTime(grunt_t)}`, undefined, grunt_t);
                    addData('wilg', wilg, wilg?.toFixed(0) + '%', `Wilgotność: ${wilg?.toFixed(0)}%${formatTime(wilg_t)}`, undefined, wilg_t);
                    addData('rosy', dewPoint, dewPoint?.toFixed(1) + '°', `Punkt Rosy: ${dewPoint?.toFixed(1)}°C${formatTime(temp_t)}`, undefined, temp_t);
                    addData('wiatr', wiatr_poryw_kmh, wiatr_poryw_kmh?.toFixed(0), `Poryw Wiatru: ${wiatr_poryw_kmh?.toFixed(0)} km/h${formatTime(wiatr_por_t)}`, wiatr_kier, wiatr_por_t);
                    addData('wiatr_sr', wiatr_sr_kmh, wiatr_sr_kmh?.toFixed(0), `Wiatr (Śr): ${wiatr_sr_kmh?.toFixed(0)} km/h${formatTime(wiatr_sr_t)}`, wiatr_kier, wiatr_sr_t);
                    
                    // synop: display temp as value, but text contains more info
                    if(!isNaN(temp) && isDataValid(temp_t)) {
                        const extra = { temp, dewPoint, wiatr_sr_kmh, wiatr_poryw_kmh, wiatr_kier, wilg };
                        addData('synop', temp, '', `Temp: ${temp?.toFixed(1)}°C${formatTime(temp_t)}<br>Wiatr: ${wiatr_poryw_kmh?.toFixed(0)} km/h${formatTime(wiatr_por_t)}<br>Wilg: ${wilg}%${formatTime(wilg_t)}`, wiatr_kier, temp_t, extra);
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
            const ptColorMode = document.getElementById('pt-color-mode') ? document.getElementById('pt-color-mode').value : 'scale';
            const opacityBg = parseInt(document.getElementById('opa-bg').value) / 100;
            
            if(data.pt_lats && (showTxt || showPt)) {
                for(let i=0; i<data.pt_lats.length; i++) {
                    let htmlContent = '';
                    const val = data.pt_vals[i];
                    
                    let ptColor = "white";
                    if (ptColorMode === 'scale') ptColor = "rgb(" + getColorRGBA(val, scale, cmin, cmax).slice(0,3).join(',') + ")";
                    else if (ptColorMode === 'black') ptColor = "black";
                    
                    if(zmienna === 'synop' && data.pt_extras && data.pt_extras[i]) {
                        // Render full synoptic station model
                        const ex = data.pt_extras[i];
                        htmlContent = `<div style="position: relative; width: 40px; height: 40px; margin: -10px -10px;">`;
                        
                        // Center dot
                        htmlContent += `<div style="position: absolute; top: 15px; left: 15px; width: 10px; height: 10px; background: ${ptColor}; border-radius: 50%; box-shadow: 0 0 2px black; border: 1px solid rgba(255,255,255,0.7); z-index: 10;"></div>`;
                        
                        // Top-left: Temperature (Red)
                        htmlContent += `<div style="position: absolute; top: -2px; left: -10px; width: 25px; text-align: right; color: #f87171; font-weight: bold; font-size: 0.8rem; text-shadow: 0 0 2px black, 0 0 3px black;">${ex.temp?.toFixed(1)}</div>`;
                        
                        // Bottom-left: Dew Point (Green/Blue)
                        if(ex.dewPoint) {
                            htmlContent += `<div style="position: absolute; top: 22px; left: -10px; width: 25px; text-align: right; color: #60a5fa; font-weight: bold; font-size: 0.8rem; text-shadow: 0 0 2px black, 0 0 3px black;">${ex.dewPoint?.toFixed(1)}</div>`;
                        }
                        
                        // Top-right: Gust / Wind
                        if(ex.wiatr_poryw_kmh && ex.wiatr_poryw_kmh > 0) {
                            htmlContent += `<div style="position: absolute; top: -2px; left: 25px; width: 25px; text-align: left; color: #fbbf24; font-weight: bold; font-size: 0.75rem; text-shadow: 0 0 2px black, 0 0 3px black;">${ex.wiatr_poryw_kmh?.toFixed(0)}</div>`;
                        }
                        
                        // Bottom-right: Humidity
                        if(!isNaN(ex.wilg)) {
                            htmlContent += `<div style="position: absolute; top: 22px; left: 25px; width: 25px; text-align: left; color: #9ca3af; font-size: 0.7rem; text-shadow: 0 0 2px black, 0 0 3px black;">${ex.wilg}%</div>`;
                        }
                        
                        // Wind Barb (Feathers)
                        if(!isNaN(ex.wiatr_kier) && ex.wiatr_sr_kmh > 0) {
                            const dir = ex.wiatr_kier + 180;
                            // Simplify barb: just a line with a small feather indicating speed (very basic)
                            htmlContent += `<div style="position: absolute; top: 11px; left: 11px; width: 18px; height: 18px; transform: rotate(${dir}deg); transform-origin: center;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 0px 2px black);">
                                    <line x1="12" y1="24" x2="12" y2="4"></line>
                                    <line x1="12" y1="4" x2="18" y2="8"></line>
                                </svg>
                            </div>`;
                        }
                        
                        htmlContent += `</div>`;
                        
                    } else {
                        // Standard marker
                        if(showTxt) htmlContent += `<div style="color: white; text-shadow: 0 0 3px black, 0 0 3px black; font-weight: bold;">${data.pt_txts[i]}</div>`;
                        
                        const isWind = (zmienna === 'wiatr' || zmienna === 'wiatr_sr');
                        
                        if (isWind && data.pt_dirs && !isNaN(data.pt_dirs[i]) && data.pt_dirs[i] !== null) {
                            const dir = data.pt_dirs[i] + 180;
                            htmlContent += `<div style="width:18px; height:18px; margin:2px auto; transform: rotate(${dir}deg); color: ${ptColor}; text-shadow: 0 0 2px black;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 0px 1px black);">
                                    <line x1="12" y1="21" x2="12" y2="3"></line>
                                    <polyline points="5 10 12 3 19 10"></polyline>
                                </svg>
                            </div>`;
                        } else if(showPt) {
                            htmlContent += `<div style="width:10px;height:10px;background:${ptColor};border-radius:50%;margin:2px auto;box-shadow:0 0 2px black; border:1px solid rgba(255,255,255,0.7);"></div>`;
                        }
                    }
                    
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
// kreator.js
// Logika kreatora map ostrzeżeń dla Łowców Burz

let kMap = null;
let currentColor = '#fbbf24';

window.initKreator = function() {
    if(kMap) return; // already initialized
    kMap = L.map('kreator-map').setView([52.069, 19.480], 5);
    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19
    });
    
    // Satelita Google
    const satellite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: '&copy; Google'
    });

    cartoDark.addTo(kMap);

    const baseMaps = {
        "Ciemny (Carto)": cartoDark,
        "Jasny (Carto)": cartoLight,
        "Satelita (Google)": satellite,
        "Standardowa (OSM)": osm
    };

    L.control.layers(baseMaps, null, {position: 'topright'}).addTo(kMap);

    kMap.pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawPolygon: true,
        drawCircle: false,
        editMode: true,
        dragMode: true,
        cutPolygon: false,
        removalMode: true,
    });

    kMap.pm.setPathOptions({
        color: currentColor,
        fillColor: currentColor,
        fillOpacity: 0.4,
        weight: 2
    });

    kMap.on('pm:drawstart', (e) => {
        kMap.pm.setPathOptions({
            color: currentColor,
            fillColor: currentColor,
            fillOpacity: 0.4,
            weight: 2
        });
    });
};

window.setDrawingColor = function(color) {
    currentColor = color;
    if (kMap) {
        kMap.pm.setPathOptions({
            color: currentColor,
            fillColor: currentColor,
            fillOpacity: 0.4,
            weight: 2
        });
    }
    
    const btns = document.querySelectorAll('.threat-btn');
    btns.forEach(b => {
        b.style.boxShadow = 'none';
        b.style.borderWidth = '1px';
    });
    if (event && event.currentTarget) {
        event.currentTarget.style.boxShadow = '0 0 10px ' + color;
        event.currentTarget.style.borderWidth = '2px';
    }
};

window.clearMap = function() {
    if(!kMap) return;
    if(confirm('Na pewno wyczyścić całą mapę?')) {
        kMap.eachLayer(function(layer){
            if(layer instanceof L.Path) {
                kMap.removeLayer(layer);
            }
        });
    }
};

window.exportMap = function() {
    const container = document.getElementById('export-container');
    const controls = document.querySelector('.leaflet-control-container');
    if (controls) controls.style.display = 'none';

    const rect = container.getBoundingClientRect();
    
    html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        width: rect.width,
        height: rect.height,
        scale: 1, 
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        backgroundColor: '#0f172a'
    }).then(canvas => {
        if (controls) controls.style.display = 'block';
        const link = document.createElement('a');
        link.download = 'b-meteo-forecast.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error("html2canvas error: ", err);
        if (controls) controls.style.display = 'block';
    });
};


// burze.js
// Ostrzeżenia i mapy z Burze.Dzis.Net

window.updateBurzeRamka = function() {
    const city = document.getElementById('burze-city-input')?.value.trim() || 'Wrocław';
    const container = document.getElementById('burze-ramka-container');
    if(!container) return;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: sans-serif; color: #fff; background: transparent; margin: 0; padding: 0; }
                a { color: #3b82f6; text-decoration: none; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 4px; border: 1px dotted #475569; text-align: center; }
                .yes { color: #22c55e; font-weight: bold; }
                .no { color: #ef4444; font-weight: bold; }
            </style>
        </head>
        <body>
            <script src="https://burze.dzis.net/ramka.php?wersja=2&miejscowosc=${encodeURIComponent(city)}&kolor_odnosnika=3b82f6&kolor_tla=0f172a&kolor_naglowka=1e293b&kolor_ostrzezenia=334155"><\/script>
        </body>
        </html>
    `;
    
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '250px';
    iframe.style.border = 'none';
    container.innerHTML = '';
    container.appendChild(iframe);
    
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlContent);
    iframe.contentWindow.document.close();
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize ramka on load
    setTimeout(window.updateBurzeRamka, 1500);

    // Initialize map
    setTimeout(() => {
        const mapContainer = document.getElementById('dzis-api-map');
        if(mapContainer && !window.dzisMapInit) {
            window.dzisMapInit = true;
            const dzisMap = L.map('dzis-api-map').setView([52.069, 19.480], 5);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://burze.dzis.net/">burze.dzis.net</a>'
            }).addTo(dzisMap);
  
            fetch('assets/js/burze_data.json')
              .then(r => r.json())
              .then(data => {
                  if (data && data.cities) {
                      data.cities.forEach(c => {
                          let warn = c.warnings;
                          if (!warn) return;
                          
                          let popupHtml = `<div style="text-align: center; color: #333;"><strong>${c.city}</strong><br>`;
                          let isWarn = false;
                          
                          if (warn.burza > 0) { popupHtml += `<span style="color: #eab308; font-weight: bold;">Burze: Stopień ${warn.burza}</span><br>`; isWarn = true; }
                          if (warn.wiatr > 0) { popupHtml += `<span style="color: #3b82f6; font-weight: bold;">Wiatr: Stopień ${warn.wiatr}</span><br>`; isWarn = true; }
                          if (warn.opad > 0) { popupHtml += `<span style="color: #22c55e; font-weight: bold;">Opad: Stopień ${warn.opad}</span><br>`; isWarn = true; }
                          if (warn.traba > 0) { popupHtml += `<span style="color: #ef4444; font-weight: bold;">Trąba: Stopień ${warn.traba}</span><br>`; isWarn = true; }
                          
                          popupHtml += `</div>`;
                          
                          let color = isWarn ? '#ef4444' : '#22c55e';
                          let r = isWarn ? 12 : 6;
                          
                          L.circleMarker([c.lat, c.lon], {
                              radius: r,
                              fillColor: color,
                              color: '#fff',
                              weight: 2,
                              opacity: 1,
                              fillOpacity: 0.8
                          }).bindPopup(isWarn ? popupHtml : `<div style="color: #333;"><strong>${c.city}</strong><br>Brak ostrzeżeń</div>`).addTo(dzisMap);
                      });
                  }
              }).catch(e => console.log('Error loading burze API data:', e));
        }
      }, 1000);
});

import codecs
import re

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

# 1. Replace the old burze.dzis.net static cards with a new map card
old_dzis_cards = re.search(r'<!-- Burze\.dzis\.net - Ostrzeżenia -->.*?</div>\s*<!-- Burze\.dzis\.net - Mapa Burzowa -->.*?</div>', html, re.DOTALL)

new_dzis_card = """<!-- Burze.dzis.net - Mapa API -->
          <div class="card tile-item" data-id="tile-dzis-api" style="padding: 1rem; cursor: grab; grid-column: span 2;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
              <h3 style="font-size: 1.1rem; color: var(--text-secondary); margin: 0;"><span style="font-size: 1.2rem; cursor: grab; margin-right: 5px;">✥</span> Ostrzeżenia i Burze API</h3>
            </div>
            <div id="dzis-api-map" style="width: 100%; height: 350px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); z-index: 1;"></div>
          </div>"""

if old_dzis_cards:
    html = html.replace(old_dzis_cards.group(0), new_dzis_card)
else:
    print("Could not find old dzis cards.")

# 2. Inject JS for dzis-api-map before </body>
dzis_js = """
    // Inicjalizacja mapy burze.dzis.net API
    setTimeout(() => {
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
                    
                    let html = `<div style="text-align: center; color: #fff;"><strong>${c.city}</strong><br>`;
                    let isWarn = false;
                    
                    // burza
                    if (warn.burza > 0) { html += `<span style="color: #eab308">Burze: Stopień ${warn.burza}</span><br>`; isWarn = true; }
                    // wiatr
                    if (warn.wiatr > 0) { html += `<span style="color: #3b82f6">Wiatr: Stopień ${warn.wiatr}</span><br>`; isWarn = true; }
                    // opad
                    if (warn.opad > 0) { html += `<span style="color: #22c55e">Opad: Stopień ${warn.opad}</span><br>`; isWarn = true; }
                    // traba
                    if (warn.traba > 0) { html += `<span style="color: #ef4444">Trąba: Stopień ${warn.traba}</span><br>`; isWarn = true; }
                    
                    html += `</div>`;
                    
                    let color = isWarn ? '#ef4444' : '#22c55e';
                    let r = isWarn ? 12 : 6;
                    
                    L.circleMarker([c.lat, c.lon], {
                        radius: r,
                        fillColor: color,
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).bindPopup(isWarn ? html : `<strong>${c.city}</strong><br>Brak ostrzeżeń`).addTo(dzisMap);
                });
            }
        }).catch(e => console.log('Error loading burze API data:', e));
    }, 1000);
"""

if "dzis-api-map" not in html and "function initKreator" in html:
    html = html.replace('</body>', dzis_js + '\n</body>')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)

print("Etap 3 JS injected")

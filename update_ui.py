import json
import re
import os

# Update dashboard_links.json
with open('assets/js/dashboard_links.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

data['sat24'] = 'https://danepubliczne.imgw.pl/datastore/getfiledown/Oper/CMM_mapy/satelita/SAT_IR_POLSKA.png'

with open('assets/js/dashboard_links.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

# Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace Blitzortung tile
blitz_regex = r'<!-- Blitzortung -->.*?</div>'
blitz_new = '''<!-- Blitzortung -->
          <div class="card tile-item" data-id="tile-blitzortung" style="padding: 1rem; cursor: grab; grid-column: span 2;">
            <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-secondary);"><span style="font-size: 1.2rem; cursor: grab; margin-right: 5px;">✥</span> Wyładowania Live (Blitzortung)</h3>
            <iframe src="https://map.blitzortung.org/#6/52.000/19.000" style="width: 100%; height: 400px; border: none; border-radius: var(--radius-sm);"></iframe>
          </div>'''
html = re.sub(blitz_regex, blitz_new, html, flags=re.DOTALL)

# 2. Add SOB and burze.dzis.net tiles at the beginning of dashboard-tiles
tiles_start = '<div id="dashboard-tiles" class="dashboard-grid">'
new_tiles = '''
          <!-- SOB Prognoza -->
          <div class="card tile-item" data-id="tile-sob" style="padding: 1rem; cursor: grab;" x-data="{
              sobImg: '',
              loading: true,
              async fetchSOB() {
                  try {
                      const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://obserwatorzy.info/prognoza-burz/'));
                      const data = await res.json();
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(data.contents, 'text/html');
                      const imgs = Array.from(doc.querySelectorAll('img'));
                      const targetImg = imgs.find(img => img.src && (img.src.includes('forecast') || img.src.includes('sob') || img.src.includes('prognoza')));
                      if(targetImg) this.sobImg = targetImg.src;
                      else this.sobImg = 'https://obserwatorzy.info/wp-content/uploads/2026/08/forecast-20260807.png';
                  } catch(e) {
                      this.sobImg = 'https://obserwatorzy.info/wp-content/uploads/2026/08/forecast-20260807.png';
                  }
                  this.loading = false;
              }
          }" x-init="fetchSOB()">
              <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-secondary);"><span style="font-size: 1.2rem; cursor: grab; margin-right: 5px;">✥</span> Prognoza SOB (Live)</h3>
              <div x-show="loading" class="skeleton-loader" style="height: 200px;"></div>
              <img x-show="!loading" :src="sobImg" alt="Prognoza SOB" class="zoomable" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-tertiary);" x-transition>
          </div>

          <!-- Burze.dzis.net - Ostrzeżenia -->
          <div class="card tile-item" data-id="tile-dzis-warn" style="padding: 1rem; cursor: grab;">
            <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-secondary);"><span style="font-size: 1.2rem; cursor: grab; margin-right: 5px;">✥</span> Ostrzeżenia (burze.dzis.net)</h3>
            <img class="zoomable" src="https://burze.dzis.net/img/zagrozenia.gif" alt="Zagrożenia" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-tertiary);">
          </div>

          <!-- Burze.dzis.net - Mapa Burzowa -->
          <div class="card tile-item" data-id="tile-dzis-storm" style="padding: 1rem; cursor: grab;">
            <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-secondary);"><span style="font-size: 1.2rem; cursor: grab; margin-right: 5px;">✥</span> Burze (burze.dzis.net)</h3>
            <img class="zoomable" src="https://burze.dzis.net/img/mapa_burzowa_europa.gif" alt="Mapa Burzowa" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-tertiary);">
          </div>
'''
if '<!-- SOB Prognoza -->' not in html:
    html = html.replace(tiles_start, tiles_start + new_tiles)

# 3. Update SAT24 Title and description in HTML
html = html.replace('Satelita (SAT24 PL/EU)', 'Satelita IR (IMGW)')

# 4. Update Baza Wiedzy to display images
# Find <template x-for="concept in meteo.thermoConcepts">
# Inside it, we add an image tag if concept.image exists.
template_thermo = '''<template x-for="concept in meteo.thermoConcepts">
                <div class="card" style="padding: 1.5rem; border-left: 4px solid var(--accent-primary);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                      <h3 x-text="concept.name" style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1.1rem;"></h3>
                      <span class="badge" x-text="concept.type" style="background: rgba(59, 130, 246, 0.1); color: var(--accent-primary);"></span>
                    </div>
                  </div>
                  <template x-if="concept.image">
                      <img :src="concept.image" alt="Ilustracja" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: var(--radius-sm); margin-bottom: 1rem; border: 1px solid var(--border-subtle);" class="zoomable">
                  </template>
                  <p x-text="concept.desc" style="color: var(--text-secondary); line-height: 1.5; font-size: 0.95rem; margin-bottom: 1rem;"></p>
                  <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px dashed var(--border-subtle);">
                    <code style="color: var(--accent-primary); font-size: 0.85rem;" x-text="concept.formula || concept.risk"></code>
                  </div>
                </div>
              </template>'''
              
old_template_thermo_regex = r'<template x-for="concept in meteo\.thermoConcepts">.*?</template>'
if '<template x-if="concept.image">' not in html:
    html = re.sub(old_template_thermo_regex, template_thermo, html, flags=re.DOTALL)

# Radar Signatures
template_radar = '''<template x-for="sig in meteo.radarSignatures">
                <div class="card" style="padding: 1.5rem; border-left: 4px solid var(--accent-secondary);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                      <h3 x-text="sig.name" style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1.1rem;"></h3>
                      <span class="badge" x-text="sig.type" style="background: rgba(16, 185, 129, 0.1); color: var(--accent-secondary);"></span>
                    </div>
                  </div>
                  <template x-if="sig.image">
                      <img :src="sig.image" alt="Sygnatura radarowa" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: var(--radius-sm); margin-bottom: 1rem; border: 1px solid var(--border-subtle);" class="zoomable">
                  </template>
                  <p x-text="sig.desc" style="color: var(--text-secondary); line-height: 1.5; font-size: 0.95rem; margin-bottom: 1rem;"></p>
                  <div style="background: rgba(239, 68, 68, 0.05); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px dashed rgba(239, 68, 68, 0.3);">
                    <span style="color: var(--danger); font-size: 0.85rem; font-weight: 500;">
                      <i data-lucide="alert-triangle" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> 
                      <span x-text="sig.risk"></span>
                    </span>
                  </div>
                </div>
              </template>'''
              
old_template_radar_regex = r'<template x-for="sig in meteo\.radarSignatures">.*?</template>'
if '<template x-if="sig.image">' not in html:
    html = re.sub(old_template_radar_regex, template_radar, html, flags=re.DOTALL)

# Also render Cloud Types (new section in Knowledge Base)
clouds_section = '''
            <div style="margin-top: 3rem;">
              <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <i data-lucide="cloud"></i> Chmury i Zjawiska Złowrogie
              </h3>
              <div class="grid-3" id="cloud-concepts-grid">
                <template x-for="cloud in meteo.cloudTypes">
                  <div class="card" style="padding: 1.5rem; border-left: 4px solid #8B5CF6;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                      <div>
                        <h3 x-text="cloud.name" style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1.1rem;"></h3>
                        <span class="badge" x-text="cloud.type" style="background: rgba(139, 92, 246, 0.1); color: #8B5CF6;"></span>
                      </div>
                    </div>
                    <template x-if="cloud.image">
                        <img :src="cloud.image" alt="Chmura" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: var(--radius-sm); margin-bottom: 1rem; border: 1px solid var(--border-subtle);" class="zoomable">
                    </template>
                    <p x-text="cloud.desc" style="color: var(--text-secondary); line-height: 1.5; font-size: 0.95rem; margin-bottom: 1rem;"></p>
                    <div style="background: rgba(239, 68, 68, 0.05); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px dashed rgba(239, 68, 68, 0.3);">
                      <span style="color: var(--danger); font-size: 0.85rem; font-weight: 500;">
                        <i data-lucide="alert-triangle" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> 
                        <span x-text="cloud.risk"></span>
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
'''
if 'id="cloud-concepts-grid"' not in html:
    html = html.replace('<!-- Ostrzeżenia Meteo -->', clouds_section + '\n\n            <!-- Ostrzeżenia Meteo -->')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

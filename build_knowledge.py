import codecs
import re
import shutil
import os

# 1. Copy images
src_dir = r"C:\Users\baluk\.gemini\antigravity-ide\brain\26def8cf-dc0a-46b7-9c4e-ba2e3d325259"
dst_dir = r"E:\meteo\assets\img"
os.makedirs(dst_dir, exist_ok=True)

# Find the specific images generated
files = os.listdir(src_dir)
arcus = next(f for f in files if f.startswith("arcus_cloud_") and f.endswith(".png"))
hook = next(f for f in files if f.startswith("hook_echo_") and f.endswith(".png"))
supercell = next(f for f in files if f.startswith("supercell_") and f.endswith(".png"))

shutil.copy(os.path.join(src_dir, arcus), os.path.join(dst_dir, "arcus_cloud.png"))
shutil.copy(os.path.join(src_dir, hook), os.path.join(dst_dir, "hook_echo.png"))
shutil.copy(os.path.join(src_dir, supercell), os.path.join(dst_dir, "supercell.png"))

# 2. Update index.html
with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

knowledge_content = """<div id="tab-knowledge" class="tab-view">
        <h2 class="section-title"><i data-lucide="book-open" style="margin-right: 10px;"></i> Baza Wiedzy (Zjawiska Burzowe)</h2>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px; max-width: 1000px;">
          
          <div class="card" style="padding: 1.5rem;">
            <h3 style="color: var(--accent-primary); border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem; margin-bottom: 1rem;">Superkomórka Burzowa (Supercell)</h3>
            <img src="assets/img/supercell.png" alt="Superkomórka" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin-bottom: 1rem; display: block;">
            <p><strong>Superkomórka</strong> to najgroźniejszy typ burzy. Charakteryzuje się obecnością wirującego prądu wstępującego (mezocyklonu). W przeciwieństwie do zwykłych burz, superkomórki potrafią istnieć przez wiele godzin i przemierzać setki kilometrów.</p>
            <ul style="margin-left: 20px; margin-top: 10px;">
              <li><strong>Zagrożenia:</strong> Ekstremalne opady gradu (często powyżej 5 cm), niszczące porywy wiatru zjawiska downburst oraz tornada.</li>
              <li><strong>Wizualnie:</strong> Posiada wyraźną chmurę stropową (wall cloud) oraz bezopadową bazę (updraft base).</li>
            </ul>
          </div>

          <div class="card" style="padding: 1.5rem;">
            <h3 style="color: var(--accent-primary); border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem; margin-bottom: 1rem;">Sygnatura Hook Echo</h3>
            <img src="assets/img/hook_echo.png" alt="Hook Echo" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin-bottom: 1rem; display: block;">
            <p><strong>Hook Echo</strong> to klasyczna sygnatura radarowa w kształcie "haka", która wskazuje na istnienie silnego mezocyklonu i potencjalnego tornada. Kształt ten powstaje, gdy prąd zstępujący z tyłu burzy (RFD) owija się wokół prądu wstępującego.</p>
            <ul style="margin-left: 20px; margin-top: 10px;">
              <li><strong>Interpretacja radaru:</strong> Rejon wcięcia haka to tzw. BWER (Bounded Weak Echo Region) – obszar bez opadu, gdzie zachodzi najsilniejsze wznoszenie i rotacja.</li>
            </ul>
          </div>

          <div class="card" style="padding: 1.5rem;">
            <h3 style="color: var(--accent-primary); border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem; margin-bottom: 1rem;">Wał Szkwałowy (Arcus)</h3>
            <img src="assets/img/arcus_cloud.png" alt="Arcus" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin-bottom: 1rem; display: block;">
            <p><strong>Chmura szelfowa (Shelf Cloud / Arcus)</strong> powstaje na styku ciepłego powietrza wstępującego oraz chłodnego, opadającego prądu zstępującego (zjawisko gust front / front szkwałowy). Wygląda jak długi, groźny wał chmurowy przesuwający się tuż nad ziemią.</p>
            <ul style="margin-left: 20px; margin-top: 10px;">
              <li><strong>Zagrożenia:</strong> Przejściu wału szkwałowego niemal zawsze towarzyszy bardzo nagły i niezwykle silny wiatr (szkwał) oraz gwałtowny spadek temperatury.</li>
            </ul>
          </div>

        </div>
      </div>"""

# Replace existing tab-knowledge
start_idx = html.find('<div id="tab-knowledge"')
if start_idx != -1:
    end_idx = html.find('<div id="tab-', start_idx + 10)
    if end_idx != -1:
        html = html[:start_idx] + knowledge_content + "\n\n      " + html[end_idx:]

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)

print("Knowledge base updated with images and descriptions")

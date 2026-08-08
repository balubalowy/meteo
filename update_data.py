import json
import re

with open('assets/js/data.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

# Replace strings to inject images safely in Python script (not via inline shell)
js_code = js_code.replace('name: "SBCAPE / MLCAPE / MUCAPE",', 'name: "SBCAPE / MLCAPE / MUCAPE",\n      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Supercell_thunderstorm.jpg/800px-Supercell_thunderstorm.jpg",')
js_code = js_code.replace('name: "Derecho Composite Parameter (DCP)",', 'name: "Derecho Composite Parameter (DCP)",\n      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Derecho_cloud.jpg/800px-Derecho_cloud.jpg",')
js_code = js_code.replace('name: "Significant Tornado Parameter (STP)",', 'name: "Significant Tornado Parameter (STP)",\n      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Tornado_in_Elie%2C_Manitoba_in_2007.jpg/800px-Tornado_in_Elie%2C_Manitoba_in_2007.jpg",')
js_code = js_code.replace('name: "Supercell Composite Parameter (SCP)",', 'name: "Supercell Composite Parameter (SCP)",\n      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Storm_supercell_near_Leoti%2C_Kansas.jpg/800px-Storm_supercell_near_Leoti%2C_Kansas.jpg",')
js_code = js_code.replace('name: "Wektor Corfidiego (MCS Propagation Vector)",', 'name: "Wektor Corfidiego (MCS Propagation Vector)",\n      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Shelf_cloud_panorama.jpg/800px-Shelf_cloud_panorama.jpg",')

js_code = js_code.replace('name: "Hook Echo (Haczyk Mezocyklonu)",', 'name: "Hook Echo (Haczyk Mezocyklonu)",\n      image: "https://upload.wikimedia.org/wikipedia/commons/2/23/Hook_echo.gif",')
js_code = js_code.replace('name: "Bow Echo & Rear Inflow Jet (RIJ)",', 'name: "Bow Echo & Rear Inflow Jet (RIJ)",\n      image: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Bow_echo_radar.gif",')
js_code = js_code.replace('name: "BWER (Bounded Weak Echo Region)",', 'name: "BWER (Bounded Weak Echo Region)",\n      image: "https://upload.wikimedia.org/wikipedia/commons/4/4b/BWER_radar.gif",')

new_knowledge = '''
  cloudTypes: [
    {
      name: "Arcus (Wał Szkwałowy)",
      type: "Chmura",
      desc: "Charakterystyczny wał chmurowy na czele burzy, zwiastujący gwałtowny wzrost prędkości wiatru (szkwał) i intensywne opady.",
      risk: "Silne porywy wiatru (Downburst / Derecho).",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Shelf_cloud_panorama.jpg/800px-Shelf_cloud_panorama.jpg"
    },
    {
      name: "Mammatus",
      type: "Chmura",
      desc: "Wypukłości w kształcie wymion na spodniej stronie kowadła burzowego (Incus). Powstają w strefach osiadania chłodnego, wilgotnego powietrza.",
      risk: "Często towarzyszą silnym superkomórkom gradowym, choć same w sobie nie są groźne.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Mammatus_clouds_over_Regina%2C_Saskatchewan.jpg/800px-Mammatus_clouds_over_Regina%2C_Saskatchewan.jpg"
    },
    {
      name: "Wall Cloud (Chmura Stropowa)",
      type: "Chmura",
      desc: "Wyraźne obniżenie podstawy chmury pod prądem wstępującym (mezocyklonem). Jeśli szybko rotuje, jest głównym wskaźnikiem formowania się tornada.",
      risk: "Wysokie ryzyko zejścia tornada mezocyklonalnego.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Wall_cloud.jpg/800px-Wall_cloud.jpg"
    },
    {
      name: "Chmura Lejkowa (Funnel Cloud)",
      type: "Zjawisko",
      desc: "Rotująca kolumna powietrza wyrastająca z podstawy chmury (zazwyczaj chmury stropowej), która nie dotyka ziemi. Jeśli dotknie powierzchni ziemi, staje się tornadem.",
      risk: "Zalążek tornada, wymaga natychmiastowej obserwacji.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Funnel_cloud.jpg/800px-Funnel_cloud.jpg"
    }
  ],
'''
if 'cloudTypes: [' not in js_code:
    js_code = js_code.replace('thermoConcepts: [', new_knowledge + '\n  thermoConcepts: [')

with open('assets/js/data.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print('Updated data.js with images and new knowledge')

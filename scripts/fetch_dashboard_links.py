import urllib.request
import re
import json
import os
from datetime import datetime

def fetch_html(url, charset='utf-8'):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        response = urllib.request.urlopen(req, timeout=15)
        return response.read().decode(charset, errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

def main():
    links = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "estofex": "https://www.estofex.org/cgi-bin/polygon/showforecast.cgi?map=yes&fcst=latest",
        "sat24": "https://en.sat24.com/en",
        "blitzortung": "https://map.blitzortung.org/#5.4/52/19",
        "lowcyburz": "https://lowcyburz.pl/"
    }

    # 1. Meteo.pl Wrocław
    html_meteo = fetch_html("https://www.meteo.pl/um/php/meteorogram_list.php?ntype=0u&row=436&col=181&lang=pl&cname=Wroc%B3aw", 'iso-8859-2')
    match = re.search(r'src="(.*?mgram_pict\.php.*?)"', html_meteo)
    if match:
        url = match.group(1)
        if url.startswith("../"):
            url = "https://www.meteo.pl/um/" + url[3:]
        elif not url.startswith("http"):
            url = "https://www.meteo.pl/um/php/" + url
        links['meteo_wroclaw'] = url

    # 2. Awiacja IMGW
    html_awiacja = fetch_html("https://awiacja.imgw.pl/prognozy-lotnicze/sigwx", 'utf-8')
    # Znalezienie img z src zawierającym sigwx (dowolne rozszerzenie png/jpg)
    match = re.search(r'src="([^"]*sigwx[^"]*\.(?:png|jpg))"', html_awiacja, re.IGNORECASE)
    if match:
        u = match.group(1)
        if not u.startswith("http"): u = "https://awiacja.imgw.pl" + u
        links['sigwx_polska'] = u

    # 3. DWD Hobby
    html_dwd = fetch_html("https://www.dwd.de/DE/leistungen/hobbymet_wk_europa/hobbyeuropakarten.html", 'utf-8')
    match = re.search(r'src="([^"]*bwk_bodendruck_na_ana\.png)"', html_dwd)
    if match:
        u = match.group(1)
        if not u.startswith("http"): u = "https://www.dwd.de" + u
        links['dwd_europa'] = u

    # 4. IMGW Public Data (Synoptyczna, CAPPI)
    # Szukamy najnowszego pliku po API
    try:
        # Mapa synoptyczna
        synop_json = fetch_html("https://danepubliczne.imgw.pl/api/data/datastore/Zjawiska_Meteo/Mapa_synoptyczna")
        if synop_json:
            files = json.loads(synop_json)
            # Find png files
            png_files = [f for f in files if f.endswith('.png')]
            if png_files:
                png_files.sort(reverse=True)
                links['imgw_synoptyczna'] = f"https://danepubliczne.imgw.pl/datastore/getfiledown/Zjawiska_Meteo/Mapa_synoptyczna/{png_files[0]}"
        
        # CAPPI
        cappi_json = fetch_html("https://danepubliczne.imgw.pl/api/data/datastore/Dane_radarowe/COMPO_CAPPI.comp.cappi")
        if cappi_json:
            files = json.loads(cappi_json)
            png_files = [f for f in files if f.endswith('.png')]
            if png_files:
                png_files.sort(reverse=True)
                links['imgw_cappi'] = f"https://danepubliczne.imgw.pl/datastore/getfiledown/Dane_radarowe/COMPO_CAPPI.comp.cappi/{png_files[0]}"
    except Exception as e:
        print("Błąd pobierania datastore:", e)


    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "js")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "dashboard_links.json")
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(links, f, indent=2)
        
    print(f"Zapisano linki do {out_file}")

if __name__ == "__main__":
    main()

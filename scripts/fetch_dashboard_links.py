import urllib.request
import re
import json
import os
from datetime import datetime

def fetch_html(url, charset='utf-8'):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'})
    try:
        response = urllib.request.urlopen(req, timeout=15)
        return response.read().decode(charset, errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

def get_latest_imgw_datastore(product):
    try:
        html = fetch_html(f"https://danepubliczne.imgw.pl/datastore/getfiledown/{product}")
        # Search for files like .png
        # The HTML usually has lines like: <a href="filename.png">filename.png</a>
        matches = re.findall(r'href="([^"]+\.png)"', html, re.IGNORECASE)
        if matches:
            matches.sort(reverse=True)
            return f"https://danepubliczne.imgw.pl/datastore/getfiledown/{product}/{matches[0]}"
    except Exception as e:
        print("Błąd datastore dla", product, ":", e)
    return ""

def main():
    links = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "estofex": "https://www.estofex.org/cgi-bin/polygon/showforecast.cgi?map=yes&fcst=latest",
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
    match_imgw = re.search(r'src="([^"]*sigwx_polska[^"]*\.(?:png|jpg|gif))"', html_awiacja, re.IGNORECASE)
    match_chmi = re.search(r'src="([^"]*sigwx_chmi[^"]*\.(?:png|jpg|gif))"', html_awiacja, re.IGNORECASE)
    if match_imgw:
        u = match_imgw.group(1)
        if not u.startswith("http"): u = "https://awiacja.imgw.pl" + u
        links['sigwx_imgw'] = u
    if match_chmi:
        u = match_chmi.group(1)
        if not u.startswith("http"): u = "https://awiacja.imgw.pl" + u
        links['sigwx_chmi'] = u

    # 3. DWD Hobby
    html_dwd = fetch_html("https://www.dwd.de/DE/leistungen/hobbymet_wk_europa/hobbyeuropakarten.html", 'utf-8')
    match = re.search(r'src="([^"]*bwk_bodendruck_na_ana\.png)"', html_dwd)
    if match:
        u = match.group(1)
        if not u.startswith("http"): u = "https://www.dwd.de" + u
        links['dwd_europa'] = u

    # 4. IMGW Datastore
    # Mapa synoptyczna
    syn_url = get_latest_imgw_datastore("Zjawiska_Meteo/Mapa_synoptyczna")
    if syn_url: links['imgw_synoptyczna'] = syn_url
    
    # CAPPI
    cappi_url = get_latest_imgw_datastore("Dane_radarowe/COMPO_CAPPI.comp.cappi")
    if cappi_url: links['imgw_cappi'] = cappi_url
    
    # LTS2005
    lts_url = get_latest_imgw_datastore("Dane_radarowe/COMPO_LTS2005.comp.lts")
    if lts_url: links['imgw_lts'] = lts_url

    # 5. Sat24 PL (Obejście iframe iframe protection przez pobranie najnowszego statycznego gifa)
    links['sat24'] = "https://api.sat24.com/animated/PL/visual/1/Central%20European%20Standard%20Time"
    
    # 6. Modele IMGW (Sondaże, Prognoza)
    html_sondaze = fetch_html("https://modele.imgw.pl/?page_id=49533")
    match_sondaz = re.search(r'src="([^"]*upload[^"]*\.png)"', html_sondaze, re.IGNORECASE)
    if match_sondaz:
        links['sondaze_imgw'] = match_sondaz.group(1)
        
    html_prognoza = fetch_html("https://modele.imgw.pl/?page_id=27337")
    match_prognoza = re.search(r'src="([^"]*upload[^"]*\.png)"', html_prognoza, re.IGNORECASE)
    if match_prognoza:
        links['prognoza_burz_imgw'] = match_prognoza.group(1)


    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "js")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "dashboard_links.json")
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(links, f, indent=2)
        
    print(f"Zapisano linki do {out_file}")

if __name__ == "__main__":
    main()

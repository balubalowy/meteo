import urllib.request
import urllib.parse
import re
import json
import os
import ssl
from datetime import datetime

# Disable SSL verification just in case IMGW has issues
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_html(url, charset='utf-8', data=None):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    try:
        if data:
            data = urllib.parse.urlencode(data).encode('utf-8')
        response = urllib.request.urlopen(req, data=data, context=ctx, timeout=15)
        return response.read().decode(charset, errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

def get_latest_imgw_datastore(path):
    try:
        url = "https://danepubliczne.imgw.pl/pl/datastore/getFilesList"
        data = {"productType": "oper", "path": path}
        html = fetch_html(url, data=data)
        
        # matches like href="datastore/getfiledown/Oper/mapasynoptyczna/mapasynop_202608010000.png"
        matches = re.findall(r'href=[\'"]datastore/getfiledown([^\'"]+(?:\.png|\.gif|\.jpg))[\'"]', html, re.IGNORECASE)
        if matches:
            # We want the regular image, not the _echoOnly for CAPPI
            filtered = [m for m in matches if '_echoOnly' not in m and '.tmb' not in m]
            if not filtered:
                filtered = matches
            latest = sorted(filtered)[-1]
            return f"https://danepubliczne.imgw.pl/datastore/getfiledown{latest}"
    except Exception as e:
        print("Błąd datastore dla", path, ":", e)
    return ""

def get_latest_imgw_datastore_all(path):
    """Returns list of all download URLs from a given IMGW datastore path."""
    try:
        url = "https://danepubliczne.imgw.pl/pl/datastore/getFilesList"
        data = {"productType": "oper", "path": path}
        html = fetch_html(url, data=data)
        
        matches = re.findall(r'href=[\'"]datastore/getfiledown([^\'\"]+(?:\.png|\.gif|\.jpg))[\'"]', html, re.IGNORECASE)
        return [f"https://danepubliczne.imgw.pl/datastore/getfiledown{m}" for m in matches]
    except Exception as e:
        print("Błąd datastore_all dla", path, ":", e)
    return []

def main():
    links = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "estofex": "https://www.estofex.org/cgi-bin/polygon/showforecast.cgi?map=yes&fcst=latest",
        "blitzortung": "https://images.blitzortung.org/Images/image_b_pl.png",
        "sat24": "https://eumetview.eumetsat.int/static-images/latestImages/EUMETSAT_MSG_RGBNatColour_CentralEurope.jpg",
        "sigwx_imgw": "https://aviation-api.imgw.pl/image/significant/pl",
        "sigwx_chmi": "https://aviation-api.imgw.pl/image/significant/cz"
    }

    # Lowcy Burz scraper
    try:
        req_lb = urllib.request.Request("https://lowcyburz.pl/", headers={'User-Agent': 'Mozilla/5.0'})
        html_lb = urllib.request.urlopen(req_lb, context=ctx, timeout=10).read().decode('utf-8', errors='ignore')
        matches = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html_lb)
        forecast_images = [m for m in matches if 'wp-content/uploads' in m and not 'logo' in m.lower() and not 'icon' in m.lower()]
        if forecast_images:
            links['lowcyburz'] = forecast_images[0]
        else:
            links['lowcyburz'] = ""
    except Exception as e:
        print("Błąd Lowcy Burz:", e)

    # 1. IMGW Datastore
    try:
        syn_url = get_latest_imgw_datastore("/Oper/mapasynoptyczna")
        if syn_url: links['imgw_synoptyczna'] = syn_url
    except Exception as e:
        print("Błąd mapy synoptycznej:", e)
        
    try:
        cappi_url = get_latest_imgw_datastore("/Oper/Polrad/Produkty/POLCOMP/COMPO_CAPPI.comp.cappi")
        if cappi_url: links['imgw_cappi'] = cappi_url
    except Exception as e:
        print("Błąd CAPPI:", e)
        
    try:
        lts_url = get_latest_imgw_datastore("/Oper/Perun/LTS2005")
        if lts_url: links['imgw_lts'] = lts_url
    except Exception as e:
        print("Błąd LTS:", e)

    # 2. Meteo.pl Wrocław
    links['meteo_wroclaw'] = "https://www.meteo.pl/um/metco/mgram_pict.php?ntype=0u&row=436&col=181&lang=pl"

    # 3. DWD Hobby
    links['dwd_europa'] = "https://www.dwd.de/DWD/wetter/wv_spez/hobbymet/wetterkarten/bwk_bodendruck_na_ana.png"

    # Sat24 live satellite
    links['sat24'] = "https://sat24.mobi/Image/satvis/europa/pl"

    # 4. CMM Synop (wszystkie produkty pogodowe z IMGW)
    # Ścieżka: /Oper/CMM_mapy/synop/, pliki: TEMPERATURA_2026080720.png
    cmm_products = {
        'cmm_temp': 'TEMPERATURA',
        'cmm_temp_min': 'TEMP_MIN_W_NOCY',
        'cmm_temp_max': 'TEMP_MAX_W_DZIEN',
        'cmm_temp_grunt': 'TEMP_GRUNT_MIN_W_NOCY',
        'cmm_temp_odcz': 'TEMP_ODCZ',
        'cmm_temp_srednia': 'TEMPERATURA_SREDNIA_DOBOWA',
        'cmm_opad': 'OPAD_SUMA_DOBOWA',
        'cmm_wiatr': 'WIATR',
        'cmm_poryw': 'PORYW_MAX',
        'cmm_cisnienie': 'CISNIENIE',
        'cmm_cisn_zmiana': 'CISNIENIE_ZMIANA_DOBOWA',
        'cmm_wilgotnosc': 'WILGOTNOSC',
        'cmm_zachmurzenie': 'ZACHMURZENIE_GODZ',
        'cmm_widzialnosc': 'WIDZIALNOSC',
        'cmm_uslonecznienie': 'USLONECZNIENIE',
        'cmm_podstawa': 'PODSTAWA_GODZ',
    }
    # Get all files from CMM_mapy/synop
    try:
        all_cmm_url = get_latest_imgw_datastore_all("/Oper/CMM_mapy/synop")
        for key, prefix in cmm_products.items():
            # Exact regex matching to avoid 'TEMPERATURA' matching 'TEMPERATURA_SREDNIA_DOBOWA'
            pattern = r'/' + re.escape(prefix) + r'_\d+(?:\.png|\.jpg|\.gif)$'
            matching = [f for f in all_cmm_url if re.search(pattern, f)]
            if matching:
                latest = sorted(matching)[-1]
                links[key] = latest
                print(f"  CMM {key}: OK ({latest.split('/')[-1]})")
            else:
                print(f"  CMM {key}: brak pliku")
    except Exception as e:
        print(f"  CMM błąd: {e}")

    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "js")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "dashboard_links.json")
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(links, f, indent=2)
        
    print(f"Zapisano linki do {out_file}")

if __name__ == "__main__":
    main()

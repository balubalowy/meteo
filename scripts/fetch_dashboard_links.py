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

def main():
    links = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "estofex": "https://www.estofex.org/cgi-bin/polygon/showforecast.cgi?map=yes&fcst=latest",
        "blitzortung": "https://map.blitzortung.org/#5.4/52/19",
        "lowcyburz": "https://lowcyburz.pl/"
    }

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

    # 3. Awiacja IMGW
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

    # 4. DWD Hobby
    links['dwd_europa'] = "https://www.dwd.de/DWD/wetter/wv_spez/hobbymet/wetterkarten/bwk_bodendruck_na_ana.png"

    # 5. Sat24 PL
    links['sat24'] = "https://api.sat24.com/animated/PL/visual/1/Central%20European%20Standard%20Time"
    
    # 6. Modele IMGW (Sondaże, Prognoza)
    # The user wants PDF or PNG. Since we can't easily parse WordPress, we can embed the iframes in HTML instead, or provide direct links.
    # We will let index.html handle this.

    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "js")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "dashboard_links.json")
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(links, f, indent=2)
        
    print(f"Zapisano linki do {out_file}")

if __name__ == "__main__":
    main()

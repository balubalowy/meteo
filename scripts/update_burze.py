import urllib.request
import urllib.parse
import json
import os
import time
import xml.etree.ElementTree as ET

API_KEY = "86d4e28c22fff6ce5a829dcb0836a10495068ef7"
SOAP_URL = "https://burze.dzis.net/soap.php"

# Limit to 6 cities to stay under 10/min rate limit safely
CITIES = {
    "Warszawa": (52.23, 21.01),
    "Kraków": (50.06, 19.94),
    "Wrocław": (51.11, 17.03),
    "Poznań": (52.41, 16.93),
    "Gdańsk": (54.35, 18.65),
    "Lublin": (51.25, 22.57)
}

def get_warnings(y, x):
    soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="https://burze.dzis.net/soap.php">
  <SOAP-ENV:Body>
    <ns1:ostrzezenia_pogodowe>
      <y>{y}</y>
      <x>{x}</x>
      <klucz>{API_KEY}</klucz>
    </ns1:ostrzezenia_pogodowe>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""

    req = urllib.request.Request(SOAP_URL, data=soap_body.encode('utf-8'))
    req.add_header('Content-Type', 'text/xml')
    try:
        response = urllib.request.urlopen(req, timeout=10)
        xml_res = response.read().decode('utf-8')
        
        root = ET.fromstring(xml_res)
        body = root.find('{http://schemas.xmlsoap.org/soap/envelope/}Body')
        resp = body.find('{https://burze.dzis.net/soap.php}ostrzezenia_pogodoweResponse')
        ret = resp.find('return')
        
        if ret is None: return None
        warnings = {}
        for child in ret:
            val = int(child.text) if child.text else 0
            warnings[child.tag] = val
        return warnings
    except Exception as e:
        print(f"Error fetching {y},{x}: {e}")
        return None

results = []
for name, (y, x) in CITIES.items():
    print(f"Fetching {name} ({y}, {x})...")
    # Wait 6 seconds between requests to respect 10/min rate limit
    time.sleep(6.1)
    
    warns = get_warnings(y, x)
    if warns:
        results.append({
            "city": name,
            "lat": y,
            "lon": x,
            "warnings": warns
        })

output_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'js', 'burze_data.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({"cities": results, "timestamp": time.time()}, f, indent=2, ensure_ascii=False)

print(f"Saved {len(results)} city warnings to {output_file}")

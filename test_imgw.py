import urllib.request, urllib.parse, re, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_html(url, data):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    encoded_data = urllib.parse.urlencode(data).encode('utf-8')
    response = urllib.request.urlopen(req, data=encoded_data, context=ctx, timeout=10)
    return response.read().decode('utf-8')

html = fetch_html('https://danepubliczne.imgw.pl/pl/datastore/getFilesList', {'productType': 'oper', 'path': '/Oper/mapasynoptyczna'})
matches = re.findall(r'href=[\'"]datastore/getfiledown([^\'"]+(?:\.png|\.gif|\.jpg))[\'"]', html, re.IGNORECASE)
print('All matches:')
for m in sorted(matches):
    print(m)

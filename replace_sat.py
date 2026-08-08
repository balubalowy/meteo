import codecs
import re

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

img_regex = r'<img id="dash-sat24"[^>]+>'
iframe_code = '<iframe sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" src="https://widgets.meteox.com/en-GB/widgets/radar/country/pl/satellite?z=6" style="width:100%!important;max-width:1080px!important;height:450px!important;padding:0px;border:none!important;box-sizing:border-box!important; border-radius: 8px;" scrolling="no" frameborder="0"></iframe>'

html = re.sub(img_regex, iframe_code, html, count=1)

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
print("Satellite replaced")

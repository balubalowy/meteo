import codecs
import re

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

# 1. Satelita span 2
sat_regex = r'<div class="card"\s+data-id="tile-sat24">'
sat_replacement = '<div class="card" data-id="tile-sat24" style="grid-column: span 2;">'
html = re.sub(sat_regex, sat_replacement, html)

# 2. Fix blurriness of burze.dzis.net images by removing width: 100% which stretches them
burze1_regex = r'<img id="dash-zagrozenia".*?>'
# We need to replace the style in the img tag
def replace_img_style(m):
    tag = m.group(0)
    tag = tag.replace('width: 100%;', 'max-width: 100%; height: auto; display: block; margin: 0 auto; image-rendering: crisp-edges;')
    return tag

html = re.sub(r'<img id="dash-zagrozenia"[^>]+>', replace_img_style, html)
html = re.sub(r'<img id="dash-burze"[^>]+>', replace_img_style, html)

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)

print("UI fixes applied")

import codecs
import re

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

# 1. Remove map nav button
html = re.sub(r'<a href="#" class="nav-link btn btn-ghost tab-btn" data-tab="tab-maps">.*?</a>\s*', '', html)

# 2. Remove tab-maps section entirely
# The section starts with <div id="tab-maps" class="tab-view"> and ends before the next <div id="tab-..."
maps_start = html.find('<div id="tab-maps" class="tab-view">')
if maps_start != -1:
    next_tab = html.find('<div id="tab-', maps_start + 10)
    if next_tab != -1:
        # We need to find the ending </div> of tab-maps
        # since next_tab might just be a sibling, it's safer to just slice out from maps_start to next_tab
        html = html[:maps_start] + html[next_tab:]
    else:
        print("Could not find next tab after tab-maps")

# 3. Fix initKreator in event listener
html = html.replace('// initKreator(); removed to avoid early init', 'initKreator(); // fixed')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)

print("Etap 1 completed")

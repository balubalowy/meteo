import codecs
with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

geoman_js = '<script src="https://unpkg.com/@geoman-io/leaflet-geoman-free@latest/dist/leaflet-geoman.min.js"></script>'
if geoman_js in html:
    html = html.replace(geoman_js, '')
    leaflet_js = '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>'
    html = html.replace(leaflet_js, leaflet_js + '\n  ' + geoman_js)

html = html.replace('initKreator();', '// initKreator(); removed to avoid early init')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)

with codecs.open('assets/js/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

app_js = app_js.replace('https://api.allorigins.win/get?url=', 'https://api.allorigins.win/raw?url=')
with codecs.open('assets/js/app.js', 'w', 'utf-8') as f:
    f.write(app_js)
print('Bugs fixed: load order, early init, CORS')

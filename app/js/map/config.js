// js/map/config.js - Słowniki stacji, skale barwne i konfiguracja warstw

window.SYNOP_STATIONS_COORDS = {
    "12100": { "lat": 54.18, "lon": 16.18, "name": "Kołobrzeg" },
    "12105": { "lat": 54.20, "lon": 16.18, "name": "Koszalin" },
    "12115": { "lat": 54.47, "lon": 17.03, "name": "Ustka" },
    "12120": { "lat": 54.76, "lon": 17.55, "name": "Łeba" },
    "12125": { "lat": 54.60, "lon": 18.80, "name": "Hel" },
    "12135": { "lat": 54.38, "lon": 18.47, "name": "Gdańsk-Rębiechowo" },
    "12155": { "lat": 54.17, "lon": 19.43, "name": "Elbląg" },
    "12160": { "lat": 54.25, "lon": 20.83, "name": "Bartoszyce" },
    "12185": { "lat": 54.15, "lon": 22.93, "name": "Suwałki" },
    "12195": { "lat": 53.98, "lon": 22.98, "name": "Augustów" },
    "12200": { "lat": 53.92, "lon": 14.25, "name": "Świnoujście" },
    "12205": { "lat": 53.40, "lon": 14.62, "name": "Szczecin" },
    "12215": { "lat": 53.65, "lon": 15.80, "name": "Resko" },
    "12230": { "lat": 53.72, "lon": 16.70, "name": "Szczecinek" },
    "12235": { "lat": 53.75, "lon": 17.55, "name": "Chojnice" },
    "12250": { "lat": 53.10, "lon": 18.00, "name": "Bydgoszcz" },
    "12270": { "lat": 53.78, "lon": 20.48, "name": "Olsztyn" },
    "12272": { "lat": 53.78, "lon": 21.57, "name": "Mikołajki" },
    "12280": { "lat": 53.35, "lon": 22.05, "name": "Łomża" },
    "12295": { "lat": 53.13, "lon": 23.17, "name": "Białystok" },
    "12300": { "lat": 52.73, "lon": 15.23, "name": "Gorzów Wlkp." },
    "12310": { "lat": 52.97, "lon": 16.57, "name": "Trzcianka" },
    "12330": { "lat": 52.42, "lon": 16.83, "name": "Poznań" },
    "12348": { "lat": 52.53, "lon": 18.25, "name": "Inowrocław" },
    "12360": { "lat": 52.73, "lon": 19.05, "name": "Włocławek" },
    "12375": { "lat": 52.17, "lon": 20.97, "name": "Warszawa-Okęcie" },
    "12385": { "lat": 52.18, "lon": 22.27, "name": "Siedlce" },
    "12399": { "lat": 52.03, "lon": 23.13, "name": "Biała Podlaska" },
    "12400": { "lat": 51.55, "lon": 15.03, "name": "Zielona Góra" },
    "12415": { "lat": 51.67, "lon": 16.08, "name": "Głogów" },
    "12418": { "lat": 51.65, "lon": 16.53, "name": "Leszno" },
    "12424": { "lat": 51.77, "lon": 18.08, "name": "Kalisz" },
    "12435": { "lat": 51.72, "lon": 19.40, "name": "Łódź" },
    "12455": { "lat": 51.55, "lon": 20.02, "name": "Tomaszów Maz." },
    "12465": { "lat": 51.40, "lon": 21.15, "name": "Radom" },
    "12485": { "lat": 51.57, "lon": 23.53, "name": "Włodawa" },
    "12495": { "lat": 51.23, "lon": 22.57, "name": "Lublin" },
    "12500": { "lat": 51.18, "lon": 15.00, "name": "Zgorzelec" },
    "12510": { "lat": 50.90, "lon": 15.73, "name": "Jelenia Góra" },
    "12520": { "lat": 51.10, "lon": 16.98, "name": "Wrocław" },
    "12530": { "lat": 50.72, "lon": 16.65, "name": "Kłodzko" },
    "12540": { "lat": 50.67, "lon": 17.93, "name": "Opole" },
    "12550": { "lat": 50.48, "lon": 17.33, "name": "Nysa" },
    "12560": { "lat": 50.23, "lon": 19.03, "name": "Katowice" },
    "12566": { "lat": 50.07, "lon": 19.95, "name": "Kraków" },
    "12570": { "lat": 50.80, "lon": 20.63, "name": "Kielce" },
    "12580": { "lat": 50.68, "lon": 21.75, "name": "Sandomierz" },
    "12585": { "lat": 50.60, "lon": 22.72, "name": "Zamość" },
    "12595": { "lat": 50.03, "lon": 22.00, "name": "Rzeszów" },
    "12600": { "lat": 49.80, "lon": 19.05, "name": "Bielsko-Biała" },
    "12625": { "lat": 49.23, "lon": 19.98, "name": "Zakopane" },
    "12650": { "lat": 49.63, "lon": 20.70, "name": "Nowy Sącz" },
    "12660": { "lat": 49.68, "lon": 21.77, "name": "Krosno" },
    "12670": { "lat": 49.45, "lon": 22.33, "name": "Lesko" },
    "12695": { "lat": 49.78, "lon": 22.77, "name": "Przemyśl" }
};

window.IMGW_RADAR_SCALE = [
    { dbz: 4, color: '#00ffff' },
    { dbz: 12, color: '#00c8ff' },
    { dbz: 16, color: '#0096ff' },
    { dbz: 20, color: '#0064ff' },
    { dbz: 24, color: '#0000ff' },
    { dbz: 28, color: '#00ff00' },
    { dbz: 32, color: '#00c800' },
    { dbz: 36, color: '#009600' },
    { dbz: 40, color: '#ffff00' },
    { dbz: 44, color: '#ffc800' },
    { dbz: 48, color: '#ff9600' },
    { dbz: 52, color: '#ff0000' },
    { dbz: 56, color: '#c80000' },
    { dbz: 60, color: '#960000' },
    { dbz: 64, color: '#ff00ff' },
    { dbz: 68, color: '#960096' },
    { dbz: 70, color: '#ffffff' }
];

window.DEFAULT_TEMP_COLORSCALE = [
    { val: -15, r: 140, g: 0, b: 180 },
    { val: -5, r: 0, g: 100, b: 220 },
    { val: 0, r: 0, g: 200, b: 255 },
    { val: 10, r: 50, g: 205, b: 50 },
    { val: 20, r: 255, g: 215, b: 0 },
    { val: 25, r: 255, g: 140, b: 0 },
    { val: 30, r: 230, g: 0, b: 0 },
    { val: 35, r: 150, g: 0, b: 50 }
];

window.DEFAULT_PRESSURE_COLORSCALE = [
    { val: 980, r: 214, g: 48, b: 49 },
    { val: 995, r: 243, g: 156, b: 18 },
    { val: 1005, r: 241, g: 196, b: 15 },
    { val: 1013, r: 46, g: 204, b: 113 },
    { val: 1020, r: 52, g: 152, b: 219 },
    { val: 1030, r: 142, g: 68, b: 173 },
    { val: 1040, r: 155, g: 89, b: 182 }
];

window.DEFAULT_WIND_COLORSCALE = [
    { val: 0, r: 50, g: 205, b: 50 },
    { val: 30, r: 255, g: 215, b: 0 },
    { val: 50, r: 255, g: 140, b: 0 },
    { val: 70, r: 230, g: 0, b: 0 },
    { val: 90, r: 150, g: 0, b: 50 },
    { val: 110, r: 140, g: 0, b: 180 }
];

window.DEFAULT_DEW_COLORSCALE = [
    { val: -5, r: 200, g: 180, b: 140 },
    { val: 5, r: 140, g: 200, b: 140 },
    { val: 10, r: 50, g: 205, b: 50 },
    { val: 15, r: 0, g: 180, b: 200 },
    { val: 18, r: 0, g: 100, b: 220 },
    { val: 20, r: 140, g: 0, b: 180 },
    { val: 22, r: 230, g: 0, b: 0 }
];

window.DEFAULT_LCL_COLORSCALE = [
    { val: 200, r: 140, g: 0, b: 180 },
    { val: 500, r: 0, g: 100, b: 220 },
    { val: 800, r: 0, g: 200, b: 255 },
    { val: 1200, r: 50, g: 205, b: 50 },
    { val: 1600, r: 255, g: 215, b: 0 },
    { val: 2000, r: 255, g: 140, b: 0 },
    { val: 2500, r: 230, g: 0, b: 0 }
];

window.DEFAULT_HUMIDITY_COLORSCALE = [
    { val: 20, r: 230, g: 0, b: 0 },
    { val: 40, r: 255, g: 140, b: 0 },
    { val: 60, r: 255, g: 215, b: 0 },
    { val: 80, r: 50, g: 205, b: 50 },
    { val: 95, r: 0, g: 100, b: 220 }
];

window.DEFAULT_GROUND_COLORSCALE = window.DEFAULT_TEMP_COLORSCALE;

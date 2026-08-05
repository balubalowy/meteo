import os
import sys
import json
import time
import requests
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
from scipy.interpolate import griddata
from scipy.stats import linregress

OUTPUT_DIR = "wykresy"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Granice Polski - uproszczony kontur
POLAND_BORDER = np.array([
    [14.12, 53.91], [14.24, 54.24], [14.77, 54.00], [15.22, 54.10], [16.00, 54.30],
    [16.80, 54.58], [17.55, 54.83], [18.30, 54.83], [18.86, 54.35], [19.64, 54.43],
    [19.89, 54.38], [20.00, 54.30], [20.60, 54.40], [21.50, 54.33], [22.75, 54.36],
    [22.92, 54.00], [23.50, 54.00], [23.90, 53.85], [23.50, 53.00], [23.90, 52.80],
    [23.10, 52.30], [23.60, 52.10], [23.10, 51.50], [24.00, 51.00], [24.14, 50.50],
    [23.30, 50.00], [22.80, 49.10], [22.50, 49.00], [21.00, 49.40], [20.00, 49.20],
    [19.00, 49.50], [18.00, 49.80], [17.00, 50.40], [16.00, 50.60], [15.00, 51.00],
    [14.80, 51.60], [14.60, 52.00], [14.40, 52.50], [14.20, 53.00], [14.12, 53.91]
])

TROPICAL_THRESHOLD = 20.0

def generate_south_grid():
    """Tylko południe Polski: szerokości <= 51.0"""
    from matplotlib.path import Path
    poly_path = Path(POLAND_BORDER)
    lats = np.arange(49.0, 51.2, 0.5)
    lons = np.arange(14.0, 24.5, 0.5)
    points = []
    for lat in lats:
        for lon in lons:
            if poly_path.contains_point((lon, lat)):
                points.append((lat, lon))
    return points

def fetch_bulk(points, start_year=1940, end_year=2024):
    """Pobiera dane dla wielu punktów w jednym strzale."""
    lats = ",".join([str(round(p[0], 2)) for p in points])
    lons = ",".join([str(round(p[1], 2)) for p in points])
    url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lats}&longitude={lons}&start_date={start_year}-01-01&end_date={end_year}-12-31&daily=temperature_2m_min&timezone=auto"
    
    for attempt in range(5):
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            # Open-Meteo zwraca listę jeśli zapytano o wiele punktów,
            # albo słownik jeśli o 1 punkt.
            if isinstance(data, dict):
                data = [data]
            return data
        print(f"  [Błąd {resp.status_code}] Czekam {5 * (attempt+1)}s...")
        time.sleep(5 * (attempt+1))
    return None

def process_data(api_data):
    """Zlicza noce tropikalne z pobranych danych JSON."""
    yearly_counts = {}
    dates = api_data['daily']['time']
    tmins = api_data['daily']['temperature_2m_min']
    
    for d, t in zip(dates, tmins):
        if t is None: continue
        y = int(d[:4])
        if y not in yearly_counts: yearly_counts[y] = 0
        if t >= TROPICAL_THRESHOLD:
            yearly_counts[y] += 1
    return yearly_counts

def create_simple_map(lons, lats, values, title, filename):
    fig, ax = plt.subplots(figsize=(10, 10), facecolor='#1a1a2e')
    ax.set_facecolor('#1a1a2e')
    
    # Rysuj cały kontur Polski
    ax.plot(POLAND_BORDER[:, 0], POLAND_BORDER[:, 1], color='#888888', linewidth=1.5)
    
    # Punkty z wartościami
    sc = ax.scatter(lons, lats, c=values, cmap='YlOrRd', s=300, edgecolor='white', linewidth=1, zorder=5)
    
    # Dodaj etykiety liczbowe obok kropek
    for lon, lat, val in zip(lons, lats, values):
        ax.text(lon, lat, f"{val:.1f}", color='black', fontsize=8, ha='center', va='center', fontweight='bold')
    
    cbar = plt.colorbar(sc, ax=ax, shrink=0.6, pad=0.02)
    cbar.set_label('Wartość', color='white')
    cbar.ax.yaxis.set_tick_params(color='white')
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color='white')
    
    ax.set_title(title, fontsize=14, color='white', pad=15)
    
    # Widok na całą Polskę
    ax.set_ylim(48.8, 55.0) 
    ax.set_xlim(13.5, 24.5)
    ax.axis('off')
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor='#1a1a2e')
    plt.close()
    return filepath

def main():
    pts = generate_south_grid()
    print(f"Wygenerowano {len(pts)} punktów dla Południa Polski (Szer. <= 51.0).")
    
    all_results = {}
    cache_file = os.path.join(OUTPUT_DIR, "cache_poludnie.json")
    
    if os.path.exists(cache_file):
        print(f"Wczytuję cache z {cache_file}...")
        with open(cache_file, 'r') as f:
            cached = json.load(f)
            for k, v in cached.items():
                lat, lon = map(float, k.split('_'))
                all_results[(lat, lon)] = {int(year): count for year, count in v.items()}
        print(f"Wczytano {len(all_results)} punktów z cache.")
    
    # Filtrujemy punkty, których nie ma w cache
    missing_pts = [p for p in pts if p not in all_results]
    
    if missing_pts:
        # Dzielimy na paczki po 10 punktów by nie przeciążyć URL-a
        chunk_size = 10
        for i in range(0, len(missing_pts), chunk_size):
            chunk = missing_pts[i:i+chunk_size]
            print(f"Pobieram paczkę brakujących punktów ({i+1} - {min(i+chunk_size, len(missing_pts))})...")
            
            responses = fetch_bulk(chunk)
            if responses:
                for pt, resp in zip(chunk, responses):
                    all_results[pt] = process_data(resp)
                
                # Zapisz cache
                cache_dict = {f"{lat}_{lon}": data for (lat, lon), data in all_results.items()}
                with open(cache_file, 'w') as f:
                    json.dump(cache_dict, f)
            else:
                print("Paczka zakończona niepowodzeniem.")
                break # Jeśli API twardo blokuje, przerwij pobieranie i rysuj z tego co jest
                
            time.sleep(2)
    
    print(f"Przygotowuję mapy dla {len(all_results)} punktów.")
    if len(all_results) == 0:
        print("Brak danych do narysowania.")
        return
        
    # Wyciągamy średnią z ostatnich 10 lat
    lats, lons, avgs = [], [], []
    for (lat, lon), yearly in all_results.items():
        recent = [yearly.get(y, 0) for y in range(2015, 2025)]
        avg = np.mean(recent) if recent else 0
        lats.append(lat)
        lons.append(lon)
        avgs.append(avg)
        
    create_simple_map(lons, lats, avgs, "Średnia roczna liczba nocy tropikalnych (2015-2024)", "mapa_szybka_poludnie.png")
    
    # Trend per dekada (1940-2024)
    trends = []
    for (lat, lon), yearly in all_results.items():
        y_arr = list(range(1940, 2025))
        c_arr = [yearly.get(y, 0) for y in y_arr]
        slope, _, _, _, _ = linregress(y_arr, c_arr)
        trends.append(slope * 10)
        
    create_simple_map(lons, lats, trends, "Trend nocy tropikalnych (1940-2024) [wzrost nocy/dekadę]", "mapa_szybka_trend.png")
    
    print("Mapy wygenerowane!")

if __name__ == '__main__':
    main()

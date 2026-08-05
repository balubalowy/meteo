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
LAT_MIN, LAT_MAX = 49.0, 55.0
LON_MIN, LON_MAX = 14.0, 24.5

def generate_grid():
    from matplotlib.path import Path
    poly_path = Path(POLAND_BORDER)
    lats = np.arange(49.0, 55.2, 0.5)
    lons = np.arange(14.0, 24.5, 0.5)
    points = []
    for lat in lats:
        for lon in lons:
            if poly_path.contains_point((lon, lat)):
                points.append((lat, lon))
    return points

def fetch_nasa_power(lat, lon, start="19810101", end="20241231"):
    url = f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MIN&community=RE&longitude={lon}&latitude={lat}&start={start}&end={end}&format=JSON"
    for attempt in range(3):
        r = requests.get(url)
        if r.status_code == 200:
            data = r.json()
            return data['properties']['parameter']['T2M_MIN']
        time.sleep(2)
    return None

def create_interpolated_map(lons, lats, values, title, filename, cmap_name='YlOrRd'):
    fig, ax = plt.subplots(figsize=(10, 10), facecolor='#1a1a2e')
    ax.set_facecolor('#1a1a2e')
    
    grid_lon = np.linspace(LON_MIN - 0.5, LON_MAX + 0.5, 400)
    grid_lat = np.linspace(LAT_MIN - 0.5, LAT_MAX + 0.5, 400)
    grid_lon_2d, grid_lat_2d = np.meshgrid(grid_lon, grid_lat)
    
    points = np.column_stack([lons, lats])
    grid_values = griddata(points, values, (grid_lon_2d, grid_lat_2d), method='cubic')
    
    from matplotlib.path import Path as MplPath
    poly_path = MplPath(POLAND_BORDER)
    mask_points = np.column_stack([grid_lon_2d.ravel(), grid_lat_2d.ravel()])
    mask = ~poly_path.contains_points(mask_points).reshape(grid_lon_2d.shape)
    grid_values_masked = np.ma.array(grid_values, mask=mask)
    
    im = ax.pcolormesh(grid_lon_2d, grid_lat_2d, grid_values_masked, cmap=cmap_name, shading='auto')
    
    ax.plot(POLAND_BORDER[:, 0], POLAND_BORDER[:, 1], color='white', linewidth=1.5)
    
    cbar = plt.colorbar(im, ax=ax, shrink=0.6, pad=0.02)
    cbar.ax.yaxis.set_tick_params(color='white')
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color='white')
    
    ax.set_title(title, fontsize=16, color='white', pad=15)
    ax.set_ylim(48.8, 55.0)
    ax.set_xlim(13.5, 24.5)
    ax.axis('off')
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor='#1a1a2e')
    plt.close()
    return filepath

def create_dot_map(lons, lats, values, title, filename):
    fig, ax = plt.subplots(figsize=(10, 10), facecolor='white')
    
    ax.plot(POLAND_BORDER[:, 0], POLAND_BORDER[:, 1], color='#333333', linewidth=1.5)
    
    vmin, vmax = np.min(values), np.max(values)
    sizes = np.clip((np.array(values) - vmin) / max(vmax - vmin, 0.01) * 250 + 30, 30, 300)
    
    sc = ax.scatter(lons, lats, c=values, s=sizes, cmap='Reds', edgecolors='white', zorder=5)
    cbar = plt.colorbar(sc, ax=ax, shrink=0.6, pad=0.02)
    
    ax.set_title(title, fontsize=16, pad=15)
    ax.set_ylim(48.8, 55.0)
    ax.set_xlim(13.5, 24.5)
    ax.axis('off')
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight')
    plt.close()
    return filepath

def main():
    pts = generate_grid()
    print(f"Wygenerowano {len(pts)} punktów (CAŁA POLSKA).")
    
    cache_file = os.path.join(OUTPUT_DIR, "nasa_cache.json")
    all_results = {}
    
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            cached = json.load(f)
            for k, v in cached.items():
                lat, lon = map(float, k.split('_'))
                all_results[(lat, lon)] = v
                
    missing = [p for p in pts if p not in all_results]
    
    if missing:
        print(f"Pobieram z NASA POWER ({len(missing)} punktów)...")
        for i, (lat, lon) in enumerate(missing):
            sys.stdout.write(f"\r  Pobieram punkt {i+1}/{len(missing)}...")
            sys.stdout.flush()
            
            tmin_dict = fetch_nasa_power(lat, lon)
            if tmin_dict:
                # Zlicz noce tropikalne per rok
                yearly = {}
                for date_str, temp in tmin_dict.items():
                    if temp == -999.0: continue # kod bledu w NASA
                    year = int(date_str[:4])
                    if year not in yearly: yearly[year] = 0
                    if temp >= 20.0:
                        yearly[year] += 1
                all_results[(lat, lon)] = yearly
                
                with open(cache_file, 'w') as f:
                    json.dump({f"{k[0]}_{k[1]}": v for k, v in all_results.items()}, f)
            time.sleep(1.2) # NASA limit: 60 req / min
            
    print("\nGotowe. Generuję mapy...")
    
    lats, lons, avgs, trends = [], [], [], []
    for (lat, lon), yearly in all_results.items():
        recent = [yearly.get(y, 0) for y in range(2015, 2025)]
        avgs.append(np.mean(recent) if recent else 0)
        
        y_arr = list(range(1981, 2025))
        c_arr = [yearly.get(y, 0) for y in y_arr]
        slope, _, _, _, _ = linregress(y_arr, c_arr)
        trends.append(slope * 10)
        
        lats.append(lat)
        lons.append(lon)
        
    create_interpolated_map(lons, lats, avgs, "Średnia roczna liczba nocy tropikalnych (2015-2024)", "nasa_mapa_avg.png")
    create_dot_map(lons, lats, trends, "Trend nocy tropikalnych (1981-2024) [wzrost nocy/dekadę]", "nasa_mapa_trend.png")

if __name__ == '__main__':
    main()

import os
import json
import numpy as np
import matplotlib.pyplot as plt
from scipy.interpolate import griddata
from scipy.stats import linregress
import geopandas as gpd

OUTPUT_DIR = "wykresy"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Wczytaj wysokiej jakości kontur Polski
POLAND_GDF = gpd.read_file("poland_hires.geojson")
poland_geom = POLAND_GDF.geometry.iloc[0]

# Wydobądź współrzędne do rysowania w matplotlib (zewnętrzny pierścień)
exterior_coords = np.array(poland_geom.exterior.coords)

LAT_MIN, LAT_MAX = 48.8, 55.0
LON_MIN, LON_MAX = 13.8, 24.5

def create_interpolated_map(lons, lats, values, title, filename, cmap_name='YlOrRd'):
    # Stylizacja a'la radar pogodowy / nowoczesna mapa
    fig, ax = plt.subplots(figsize=(10, 10), facecolor='#0B192C')
    ax.set_facecolor('#0B192C')
    
    grid_lon = np.linspace(LON_MIN, LON_MAX, 400)
    grid_lat = np.linspace(LAT_MIN, LAT_MAX, 400)
    grid_lon_2d, grid_lat_2d = np.meshgrid(grid_lon, grid_lat)
    
    points = np.column_stack([lons, lats])
    grid_values = griddata(points, values, (grid_lon_2d, grid_lat_2d), method='cubic')
    
    # Maskowanie poza granicami Polski przy użyciu wysokiej jakości wielokąta
    from matplotlib.path import Path as MplPath
    poly_path = MplPath(exterior_coords)
    mask_points = np.column_stack([grid_lon_2d.ravel(), grid_lat_2d.ravel()])
    mask = ~poly_path.contains_points(mask_points).reshape(grid_lon_2d.shape)
    grid_values_masked = np.ma.array(grid_values, mask=mask)
    
    # Rysuj plamę ciepła (heatmap)
    im = ax.pcolormesh(grid_lon_2d, grid_lat_2d, grid_values_masked, cmap=cmap_name, shading='auto', alpha=0.9)
    
    # Rysuj idealny kontur
    ax.plot(exterior_coords[:, 0], exterior_coords[:, 1], color='#FFFFFF', linewidth=2.0)
    
    # Opcjonalne delikatne cieniowanie pod konturem dla efektu 3D
    ax.plot(exterior_coords[:, 0]+0.02, exterior_coords[:, 1]-0.02, color='#000000', linewidth=1.5, alpha=0.3)
    
    cbar = plt.colorbar(im, ax=ax, shrink=0.6, pad=0.02)
    cbar.ax.yaxis.set_tick_params(color='white')
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color='white')
    
    ax.set_title(title, fontsize=16, color='white', pad=15, fontweight='bold')
    ax.set_ylim(LAT_MIN, LAT_MAX)
    ax.set_xlim(LON_MIN, LON_MAX)
    ax.axis('off')
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='#0B192C')
    plt.close()
    return filepath

def create_dot_map(lons, lats, values, title, filename):
    fig, ax = plt.subplots(figsize=(10, 10), facecolor='#1A1A2E')
    ax.set_facecolor('#1A1A2E')
    
    # Rysuj idealny kontur
    ax.plot(exterior_coords[:, 0], exterior_coords[:, 1], color='#FFFFFF', linewidth=1.5)
    ax.fill(exterior_coords[:, 0], exterior_coords[:, 1], color='#0B192C', alpha=0.5) # Lekkie tło dla Polski
    
    vmin, vmax = np.min(values), np.max(values)
    sizes = np.clip((np.array(values) - vmin) / max(vmax - vmin, 0.01) * 250 + 30, 30, 300)
    
    sc = ax.scatter(lons, lats, c=values, s=sizes, cmap='YlOrRd', edgecolors='black', linewidth=0.5, zorder=5, alpha=0.9)
    
    cbar = plt.colorbar(sc, ax=ax, shrink=0.6, pad=0.02)
    cbar.ax.yaxis.set_tick_params(color='white')
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color='white')
    
    ax.set_title(title, fontsize=16, color='white', pad=15, fontweight='bold')
    ax.set_ylim(LAT_MIN, LAT_MAX)
    ax.set_xlim(LON_MIN, LON_MAX)
    ax.axis('off')
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='#1A1A2E')
    plt.close()
    return filepath

def main():
    cache_file = os.path.join(OUTPUT_DIR, "nasa_cache.json")
    if not os.path.exists(cache_file):
        print("Brak pliku cache. Najpierw pobierz dane.")
        return
        
    all_results = {}
    with open(cache_file, 'r') as f:
        cached = json.load(f)
        for k, v in cached.items():
            lat, lon = map(float, k.split('_'))
            all_results[(lat, lon)] = v
            
    print(f"Wczytano {len(all_results)} punktów. Generuję piękne mapy...")
    
    lats, lons, avgs, trends = [], [], [], []
    for (lat, lon), yearly in all_results.items():
        recent = [yearly.get(str(y), yearly.get(y, 0)) for y in range(2015, 2025)]
        avgs.append(np.mean(recent) if recent else 0)
        
        y_arr = list(range(1981, 2025))
        c_arr = [yearly.get(str(y), yearly.get(y, 0)) for y in y_arr]
        slope, _, _, _, _ = linregress(y_arr, c_arr)
        trends.append(slope * 10)
        
        lats.append(lat)
        lons.append(lon)
        
    print("Rysuję mapę średnich...")
    create_interpolated_map(lons, lats, avgs, "Średnia roczna liczba nocy tropikalnych (2015-2024)", "nasa_mapa_avg_piekna.png", cmap_name='magma')
    
    print("Rysuję mapę trendów...")
    create_dot_map(lons, lats, trends, "Trend nocy tropikalnych (1981-2024) [wzrost nocy/dekadę]", "nasa_mapa_trend_piekna.png")
    print("Gotowe!")

if __name__ == '__main__':
    main()

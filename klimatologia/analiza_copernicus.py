"""
Pobieranie danych ERA5 z Copernicus CDS API
=============================================
Pobiera dzienne statystyki temperatury 2m (min, max, mean)
dla obszaru Polski od 1940 do 2025.

Używa zbioru: derived-era5-single-levels-daily-statistics
"""

import cdsapi
import xarray as xr
import numpy as np
import os
import sys
from scipy.interpolate import griddata
from scipy.stats import linregress
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Granice Polski (bounding box z buforem)
AREA = [55.0, 14.0, 49.0, 24.5]  # [N, W, S, E]

# Uproszczony kontur granic Polski
POLAND_BORDER = np.array([
    [14.12, 53.92], [14.22, 53.87], [14.40, 53.65], [14.58, 53.34],
    [14.63, 53.11], [14.60, 52.88], [14.55, 52.62], [14.64, 52.50],
    [14.75, 52.07], [14.97, 51.75], [14.98, 51.45], [14.83, 51.15],
    [14.97, 51.00], [14.99, 50.87], [15.01, 50.78], [15.35, 50.73],
    [15.68, 50.74], [16.00, 50.61], [16.21, 50.44], [16.42, 50.31],
    [16.58, 50.29], [16.86, 50.20], [17.00, 50.22], [17.15, 50.10],
    [17.42, 50.05], [17.70, 49.98], [17.85, 49.97], [18.05, 49.90],
    [18.18, 49.87], [18.56, 49.83], [18.58, 49.68], [18.83, 49.52],
    [18.85, 49.46], [19.15, 49.40], [19.44, 49.60], [19.60, 49.42],
    [19.77, 49.21], [19.83, 49.19], [20.07, 49.18], [20.28, 49.32],
    [20.62, 49.32], [20.81, 49.33], [21.08, 49.37], [21.45, 49.43],
    [21.78, 49.37], [22.07, 49.17], [22.56, 49.08], [22.68, 49.57],
    [22.71, 49.65], [23.48, 50.22], [23.98, 50.42], [24.10, 50.57],
    [23.95, 50.86], [23.87, 51.12], [23.65, 51.31], [23.61, 51.53],
    [23.53, 51.63], [23.60, 51.78], [23.62, 52.08], [23.18, 52.28],
    [23.80, 52.69], [23.90, 52.73], [23.48, 53.06], [23.87, 53.40],
    [23.56, 53.47], [23.28, 53.93], [22.77, 54.37], [22.12, 54.46],
    [21.24, 54.33], [20.80, 54.41], [19.80, 54.46], [19.60, 54.46],
    [18.97, 54.36], [18.67, 54.70], [18.42, 54.74], [18.32, 54.84],
    [17.93, 54.82], [17.27, 54.79], [16.80, 54.56], [16.18, 54.28],
    [15.88, 54.17], [15.23, 54.02], [14.75, 53.93], [14.58, 53.93],
    [14.21, 53.87], [14.12, 53.92]
])

TROPICAL_THRESHOLD = 20.0  # °C

def download_era5_year(client, year, output_path):
    """Pobierz dzienne Tmin z ERA5 dla jednego roku."""
    if os.path.exists(output_path):
        print(f"  Plik {output_path} już istnieje, pomijam pobieranie.")
        return True
    
    print(f"  Zlecam pobranie ERA5 za rok {year}...")
    
    try:
        client.retrieve(
            "derived-era5-single-levels-daily-statistics",
            {
                "product_type": "reanalysis",
                "variable": "2m_temperature",
                "year": str(year),
                "month": [f"{m:02d}" for m in range(1, 13)],
                "day": [f"{d:02d}" for d in range(1, 32)],
                "daily_statistic": "daily_minimum",
                "time_zone": "utc+01:00",
                "frequency": "1_hourly",
                "area": AREA,
                "data_format": "netcdf",
            },
            output_path
        )
        print(f"  ✓ Pobrano: {output_path}")
        return True
    except Exception as e:
        print(f"  ✗ Błąd dla {year}: {e}")
        return False


def download_era5_batch(client, start_year, end_year, batch_dir):
    """Pobierz dane ERA5 porcjami (rok po roku)."""
    os.makedirs(batch_dir, exist_ok=True)
    
    files = []
    for year in range(start_year, end_year + 1):
        fname = os.path.join(batch_dir, f"era5_tmin_{year}.nc")
        success = download_era5_year(client, year, fname)
        if success and os.path.exists(fname):
            files.append(fname)
    
    return files


def process_netcdf_files(nc_files):
    """Otwórz pliki NetCDF i policz noce tropikalne per rok per punkt siatki."""
    print("\nPrzetwarzanie plików NetCDF...")
    
    all_yearly = {}  # {(lat, lon): {year: count}}
    
    for nc_file in nc_files:
        try:
            ds = xr.open_dataset(nc_file)
            # Zmienna temperatury - ERA5 zwraca w Kelwinach
            # Szukamy zmiennej z temperaturą
            temp_var = None
            for vname in ds.data_vars:
                if 't2m' in vname.lower() or 'temperature' in vname.lower() or '2m' in vname.lower():
                    temp_var = vname
                    break
            
            if temp_var is None:
                temp_var = list(ds.data_vars)[0]
                print(f"  Używam zmiennej: {temp_var}")
            
            tmin = ds[temp_var]
            
            # Konwertuj z Kelwinów na Celsjusze jeśli potrzeba
            vals = tmin.values
            if np.nanmean(vals) > 100:  # prawdopodobnie w Kelwinach
                tmin = tmin - 273.15
            
            # Wyciągnij współrzędne
            lat_name = 'latitude' if 'latitude' in ds.coords else 'lat'
            lon_name = 'longitude' if 'longitude' in ds.coords else 'lon'
            time_name = 'time' if 'time' in ds.coords else 'valid_time'
            
            lats = ds[lat_name].values
            lons = ds[lon_name].values
            times = ds[time_name].values
            
            # Policz noce tropikalne
            for i, lat in enumerate(lats):
                for j, lon in enumerate(lons):
                    key = (float(np.round(lat, 2)), float(np.round(lon, 2)))
                    if key not in all_yearly:
                        all_yearly[key] = {}
                    
                    for t_idx, t in enumerate(times):
                        year = int(str(t)[:4])
                        tmin_val = float(tmin.values[t_idx, i, j])
                        
                        if np.isnan(tmin_val):
                            continue
                        
                        if year not in all_yearly[key]:
                            all_yearly[key][year] = 0
                        
                        if tmin_val >= TROPICAL_THRESHOLD:
                            all_yearly[key][year] += 1
            
            ds.close()
            year_str = os.path.basename(nc_file).replace('era5_tmin_', '').replace('.nc', '')
            print(f"  Przetworzono: {year_str}")
            
        except Exception as e:
            print(f"  Błąd przetwarzania {nc_file}: {e}")
    
    return all_yearly


def create_interpolated_map(lons, lats, values, title, filename, cmap_name='YlOrRd',
                            vmin=None, vmax=None, label="", extend='max'):
    """Stwórz interpolowaną mapę cieplną z konturem Polski."""
    fig, ax = plt.subplots(1, 1, figsize=(10, 9), facecolor='#1a1a2e')
    ax.set_facecolor('#1a1a2e')
    
    LON_MIN, LON_MAX = 14.0, 24.5
    LAT_MIN, LAT_MAX = 49.0, 55.0
    
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
    
    if vmin is None:
        vmin = np.nanmin(values)
    if vmax is None:
        vmax = np.nanmax(values)
    
    im = ax.pcolormesh(grid_lon_2d, grid_lat_2d, grid_values_masked,
                        cmap=cmap_name, vmin=vmin, vmax=vmax, shading='auto')
    
    ax.plot(POLAND_BORDER[:, 0], POLAND_BORDER[:, 1], color='white', linewidth=1.8,
            path_effects=[pe.Stroke(linewidth=3, foreground='black'), pe.Normal()])
    
    cbar = plt.colorbar(im, ax=ax, shrink=0.75, pad=0.02, extend=extend)
    cbar.set_label(label, fontsize=13, color='white', labelpad=10)
    cbar.ax.yaxis.set_tick_params(color='white')
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color='white', fontsize=11)
    
    ax.set_title(title, fontsize=16, fontweight='bold', color='white', pad=15)
    ax.set_xlim(LON_MIN - 0.3, LON_MAX + 0.3)
    ax.set_ylim(LAT_MIN - 0.2, LAT_MAX + 0.3)
    ax.set_aspect('auto')
    ax.tick_params(colors='#555555', labelsize=9)
    for spine in ax.spines.values():
        spine.set_color('#333333')
    
    ax.text(0.99, 0.01, 'Dane: ERA5 Copernicus CDS • Analiza: Python',
            transform=ax.transAxes, fontsize=8, color='#666666',
            ha='right', va='bottom')
    
    plt.tight_layout()
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"  Zapisano mapę: {filepath}")


def create_dot_map(lons, lats, values, title, filename, cmap_name='Reds',
                   vmin=None, vmax=None, label=""):
    """Stwórz mapę punktową (jak u kolegi z RStudio)."""
    fig, ax = plt.subplots(1, 1, figsize=(10, 9), facecolor='white')
    ax.set_facecolor('white')
    
    LON_MIN, LON_MAX = 14.0, 24.5
    LAT_MIN, LAT_MAX = 49.0, 55.0
    
    if vmin is None:
        vmin = np.nanmin(values)
    if vmax is None:
        vmax = np.nanmax(values)
    
    ax.plot(POLAND_BORDER[:, 0], POLAND_BORDER[:, 1], color='#333333', linewidth=1.5)
    
    values_arr = np.array(values)
    sizes = np.clip((values_arr - vmin) / max(vmax - vmin, 0.01) * 200 + 20, 20, 300)
    
    sc = ax.scatter(lons, lats, c=values_arr, s=sizes, cmap=cmap_name,
                    vmin=vmin, vmax=vmax, edgecolors='white', linewidths=0.5,
                    alpha=0.85, zorder=5)
    
    cbar = plt.colorbar(sc, ax=ax, shrink=0.7, pad=0.02)
    cbar.set_label(label, fontsize=13, labelpad=10)
    
    ax.set_title(title, fontsize=15, fontweight='bold', pad=15)
    ax.set_xlim(LON_MIN - 0.5, LON_MAX + 0.5)
    ax.set_ylim(LAT_MIN - 0.3, LAT_MAX + 0.4)
    ax.set_aspect('auto')
    ax.tick_params(labelsize=9, colors='#555555')
    
    ax.text(0.99, 0.01, 'Dane: ERA5 Copernicus CDS • Analiza: Python',
            transform=ax.transAxes, fontsize=8, color='#888888',
            ha='right', va='bottom')
    
    plt.tight_layout()
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight')
    plt.close()
    print(f"  Zapisano mapę: {filepath}")


def create_timeseries(all_data, filename):
    """Wykres słupkowy średniej nocy tropikalnych w Polsce."""
    years = sorted(set(y for data in all_data.values() for y in data.keys()))
    
    avg_per_year = []
    for year in years:
        vals = [data.get(year, 0) for data in all_data.values()]
        avg_per_year.append(np.mean(vals) if vals else 0)
    
    fig, ax = plt.subplots(figsize=(16, 6), facecolor='#1a1a2e')
    ax.set_facecolor('#1a1a2e')
    
    max_val = max(max(avg_per_year), 1)
    colors = plt.cm.YlOrRd(np.array(avg_per_year) / max_val)
    ax.bar(years, avg_per_year, color=colors, edgecolor='none', width=0.8)
    
    if len(years) > 5:
        z = np.polyfit(years, avg_per_year, 2)
        p = np.poly1d(z)
        ax.plot(years, p(years), color='cyan', linewidth=2, linestyle='--', alpha=0.8,
                label='Trend (wielomian 2. stopnia)')
        ax.legend(fontsize=11, facecolor='#2a2a4e', edgecolor='#444', labelcolor='white')
    
    ax.set_title('Średnia liczba nocy tropikalnych w Polsce (Tmin ≥ 20°C) – ERA5 Copernicus',
                 fontsize=15, fontweight='bold', color='white', pad=15)
    ax.set_xlabel('Rok', fontsize=13, color='white')
    ax.set_ylabel('Średnia liczba nocy tropikalnych', fontsize=13, color='white')
    ax.tick_params(colors='white', labelsize=10)
    for spine in ax.spines.values():
        spine.set_color('#444444')
    ax.set_xlim(min(years) - 1, max(years) + 1)
    
    plt.tight_layout()
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"  Zapisano wykres: {filepath}")


def main():
    print("=" * 70)
    print("  COPERNICUS ERA5 - NOCE TROPIKALNE W POLSCE")
    print("=" * 70)
    
    client = cdsapi.Client()
    batch_dir = os.path.join(OUTPUT_DIR, "era5_data")
    
    # KROK 1: Pobierz dane rok po roku
    # Zacznijmy od jednego roku testowego
    start_year = 1950
    end_year = 2024
    
    print(f"\nPobieram dane ERA5 za lata {start_year}-{end_year}...")
    print(f"Folder zapisu: {batch_dir}")
    print("-" * 50)
    
    nc_files = download_era5_batch(client, start_year, end_year, batch_dir)
    
    if not nc_files:
        print("\nBrak pobranych plików! Sprawdź klucz API i połączenie.")
        return
    
    # KROK 2: Przetwórz dane
    all_data = process_netcdf_files(nc_files)
    
    if not all_data:
        print("\nBrak danych do analizy!")
        return
    
    # Filtruj punkty wewnątrz Polski
    from matplotlib.path import Path as MplPath
    poly_path = MplPath(POLAND_BORDER)
    
    filtered = {}
    for (lat, lon), yearly in all_data.items():
        if poly_path.contains_point([lon, lat]):
            filtered[(lat, lon)] = yearly
    
    all_data = filtered
    print(f"\nPunktów wewnątrz Polski: {len(all_data)}")
    
    point_lons = [pt[1] for pt in all_data.keys()]
    point_lats = [pt[0] for pt in all_data.keys()]
    
    # KROK 3: Generuj mapy
    print(f"\n{'=' * 70}")
    print("  GENEROWANIE MAP")
    print(f"{'=' * 70}")
    
    # A) Średnia 2015-2024
    print("\n▸ Mapa: Średnia nocy tropikalnych 2015-2024...")
    recent_avg = []
    for pt in all_data:
        vals = [all_data[pt].get(y, 0) for y in range(2015, 2025)]
        recent_avg.append(np.mean(vals))
    
    create_interpolated_map(
        point_lons, point_lats, recent_avg,
        "Średnia roczna liczba nocy tropikalnych\n(Tmin ≥ 20°C), 2015–2024 [ERA5 Copernicus]",
        "copernicus_noce_trop_srednia_2015_2024.png",
        vmin=0, vmax=max(max(recent_avg), 5),
        label="Liczba nocy tropikalnych / rok"
    )
    
    # B) Trend 1960-2024
    print("\n▸ Mapa: Trend nocy tropikalnych / dekadę (1960-2024)...")
    trends = []
    for pt in all_data:
        yearly = all_data[pt]
        years_list = []
        counts_list = []
        for y in range(1960, 2025):
            if y in yearly:
                years_list.append(y)
                counts_list.append(yearly[y])
        if len(years_list) >= 10:
            slope = linregress(years_list, counts_list).slope * 10
        else:
            slope = 0
        trends.append(slope)
    
    create_interpolated_map(
        point_lons, point_lats, trends,
        "Trend liczby nocy tropikalnych na dekadę\nRegresja liniowa, 1960–2024 [ERA5 Copernicus]",
        "copernicus_trend_noce_tropikalne.png",
        cmap_name='Reds', vmin=0, vmax=max(max(trends), 2),
        label="Noce tropikalne / dekadę"
    )
    
    # C) Mapa punktowa trendów
    create_dot_map(
        point_lons, point_lats, trends,
        "Trend nocy tropikalnych na dekadę\n1960–2024 [ERA5 Copernicus]",
        "copernicus_trend_noce_punktowa.png",
        vmin=0, vmax=max(max(trends), 2),
        label="noce/dekadę"
    )
    
    # D) Wykres słupkowy
    print("\n▸ Wykres: Średnia roczna nocy tropikalnych 1950-2024...")
    create_timeseries(all_data, "copernicus_wykres_noce_tropikalne.png")
    
    print(f"\n{'=' * 70}")
    print("  GOTOWE! Wszystkie mapy wygenerowane pomyślnie!")
    print(f"  Folder: {OUTPUT_DIR}")
    print(f"{'=' * 70}")


if __name__ == '__main__':
    main()

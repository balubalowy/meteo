"""
Tropical Nights Grid Analysis over Poland (ERA5 via Open-Meteo)
================================================================
Noc tropikalna = Tmin >= 20°C

Skrypt:
1. Tworzy siatkę punktów nad Polską (co 0.5°)
2. Pobiera dzienne Tmin z ERA5 (Open-Meteo Archive API) od 1940 do teraz
3. Liczy noce tropikalne w każdym roku w każdym punkcie siatki
4. Generuje mapy:
   a) Noce tropikalne w wybranych latach
   b) Trend wzrostowy (nachylenie regresji liniowej) per dekada
"""

import urllib.request
import urllib.error
import json
import time
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime
from scipy.interpolate import griddata
from scipy.stats import linregress
import matplotlib
matplotlib.use('Agg')  # non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from matplotlib.path import Path
from matplotlib.patches import PathPatch
import matplotlib.patheffects as pe

# ======================================================================
# KONFIGURACJA
# ======================================================================
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Siatka nad Polską (granice geograficzne)
LAT_MIN, LAT_MAX = 49.0, 54.8
LON_MIN, LON_MAX = 14.1, 24.2
GRID_STEP = 0.6  # stopnie - daje ~100 punktów, dobre pokrycie

# Zakres lat
YEAR_START = 1940
YEAR_END = 2025

# Próg nocy tropikalnej
TROPICAL_THRESHOLD = 20.0  # °C

# Uproszczony kontur granic Polski (wielokąt)
# Źródło: przybliżone współrzędne kluczowych punktów granicy Polski
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

def generate_grid():
    """Generuj siatkę punktów nad Polską."""
    lats = np.arange(LAT_MIN, LAT_MAX + 0.01, GRID_STEP)
    lons = np.arange(LON_MIN, LON_MAX + 0.01, GRID_STEP)
    
    # Filtruj punkty wewnątrz granic Polski (przybliżony prostokąt + bufor)
    from matplotlib.path import Path as MplPath
    poly_path = MplPath(POLAND_BORDER)
    
    grid_points = []
    for lat in lats:
        for lon in lons:
            if poly_path.contains_point([lon, lat]):
                grid_points.append((lat, lon))
    
    print(f"Wygenerowano {len(grid_points)} punktów siatki wewnątrz granic Polski.")
    return grid_points


def fetch_tmin_chunk(lat, lon, start_date, end_date, max_retries=5):
    """Pobierz jeden fragment danych z retry i exponential backoff."""
    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&daily=temperature_2m_min"
        f"&timezone=Europe/Warsaw"
    )
    
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode('utf-8'))
                return data['daily']['time'], data['daily']['temperature_2m_min']
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 2 ** attempt * 3 + 2  # 5s, 8s, 14s, 26s, 50s
                sys.stdout.write(f" [429, czekam {wait}s]")
                sys.stdout.flush()
                time.sleep(wait)
            else:
                print(f"  HTTP {e.code} dla ({lat}, {lon}): {e}")
                return None, None
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                print(f"  BŁĄD dla ({lat}, {lon}): {e}")
                return None, None
    return None, None


def fetch_tmin_data(lat, lon, start_year, end_year):
    """Pobierz dzienne Tmin w jednym zapytaniu z retry."""
    start_date = f"{start_year}-01-01"
    end_date = f"{end_year}-12-31"
    return fetch_tmin_chunk(lat, lon, start_date, end_date)


def count_tropical_nights(dates, tmin_vals):
    """Policz noce tropikalne (Tmin >= 20°C) per rok."""
    yearly_counts = {}
    
    if not dates or not tmin_vals:
        return yearly_counts
    
    for date_str, tmin in zip(dates, tmin_vals):
        if tmin is None:
            continue
        year = int(date_str[:4])
        if year not in yearly_counts:
            yearly_counts[year] = 0
        if tmin >= TROPICAL_THRESHOLD:
            yearly_counts[year] += 1
    
    return yearly_counts


def compute_trend_per_decade(yearly_counts, year_range_start, year_range_end):
    """Oblicz nachylenie regresji liniowej (trend) w noc. trop. / dekadę."""
    years = []
    counts = []
    for y in range(year_range_start, year_range_end + 1):
        if y in yearly_counts:
            years.append(y)
            counts.append(yearly_counts[y])
    
    if len(years) < 5:
        return np.nan
    
    slope, intercept, r_value, p_value, std_err = linregress(years, counts)
    return slope * 10  # nachylenie * 10 = trend per dekadę


def create_interpolated_map(lons, lats, values, title, filename, cmap_name='YlOrRd',
                            vmin=None, vmax=None, label="", extend='max'):
    """Stwórz piękną, interpolowaną mapę cieplną z konturem Polski."""
    fig, ax = plt.subplots(1, 1, figsize=(10, 9), facecolor='#1a1a2e')
    ax.set_facecolor('#1a1a2e')
    
    # Siatka do interpolacji
    grid_lon = np.linspace(LON_MIN - 0.5, LON_MAX + 0.5, 400)
    grid_lat = np.linspace(LAT_MIN - 0.5, LAT_MAX + 0.5, 400)
    grid_lon_2d, grid_lat_2d = np.meshgrid(grid_lon, grid_lat)
    
    # Interpolacja
    points = np.column_stack([lons, lats])
    grid_values = griddata(points, values, (grid_lon_2d, grid_lat_2d), method='cubic')
    
    # Maskowanie poza Polską
    from matplotlib.path import Path as MplPath
    poly_path = MplPath(POLAND_BORDER)
    mask_points = np.column_stack([grid_lon_2d.ravel(), grid_lat_2d.ravel()])
    mask = ~poly_path.contains_points(mask_points).reshape(grid_lon_2d.shape)
    grid_values_masked = np.ma.array(grid_values, mask=mask)
    
    # Rysuj mapę cieplną
    if vmin is None:
        vmin = np.nanmin(values)
    if vmax is None:
        vmax = np.nanmax(values)
    
    im = ax.pcolormesh(grid_lon_2d, grid_lat_2d, grid_values_masked,
                        cmap=cmap_name, vmin=vmin, vmax=vmax, shading='auto')
    
    # Kontur granic Polski
    ax.plot(POLAND_BORDER[:, 0], POLAND_BORDER[:, 1], color='white', linewidth=1.8,
            path_effects=[pe.Stroke(linewidth=3, foreground='black'), pe.Normal()])
    
    # Kolorbar
    cbar = plt.colorbar(im, ax=ax, shrink=0.75, pad=0.02, extend=extend)
    cbar.set_label(label, fontsize=13, color='white', labelpad=10)
    cbar.ax.yaxis.set_tick_params(color='white')
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color='white', fontsize=11)
    
    # Tytuł
    ax.set_title(title, fontsize=16, fontweight='bold', color='white', pad=15)
    
    # Ukryj osie
    ax.set_xlim(LON_MIN - 0.3, LON_MAX + 0.3)
    ax.set_ylim(LAT_MIN - 0.2, LAT_MAX + 0.3)
    ax.set_aspect('auto')
    ax.tick_params(colors='#555555', labelsize=9)
    for spine in ax.spines.values():
        spine.set_color('#333333')
    
    # Podpis
    ax.text(0.99, 0.01, 'Dane: ERA5 (Open-Meteo) • Analiza: Python',
            transform=ax.transAxes, fontsize=8, color='#666666',
            ha='right', va='bottom')
    
    plt.tight_layout()
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"  Zapisano mapę: {filepath}")
    return filepath


def create_dot_map(lons, lats, values, title, filename, cmap_name='Reds',
                   vmin=None, vmax=None, label=""):
    """Stwórz mapę punktową (jak dolny screen z trendem)."""
    fig, ax = plt.subplots(1, 1, figsize=(10, 9), facecolor='white')
    ax.set_facecolor('white')
    
    if vmin is None:
        vmin = np.nanmin(values)
    if vmax is None:
        vmax = np.nanmax(values)
    
    # Kontur granic Polski
    ax.plot(POLAND_BORDER[:, 0], POLAND_BORDER[:, 1], color='#333333', linewidth=1.5)
    
    # Punkty (wielkość proporcjonalna do wartości)
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
    
    ax.text(0.99, 0.01, 'Dane: ERA5 (Open-Meteo) • Analiza: Python',
            transform=ax.transAxes, fontsize=8, color='#888888',
            ha='right', va='bottom')
    
    plt.tight_layout()
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight')
    plt.close()
    print(f"  Zapisano mapę: {filepath}")
    return filepath


def create_timeseries_chart(all_data, grid_points, filename):
    """Wykres średniej liczby nocy tropikalnych w Polsce per rok."""
    years = sorted(set(y for data in all_data.values() for y in data.keys()))
    
    avg_per_year = []
    for year in years:
        vals = [all_data[pt].get(year, 0) for pt in grid_points if pt in all_data]
        avg_per_year.append(np.mean(vals) if vals else 0)
    
    fig, ax = plt.subplots(figsize=(16, 6), facecolor='#1a1a2e')
    ax.set_facecolor('#1a1a2e')
    
    colors = plt.cm.YlOrRd(np.array(avg_per_year) / max(max(avg_per_year), 1))
    ax.bar(years, avg_per_year, color=colors, edgecolor='none', width=0.8)
    
    # Linia trendu
    if len(years) > 5:
        z = np.polyfit(years, avg_per_year, 2)
        p = np.poly1d(z)
        ax.plot(years, p(years), color='cyan', linewidth=2, linestyle='--', alpha=0.8,
                label='Trend (wielomian 2. stopnia)')
        ax.legend(fontsize=11, facecolor='#2a2a4e', edgecolor='#444', labelcolor='white')
    
    ax.set_title('Średnia liczba nocy tropikalnych w Polsce (Tmin ≥ 20°C)',
                 fontsize=15, fontweight='bold', color='white', pad=15)
    ax.set_xlabel('Rok', fontsize=13, color='white')
    ax.set_ylabel('Średnia liczba nocy tropikalnych', fontsize=13, color='white')
    ax.tick_params(colors='white', labelsize=10)
    for spine in ax.spines.values():
        spine.set_color('#444444')
    ax.set_xlim(min(years) - 1, max(years) + 1)
    
    ax.text(0.99, 0.97, 'Dane: ERA5 (Open-Meteo)',
            transform=ax.transAxes, fontsize=8, color='#666666',
            ha='right', va='top')
    
    plt.tight_layout()
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"  Zapisano wykres: {filepath}")
    return filepath


# ======================================================================
# MAIN
# ======================================================================
def main():
    print("=" * 70)
    print("  ANALIZA NOCY TROPIKALNYCH W POLSCE (ERA5 via Open-Meteo)")
    print("=" * 70)
    
    # 1. Generuj siatkę
    grid_points = generate_grid()
    
    # 2. Pobierz dane dla każdego punktu
    all_data = {}  # {(lat, lon): {year: count}}
    
    cache_file = os.path.join(OUTPUT_DIR, "tropical_nights_cache.json")
    
    # Sprawdź czy mamy cache
    if os.path.exists(cache_file):
        print(f"\nZnaleziono cache ({cache_file}), wczytuję...")
        with open(cache_file, 'r') as f:
            cached = json.load(f)
        for key, val in cached.items():
            lat, lon = map(float, key.split('_'))
            all_data[(lat, lon)] = {int(k): v for k, v in val.items()}
        print(f"  Wczytano dane dla {len(all_data)} punktów.")
    
    # Pobierz brakujące punkty
    missing = [pt for pt in grid_points if pt not in all_data]
    if missing:
        print(f"\nPobieram dane ERA5 dla {len(missing)} punktów siatki...")
        print(f"Zakres: {YEAR_START}-{YEAR_END} ({YEAR_END - YEAR_START + 1} lat)")
        print("-" * 50)
        
        for i, (lat, lon) in enumerate(missing):
            pct = (i + 1) / len(missing) * 100
            sys.stdout.write(f"\r  [{i+1}/{len(missing)}] ({pct:.0f}%) Lat={lat:.1f}, Lon={lon:.1f}...")
            sys.stdout.flush()
            
            dates, tmin_vals = fetch_tmin_data(lat, lon, YEAR_START, YEAR_END)
            if dates:
                yearly = count_tropical_nights(dates, tmin_vals)
                all_data[(lat, lon)] = yearly
                
                # Zapisz cache po każdym punkcie!
                cache_dict = {}
                for (clat, clon), val in all_data.items():
                    cache_dict[f"{clat}_{clon}"] = val
                with open(cache_file, 'w') as f:
                    json.dump(cache_dict, f)
            
            time.sleep(2.0)  # pauza by nie uderzyć w rate limit
        
        print(f"\n  Pobrano dane dla {len(all_data)} punktów łącznie.")
        with open(cache_file, 'w') as f:
            json.dump(cache_dict, f)
        print(f"  Cache zapisany: {cache_file}")
    
    # 3. Przygotuj dane do map
    point_lons = [pt[1] for pt in grid_points if pt in all_data]
    point_lats = [pt[0] for pt in grid_points if pt in all_data]
    active_points = [pt for pt in grid_points if pt in all_data]
    
    print(f"\n{'=' * 70}")
    print("  GENEROWANIE MAP")
    print(f"{'=' * 70}")
    
    # ---------------------------------------------------------------
    # A) MAPA: Średnia roczna liczba nocy tropikalnych (ostatnie 10 lat)
    # ---------------------------------------------------------------
    print("\n▸ Mapa 1: Średnia liczba nocy tropikalnych (2015-2025)...")
    recent_avg = []
    for pt in active_points:
        vals = [all_data[pt].get(y, 0) for y in range(2015, 2026)]
        recent_avg.append(np.mean(vals))
    
    create_interpolated_map(
        point_lons, point_lats, recent_avg,
        title="Średnia roczna liczba nocy tropikalnych\n(Tmin ≥ 20°C), 2015–2025",
        filename="mapa_noce_tropikalne_srednia_2015_2025.png",
        cmap_name='YlOrRd', vmin=0, vmax=max(max(recent_avg), 5),
        label="Liczba nocy tropikalnych / rok"
    )
    
    # ---------------------------------------------------------------
    # B) MAPA: Konkretne lata (rekordowe i historyczne)
    # ---------------------------------------------------------------
    showcase_years = [1950, 1975, 1994, 2006, 2015, 2018, 2019, 2024]
    print(f"\n▸ Mapa 2: Noce tropikalne w wybranych latach ({', '.join(map(str, showcase_years))})...")
    
    fig, axes = plt.subplots(2, 4, figsize=(22, 12), facecolor='#1a1a2e')
    
    # Oblicz globalny vmax
    all_yearly_vals = []
    for yr in showcase_years:
        for pt in active_points:
            all_yearly_vals.append(all_data[pt].get(yr, 0))
    global_vmax = max(max(all_yearly_vals), 5)
    
    for idx, year in enumerate(showcase_years):
        ax = axes[idx // 4][idx % 4]
        ax.set_facecolor('#1a1a2e')
        
        year_vals = [all_data[pt].get(year, 0) for pt in active_points]
        
        # Interpolacja
        grid_lon = np.linspace(LON_MIN - 0.3, LON_MAX + 0.3, 300)
        grid_lat = np.linspace(LAT_MIN - 0.3, LAT_MAX + 0.3, 300)
        grid_lon_2d, grid_lat_2d = np.meshgrid(grid_lon, grid_lat)
        
        points = np.column_stack([point_lons, point_lats])
        grid_values = griddata(points, year_vals, (grid_lon_2d, grid_lat_2d), method='cubic')
        
        from matplotlib.path import Path as MplPath
        poly_path = MplPath(POLAND_BORDER)
        mask_pts = np.column_stack([grid_lon_2d.ravel(), grid_lat_2d.ravel()])
        mask = ~poly_path.contains_points(mask_pts).reshape(grid_lon_2d.shape)
        grid_values_masked = np.ma.array(grid_values, mask=mask)
        
        im = ax.pcolormesh(grid_lon_2d, grid_lat_2d, grid_values_masked,
                           cmap='YlOrRd', vmin=0, vmax=global_vmax, shading='auto')
        ax.plot(POLAND_BORDER[:, 0], POLAND_BORDER[:, 1], color='white', linewidth=1.2)
        
        total_yr = sum(year_vals)
        avg_yr = np.mean(year_vals)
        ax.set_title(f"{year}\n(śr. {avg_yr:.1f})", fontsize=13, fontweight='bold', color='white')
        ax.set_xlim(LON_MIN - 0.3, LON_MAX + 0.3)
        ax.set_ylim(LAT_MIN - 0.2, LAT_MAX + 0.2)
        ax.set_aspect('auto')
        ax.tick_params(labelsize=7, colors='#555555')
    
    fig.suptitle('Noce tropikalne w Polsce (Tmin ≥ 20°C) – wybrane lata',
                 fontsize=18, fontweight='bold', color='white', y=0.98)
    
    cbar = fig.colorbar(im, ax=axes, shrink=0.6, pad=0.02, extend='max')
    cbar.set_label('Noce tropikalne', fontsize=13, color='white')
    cbar.ax.yaxis.set_tick_params(color='white')
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color='white')
    
    filepath = os.path.join(OUTPUT_DIR, "mapa_noce_tropikalne_lata.png")
    plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"  Zapisano: {filepath}")
    
    # ---------------------------------------------------------------
    # C) MAPA TRENDÓW: noce tropikalne / dekadę
    # ---------------------------------------------------------------
    print("\n▸ Mapa 3: Trend nocy tropikalnych per dekadę (1960–2025)...")
    trends = []
    for pt in active_points:
        trend = compute_trend_per_decade(all_data[pt], 1960, 2025)
        trends.append(trend)
    
    create_interpolated_map(
        point_lons, point_lats, trends,
        title="Trend liczby nocy tropikalnych na dekadę\nRegresja liniowa, 1960–2025",
        filename="mapa_trend_noce_tropikalne_dekada.png",
        cmap_name='Reds', vmin=0, vmax=max(max(trends), 2),
        label="Noce tropikalne / dekadę"
    )
    
    # Mapa punktowa trendów (styl jak u kolegi)
    create_dot_map(
        point_lons, point_lats, trends,
        title="Trend nocy tropikalnych na dekadę\nRegresja liniowa, 1960–2025",
        filename="mapa_trend_noce_tropikalne_punktowa.png",
        cmap_name='Reds', vmin=0, vmax=max(max(trends), 2),
        label="noce/dekadę"
    )
    
    # ---------------------------------------------------------------
    # D) MAPA TRENDÓW – okres nowszy: 1990-2025
    # ---------------------------------------------------------------
    print("\n▸ Mapa 4: Trend nocy tropikalnych per dekadę (1990–2025, przyspieszenie)...")
    trends_recent = []
    for pt in active_points:
        trend = compute_trend_per_decade(all_data[pt], 1990, 2025)
        trends_recent.append(trend)
    
    create_dot_map(
        point_lons, point_lats, trends_recent,
        title="Trend nocy tropikalnych na dekadę\nRegresja liniowa, 1990–2025 (okres przyspieszenia)",
        filename="mapa_trend_noce_tropikalne_1990_2025.png",
        cmap_name='Reds', vmin=0, vmax=max(max(trends_recent), 3),
        label="noce/dekadę"
    )
    
    # ---------------------------------------------------------------
    # E) WYKRES SŁUPKOWY: średnia dla Polski per rok
    # ---------------------------------------------------------------
    print("\n▸ Wykres 5: Średnia roczna liczba nocy tropikalnych w Polsce (1940-2025)...")
    create_timeseries_chart(all_data, active_points, "wykres_noce_tropikalne_polska.png")
    
    print(f"\n{'=' * 70}")
    print("  WSZYSTKIE MAPY I WYKRESY WYGENEROWANE POMYŚLNIE!")
    print(f"  Folder: {OUTPUT_DIR}")
    print(f"{'=' * 70}")


if __name__ == '__main__':
    main()

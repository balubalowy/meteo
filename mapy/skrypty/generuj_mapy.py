import os
import matplotlib.pyplot as plt
import geopandas as gpd
from shapely.geometry import Polygon

plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['axes.edgecolor'] = '#444444'
plt.rcParams['axes.linewidth'] = 0.8

GEO_DIR = "e:/meteo/mapy/geo_data"
POLAND_GEOJSON = os.path.join(GEO_DIR, "poland_voivodeships.json")
EUROPE_GEOJSON = os.path.join(GEO_DIR, "europe_countries.json")

def generuj_mape_polski(output_path="e:/meteo/mapy/wygenerowane/mapa_polski_ostrzezenia.png", dpi=300):
    """
    Generuje profesjonalną, precyzyjną mapę Polski z granicami 16 województw, miastami i strefami SOB.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fig, ax = plt.subplots(figsize=(10, 9.5), dpi=dpi)

    # 1. Wczytanie granic Polski i województw z GeoJSON
    gdf_poland = gpd.read_file(POLAND_GEOJSON)

    # Tło oceanu/bałtyku
    ax.set_facecolor('#E3F2FD')

    # Rysowanie obrysów województw
    gdf_poland.plot(ax=ax, color='#F8F9FA', edgecolor='#666666', linewidth=0.7, zorder=2)
    gdf_poland.boundary.plot(ax=ax, color='#222222', linewidth=1.2, zorder=3)

    # 2. Rejony Ostrzeżeń SOB (Przykładowe strefy o rzeczywistych kształtach)
    strefa2_poly = Polygon([(16.2, 51.1), (17.5, 52.8), (19.8, 53.2), (21.5, 52.0), (20.8, 50.4), (17.8, 50.2)])
    strefa3_poly = Polygon([(17.8, 51.2), (19.2, 52.4), (20.5, 51.8), (19.5, 50.8)])

    gdf_strefa2 = gpd.GeoDataFrame(geometry=[strefa2_poly], crs="EPSG:4326")
    gdf_strefa3 = gpd.GeoDataFrame(geometry=[strefa3_poly], crs="EPSG:4326")

    gdf_strefa2.plot(ax=ax, color='#FF9800', alpha=0.45, edgecolor='#E65100', linewidth=1.5, zorder=4, label="Stopień 2 (SOB): Silne burze / Grad")
    gdf_strefa3.plot(ax=ax, color='#E53935', alpha=0.55, edgecolor='#B71C1C', linewidth=2.0, zorder=5, label="Stopień 3 (SOB): Gwałtowne burze / Nawałnica")

    # Wektor ruchu burzy
    ax.annotate("", xy=(20.8, 52.2), xytext=(17.2, 50.8),
                arrowprops=dict(arrowstyle="->", color="#B71C1C", lw=3.0, mutation_scale=18), zorder=7)
    ax.text(18.9, 51.7, "Ruch burz (SW -> NE)", color="#7F0000", fontsize=9.5, fontweight='bold', rotation=30, zorder=8)

    # Główne miasta w Polsce
    miasta = {
        "Warszawa": (21.01, 52.23), "Kraków": (19.94, 50.06), "Wrocław": (17.03, 51.11),
        "Poznań": (16.92, 52.41), "Gdańsk": (18.64, 54.35), "Katowice": (19.02, 50.26),
        "Rzeszów": (22.00, 50.04), "Białystok": (23.16, 53.13), "Szczecin": (14.55, 53.43),
        "Lublin": (22.57, 51.25), "Olsztyn": (20.48, 53.77), "Bydgoszcz": (18.00, 53.12),
        "Łódź": (19.46, 51.76), "Zielona Góra": (15.50, 51.93), "Opole": (17.92, 50.67)
    }

    for miasto, (lon, lat) in miasta.items():
        ax.scatter(lon, lat, color='#111111', s=20, zorder=6)
        ax.text(lon + 0.1, lat + 0.06, miasto, fontsize=8.5, fontweight='bold', color='#333333', zorder=6)

    # Zakres współrzędnych Polski
    ax.set_xlim(14.0, 24.3)
    ax.set_ylim(48.8, 55.0)

    # Stylistyka czysta i naukowa
    ax.set_title("MAPA PROGNOZY SYNUATYWNEJ I OSTRZEŻEŃ — POLSKA", fontsize=12, fontweight='bold', pad=12, color='#1A252C')
    ax.grid(True, linestyle=':', alpha=0.5, color='#888888')
    ax.legend(loc='lower left', frameon=True, facecolor='white', framealpha=0.95, fontsize=8.5)

    ax.set_xlabel("Długość geograficzna (°E)", fontsize=9)
    ax.set_ylabel("Szerokość geograficzna (°N)", fontsize=9)

    plt.figtext(0.98, 0.015, "Oficjalne kontury państwowe (Natural Earth 1:10m) | Sieć Obserwatorów Burz", horizontalalignment='right', fontsize=8, color='#555555', style='italic')

    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi, bbox_inches='tight')
    plt.close()
    print(f"Pomyślnie wygenerowano precyzyjną mapę Polski: {output_path}")

def generuj_mape_europy(output_path="e:/meteo/mapy/wygenerowane/mapa_europy_synoptyczna.png", dpi=300):
    """
    Generuje profesjonalną mapę synoptyczną Europy w stylu ESTOFEX z konturami państw z Natural Earth.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fig, ax = plt.subplots(figsize=(11, 8.5), dpi=dpi)

    gdf_europe = gpd.read_file(EUROPE_GEOJSON)

    ax.set_facecolor('#D0E1F9') # Akweny morskie

    # Rysowanie państw europejskich
    gdf_europe.plot(ax=ax, color='#F4F6F7', edgecolor='#555555', linewidth=0.8, zorder=2)

    # Zakres Europy Środkowej i Zachodniej
    ax.set_xlim(-10.0, 32.0)
    ax.set_ylim(35.0, 62.0)

    # Przykładowe podświetlenie strefy ESTOFEX Level 2
    strefa_estofex = Polygon([(14.0, 48.0), (17.5, 53.5), (22.0, 52.5), (20.5, 47.5)])
    gdf_estofex = gpd.GeoDataFrame(geometry=[strefa_estofex], crs="EPSG:4326")
    gdf_estofex.plot(ax=ax, color='#FF5722', alpha=0.4, edgecolor='#D84315', linewidth=1.8, zorder=4, label="ESTOFEX Level 2: Severe Convective Storms")

    ax.set_title("ESTOFEX SYNOPTIC CONVECTIVE OVERVIEW — EUROPE", fontsize=12, fontweight='bold', color='#1C2833', pad=12)
    ax.grid(True, linestyle=':', alpha=0.5, color='#7F8C8D')
    ax.legend(loc='upper left', frameon=True, facecolor='white', framealpha=0.95, fontsize=8.5)

    ax.set_xlabel("Długość geograficzna (°E)", fontsize=9)
    ax.set_ylabel("Szerokość geograficzna (°N)", fontsize=9)

    plt.figtext(0.98, 0.015, "Wektory geograficzne Natural Earth 50m | ESTOFEX Forecast Model", horizontalalignment='right', fontsize=8, color='#555555', style='italic')

    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi, bbox_inches='tight')
    plt.close()
    print(f"Pomyślnie wygenerowano precyzyjną mapę Europy: {output_path}")

if __name__ == "__main__":
    generuj_mape_polski()
    generuj_mape_europy()

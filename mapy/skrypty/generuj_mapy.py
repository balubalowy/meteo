import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Ustawienie wysokiej rozdzielczości i czystego stylu
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['axes.edgecolor'] = '#333333'
plt.rcParams['axes.linewidth'] = 0.8

def generuj_mape_polski(output_path="e:/meteo/mapy/wygenerowane/mapa_polski_ostrzezenia.png", dpi=300):
    """
    Generuje czystą, czytelną mapę Polski (300 DPI) w projekcji zorientowanej na kraje (WGS84 / EPSG:2180)
    z zaznaczonymi rejonami ostrzeżeń burzowych SOB / IMGW oraz głównymi miastami.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    fig, ax = plt.subplots(figsize=(10, 9), dpi=dpi)
    
    # Granice geograficzne Polski (dla orientacji)
    lon_min, lon_max = 14.0, 24.5
    lat_min, lat_max = 49.0, 55.0
    
    ax.set_xlim(lon_min, lon_max)
    ax.set_ylim(lat_min, lat_max)
    ax.set_aspect('equal')
    
    # Tło morskie i lądowe
    ax.set_facecolor('#E6F2FF') # Błękit Bałtyku
    
    # Przybliżony kształt Polski (WGS84)
    poland_contour_lon = [14.1, 14.6, 14.7, 15.0, 16.0, 17.5, 18.5, 19.5, 20.5, 21.8, 22.8, 23.5, 24.1, 23.5, 22.7, 22.6, 21.0, 19.8, 19.0, 17.8, 16.0, 15.0, 14.8, 14.2, 14.1]
    poland_contour_lat = [53.9, 54.5, 54.8, 54.5, 54.8, 54.6, 54.8, 54.4, 54.4, 54.4, 54.3, 53.6, 52.8, 51.5, 50.8, 49.0, 49.2, 49.4, 49.5, 50.4, 51.0, 51.2, 52.0, 53.0, 53.9]
    
    # Wypełnienie lądu Polski
    ax.fill(poland_contour_lon, poland_contour_lat, color='#F5F5F0', edgecolor='#444444', linewidth=1.5, zorder=2, label="Polska")
    
    # Przykładowa strefa ostrzeżeń (Strefa 2 i Strefa 3 SOB)
    # Strefa 2 (Pomarańczowy - silne burze / duży grad)
    strefa2_lon = [16.5, 18.0, 20.5, 22.0, 21.0, 18.5, 16.5]
    strefa2_lat = [51.0, 52.5, 53.0, 51.5, 50.0, 50.2, 51.0]
    ax.fill(strefa2_lon, strefa2_lat, color='#FF9900', alpha=0.55, edgecolor='#CC6600', linewidth=2, zorder=3, label="Stopień 2 (SOB): Silne burze / Grad")
    
    # Strefa 3 (Czerwony - niszczycielskie superkomórki / nawalne opady / tornada)
    strefa3_lon = [18.2, 19.8, 20.8, 19.5, 18.2]
    strefa3_lat = [51.2, 52.2, 51.4, 50.8, 51.2]
    ax.fill(strefa3_lon, strefa3_lat, color='#CC0000', alpha=0.65, edgecolor='#990000', linewidth=2.5, zorder=4, label="Stopień 3 (SOB): Gwałtowne burze / Tornada")
    
    # Wektor ruchu burz (Strzałka przemieszczania się MCS / superkomórek)
    ax.annotate("", xy=(21.0, 52.5), xytext=(17.5, 50.8),
                arrowprops=dict(arrowstyle="->", color="#990000", lw=3.5, mutation_scale=20), zorder=6)
    ax.text(19.2, 51.9, "Ruch burz (SW -> NE)", color="#800000", fontsize=10, fontweight='bold', rotation=32, zorder=7)

    # Główne miasta
    miasta = {
        "Warszawa": (21.01, 52.23),
        "Kraków": (19.94, 50.06),
        "Wrocław": (17.03, 51.11),
        "Poznań": (16.92, 52.41),
        "Gdańsk": (18.64, 54.35),
        "Katowice": (19.02, 50.26),
        "Rzeszów": (22.00, 50.04),
        "Białystok": (23.16, 53.13),
        "Szczecin": (14.55, 53.43),
        "Lublin": (22.57, 51.25)
    }
    
    for miasto, (lon, lat) in miasta.items():
        ax.scatter(lon, lat, color='#111111', s=25, zorder=5)
        ax.text(lon + 0.12, lat + 0.08, miasto, fontsize=9, fontweight='bold', color='#222222', zorder=5)

    # Nagłówek i Tytuł Mapy
    ax.set_title("MAPA PROGNOZY / ANALIZY BURZOWEJ — POLSKA", fontsize=14, fontweight='bold', pad=15, color='#1F4E79')
    
    # Legenda i siatka
    ax.grid(True, linestyle='--', alpha=0.4, color='#888888')
    ax.legend(loc='lower left', frameon=True, facecolor='white', framealpha=0.9, fontsize=9)
    
    ax.set_xlabel("Długość geograficzna (°E)", fontsize=10)
    ax.set_ylabel("Szerokość geograficzna (°N)", fontsize=10)
    
    # Stópka źródłowa
    plt.figtext(0.98, 0.02, "Wygenerowano: Centrum Meteo Bartka (SOB) | Projekcja WGS84", horizontalalignment='right', fontsize=8, color='#666666', style='italic')

    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi, bbox_inches='tight')
    plt.close()
    print(f"Pomyślnie wygenerowano mapę Polski: {output_path}")

def generuj_mape_europy(output_path="e:/meteo/mapy/wygenerowane/mapa_europy_synoptyczna.png", dpi=300):
    """
    Generuje czystą, czytelną mapę Europy (300 DPI) z zaznaczeniem aktywności konwekcyjnej i frontów.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    fig, ax = plt.subplots(figsize=(11, 8.5), dpi=dpi)
    
    # Granice Europy
    lon_min, lon_max = -10.0, 35.0
    lat_min, lat_max = 35.0, 65.0
    
    ax.set_xlim(lon_min, lon_max)
    ax.set_ylim(lat_min, lat_max)
    ax.set_aspect('equal')
    
    ax.set_facecolor('#D6EAF8') # Bałtyk, Atlantyk, Śródziemne
    
    # Kontury krajów europejskich (uproszczone zarysy)
    kraje = {
        "Polska": ([14.1, 24.1, 24.1, 14.1, 14.1], [49.0, 49.0, 54.8, 54.8, 49.0]),
        "Niemcy": ([6.0, 14.1, 14.1, 6.0, 6.0], [47.3, 47.3, 55.0, 55.0, 47.3]),
        "Czechy/Słowacja": ([12.1, 22.5, 22.5, 12.1, 12.1], [47.7, 47.7, 51.0, 51.0, 47.7]),
        "Francja": ([-4.5, 8.2, 8.2, -4.5, -4.5], [42.3, 42.3, 51.0, 51.0, 42.3]),
        "Włochy": ([6.6, 18.5, 18.5, 6.6, 6.6], [36.6, 36.6, 47.0, 47.0, 36.6]),
    }
    
    for nazwa, (lons, lats) in kraje.items():
        ax.fill(lons, lats, color='#F2F3F4', edgecolor='#795548', linewidth=1, alpha=0.8, zorder=2)
        ax.text(np.mean(lons), np.mean(lats), nazwa, fontsize=9, color='#555555', ha='center', va='center', zorder=3)

    # Przykładowe centrum strefy burzowej nad Europą Środkową
    ax.scatter([19.0], [52.0], color='#FF0000', s=120, zorder=5, label="Ośrodek Burzowy / ESTOFEX Level 2")
    
    ax.set_title("PROGNOZA KONWEKCYJNA DLA EUROPY (ESTOFEX SYNOPTIC OVERVIEW)", fontsize=13, fontweight='bold', color='#1A5276', pad=12)
    ax.grid(True, linestyle=':', alpha=0.5, color='#7F8C8D')
    ax.legend(loc='upper left', frameon=True, facecolor='white', fontsize=9)
    
    ax.set_xlabel("Długość geograficzna (°E)")
    ax.set_ylabel("Szerokość geograficzna (°N)")
    
    plt.figtext(0.98, 0.02, "Źródło: Centrum Meteo Bartka | ESTOFEX Overview | 300 DPI", horizontalalignment='right', fontsize=8, color='#555555', style='italic')

    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi, bbox_inches='tight')
    plt.close()
    print(f"Pomyślnie wygenerowano mapę Europy: {output_path}")

if __name__ == "__main__":
    generuj_mape_polski()
    generuj_mape_europy()

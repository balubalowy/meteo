#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
4_Dashboard_IMGW.py - GIGANTYCZNY DASHBOARD JS
Dynamiczna mapa HTML generowana w locie, z zaawansowaną interpolacją (linear+nearest), 
izoliniami, i ekstremami historycznymi z ostatnich 24h.
"""

import json
import math
import os
import sys
import numpy as np
import requests
from datetime import datetime, timedelta
from scipy.interpolate import griddata
from shapely.geometry import shape, Point
from shapely.ops import unary_union
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

FIREBASE_URL = "https://meteo-bbe28-default-rtdb.europe-west1.firebasedatabase.app"

# ================================================================
# KONFIGURACJA ZMIENNYCH
# ================================================================
TEMP_COLORSCALE = [
    [0.0, "#f4c2f4"], [0.055, "#e020e0"], [0.111, "#8a2be2"], [0.166, "#4b0082"],
    [0.222, "#000080"], [0.277, "#0000ff"], [0.333, "#1e90ff"], [0.388, "#00bfff"],
    [0.444, "#00ffff"], [0.5, "#00fa9a"], [0.555, "#32cd32"], [0.611, "#adff2f"],
    [0.666, "#ffd700"], [0.722, "#ffa500"], [0.777, "#ff4500"], [0.833, "#ff0000"],
    [0.888, "#8b0000"], [0.944, "#5c4033"], [1.0, "#808080"]
]
def _wnd(kmh, mx=259): return round(kmh/mx, 4)
WIND_COLORSCALE = [
    [0.0, "#FFFFFF"], [_wnd(9), "#C8FFFF"], [_wnd(19), "#00FFFF"], [_wnd(28), "#0088FF"],
    [_wnd(37), "#0000CD"], [_wnd(46), "#00C800"], [_wnd(56), "#80FF00"],
    [_wnd(65), "#FFFF00"], [_wnd(74), "#FFD700"], [_wnd(83), "#FFA500"],
    [_wnd(93), "#FF4500"], [_wnd(102), "#FF0000"], [_wnd(111), "#CC0000"],
    [_wnd(120), "#800000"], [_wnd(130), "#800080"], [_wnd(139), "#4B0082"],
    [_wnd(148), "#FF00FF"], [_wnd(157), "#FF69B4"], [_wnd(167), "#808080"],
    [_wnd(176), "#606060"], [_wnd(185), "#404040"], [_wnd(194), "#303030"],
    [_wnd(204), "#202020"], [1.0, "#000000"]
]
HUMIDITY_COLORSCALE = [[0.0, "#FFD700"], [0.25, "#FF8C00"], [0.5, "#32CD32"], [0.75, "#1E90FF"], [1.0, "#00008B"]]
DEWPOINT_COLORSCALE = [[0.0, "#0000FF"], [0.26, "#00BFFF"], [0.39, "#00FF7F"], [0.53, "#ADFF2F"], [0.66, "#FFD700"], [0.79, "#FF4500"], [0.92, "#FF0000"], [1.0, "#8B0000"]]

ZMIENNE = {
    "temp":  {"nazwa": "Temperatura", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0},
    "grunt": {"nazwa": "Temp. Gruntu", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0},
    "wiatr": {"nazwa": "Poryw Wiatru", "cscale": "WIND_COLORSCALE", "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0},
    "wiatr_sr": {"nazwa": "Śr. Wiatr", "cscale": "WIND_COLORSCALE", "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0},
    "wilg":  {"nazwa": "Wilgotność", "cscale": "HUMIDITY_COLORSCALE", "cmin": 0, "cmax": 100, "unit": "%", "step": 10.0},
    "rosy":  {"nazwa": "Punkt Rosy", "cscale": "DEWPOINT_COLORSCALE", "cmin": -10, "cmax": 28, "unit": "°C", "step": 2.0},
    "synop": {"nazwa": "Model Synoptyczny", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "", "step": 2.0},
}

OKRESY = ["now", "max3", "min3", "max6", "min6", "max12", "min12", "max24", "min24"]
OKRESY_NAZWY = {
    "now": "Aktualne", "max3": "Max 3h", "min3": "Min 3h", 
    "max6": "Max 6h", "min6": "Min 6h", "max12": "Max 12h", 
    "min12": "Min 12h", "max24": "Max 24h", "min24": "Min 24h"
}

def create_grid(lats, lons, vals, u_vals=None, v_vals=None):
    """Tworzy interpolowaną siatkę dla heatmapy oraz wektorów."""
    if len(vals) < 3:
        return [], [], [], [], [], []
    
    # 1. Tworzenie regularnej siatki
    grid_lon, grid_lat = np.mgrid[13.5:24.5:0.04, 48.5:55.5:0.04]
    
    points = np.array([lons, lats]).T
    
    # Próba interpolacji linear, z fallbackiem do nearest (łatanie dziur na granicach)
    grid_z_linear = griddata(points, vals, (grid_lon, grid_lat), method='linear')
    grid_z_nearest = griddata(points, vals, (grid_lon, grid_lat), method='nearest')
    grid_z = np.where(np.isnan(grid_z_linear), grid_z_nearest, grid_z_linear)
    
    # Interpolacja U i V
    grid_u, grid_v = None, None
    if u_vals and v_vals and len(u_vals) == len(vals):
        grid_u_lin = griddata(points, u_vals, (grid_lon, grid_lat), method='linear')
        grid_u_near = griddata(points, u_vals, (grid_lon, grid_lat), method='nearest')
        grid_u = np.where(np.isnan(grid_u_lin), grid_u_near, grid_u_lin)
        
        grid_v_lin = griddata(points, v_vals, (grid_lon, grid_lat), method='linear')
        grid_v_near = griddata(points, v_vals, (grid_lon, grid_lat), method='nearest')
        grid_v = np.where(np.isnan(grid_v_lin), grid_v_near, grid_v_lin)
    
    poland_polygon = pobierz_polske()
    
    glats, glons, gvals = [], [], []
    gu, gv = [], []
    
    grid_masked = np.full(grid_lon.shape, np.nan)
    
    # Maskowanie
    for i in range(grid_lon.shape[0]):
        for j in range(grid_lon.shape[1]):
            lon, lat = grid_lon[i, j], grid_lat[i, j]
            val = grid_z[i, j]
            if not np.isnan(val) and poland_polygon.contains(Point(lon, lat)):
                glats.append(round(lat,3))
                glons.append(round(lon,3))
                gvals.append(round(val,2))
                grid_masked[i, j] = val
                if grid_u is not None and grid_v is not None:
                    gu.append(grid_u[i, j])
                    gv.append(grid_v[i, j])
    
    # Generowanie siatki wektorów strzałek wiatru
    w_lats, w_lons, w_txts = [], [], []
    if len(gu) > 0 and len(gv) > 0:
        # Pamiętajmy, że chcemy próbkować "co n-ty" punkt dla czytelności mapy:
        for i in range(0, len(glats), 40): # Rzadsza siatka wektorów (mniej więcej co 40 punkt w 1D)
            u = gu[i]
            v = gv[i]
            spd = math.sqrt(u*u + v*v)
            if spd > 2.0: # Pokazujemy strzałki tylko gdy wiatr > 2 km/h
                # Obliczanie kierunku (odwrócony atan2 bo u/v są wektorami ruchu powietrza)
                angle = math.degrees(math.atan2(u, v))
                if angle < 0: angle += 360
                
                # Zmiana kąta na strzałkę Unicode
                # 0=N, 90=E, 180=S, 270=W
                idx = int(round(angle / 45.0)) % 8
                arrows = ['⬆', '↗', '➡', '↘', '⬇', '↙', '⬅', '↖']
                w_txts.append(arrows[idx])
                w_lats.append(glats[i])
                w_lons.append(glons[i])

    return glats, glons, gvals, w_lats, w_lons, w_txts, grid_masked, grid_lon, grid_lat



def generate_dashboard():
    print("=" * 65)
    print("  GENEROWANIE GIGANTYCZNEGO DASHBOARDU IMGW")
    print("=" * 65)

    print("  POBIERANIE HISTORII Z FIREBASE")
    print("=" * 65)

    import os
    secret = os.environ.get("FIREBASE_SECRET", "")
    auth_param = f"?auth={secret}" if secret else ""

    historia = []
    try:
        resp = requests.get(f"{FIREBASE_URL}/imgw_historia.json{auth_param}", timeout=30)
        if resp.status_code == 200:
            historia = resp.json() or []
    except Exception as e:
        print(f"  [!] Błąd pobierania historii z Firebase: {e}")
        return

    if not isinstance(historia, list) or not historia:
        print("  [!] Brak historii w Firebase!")
        return

    print(f"  Wczytano {len(historia)} snapshotów z historii.")
    
    latest_snap = historia[-1]
    latest_time_str = latest_snap["czas_pobrania"]
    try:
        latest_time = datetime.strptime(latest_time_str, "%Y-%m-%d %H:%M:%S")
    except:
        latest_time = datetime.now()

    # Grupowanie danych wg stacji i wyliczanie ekstremow
    # station_id -> { "nazwa", "lat", "lon", "temp": {"now": X, "max3": Y, ...} }
    master_stations = {}
    
    # Dodajemy puste struktury z najnowszego snapshota, zeby miec baze stacji
    for st in latest_snap["stacje"]:
        kod = st["kod"]
        master_stations[kod] = {
            "nazwa": st["nazwa"], "lat": st["lat"], "lon": st["lon"],
            "temp": {}, "grunt": {}, "wiatr": {}, "wilg": {}, "rosy": {}, "wiatr_sr": {}, "kierunek": {},
            "czas": {} # przechowuje stringi np. "14:20" dla hove'a
        }
        
    # Funkcja pomocnicza do mapowania zmiennych API na nasze krotkie klucze
    api_map = {
        "temp": "temp", "grunt": "temp_grunt", 
        "wiatr": "maks_poryw_kmh", "wilg": "wilgotnosc", "rosy": "punkt_rosy",
        "wiatr_sr": "wiatr_sr_kmh", "kierunek": "wiatr_kierunek"
    }

    print("  Przetwarzanie ekstremów historycznych...")
    for snap in historia:
        try:
            snap_time = datetime.strptime(snap["czas_pobrania"], "%Y-%m-%d %H:%M:%S")
            diff_h = (latest_time - snap_time).total_seconds() / 3600.0
        except:
            continue
            
        is_3h = diff_h <= 3.1
        is_6h = diff_h <= 6.1
        is_12h = diff_h <= 12.1
        is_24h = diff_h <= 24.1
        is_now = diff_h <= 0.1 # w granicach tego samego snapshota

        for st in snap["stacje"]:
            kod = st["kod"]
            if kod not in master_stations: continue
            
            # Czas pomiaru ze stacji (IMGW API podaje w UTC)
            t_data = st.get("temp_data")
            is_valid_data = True
            if t_data:
                try:
                    # Parsujemy jako UTC i dodajemy 2h (CEST)
                    cz_dt = datetime.strptime(t_data, "%Y-%m-%d %H:%M:%S") + timedelta(hours=2)
                    
                    # Filtrowanie
                    age_hours = (snap_time - cz_dt).total_seconds() / 3600.0
                    if age_hours > 6:
                        is_valid_data = False
                    if is_now and age_hours > 1.5:
                        is_valid_data = False
                        
                    cz = cz_dt.strftime("%H:%M")
                except:
                    cz = str(t_data)
            else:
                cz = snap_time.strftime("%H:%M")

            if not is_valid_data:
                continue # Ignorujemy całkowicie przestarzałe dane z martwych stacji (np. sprzed miesiąca)

            for k, api_k in api_map.items():
                v = st.get(api_k)
                if v is None: continue
                
                # Zabezpieczenie przed zepsutymi czujnikami wiatru
                if k in ["wiatr", "wiatr_sr"]:
                    nazwa_st = st.get("nazwa", "").upper()
                    if nazwa_st in ["DĄBRÓWKA STARA", "CHRZĄSTOWO", "ŚWIERKLANIEC", "ŚWIERKLANY"]:
                        continue
                    # Wiatr > 120 km/h poza wysokimi górami to na 99% błąd sprzętu IMGW
                    if v > 120 and nazwa_st not in ["ŚNIEŻKA", "KASPROWY WIERCH"]:
                        continue
                
                ms = master_stations[kod][k]
                
                # Zapisujemy czas pomiaru dla najnowszego (now)
                if is_now: 
                    ms["now"] = v
                    master_stations[kod]["czas"]["now"] = cz
                
                def update_minmax(okr_min, okr_max, val, c_time):
                    if okr_min not in ms or val < ms[okr_min]: 
                        ms[okr_min] = val
                        master_stations[kod]["czas"][okr_min] = c_time
                    if okr_max not in ms or val > ms[okr_max]: 
                        ms[okr_max] = val
                        master_stations[kod]["czas"][okr_max] = c_time

                if is_3h: update_minmax("min3", "max3", v, cz)
                if is_6h: update_minmax("min6", "max6", v, cz)
                if is_12h: update_minmax("min12", "max12", v, cz)
                if is_24h: update_minmax("min24", "max24", v, cz)

    # Przygotowanie Polski i siatki (grid rozszerzony zeby zakryc cala Polske)
    print("  Pobieranie konturów Polski...")
    poland_polygon = pobierz_polske()
    js_data = {}
    total_iters = len(ZMIENNE) * len(OKRESY)
    curr_iter = 0

    print("  Budowanie bazy danych przestrzennych (to zajmie chwilę)...")
    for z_key, z_info in ZMIENNE.items():
        js_data[z_key] = {}
        for okres in OKRESY:
            curr_iter += 1
            sys.stdout.write(f"\r    Postęp: {curr_iter}/{total_iters} [{z_key} {okres}]      ")
            
            lats_ok, lons_ok, vals_ok, u_vals, v_vals, hovs_ok, txts_ok, angs_ok = [], [], [], [], [], [], [], []
            lats_nan, lons_nan, hovs_nan = [], [], []
            
            for kod, st in master_stations.items():
                val = st["temp"].get(okres) if z_key == "synop" else st[z_key].get(okres)
                lat, lon, nazwa, czas = st["lat"], st["lon"], st["nazwa"], st.get("czas", {}).get(okres, "--:--")
                
                if val is not None:
                    lats_ok.append(lat); lons_ok.append(lon); vals_ok.append(val)
                    if z_key in ["wiatr", "wiatr_sr"]:
                        kier = st["kierunek"].get(okres)
                        if kier is not None:
                            rad = math.radians(kier)
                            u_vals.append(-val * math.sin(rad)); v_vals.append(-val * math.cos(rad))
                        else: u_vals.append(0); v_vals.append(0)
                    
                    if z_key == "synop":
                        v_t, v_r, v_ws, v_wp, kier = st["temp"].get(okres), st["rosy"].get(okres), st["wiatr_sr"].get(okres), st["wiatr"].get(okres), st["kierunek"].get(okres)
                        strz = kier_na_strzalke(kier)
                        
                        txt_t = f"{v_t:.1f}" if v_t is not None else ""
                        txt_ws = f"{v_ws:.0f} {strz}" if v_ws is not None else ""
                        txt_r = f"{v_r:.1f}" if v_r is not None else ""
                        txt_wp = f"{v_wp:.0f}" if v_wp is not None else ""
                        
                        txts_ok.append(f"{txt_t}|{txt_ws}|{txt_r}|{txt_wp}")
                        hovs_ok.append(f"<b>{nazwa}</b><br>Temp: {txt_t}°C | Rosy: {txt_r}°C<br>Wiatr Śr: {txt_ws} (Poryw: {txt_wp})<br>Czas: {czas}")
                    elif z_key in ["wiatr", "wiatr_sr"]:
                        fmt = f"{val:.1f}" if val < 10 else f"{val:.0f}"
                        txts_ok.append(fmt); angs_ok.append(0)
                        hovs_ok.append(f"<b>{nazwa}</b><br>{z_info['nazwa']}: {fmt} {z_info['unit']} {kier_na_strzalke(st['kierunek'].get(okres))}<br>Czas: {czas}")
                    else:
                        fmt = f"{val:.1f}"
                        txts_ok.append(fmt); angs_ok.append(0)
                        hovs_ok.append(f"<b>{nazwa}</b><br>{z_info['nazwa']}: {fmt} {z_info['unit']}<br>Czas: {czas}")
                else: lats_nan.append(lat); lons_nan.append(lon); hovs_nan.append(f"<b>{nazwa}</b><br>Brak danych")

            glats, glons, gvals, wlats, wlons, wtxts, grid_masked, grid_lon, grid_lat = create_grid(lats_ok, lons_ok, vals_ok, u_vals, v_vals)
            c_lats, c_lons, c_txts = extract_contours(grid_masked, grid_lon, grid_lat, z_info["step"])

            js_data[z_key][okres] = {
                "pt_lats": lats_ok, "pt_lons": lons_ok, "pt_vals": vals_ok, "pt_hov": hovs_ok, "pt_txts": txts_ok,
                "gr_lats": glats, "gr_lons": glons, "gr_vals": gvals, "w_lats": wlats, "w_lons": wlons, "w_txts": wtxts
            }

    js_colors = {"TEMP_COLORSCALE": TEMP_COLORSCALE, "WIND_COLORSCALE": WIND_COLORSCALE, "HUMIDITY_COLORSCALE": HUMIDITY_COLORSCALE, "DEWPOINT_COLORSCALE": DEWPOINT_COLORSCALE}

    # Zapis i wysyłka do Firebase
    final_payload = {
        "MAP_DATA": js_data,
        "ZMIENNE": ZMIENNE,
        "COLORS": js_colors,
        "LATEST_TIME": latest_time_str,
        "SNAPSHOT_COUNT": len(historia)
    }

    def clean_nans(obj):
        if isinstance(obj, float):
            if math.isnan(obj) or math.isinf(obj): return None
            return obj
        elif isinstance(obj, dict):
            return {k: clean_nans(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_nans(i) for i in obj]
        return obj

    final_payload = clean_nans(final_payload)

    print(f"  Wysyłanie map_data do bazy {FIREBASE_URL}/imgw_map_data.json")
    try:
        resp_put = requests.put(f"{FIREBASE_URL}/imgw_map_data.json{auth_param}", json=final_payload)
        if not resp_put.ok:
            print(f"  [!] Firebase zwrócił błąd {resp_put.status_code}: {resp_put.text}")
        resp_put.raise_for_status()
        print("  [OK] Dane przestrzenne zaktualizowane w Firebase!")
    except Exception as e:
        print(f"  [!] Błąd wysyłania do Firebase: {e}")
        sys.exit(1)
        
    print("=" * 65)

if __name__ == "__main__":
    generate_dashboard()

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
import requests
from datetime import datetime, timedelta

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

# Skale dywergentne dla trendów (tempo zmian na godzinę)
TREND_TEMP_COLORSCALE = [
    [0.0, "#1e3a8a"], [0.2, "#3b82f6"], [0.4, "#93c5fd"],
    [0.5, "#f3f4f6"],
    [0.6, "#fca5a5"], [0.8, "#ef4444"], [1.0, "#991b1b"]
]
TREND_HUMIDITY_COLORSCALE = [
    [0.0, "#854d0e"], [0.25, "#d97706"],
    [0.5, "#f3f4f6"],
    [0.75, "#0284c7"], [1.0, "#1e3a8a"]
]

ZMIENNE = {
    "temp":  {"nazwa": "Temperatura", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0},
    "grunt": {"nazwa": "Temp. Gruntu", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0},
    "wiatr": {"nazwa": "Poryw Wiatru", "cscale": "WIND_COLORSCALE", "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0},
    "wiatr_sr": {"nazwa": "Śr. Wiatr", "cscale": "WIND_COLORSCALE", "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0},
    "wilg":  {"nazwa": "Wilgotność", "cscale": "HUMIDITY_COLORSCALE", "cmin": 0, "cmax": 100, "unit": "%", "step": 10.0},
    "rosy":  {"nazwa": "Punkt Rosy", "cscale": "DEWPOINT_COLORSCALE", "cmin": -10, "cmax": 28, "unit": "°C", "step": 2.0},
    "synop": {"nazwa": "Model Synoptyczny", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "", "step": 2.0},
}

OKRESY = ["now", "max5", "min5", "trend1h", "trend2h", "trend3h", "trend5h"]
OKRESY_NAZWY = {
    "now": "Aktualne",
    "max5": "Maksimum (ost. 5h)",
    "min5": "Minimum (ost. 5h)",
    "trend1h": "Trend 1h (Δ/h)",
    "trend2h": "Trend 2h (Δ/h)",
    "trend3h": "Trend 3h (Δ/h)",
    "trend5h": "Trend 5h (Δ/h)"
}

def kier_na_strzalke(kier):
    if kier is None: return ""
    try:
        val = float(kier)
    except:
        return ""
    dirs = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"]
    idx = round(val / 45.0) % 8
    return dirs[idx]

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

    # Grupowanie danych wg stacji i wyliczanie ekstremów
    master_stations = {}
    for st in latest_snap["stacje"]:
        kod = st["kod"]
        master_stations[kod] = {
            "nazwa": st["nazwa"], "lat": st["lat"], "lon": st["lon"],
            "temp": {}, "grunt": {}, "wiatr": {}, "wilg": {}, "rosy": {}, "wiatr_sr": {}, "kierunek": {},
            "czas_now": "--:--"
        }
        
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
            
        is_5h = diff_h <= 5.1
        is_now = diff_h <= 0.1

        for st in snap["stacje"]:
            kod = st["kod"]
            if kod not in master_stations: continue
            
            t_data = st.get("temp_data")
            is_valid_data = True
            if t_data:
                try:
                    cz_dt = datetime.strptime(t_data, "%Y-%m-%d %H:%M:%S") + timedelta(hours=2)
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
                continue

            if is_now:
                master_stations[kod]["czas_now"] = cz

            for k, api_k in api_map.items():
                v = st.get(api_k)
                if v is None: continue
                
                # Zabezpieczenie przed uszkodzonymi czujnikami wiatru
                if k in ["wiatr", "wiatr_sr"]:
                    nazwa_st = st.get("nazwa", "").upper()
                    if nazwa_st in ["DĄBRÓWKA STARA", "CHRZĄSTOWO", "ŚWIERKLANIEC", "ŚWIERKLANY"]:
                        continue
                    if v > 120 and nazwa_st not in ["ŚNIEŻKA", "KASPROWY WIERCH"]:
                        continue
                
                ms = master_stations[kod][k]
                
                if is_now: 
                    ms["now"] = v
                    ms["czas_now"] = cz
                
                if is_5h:
                    # Minimum: rejestracja wartości i czasu wystąpienia
                    if "min5" not in ms or v < ms["min5"]:
                        ms["min5"] = v
                        ms["czas_min5"] = cz
                    # Maksimum: rejestracja wartości i czasu wystąpienia
                    if "max5" not in ms or v > ms["max5"]:
                        ms["max5"] = v
                        ms["czas_max5"] = cz

    # Obliczanie trendów czasowych (1h, 2h, 3h, 5h)
    print("  Wyliczanie trendów czasowych (1h, 2h, 3h, 5h)...")
    for hours_back in [1, 2, 3, 5]:
        target_dt = latest_time - timedelta(hours=hours_back)
        best_snap = None
        min_sec_diff = float("inf")
        for s in historia:
            try:
                st_dt = datetime.strptime(s["czas_pobrania"], "%Y-%m-%d %H:%M:%S")
                sec_diff = abs((st_dt - target_dt).total_seconds())
                if sec_diff < min_sec_diff and sec_diff <= 45 * 60:
                    min_sec_diff = sec_diff
                    best_snap = (s, st_dt)
            except:
                continue
        
        if not best_snap:
            continue
            
        past_snap, past_dt = best_snap
        dt_actual_hours = (latest_time - past_dt).total_seconds() / 3600.0
        if dt_actual_hours < 0.4:
            continue
            
        past_map = {s["kod"]: s for s in past_snap.get("stacje", [])}
        trend_key = f"trend{hours_back}h"
        
        for kod, ms_st in master_stations.items():
            st_past = past_map.get(kod)
            if not st_past: continue
            for k, api_k in api_map.items():
                v_now = ms_st[k].get("now")
                v_past = st_past.get(api_k)
                if v_now is None or v_past is None: continue
                if k in ["wiatr", "wiatr_sr"]:
                    nazwa_st = ms_st.get("nazwa", "").upper()
                    if nazwa_st in ["DĄBRÓWKA STARA", "CHRZĄSTOWO", "ŚWIERKLANIEC", "ŚWIERKLANY"]:
                        continue
                    if (v_now > 120 or v_past > 120) and nazwa_st not in ["ŚNIEŻKA", "KASPROWY WIERCH"]:
                        continue
                        
                delta_total = round(v_now - v_past, 1)
                rate_per_hour = round(delta_total / dt_actual_hours, 1)
                ms = ms_st[k]
                ms[trend_key] = rate_per_hour
                ms[f"meta_{trend_key}"] = {
                    "v_now": v_now,
                    "v_past": v_past,
                    "cz_past": past_dt.strftime("%H:%M"),
                    "cz_now": ms.get("czas_now", latest_time.strftime("%H:%M")),
                    "dt_h": round(dt_actual_hours, 1),
                    "delta_total": delta_total
                }

    js_data = {}
    total_iters = len(ZMIENNE) * len(OKRESY)
    curr_iter = 0

    print("  Budowanie bazy danych przestrzennych...")
    for z_key, z_info in ZMIENNE.items():
        js_data[z_key] = {}
        for okres in OKRESY:
            curr_iter += 1
            sys.stdout.write(f"\r    Postęp: {curr_iter}/{total_iters} [{z_key} {okres}]      ")
            
            lats_ok, lons_ok, vals_ok, u_vals, v_vals, hovs_ok, txts_ok, angs_ok = [], [], [], [], [], [], [], []
            lats_nan, lons_nan, hovs_nan = [], [], []
            
            for kod, st in master_stations.items():
                is_trend = okres.startswith("trend")
                ms = st["temp"] if z_key == "synop" else st[z_key]
                val = ms.get(okres)
                lat, lon, nazwa = st["lat"], st["lon"], st["nazwa"]
                
                if val is not None:
                    lats_ok.append(lat); lons_ok.append(lon); vals_ok.append(val)
                    if z_key in ["wiatr", "wiatr_sr"]:
                        kier = st["kierunek"].get(okres)
                        if kier is not None:
                            rad = math.radians(kier)
                            u_vals.append(-val * math.sin(rad)); v_vals.append(-val * math.cos(rad))
                        else: u_vals.append(0); v_vals.append(0)
                    
                    if is_trend:
                        meta = ms.get(f"meta_{okres}", {})
                        znak = "+" if val > 0 else ""
                        unit_h = f"{z_info['unit']}/h" if z_info['unit'] else "/h"
                        fmt_val = f"{znak}{val:.1f}"
                        txts_ok.append(fmt_val)
                        
                        v_past = meta.get("v_past", "?")
                        v_now = meta.get("v_now", "?")
                        cz_past = meta.get("cz_past", "--:--")
                        cz_now = meta.get("cz_now", "--:--")
                        dt_h = meta.get("dt_h", "")
                        d_tot = meta.get("delta_total", val)
                        d_tot_znak = "+" if (d_tot is not None and d_tot > 0) else ""
                        
                        hov = (
                            f"<b>{nazwa}</b><br>"
                            f"Trend {z_info['nazwa']}: <b>{fmt_val} {unit_h}</b><br>"
                            f"Zmiana w {dt_h}h: {d_tot_znak}{d_tot} {z_info['unit']} "
                            f"(z {v_past} o {cz_past} do {v_now} o {cz_now})"
                        )
                        hovs_ok.append(hov)
                    elif z_key == "synop":
                        v_t = st["temp"].get(okres)
                        v_r = st["rosy"].get(okres)
                        v_ws = st["wiatr_sr"].get(okres)
                        v_wp = st["wiatr"].get(okres)
                        kier = st["kierunek"].get(okres)
                        strz = kier_na_strzalke(kier)
                        
                        txt_t = f"{v_t:.1f}" if v_t is not None else ""
                        txt_ws = f"{v_ws:.0f} {strz}" if v_ws is not None else ""
                        txt_r = f"{v_r:.1f}" if v_r is not None else ""
                        txt_wp = f"{v_wp:.0f}" if v_wp is not None else ""
                        
                        cz_t = st["temp"].get(f"czas_{okres}", st.get("czas_now", "--:--"))
                        txts_ok.append(f"{txt_t}|{txt_ws}|{txt_r}|{txt_wp}")
                        hovs_ok.append(f"<b>{nazwa}</b><br>Temp: {txt_t}°C | Rosy: {txt_r}°C<br>Wiatr Śr: {txt_ws} (Poryw: {txt_wp})<br>Czas: {cz_t}")
                    elif okres in ["max5", "min5"]:
                        cz_extr = ms.get(f"czas_{okres}", "--:--")
                        lbl = "Maksimum" if okres == "max5" else "Minimum"
                        fmt = f"{val:.1f}" if (z_key not in ["wiatr", "wiatr_sr"] or val < 10) else f"{val:.0f}"
                        txts_ok.append(fmt)
                        hovs_ok.append(f"<b>{nazwa}</b><br>{lbl} (ost. 5h): <b>{fmt} {z_info['unit']}</b><br>Czas wystąpienia: {cz_extr}")
                    elif z_key in ["wiatr", "wiatr_sr"]:
                        fmt = f"{val:.1f}" if val < 10 else f"{val:.0f}"
                        cz_now = ms.get("czas_now", st.get("czas_now", "--:--"))
                        txts_ok.append(fmt); angs_ok.append(0)
                        hovs_ok.append(f"<b>{nazwa}</b><br>{z_info['nazwa']}: {fmt} {z_info['unit']} {kier_na_strzalke(st['kierunek'].get(okres))}<br>Czas: {cz_now}")
                    else:
                        fmt = f"{val:.1f}"
                        cz_now = ms.get("czas_now", st.get("czas_now", "--:--"))
                        txts_ok.append(fmt); angs_ok.append(0)
                        hovs_ok.append(f"<b>{nazwa}</b><br>{z_info['nazwa']}: {fmt} {z_info['unit']}<br>Czas: {cz_now}")
                else: lats_nan.append(lat); lons_nan.append(lon); hovs_nan.append(f"<b>{nazwa}</b><br>Brak danych")

            js_data[z_key][okres] = {
                "pt_lats": [round(x, 4) for x in lats_ok],
                "pt_lons": [round(x, 4) for x in lons_ok],
                "pt_vals": [round(x, 1) if x is not None else None for x in vals_ok],
                "pt_hov": hovs_ok,
                "pt_txts": txts_ok
            }

    js_colors = {
        "TEMP_COLORSCALE": TEMP_COLORSCALE,
        "WIND_COLORSCALE": WIND_COLORSCALE,
        "HUMIDITY_COLORSCALE": HUMIDITY_COLORSCALE,
        "DEWPOINT_COLORSCALE": DEWPOINT_COLORSCALE,
        "TREND_TEMP_COLORSCALE": TREND_TEMP_COLORSCALE,
        "TREND_HUMIDITY_COLORSCALE": TREND_HUMIDITY_COLORSCALE
    }

    # Zapis i wysyłka do Firebase
    final_payload_base = {
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

    final_payload_base = clean_nans(final_payload_base)
    js_data = clean_nans(js_data)

    try:
        print(f"  Wysyłanie metadanych do bazy {FIREBASE_URL}/imgw_map_data.json")
        resp_meta = requests.patch(f"{FIREBASE_URL}/imgw_map_data.json{auth_param}", json=final_payload_base)
        if resp_meta.status_code != 200:
            print(f"  [!] Błąd metadanych Firebase ({resp_meta.status_code}): {resp_meta.text}")
            resp_meta.raise_for_status()

        # Wysyłamy każdą zmienną i każdy okres w oddzielnym zapytaniu (Chunking per okres = brak błędu 400 Bad Request)
        total_chunks = sum(len(periods) for periods in js_data.values())
        chunk_i = 0
        for z_key, z_dict in js_data.items():
            for okres, okres_data in z_dict.items():
                chunk_i += 1
                payload_str = json.dumps(okres_data)
                sys.stdout.write(f"\r  Wysyłanie [{chunk_i}/{total_chunks}] {z_key}/{okres} ({len(payload_str)} B)...      ")
                sys.stdout.flush()
                resp = requests.put(f"{FIREBASE_URL}/imgw_map_data/MAP_DATA/{z_key}/{okres}.json{auth_param}", json=okres_data)
                if resp.status_code != 200:
                    print(f"\n  [!] Błąd Firebase ({resp.status_code}) dla {z_key}/{okres}: {resp.text}")
                    resp.raise_for_status()

        print("\n  [OK] Dane przestrzenne zaktualizowane w Firebase (Porcjami per okres)!")
    except Exception as e:
        print(f"\n  [!] Błąd wysyłania do Firebase: {e}")
        sys.exit(1)
        
    print("=" * 65)

if __name__ == "__main__":
    generate_dashboard()

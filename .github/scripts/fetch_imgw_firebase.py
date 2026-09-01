#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skrypt pobiera dane ze stacji IMGW i wysyła je bezpośrednio 
do bazy Firebase Realtime Database.
"""

import requests
import math
from datetime import datetime, timedelta

IMGW_URL = "https://danepubliczne.imgw.pl/api/data/meteo"
FIREBASE_URL = "https://meteo-bbe28-default-rtdb.europe-west1.firebasedatabase.app"
MAX_HISTORY_HOURS = 5

def oblicz_punkt_rosy(temp_c, wilgotnosc_pct):
    if temp_c is None or wilgotnosc_pct is None or wilgotnosc_pct <= 0:
        return None
    a, b = 17.27, 237.7
    try:
        alpha = (a * temp_c) / (b + temp_c) + math.log(wilgotnosc_pct / 100.0)
        td = (b * alpha) / (a - alpha)
        return round(td, 1)
    except:
        return None

def ms_na_kmh(v_ms):
    return round(v_ms * 3.6, 1) if v_ms is not None else None

def parsuj_float(wartosc):
    try:
        return float(wartosc) if wartosc not in (None, "") else None
    except ValueError:
        return None

def check_fresh(val_str, date_str, now_utc):
    if val_str in (None, "") or not date_str:
        return None
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        if (now_utc - dt).total_seconds() > 6 * 3600:
            return None
        return float(val_str)
    except ValueError:
        return None

def fetch_and_upload():
    print("=" * 65)
    print("  POBIERANIE IMGW I WYSYŁKA DO FIREBASE")
    print("=" * 65)

    response = requests.get(IMGW_URL, timeout=30)
    response.raise_for_status()
    raw_stations = response.json()
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    now_utc = datetime.utcnow()
    processed = []

    for st in raw_stations:
        lat = parsuj_float(st.get("lat"))
        lon = parsuj_float(st.get("lon"))
        if lat is None or lon is None: continue

        temp = check_fresh(st.get("temperatura_powietrza"), st.get("temperatura_powietrza_data"), now_utc)
        temp_grunt = check_fresh(st.get("temperatura_gruntu"), st.get("temperatura_gruntu_data"), now_utc)
        wilg = check_fresh(st.get("wilgotnosc_wzgledna"), st.get("wilgotnosc_wzgledna_data"), now_utc)
        wiatr_sr = check_fresh(st.get("wiatr_srednia_predkosc"), st.get("wiatr_srednia_predkosc_data"), now_utc)
        wiatr_max = check_fresh(st.get("wiatr_predkosc_maksymalna"), st.get("wiatr_predkosc_maksymalna_data"), now_utc)
        wiatr_poryw = check_fresh(st.get("wiatr_poryw_10min"), st.get("wiatr_poryw_10min_data"), now_utc)
        wiatr_kier = check_fresh(st.get("wiatr_kierunek"), st.get("wiatr_kierunek_data"), now_utc)

        punkt_rosy = oblicz_punkt_rosy(temp, wilg)
        wiatr_sr_kmh = ms_na_kmh(wiatr_sr)
        wiatr_max_kmh = ms_na_kmh(wiatr_max)
        wiatr_poryw_kmh = ms_na_kmh(wiatr_poryw)
        
        porywy = [v for v in [wiatr_max_kmh, wiatr_poryw_kmh] if v is not None]
        maks_poryw_kmh = max(porywy) if porywy else None

        processed.append({
            "nazwa": st.get("nazwa_stacji", "?"),
            "kod": st.get("kod_stacji", ""),
            "lat": lat,
            "lon": lon,
            "wys_npm": parsuj_float(st.get("wysokosc_npm")),
            "temp": temp,
            "temp_data": st.get("temperatura_powietrza_data"),
            "temp_grunt": temp_grunt,
            "wilgotnosc": wilg,
            "punkt_rosy": punkt_rosy,
            "wiatr_sr_kmh": wiatr_sr_kmh,
            "wiatr_max_kmh": wiatr_max_kmh,
            "wiatr_poryw_kmh": wiatr_poryw_kmh,
            "maks_poryw_kmh": maks_poryw_kmh,
            "wiatr_kierunek": wiatr_kier,
        })

    snapshot = {
        "czas_pobrania": now_str,
        "liczba_stacji": len(processed),
        "stacje": processed
    }

    import os
    secret = os.environ.get("FIREBASE_SECRET", "")
    auth_param = f"?auth={secret}" if secret else ""

    # Upload latest snapshot
    print(f"Wysyłanie {len(processed)} stacji do {FIREBASE_URL}/imgw_latest.json")
    resp_latest = requests.put(f"{FIREBASE_URL}/imgw_latest.json{auth_param}", json=snapshot)
    resp_latest.raise_for_status()

    # Get history, append, and upload
    resp_hist = requests.get(f"{FIREBASE_URL}/imgw_historia.json{auth_param}")
    historia = resp_hist.json() or []
    if not isinstance(historia, list):
        historia = []
        
    historia.append(snapshot)
    
    cutoff = datetime.now() - timedelta(hours=MAX_HISTORY_HOURS)
    historia_filtered = [
        snap for snap in historia 
        if snap.get("czas_pobrania") and datetime.strptime(snap["czas_pobrania"], "%Y-%m-%d %H:%M:%S") >= cutoff
    ]

    print(f"Wysyłanie historii ({len(historia_filtered)} wpisów) do {FIREBASE_URL}/imgw_historia.json")
    resp_hist_put = requests.put(f"{FIREBASE_URL}/imgw_historia.json{auth_param}", json=historia_filtered)
    resp_hist_put.raise_for_status()
    
    print("Zakończono pomyślnie!")

if __name__ == "__main__":
    fetch_and_upload()

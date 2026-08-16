import os
import requests
import openpyxl
import time
import json

TIMEZONE = "Europe/Warsaw"

MODELS = [
    ("ecmwf_ifs025_ensemble",          "ECMWF_IFS",     50),
    ("ecmwf_aifs025_ensemble",         "ECMWF_AIFS",    50),
    ("ncep_gefs025",                   "GEFS",          30),
    ("icon_eu_eps",                    "ICON_EU",       39),
]

def download_data():
    print()
    print("═" * 65)
    print("  KROK 1: POBIERANIE DANYCH Z MODELI (API)")
    
    import sys
    if len(sys.argv) >= 3:
        try:
            threshold = float(str(sys.argv[1]).replace(',', '.'))
            days_ahead = int(sys.argv[2])
            print(f"  Parametry: Próg = {threshold}°C, Dni w przód = +{days_ahead}")
        except ValueError:
            threshold = 30.0
            days_ahead = 1
    else:
        try:
            threshold = float(input("  Podaj próg temperatury (np. 30 dla T_max > 30°C): ").replace(',', '.'))
            days_ahead = int(input("  Na ile dni do przodu? (0 = dzisiaj, 1 = jutro, max 14): "))
        except (ValueError, EOFError):
            print("  [Domyślnie] Ustawiono próg: 30°C, dni w przód: +1")
            threshold = 30.0
            days_ahead = 1

    print("  Generowanie siatki (ok. 270 punktów)...")
    lats = [round(49.0 + i*0.5, 2) for i in range(13)]
    lons = [round(14.0 + i*0.5, 2) for i in range(21)]
    
    points = [(lat, lon) for lat in lats for lon in lons]
    print(f"  Przygotowano {len(points)} punktów.")
    
    point_members = {i: [] for i in range(len(points))}
    batch_size = 50
    batches = [points[i:i + batch_size] for i in range(0, len(points), batch_size)]
    
    for api_id, name, _ in MODELS:
        print(f"  [{name:14s}] Pobieranie siatki...", end=" ", flush=True)
        success = True
        global_idx = 0
        
        for batch in batches:
            lat_str = ",".join(str(p[0]) for p in batch)
            lon_str = ",".join(str(p[1]) for p in batch)
            
            url = "https://ensemble-api.open-meteo.com/v1/ensemble"
            params = {
                "latitude": lat_str,
                "longitude": lon_str,
                "daily": "temperature_2m_max",
                "models": api_id,
                "timezone": TIMEZONE
            }
            try:
                for retry in range(3):
                    resp = requests.get(url, params=params, timeout=120)
                    if resp.status_code == 429:
                        print(" [Limit 1min - czekam 60s...] ", end="", flush=True)
                        time.sleep(60)
                        continue
                    resp.raise_for_status()
                    data = resp.json()
                    break
                else:
                    raise Exception("Przekroczono limit prób API.")
                    
                if not isinstance(data, list):
                    data = [data]
                
                for batch_idx, loc_data in enumerate(data):
                    idx = global_idx + batch_idx
                    daily = loc_data.get("daily", {})
                    if "time" in daily and len(daily["time"]) > days_ahead:
                        for key, vals in daily.items():
                            if key.startswith("temperature_2m_max_member"):
                                val = vals[days_ahead]
                                if val is not None:
                                    point_members[idx].append(val)
            except Exception as e:
                print(f" (Wyjątek: {e})", end="")
                success = False
                break
            
            global_idx += len(batch)
        
        if success:
            print("OK")
        else:
            print("BŁĄD")
            
    print("  Zapisywanie danych do Dane_Mapy_Polska.xlsx...")
    target_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Dane_Mapy_Polska.xlsx")
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Mapa_Grid"
    
    headers = ["Lat", "Lon", f"Prawdopodobieństwo T > {threshold}°C [%]", "Oczekiwana T_max [°C]", "Liczba wiązek"]
    ws.append(headers)
    
    for i, p in enumerate(points):
        members = point_members[i]
        n = len(members)
        if n > 0:
            mean_t = sum(members) / n
            prob = sum(1 for m in members if m > threshold) / n * 100
        else:
            mean_t = 0
            prob = 0
            
        ws.append([p[0], p[1], round(prob, 2), round(mean_t, 2), n])
        
    wb.save(target_file)
    
    # Zapis parametrów aby skrypt renderujący wiedział co to za dane
    config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    with open(config_file, "w") as f:
        json.dump({"threshold": threshold, "days_ahead": days_ahead}, f)
        
    print(f"  ✓ Gotowe! Plik {os.path.basename(target_file)} zaktualizowany.")
    print("═" * 65)

if __name__ == "__main__":
    download_data()

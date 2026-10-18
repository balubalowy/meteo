import os
import sys
import time
import json
import requests
import openpyxl

TIMEZONE = "Europe/Warsaw"

MODELS = [
    ("ecmwf_ifs025_ensemble",          "ECMWF_IFS",     50),
    ("ecmwf_aifs025_ensemble",         "ECMWF_AIFS",    50),
    ("ncep_gefs025",                   "GEFS",          30),
    ("icon_eu_eps",                    "ICON_EU",       39),
]

def parse_cli_arguments():
    if len(sys.argv) >= 3:
        try:
            threshold = float(str(sys.argv[1]).replace(',', '.'))
            days_ahead = int(sys.argv[2])
            print(f"  Parametry: Próg = {threshold}°C, Dni w przód = +{days_ahead}")
            return threshold, days_ahead
        except ValueError:
            pass
    try:
        threshold = float(input("  Podaj próg temperatury (np. 30 dla T_max > 30°C): ").replace(',', '.'))
        days_ahead = int(input("  Na ile dni do przodu? (0 = dzisiaj, 1 = jutro, max 14): "))
        return threshold, days_ahead
    except (ValueError, EOFError):
        print("  [Domyślnie] Ustawiono próg: 30°C, dni w przód: +1")
        return 30.0, 1

def generate_forecast_grid():
    lats = [round(49.0 + i * 0.5, 2) for i in range(13)]
    lons = [round(14.0 + i * 0.5, 2) for i in range(21)]
    return [(lat, lon) for lat in lats for lon in lons]

def fetch_batch_with_retry(batch, api_id):
    url = "https://ensemble-api.open-meteo.com/v1/ensemble"
    params = {
        "latitude": ",".join(str(p[0]) for p in batch),
        "longitude": ",".join(str(p[1]) for p in batch),
        "daily": "temperature_2m_max",
        "models": api_id,
        "timezone": TIMEZONE
    }
    for _ in range(3):
        resp = requests.get(url, params=params, timeout=120)
        if resp.status_code == 429:
            print(" [Limit 1min - czekam 60s...] ", end="", flush=True)
            time.sleep(60)
            continue
        resp.raise_for_status()
        data = resp.json()
        return data if isinstance(data, list) else [data]
    raise RuntimeError("Przekroczono limit prób API Open-Meteo.")

def extract_member_temperatures(data, days_ahead, point_members, offset):
    for batch_idx, loc_data in enumerate(data):
        daily = loc_data.get("daily", {})
        if "time" not in daily or len(daily["time"]) <= days_ahead:
            continue
        idx = offset + batch_idx
        for key, vals in daily.items():
            if key.startswith("temperature_2m_max_member"):
                val = vals[days_ahead]
                if val is not None:
                    point_members[idx].append(val)

def export_results_to_excel(points, point_members, threshold, days_ahead, target_dir):
    target_file = os.path.join(target_dir, "Dane_Mapy_Polska.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Mapa_Grid"
    ws.append(["Lat", "Lon", f"Prawdopodobieństwo T > {threshold}°C [%]", "Oczekiwana T_max [°C]", "Liczba wiązek"])

    for i, p in enumerate(points):
        members = point_members[i]
        n = len(members)
        mean_t = (sum(members) / n) if n > 0 else 0
        prob = (sum(1 for m in members if m > threshold) / n * 100) if n > 0 else 0
        ws.append([p[0], p[1], round(prob, 2), round(mean_t, 2), n])

    wb.save(target_file)
    config_file = os.path.join(target_dir, "config.json")
    with open(config_file, "w") as f:
        json.dump({"threshold": threshold, "days_ahead": days_ahead}, f)
    print(f"  Gotowe! Plik {os.path.basename(target_file)} zaktualizowany.")

def download_data():
    print("\n" + "=" * 65)
    print("  KROK 1: POBIERANIE DANYCH Z MODELI (API)")
    threshold, days_ahead = parse_cli_arguments()
    points = generate_forecast_grid()
    print(f"  Przygotowano {len(points)} punktów.")

    point_members = {i: [] for i in range(len(points))}
    batch_size = 50
    batches = [points[i:i + batch_size] for i in range(0, len(points), batch_size)]

    for api_id, name, _ in MODELS:
        print(f"  [{name:14s}] Pobieranie siatki...", end=" ", flush=True)
        global_idx = 0
        success = True
        for batch in batches:
            try:
                data = fetch_batch_with_retry(batch, api_id)
                extract_member_temperatures(data, days_ahead, point_members, global_idx)
            except Exception as e:
                print(f" (Wyjątek: {e})", end="")
                success = False
                break
            global_idx += len(batch)
        print("OK" if success else "BŁĄD")

    target_dir = os.path.dirname(os.path.abspath(__file__))
    export_results_to_excel(points, point_members, threshold, days_ahead, target_dir)
    print("=" * 65)

if __name__ == "__main__":
    download_data()

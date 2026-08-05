import os
import json
import requests
import math
from datetime import datetime, timezone, timedelta

# Source for Dew Point Formula: Magnus-Tetens approximation
# Td = (b * alpha) / (a - alpha)
# where alpha = (a * T) / (b + T) + ln(RH / 100)
# a = 17.27, b = 237.7
def calculate_dew_point(temp, rh):
    if temp is None or rh is None or rh <= 0:
        return None
    a = 17.27
    b = 237.7
    alpha = ((a * temp) / (b + temp)) + math.log(rh / 100.0)
    td = (b * alpha) / (a - alpha)
    return round(td, 1)

def fetch_data():
    url = "https://danepubliczne.imgw.pl/api/data/meteo"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Błąd pobierania danych: {e}")
        return None

def process_data(raw_data):
    if not raw_data:
        return []
    
    stations = []
    for item in raw_data:
        try:
            # Parse values, handle possible None/missing
            station_name = item.get('stacja')
            if not station_name:
                continue
                
            lat = float(item.get('szerokosc_geograficzna', 0)) if item.get('szerokosc_geograficzna') else None
            lon = float(item.get('dlugosc_geograficzna', 0)) if item.get('dlugosc_geograficzna') else None
            temp = float(item.get('temperatura', 0)) if item.get('temperatura') else None
            ground_temp = float(item.get('temperatura_grunt', 0)) if item.get('temperatura_grunt') else None
            humidity = float(item.get('wilgotnosc_wzgledna', 0)) if item.get('wilgotnosc_wzgledna') else None
            pressure = float(item.get('cisnienie', 0)) if item.get('cisnienie') else None
            
            # Wind speed is usually in m/s, convert to km/h (* 3.6)
            wind_speed_ms = float(item.get('predkosc_wiatru', 0)) if item.get('predkosc_wiatru') else None
            wind_gust_ms = float(item.get('poryw_wiatru', 0)) if item.get('poryw_wiatru') else None
            
            wind_speed_kmh = round(wind_speed_ms * 3.6, 1) if wind_speed_ms is not None else None
            wind_gust_kmh = round(wind_gust_ms * 3.6, 1) if wind_gust_ms is not None else None
            
            dew_point = calculate_dew_point(temp, humidity)
            
            stations.append({
                "name": station_name,
                "lat": lat,
                "lon": lon,
                "temp": temp,
                "ground_temp": ground_temp,
                "humidity": humidity,
                "dew_point": dew_point,
                "wind_speed_kmh": wind_speed_kmh,
                "wind_gust_kmh": wind_gust_kmh,
                "pressure": pressure
            })
        except ValueError:
            continue
            
    return stations

def main():
    data_dir = "stacje/dane"
    os.makedirs(data_dir, exist_ok=True)
    
    raw_data = fetch_data()
    stations = process_data(raw_data)
    
    if not stations:
        print("Brak danych do zapisania.")
        return
        
    now = datetime.now(timezone.utc)
    timestamp_str = now.isoformat()
    
    latest_data = {
        "timestamp": timestamp_str,
        "station_count": len(stations),
        "stations": stations
    }
    
    latest_file = os.path.join(data_dir, "imgw_latest.json")
    with open(latest_file, "w", encoding="utf-8") as f:
        json.dump(latest_data, f, ensure_ascii=False, indent=2)
        
    history_file = os.path.join(data_dir, "imgw_historia_24h.json")
    history_data = []
    
    if os.path.exists(history_file):
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history_data = json.load(f)
        except json.JSONDecodeError:
            pass
            
    # Append new data
    history_data.append(latest_data)
    
    # Prune data older than 24h
    cutoff_time = now - timedelta(hours=24)
    pruned_history = []
    for snapshot in history_data:
        try:
            snapshot_time = datetime.fromisoformat(snapshot["timestamp"])
            if snapshot_time >= cutoff_time:
                pruned_history.append(snapshot)
        except (ValueError, KeyError):
            pass
            
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(pruned_history, f, ensure_ascii=False, indent=2)
        
    print(f"Zapisano dane dla {len(stations)} stacji. Historia zawiera {len(pruned_history)} wpisów.")

if __name__ == "__main__":
    main()

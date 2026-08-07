import pandas as pd
import json
import os
from datetime import datetime

def main():
    excel_path = r'C:\Users\baluk\OneDrive - Uniwersytet Ekonomiczny we Wrocławiu\hanuenane cz. 3\[-] ROZWÓJ\[1] EXCEL I DANE\modele excel\PASJE_Pamiętnik_burz.xlsx'
    
    if not os.path.exists(excel_path):
        print(f"Brak pliku Excel pod ścieżką: {excel_path}")
        return

    try:
        # Wczytujemy z nagłówkiem na trzecim wierszu (header=2)
        df = pd.read_excel(excel_path, sheet_name='Burze', header=2)
        
        # Czyszczenie: odrzucamy wiersze, które nie mają poprawnych danych o burzy (np. "Opłacalność" w środku, albo NaN w L.p.)
        # Załóżmy, że "Data" lub "Lokalizacja" muszą być obecne i nie NaN
        df = df.dropna(subset=['Lokalizacja'])
        
        # Odrzucamy wiersze gdzie L.p. nie jest liczbą
        def is_numeric_lp(val):
            try:
                # np. 1.0, 2.0 albo '1.' -> '1'
                if isinstance(val, str):
                    val = val.replace('.', '')
                float(val)
                return True
            except:
                return False

        df = df[df['L.p.'].apply(is_numeric_lp)]
        
        total_storms = len(df)
        
        # Zbieranie maksymalnego wiatru (Kolumna 'Wiatr' lub 'Prędkość wiatru 850 hPa')
        # Może być "Wiatr" (jako string lub float)
        def parse_numeric(val):
            try:
                if pd.isna(val) or val == '-':
                    return 0.0
                return float(val)
            except:
                return 0.0

        max_wind = 0.0
        if 'Wiatr' in df.columns:
            max_wind = df['Wiatr'].apply(parse_numeric).max()
            
        max_cape = 0.0
        if 'Maks. CAPE' in df.columns:
            max_cape = df['Maks. CAPE'].apply(parse_numeric).max()
            
        total_km = 0.0
        if 'Przejechane kilometry' in df.columns:
            total_km = df['Przejechane kilometry'].apply(parse_numeric).sum()
            
        stats = {
            "total_storms": total_storms,
            "max_wind": max_wind,
            "max_cape": max_cape,
            "total_km": total_km,
            "lastSync": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "js")
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, "local_stats.js")
        
        js_content = f"window.meteoStats = {json.dumps(stats)};"
        
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(js_content)
            
        print("Zapisano statystyki burz do local_stats.js")
        
    except Exception as e:
        print(f"Błąd przetwarzania Excela: {e}")

if __name__ == '__main__':
    main()

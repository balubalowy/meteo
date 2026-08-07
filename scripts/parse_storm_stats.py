import pandas as pd
import json
import os
import shutil
import subprocess
from datetime import datetime

def main():
    excel_path = r'C:\Users\baluk\OneDrive - Uniwersytet Ekonomiczny we Wrocławiu\hanuenane cz. 3\[-] ROZWÓJ\[1] EXCEL I DANE\modele excel\PASJE_Pamiętnik_burz.xlsx'
    
    if not os.path.exists(excel_path):
        print(f"Brak pliku Excel pod ścieżką: {excel_path}")
        return

    # Try copying to temp file to prevent permission lock when Excel is open
    tmp_path = r'C:\Users\baluk\AppData\Local\Temp\temp_burze_parse.xlsx'
    try:
        shutil.copyfile(excel_path, tmp_path)
    except Exception:
        cmd = f'powershell -Command "Copy-Item -LiteralPath \'{excel_path}\' -Destination \'{tmp_path}\' -Force"'
        subprocess.run(cmd, shell=True)

    target_excel = tmp_path if os.path.exists(tmp_path) else excel_path

    try:
        # 1. Sheet 'Podsumowanie'
        df_pod = pd.read_excel(target_excel, sheet_name='Podsumowanie', header=None)
        
        def get_val(r, c):
            if r < df_pod.shape[0] and c < df_pod.shape[1]:
                v = df_pod.iloc[r, c]
                return str(v).strip() if pd.notna(v) else ""
            return ""

        summary_metrics = {
            "burze_lowy": { "val": get_val(2, 2), "info": get_val(4, 2), "stan": get_val(4, 6) },
            "dni_burzowe_lowy": { "val": get_val(7, 2), "info": get_val(9, 2), "stan": get_val(9, 6) },
            "burze_ogolem": { "val": get_val(12, 2), "info": get_val(14, 2), "stan": get_val(14, 6) },
            "dni_burzowe_ogolem": { "val": get_val(17, 2), "info": get_val(19, 2), "stan": get_val(19, 6) },
            "km_suma": { "val": get_val(22, 2), "info": get_val(24, 2), "stan": get_val(24, 6) },
            
            "grad_max": { "val": get_val(2, 11), "info": get_val(4, 11), "stan": get_val(4, 15) },
            "wiatr_max": { "val": get_val(7, 11), "info": get_val(9, 11), "stan": get_val(9, 15) },
            "opad_max": { "val": get_val(12, 11), "info": get_val(14, 11), "stan": get_val(14, 15) },
            
            "temp_max": { "val": get_val(2, 20), "info": get_val(4, 20), "stan": get_val(4, 24) },
            "temp_min": { "val": get_val(7, 20), "info": get_val(9, 20), "stan": get_val(9, 24) },
        }

        # 2. Sheet 'Skala'
        df_skala = pd.read_excel(target_excel, sheet_name='Skala', header=None)
        ratings_table = []
        for r in range(2, 8):
            if r < df_skala.shape[0]:
                nazwa = str(df_skala.iloc[r, 11]).strip() if pd.notna(df_skala.iloc[r, 11]) else ""
                zagr = int(df_skala.iloc[r, 12]) if pd.notna(df_skala.iloc[r, 12]) else 0
                wygl = int(df_skala.iloc[r, 13]) if pd.notna(df_skala.iloc[r, 13]) else 0
                ratings_table.append({"name": nazwa, "zagrozenia": zagr, "wyglad": wygl})

        # 3. Sheet 'Burze' for max CAPE
        df_burze = pd.read_excel(target_excel, sheet_name='Burze', header=2)
        df_burze = df_burze.dropna(subset=['Lokalizacja'])
        def parse_num(v):
            try:
                return float(v) if (pd.notna(v) and v != '-') else 0.0
            except:
                return 0.0
        max_cape = df_burze['Maks. CAPE'].apply(parse_num).max() if 'Maks. CAPE' in df_burze.columns else 3870

        # 4. Count repo files
        repo_dir = r'e:\meteo'
        py_c, html_c, xlsx_c = 0, 0, 0
        for root, dirs, files in os.walk(repo_dir):
            for f in files:
                if f.endswith('.py'): py_c += 1
                elif f.endswith('.html'): html_c += 1
                elif f.endswith('.xlsx'): xlsx_c += 1

        stats = {
            "total_storms": summary_metrics["burze_ogolem"]["val"],
            "max_wind": summary_metrics["wiatr_max"]["val"],
            "max_cape": int(max_cape),
            "total_km": summary_metrics["km_suma"]["val"],
            "summary": summary_metrics,
            "ratings": ratings_table,
            "pythonFiles": py_c,
            "htmlFiles": html_c,
            "excelFiles": xlsx_c,
            "lastSync": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "js")
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, "local_stats.js")
        
        js_content = f"window.meteoStats = {json.dumps(stats, indent=2, ensure_ascii=False)};"
        
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(js_content)
            
        print("Zapisano pełne statystyki burz do local_stats.js")
        print("Stats sample:", json.dumps(stats, indent=2, ensure_ascii=False)[:500])
        
    except Exception as e:
        print(f"Błąd przetwarzania Excela: {e}")

if __name__ == '__main__':
    main()

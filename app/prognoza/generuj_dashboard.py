import os
import json
import requests
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from scipy.interpolate import griddata
from shapely.geometry import shape, Point
import traceback

def generate_dashboard():
    print()
    print("═" * 65)
    print("  KROK 2: GENEROWANIE MAPY Z DANYCH EXCEL")
    
    excel_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Dane_Mapy_Polska.xlsx")
    config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    
    if not os.path.exists(excel_file):
        print(f"  ⚠ Brak pliku {os.path.basename(excel_file)}. Najpierw uruchom skrypt pobierający (KROK 1).")
        return
        
    print(f"  Wczytywanie danych z {os.path.basename(excel_file)}...")
    df_excel = pd.read_excel(excel_file)
    
    if os.path.exists(config_file):
        with open(config_file, "r") as f:
            cfg = json.load(f)
            threshold = cfg.get("threshold", "?")
            days_ahead = cfg.get("days_ahead", "?")
    else:
        print("  [Info] To są dane bez pliku konfiguracyjnego (config.json).")
        try:
            threshold = input("  Jaki próg upału (T_max > ?) był użyty do tych danych?: ").strip()
            days_ahead = input("  Na ile dni w przód wygenerowano te dane?: ").strip()
            with open(config_file, "w") as f:
                json.dump({"threshold": threshold, "days_ahead": days_ahead}, f)
        except Exception:
            threshold = "?"
            days_ahead = "?"

    lat_col = df_excel.columns[0]
    lon_col = df_excel.columns[1]
    prob_col = df_excel.columns[2]
    tmax_col = df_excel.columns[3]
    
    df = df_excel.rename(columns={lat_col: 'Lat', lon_col: 'Lon', prob_col: 'Szansa', tmax_col: 'Temperatura'})

    try:
        print("  [Geo] Pobieranie konturów Polski...")
        geojson_url = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/POL.geo.json'
        r = requests.get(geojson_url)
        geojson_data = r.json()
        poland_polygon = shape(geojson_data['features'][0]['geometry'])

        print("  [Grid] Przygotowywanie siatki i interpolacja...")
        points_arr = df[['Lon', 'Lat']].values
        tmax_vals = df['Temperatura'].values
        prob_vals = df['Szansa'].values

        grid_lon, grid_lat = np.mgrid[14.0:24.2:0.05, 48.9:55.0:0.05]
        
        grid_tmax = griddata(points_arr, tmax_vals, (grid_lon, grid_lat), method='cubic')
        grid_prob = griddata(points_arr, prob_vals, (grid_lon, grid_lat), method='cubic')

        print("  [Mask] Wycinanie mapy do granic Polski (to może zająć 2-3 sekundy)...")
        fine_data = {'Lat': [], 'Lon': [], 'Temperatura': [], 'Szansa': []}
        
        grid_tmax_masked = np.copy(grid_tmax)
        grid_prob_masked = np.copy(grid_prob)
        
        for i in range(grid_lon.shape[0]):
            for j in range(grid_lon.shape[1]):
                lon = grid_lon[i, j]
                lat = grid_lat[i, j]
                t_val = grid_tmax[i, j]
                p_val = grid_prob[i, j]
                if not np.isnan(t_val) and poland_polygon.contains(Point(lon, lat)):
                    fine_data['Lat'].append(lat)
                    fine_data['Lon'].append(lon)
                    fine_data['Temperatura'].append(round(t_val, 1))
                    fine_data['Szansa'].append(round(p_val, 1))
                else:
                    grid_tmax_masked[i, j] = np.nan
                    grid_prob_masked[i, j] = np.nan

        df_fine = pd.DataFrame(fine_data)
        
        print("  [Geo] Obliczanie izolinii (Contour paths)...")
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt

        def get_contours(grid_z, interval):
            min_val = np.nanmin(grid_z)
            max_val = np.nanmax(grid_z)
            levels = np.arange(np.floor(min_val/interval)*interval, np.ceil(max_val/interval)*interval + interval, interval)
            
            fig_c = plt.figure()
            ax = fig_c.add_subplot(111)
            cs = ax.contour(grid_lon, grid_lat, grid_z, levels=levels)
            
            lons, lats, txts = [], [], []
            for level, path in zip(levels, cs.get_paths()):
                codes = path.codes if path.codes is not None else np.zeros(len(path.vertices))
                for i, (coord, code) in enumerate(zip(path.vertices, codes)):
                    if code == 1 and i > 0: # 1 == MOVETO, break the line
                        lons.append(None)
                        lats.append(None)
                        txts.append(None)
                    lons.append(coord[0])
                    lats.append(coord[1])
                    txts.append(f"{level}")
                lons.append(None)
                lats.append(None)
                txts.append(None)
            plt.close(fig_c)
            return lons, lats, txts

        c_lon_t, c_lat_t, c_txt_t = get_contours(grid_tmax_masked, 2.0)
        c_lon_p, c_lat_p, c_txt_p = get_contours(grid_prob_masked, 5.0)

        # --- RENDEROWANIE PLOTLY ---
        print("  [Plot] Rysowanie dwuwarstwowej mapy...")
        custom_colorscale = [
            [0.0, "#f4c2f4"], [0.055, "#e020e0"], [0.111, "#8a2be2"], [0.166, "#4b0082"],
            [0.222, "#000080"], [0.277, "#0000ff"], [0.333, "#1e90ff"], [0.388, "#00bfff"],
            [0.444, "#00ffff"], [0.5, "#00fa9a"], [0.555, "#32cd32"], [0.611, "#adff2f"],
            [0.666, "#ffd700"], [0.722, "#ffa500"], [0.777, "#ff4500"], [0.833, "#ff0000"],
            [0.888, "#8b0000"], [0.944, "#5c4033"], [1.0, "#808080"]
        ]
        
        prob_colorscale = [
            [0.0, "#0000ff"], [0.25, "#00ffff"], [0.5, "#ffff00"], [0.75, "#ff0000"], [1.0, "#ffffff"]
        ]

        trace_temp = go.Scattermapbox(
            lat=df_fine['Lat'], lon=df_fine['Lon'],
            mode='markers+text',
            text=df_fine['Temperatura'].astype(str) + '°C',
            textfont=dict(size=12, color='black', family='Arial Black'),
            textposition='top right',
            marker=dict(
                size=14, 
                color=df_fine['Temperatura'],
                colorscale=custom_colorscale,
                cmin=-40, cmax=50,
                showscale=True,
                colorbar=dict(title="T_max [°C]")
            ),
            hovertemplate="T_max [°C]=%{marker.color}<br>Prawdopodobieństwo [%]=%{customdata[0]}<extra></extra>",
            customdata=df_fine[['Szansa']]
        )

        trace_prob = go.Scattermapbox(
            lat=df_fine['Lat'], lon=df_fine['Lon'],
            mode='markers+text',
            text=df_fine['Szansa'].astype(str) + '%',
            textfont=dict(size=12, color='black', family='Arial Black'),
            textposition='top right',
            marker=dict(
                size=14, 
                color=df_fine['Szansa'],
                colorscale=prob_colorscale,
                cmin=0, cmax=100,
                showscale=True,
                colorbar=dict(title="Prawd. [%]")
            ),
            hovertemplate="Prawd. [%]=%{marker.color}<br>T_max [°C]=%{customdata[0]}<extra></extra>",
            customdata=df_fine[['Temperatura']],
            visible=False
        )
        
        fig = go.Figure(data=[trace_temp, trace_prob])
        fig.update_traces(opacity=0.9)
        
        trace_contour_temp = go.Scattermapbox(
            lat=c_lat_t, lon=c_lon_t, mode='lines',
            line=dict(width=1, color='rgba(0,0,0,0.5)'),
            text=c_txt_t, hovertemplate="Izolinia: %{text}°C<extra></extra>", hoverinfo="text"
        )
        trace_contour_prob = go.Scattermapbox(
            lat=c_lat_p, lon=c_lon_p, mode='lines',
            line=dict(width=1, color='rgba(0,0,0,0.5)'),
            text=c_txt_p, hovertemplate="Izolinia: %{text}%<extra></extra>", hoverinfo="text",
            visible=False
        )

        max_temp_idx = df_fine['Temperatura'].idxmax()
        max_temp_row = df_fine.loc[max_temp_idx]
        
        trace_max_temp_text = go.Scattermapbox(
            lat=[max_temp_row['Lat']], lon=[max_temp_row['Lon']], mode='markers+text',
            marker=dict(size=22, color='rgba(0,0,0,0)', opacity=1.0),
            text=[f"🔥 MAX TEMP: {max_temp_row['Temperatura']}°C"],
            textposition="top right", textfont=dict(color="black", size=14),
            hoverinfo="skip"
        )
        trace_max_temp_border = go.Scattermapbox(
            lat=[max_temp_row['Lat']], lon=[max_temp_row['Lon']], mode='markers',
            marker=dict(size=24, color='white', opacity=0.7), hoverinfo="skip"
        )

        max_prob_idx = df_fine['Szansa'].idxmax()
        max_prob_row = df_fine.loc[max_prob_idx]
        
        trace_max_prob_text = go.Scattermapbox(
            lat=[max_prob_row['Lat']], lon=[max_prob_row['Lon']], mode='markers+text',
            marker=dict(size=22, color='rgba(0,0,0,0)', opacity=1.0),
            text=[f"⚠️ MAX SZANSA: {max_prob_row['Szansa']}%"],
            textposition="bottom right", textfont=dict(color="black", size=14),
            hoverinfo="skip", visible=False
        )
        trace_max_prob_border = go.Scattermapbox(
            lat=[max_prob_row['Lat']], lon=[max_prob_row['Lon']], mode='markers',
            marker=dict(size=24, color='black', opacity=0.7), hoverinfo="skip", visible=False
        )

        fig.add_trace(trace_contour_temp)
        fig.add_trace(trace_contour_prob)
        fig.add_trace(trace_max_temp_text)
        fig.add_trace(trace_max_temp_border)
        fig.add_trace(trace_max_prob_text)
        fig.add_trace(trace_max_prob_border)

        fig.update_layout(
            showlegend=False,
            mapbox=dict(style="carto-positron", center=dict(lat=52.0, lon=19.2), zoom=5.2),
            margin=dict(l=0, r=0, t=0, b=0)
        )

        data_buttons = [
            dict(label="Wyświetl: Temperatura", method="update", args=[{"visible": [True, False, True, False, True, True, False, False]}]),
            dict(label="Wyświetl: Prawdopodobieństwo", method="update", args=[{"visible": [False, True, False, True, False, False, True, True]}])
        ]
        dropdown_data = dict(buttons=data_buttons, direction="down", pad={"r": 10, "t": 10}, showactive=True, x=0.01, xanchor="left", y=0.99, yanchor="top", bgcolor="white", bordercolor="gray")
        
        map_styles = ["carto-darkmatter", "carto-positron", "open-street-map"]
        style_buttons = [dict(args=["mapbox.style", s], label=s, method="relayout") for s in map_styles]
        dropdown_style = dict(buttons=style_buttons, direction="down", pad={"r": 10, "t": 10}, showactive=True, x=0.20, xanchor="left", y=0.99, yanchor="top", bgcolor="white", bordercolor="gray")

        opacity_slider = dict(
            active=8,
            currentvalue={"prefix": "Widoczność mapy: "},
            pad={"t": 10}, x=0.0, len=0.45, y=-0.05,
            steps=[
                dict(label=f"{i*10}%", method="restyle", args=[{"opacity": i/10}, [0, 1]])
                for i in range(1, 11)
            ]
        )
        
        isoline_slider = dict(
            active=5,
            currentvalue={"prefix": "Widoczność izolinii: "},
            pad={"t": 10}, x=0.55, len=0.45, y=-0.05,
            steps=[
                dict(label=f"{i*10}%", method="restyle", args=[{"line.color": f"rgba(0,0,0,{i/10})"}, [2, 3]])
                for i in range(0, 11)
            ]
        )

        fig.update_layout(updatemenus=[dropdown_data, dropdown_style], sliders=[opacity_slider, isoline_slider])
        
        
        json_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard_data.json")
        with open(json_file, "w", encoding="utf-8") as f:
            f.write(fig.to_json())
        plot_html = '<div id="plot_div"></div>\n<script>\nfetch("dashboard_data.json").then(r => r.json()).then(fig => Plotly.newPlot("plot_div", fig.data, fig.layout));\n</script>'
    
        
        
        dashboard_html = f"""<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Pogodowy</title>
  <link rel="stylesheet" href="../assets/css/bcore.css">
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <header class="topbar">
      <div class="logo">
          <i data-lucide="cloud-lightning" class="symbol"></i>
          <h1>Modele <span>Ensemble</span></h1>
      </div>
      <div class="top-stats">
          <a href="../index.html" class="btn btn-ghost"><i data-lucide="arrow-left"></i> Powrót do Głównego Centrum</a>
      </div>
  </header>
  
  <div class="container main-content">
      <div class="card mb-3">
          <div class="card-header-bar" style="justify-content: space-between;">
              <div class="card-title">Ensemble: Próg upału > {threshold}°C</div>
              <div class="stat-label">Wygenerowano: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
          </div>
          <p style="color: var(--text-secondary); margin-bottom: 16px;">Przedział czasowy: +{days_ahead} dni</p>
          <div class="map-container" style="background: var(--bg-tertiary); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); min-height: 70vh;">
              {plot_html}
          </div>
      </div>
  </div>
  <script>lucide.createIcons();</script>
</body>
</html>"""

        
        html_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Dashboard_Pogody.html")
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(dashboard_html)
            
        print(f"  ✓ Gotowe! Interaktywny Dashboard zapisany jako: {os.path.basename(html_file)}")
        
        import webbrowser
        webbrowser.open('file://' + html_file.replace('\\', '/'))
        
    except Exception as e:
        traceback.print_exc()
        print(f"  ⚠ Błąd przy tworzeniu mapy HTML: {e}")

    print("═" * 65)
    print()

if __name__ == "__main__":
    generate_dashboard()

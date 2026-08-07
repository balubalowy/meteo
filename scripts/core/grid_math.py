# -*- coding: utf-8 -*-
import math
import numpy as np
import requests
from scipy.interpolate import griddata
from shapely.geometry import shape, Point
from shapely.ops import unary_union
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def kier_na_strzalke(kier):
    if kier is None: return ""
    try:
        val = float(kier)
    except:
        return ""
    dirs = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"]
    idx = round(val / 45.0) % 8
    return dirs[idx]

def pobierz_polske():
    try:
        url = 'https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/wojewodztwa/wojewodztwa-min.geojson'
        geo_data = requests.get(url, timeout=10).json()
        polygons = [shape(f['geometry']).buffer(0) for f in geo_data['features']]
        return unary_union(polygons)
    except:
        url = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/POL.geo.json'
        geo_data = requests.get(url).json()
        return shape(geo_data['features'][0]['geometry']).buffer(0)

def extract_contours(grid_z, grid_lon, grid_lat, interval):
    if len(grid_z) == 0: return [], [], []
    min_val = np.nanmin(grid_z)
    max_val = np.nanmax(grid_z)
    if np.isnan(min_val): return [], [], []
    
    levels = np.arange(np.floor(min_val/interval)*interval, np.ceil(max_val/interval)*interval + interval, interval)
    fig_c = plt.figure()
    ax = fig_c.add_subplot(111)
    cs = ax.contour(grid_lon, grid_lat, grid_z, levels=levels)
    
    lons, lats, txts = [], [], []
    for level, path in zip(levels, cs.get_paths()):
        codes = path.codes if path.codes is not None else np.zeros(len(path.vertices))
        for i, (coord, code) in enumerate(zip(path.vertices, codes)):
            if code == 1 and i > 0: # MOVETO = break line
                lons.append(None); lats.append(None); txts.append(None)
            lons.append(coord[0])
            lats.append(coord[1])
            txts.append(f"{level}")
        lons.append(None); lats.append(None); txts.append(None)
    plt.close(fig_c)
    return lats, lons, txts

def create_grid(lats, lons, vals, u_vals=None, v_vals=None):
    if len(vals) < 3:
        return [], [], [], [], [], [], None, None, None
    
    grid_lon, grid_lat = np.mgrid[13.5:24.5:0.04, 48.5:55.5:0.04]
    points = np.array([lons, lats]).T
    
    grid_z_linear = griddata(points, vals, (grid_lon, grid_lat), method='linear')
    grid_z_nearest = griddata(points, vals, (grid_lon, grid_lat), method='nearest')
    grid_z = np.where(np.isnan(grid_z_linear), grid_z_nearest, grid_z_linear)
    
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
    
    w_lats, w_lons, w_txts = [], [], []
    if len(gu) > 0 and len(gv) > 0:
        for i in range(0, len(glats), 40): 
            u = gu[i]; v = gv[i]
            spd = math.sqrt(u*u + v*v)
            if spd > 2.0:
                angle = math.degrees(math.atan2(u, v))
                if angle < 0: angle += 360
                idx = int(round(angle / 45.0)) % 8
                arrows = ['⬆', '↗', '➡', '↘', '⬇', '↙', '⬅', '↖']
                w_txts.append(arrows[idx])
                w_lats.append(glats[i])
                w_lons.append(glons[i])

    return glats, glons, gvals, w_lats, w_lons, w_txts, grid_masked, grid_lon, grid_lat

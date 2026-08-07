# -*- coding: utf-8 -*-

FIREBASE_URL = "https://meteo-bbe28-default-rtdb.europe-west1.firebasedatabase.app"

def _wnd(kmh, mx=259): return round(kmh/mx, 4)

TEMP_COLORSCALE = [
    [0.0, "#f4c2f4"], [0.055, "#e020e0"], [0.111, "#8a2be2"], [0.166, "#4b0082"],
    [0.222, "#000080"], [0.277, "#0000ff"], [0.333, "#1e90ff"], [0.388, "#00bfff"],
    [0.444, "#00ffff"], [0.5, "#00fa9a"], [0.555, "#32cd32"], [0.611, "#adff2f"],
    [0.666, "#ffd700"], [0.722, "#ffa500"], [0.777, "#ff4500"], [0.833, "#ff0000"],
    [0.888, "#8b0000"], [0.944, "#5c4033"], [1.0, "#808080"]
]
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

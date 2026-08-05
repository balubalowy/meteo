# Prompt do AntiGravity — Aplikacja do Analizy Danych Radarowych IMGW

---

## 🎯 CEL APLIKACJI

Zbuduj zaawansowaną, interaktywną aplikację webową (single-file HTML) do analizy i wizualizacji danych radarowych IMGW-PIB. Aplikacja jest przeznaczona dla doświadczonego łowcy burz, który umie czytać produkty radarowe — priorytetem jest głęboka analityczność, nie edukacja dla początkujących.

---

## 📂 DANE WEJŚCIOWE

Użytkownik dysponuje lokalnymi plikami radarowymi IMGW w formacie **ODIM HDF5 (`.h5`)**. Pliki mogą być pobrane i dostępne na dysku lokalnym. Format nazewnictwa plików to:

```
YYYYMMDDHHMMSS<zakres>dBZ.ppi.h5       ← reflektywność PPI
YYYYMMDDHHMMSS<zakres>ZDR.max.h5       ← ZDR maksimum kolumny
YYYYMMDDHHMMSS<zakres>V.cappi.h5       ← prędkość radialna (velocity) CAPPI
YYYYMMDDHHMMSS<zakres>BR.dpsri.h5      ← dual-pol Surface Rainfall Intensity
YYYYMMDDHHMMSS<zakres>Height.eht.h5    ← Echo Top Height
YYYYMMDDHHMMSS<zakres>BR.sri.h5        ← Surface Rainfall Intensity
YYYYMMDDHHMMSS<zakres>dBZ.cappi.h5     ← reflektywność CAPPI
```

Przykładowe nazwy plików:
- `20260621165500600dBZ.ppi.h5`
- `20260621165500600V.cappi.h5`
- `20260621165500600ZDR.max.h5`
- `20260621165500600Height.eht.h5`

### Struktura wewnętrzna ODIM HDF5 (standard EUMETNET OPERA v2.4):

```
/what               → date, time, object, version
/where              → lat, lon, alt radaru
/dataset1/
  /where            → elangle, nbins, nrays, rscale, startaz, a1gate
  /data1/
    /what           → quantity (DBZH / VRADH / ZDR / HGHT / RATE), gain, offset, nodata, undetect
    /data           → surowa macierz int8/int16 [nrays × nbins]
```

**Dekodowanie wartości fizycznej:**
```
v = raw * gain + offset
```
Komórki gdzie `raw == nodata` lub `raw == undetect` → `NaN`.

---

## 🛠️ WYMAGANIA TECHNICZNE

### Stack:
- **Jeden plik HTML** — zero zależności serwerowych
- **JavaScript (vanilla lub small CDN libs)** — h5wasm do odczytu HDF5, Canvas/WebGL do rysowania
- **h5wasm** z CDN: `https://cdn.jsdelivr.net/npm/h5wasm@latest/dist/esm/h5wasm.js` — umożliwia odczyt plików HDF5 bezpośrednio w przeglądarce przez `<input type="file">`
- **Leaflet.js** do podkładu mapowego z warstwami (OpenStreetMap)
- **Plotly.js** do wykresów analitycznych (histogramy, time series, scatter)
- **D3.js** do kolorowania i skali barwnej

### Ograniczenie: brak backendu — całość w przeglądarce.

---

## 🖥️ INTERFEJS I FUNKCJE — WYMAGANIA SZCZEGÓŁOWE

### 1. Panel wczytywania plików

- Drag & drop lub `<input type="file" multiple>` — umożliwia wczytanie **wielu plików naraz** (cała sekwencja czasowa)
- Automatyczna detekcja produktu z nazwy pliku (regex na `dBZ`, `V`, `ZDR`, `Height`, `sri`, `dpsri`)
- Lista wczytanych plików z timestampami, typem produktu, statusem odczytu
- Walidacja formatu: sprawdź czy `dataset1/data1/what` zawiera atrybut `quantity` — jeśli nie, pokaż błąd z dokładną ścieżką

### 2. Główna mapa radarowa — Canvas na Leaflet

- Renderuj dane radarowe jako warstwa Canvas na mapie Leaflet
- Projekt geograficzny: dane CAPPI są na siatce kartezjańskiej — użyj atrybutów `LL_lon`, `LL_lat`, `UR_lon`, `UR_lat` z `/where` do georeferencji jako `L.imageOverlay`
- Dla danych PPI (biegunowych) — konwersja do siatki kartezjańskiej przez interpolację promieniową przed nałożeniem na mapę
- Centrum mapy automatycznie na pozycji radaru z `/where` (`lat`, `lon`)

### 3. Warstwy produktów — przełączalne

Każdy produkt renderowany osobno, z możliwością włączenia/wyłączenia i regulacji przezroczystości:

| Produkt | Skala barwna | Zakres |
|---|---|---|
| dBZ (reflektywność) | `NWSReflectivity` — granatowy→zielony→żółty→czerwony→purpurowy | -10 do 70 dBZ |
| V (velocity VRADH) | `RdBu_r` — niebieski=do radaru, czerwony=od radaru | -30 do +30 m/s |
| ZDR | `PiYG` — fioletowy→biały→zielony | -2 do +6 dB |
| Echo Top Height | `plasma` | 0 do 16 km |
| SRI/BR | `YlOrRd` | 0 do 100 mm/h |

### 4. Odczyt wartości pod kursorem

- Hover nad mapą → tooltip z wartościami **wszystkich aktywnych warstw** w tym samym punkcie przestrzennym, zsynchronizowanych do aktualnego timestampu
- Format: `dBZ: 52.5 | V: -18.3 m/s | ZDR: 2.1 dB | ETH: 11.4 km`
- Biały/czarny kontrast zależnie od tła

### 5. Odtwarzacz sekwencji (time loop)

- Jeśli wczytano wiele plików tego samego produktu z różnych timestampów → suwak czasu + przycisk Play/Pause
- Prędkość: 1-15 klatek/sek (suwak)
- Pasek czasu z timestampami plików, aktualny czas podświetlony
- Animacja płynna przez pre-rendering wszystkich klatek do `<canvas offscreen>`

### 6. Panel analityczny — prawý sidebar

Automatyczna analiza dla aktywnej warstwy i aktywnego timestampu:

#### A. Analiza dBZ (reflektywność):
- Histogram rozkładu wartości dBZ
- `Zmax` — maksymalna reflektywność + koordynaty geograficzne
- `ETH_45` — przybliżony zasięg echa ≥45 dBZ (obszar w km²)
- Wykrywanie potencjalnego hook echo: algorytm szukający „zagięcia" wysokiej reflektywności (≥50 dBZ) na podstawie gradientu przestrzennego

#### B. Analiza V (velocity / VRADH):
- Wizualizacja **coupletu** — automatyczne wykrywanie lokalnego maksimum Vrot:
  ```
  Vrot = (|V_inbound_max| + |V_outbound_max|) / 2
  ```
  w oknie przesuwnym 10×10 km. Zaznacz znalezione couplety na mapie kolorem (żółty = Vrot > 15 m/s, czerwony = Vrot > 25 m/s)
- Wykrywanie granicy zero-izodopy (zero-velocity line) — konturowanie izoliny V=0
- Tekst: `Vrot_max = X m/s` z geolokalizacją

#### C. Analiza ZDR:
- ZDR column detection: szukaj obszarów ZDR > 2 dB współlokowanych z dBZ > 40 dBZ — to sygnatura silnego updraftu. Zaznacz na mapie.
- ZDR ≈ 0 + dBZ > 55 dBZ → sygnatura gradu sferycznego → zaznacz obszar jako `HAIL POSSIBLE`

#### D. Echo Top Height:
- Izolinie: 3 km, 6 km, 10 km, 15 km — narysuj na mapie jako kontury
- `ETH_max` z lokalizacją

#### E. Multi-produkt overlay — analiza łączona:
Automatycznie gdy wczytano dBZ + V + ZDR jednocześnie:
- Scoring komórki burzowej (0-100):
  ```
  score = 0
  score += min(Zmax / 70, 1) * 30         ← reflektywność
  score += min(Vrot_max / 30, 1) * 35     ← rotacja
  score += min(ETH_max / 15, 1) * 15      ← wysokość
  score += (ZDR_column_detected) * 20     ← kolumna ZDR
  ```
- Wyświetl score + opis: "Komórka konwekcyjna", "Potencjalna superkomórka", "Superkomórka z mezocyklonem"

### 7. Panel informacyjny — metadane pliku

- Nazwa i ścieżka pliku
- Timestamp skanu (UTC i CEST)
- Pozycja radaru (lat/lon/alt)
- Produkt (`quantity`), gain, offset, zakres [km], rozdzielczość [m]
- Format: ODIM HDF5 v2.x

### 8. Eksport

- Przycisk `Zapisz PNG` → eksportuje widok mapy z warstw Canvas jako obraz PNG
- Przycisk `Raport CSV` → eksportuje tabelę z: timestamp, Zmax, ETH_max, Vrot_max, score, koordynaty do pliku `.csv`

---

## 🎨 DESIGN

- Motyw: **ciemny, meteorologiczny** — czarne/granatowe tło, terminale-style font dla wartości liczbowych
- Akcent: cyjano-turkusowy (`#4f98a3`) dla UI, ciepły żółty dla ostrzeżeń
- Układ: mapa zajmuje 70% szerokości, sidebar prawy 30%
- Responsywność: działa na laptopie 1280px+
- Font: Inter (CDN Google Fonts) dla UI, IBM Plex Mono dla wartości numerycznych
- Bez animacji dekoracyjnych — interfejs jest narzędziem, nie prezentacją

---

## 🔬 LOGIKA ANALITYCZNA — SZCZEGÓŁY IMPLEMENTACJI

### Konwersja PPI → kartezjan:

```javascript
// dla każdego radia (az) i binu (r):
const az_rad = (az_deg - 90) * Math.PI / 180;  // obrót: 0° = Północ
const x = r * Math.cos(az_rad);  // metry na wschód
const y = r * Math.sin(az_rad);  // metry na północ
// konwersja na lat/lon przez proj (Haversine)
```

### Couplet detection (uproszczony algorytm):

```javascript
// sliding window 10x10 km na siatce VRADH CAPPI
// w każdym oknie: V_min (inbound), V_max (outbound)
// Vrot = (|V_min| + |V_max|) / 2
// jeśli Vrot > próg i odległość między min/max < 10 km → couplet
```

### ZDR column:

```javascript
// overlap mask: dBZ > 40 AND ZDR > 2.0
// znajdź spójne regiony (connected components)
// region > 5 km² → wykryto kolumnę ZDR
```

---

## 📋 UWAGI DLA MODELU AI BUDUJĄCEGO APLIKACJĘ

1. **h5wasm** ładuje pliki przez `hdf5.File(arrayBuffer)` — `arrayBuffer` z `FileReader.readAsArrayBuffer(file)`. Użyj paczki z CDN esm: `https://cdn.jsdelivr.net/npm/h5wasm@0.7.3/dist/esm/hdf5_hl.js`

2. Dane radarowe to macierz `int8` lub `uint8` — **nie float**. Zawsze dekoduj: `v = raw * gain + offset`.

3. CAPPI (`V.cappi.h5`, `dBZ.cappi.h5`) ma siatką kartezjańską. PPI (`dBZ.ppi.h5`) ma siatką biegunową. Traktuj je oddzielnie.

4. `nodata` i `undetect` to różne rzeczy: `nodata` = brak sygnału radarowego / poza zasięgiem. `undetect` = poniżej progu minimalnego sygnału. Oba powinny być maskowane jako NaN przy wizualizacji.

5. Skale barwne dla velocity (VRADH): zero velocity (V=0) musi być na białym/szarym — po lewej niebieski (inbound, V ujemne = do radaru), po prawej czerwony (outbound, od radaru). To standardowa konwencja Dopplera.

6. Przy Leaflet jako podkład map: użyj `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')` i nałóż dane jako `L.canvas()` renderer lub `L.imageOverlay` na wyliczone bounds.

7. Wszystko musi działać **offline** po załadowaniu pliku — żadne żądania HTTP po wczytaniu danych.

---

## ✅ DEFINICJA UKOŃCZENIA

Aplikacja jest gotowa gdy:
- [ ] Można wczytać plik `.h5` z dowolnym produktem i zobaczyć dane na mapie
- [ ] Działa overlay wielu produktów jednocześnie
- [ ] Tooltip pokazuje wartości pod kursorem dla każdej aktywnej warstwy
- [ ] Panel analityczny generuje automatyczne wyniki dla dBZ i VRADH
- [ ] Time loop działa przy wczytaniu sekwencji plików
- [ ] Eksport PNG i CSV działa
- [ ] Aplikacja działa w Chrome/Firefox bez żadnego serwera


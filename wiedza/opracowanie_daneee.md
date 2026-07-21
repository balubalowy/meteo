# Opracowanie Materiałów Źródłowych z Katalogu `daneee/`

Syntetyczne omówienie 19 profesjonalnych publikacji, instrukcji i opracowań meteorologicznych zgromadzonych w katalogu `daneee/`.

---

## 1. Oficjalny Standard ESSL IF-Scale v1.0e (2025)
**Plik**: `IF-scale_v1.0e.pdf`  
*Autorzy*: Pieter Groenemeijer, Alois M. Holzer, Tomáš Púčik, Maciej Dutkiewicz (PBś Bydgoszcz) i zespół ESSL.

### Kluczowe ustalenia:
- **Definicja prędkości wiatru**: Chwilowa trójwymiarowa prędkość wiatru w porywie (*instantaneous 3D wind speed*) na wysokości powstałych zniszczeń (w przeciwieństwie do uśredniania 3-sekundowego w skali EF).
- **Sub-kroki połówkowe**: Klasy IF0.5, IF1.5, IF2.5 wprowadzone dla zwiększenia precyzji oceny częstszych, słabszych zdarzeń.
- **Inwentarz 21 wskaźników zniszczeń (Damage Indicators - DI)**:
  1. `BS` (Building Structure) – klasa wytrzymałości ścian A (bardzo słaba) do F (żelbet).
  2. `BR` (Building Roof) – dachy, więźby, szczyty.
  3. `BN` (Building Non-structural) – dachówki, blacha, panele fotowoltaiczne.
  4. `BM` (Building Anchoring) – zsuwanie budynków drewnianych z fundamentu.
  5. `VH` (Road Vehicles) – pojazdy osobowe (IF1.5 przesuwanie, IF2 przewracanie, IF3 unoszenie w powietrze > 10m).
  6. `TR` (Trees) – pojedyncze drzewa z uwzględnieniem gatunku (słabe: świerk, topola, wierzba; silne: dąb bez liści).
  7. `TS` (Tree Stand) – drzewostan i kompleksy leśne (% powalenia).
  8. `WT` (Wind Turbines), `GH` (Greenhouses), `TC` (Train Cars), `MH` (Mobile Homes), `PT` (Poles & Towers), `SP` (Solar Panels), `FC` (Fences), `FW` (Free-standing Walls), `SN` (Billboards), `CS` (Scaffolding), `CP` (Carports), `SS` (Service Station Canopies), `SC` (Shipping Containers), `CR` (Cranes), `OF` (Outdoor Furniture), `WM` (Wind Speed Measurement).

---

## 2. Diagramy Aerologiczne i Wskaźniki Termodynamiczne
**Pliki**: `Podstawowe-wskaźniki-termodynamiczne-Zięba.pdf`, `radiosondaze.pdf`, `taszarek_doc_www.pdf`  
*Autorzy*: dr Marek Zięba (Skywarn Polska), dr hab. Mateusz Taszarek (UAM Poznań).

### Kluczowe ustalenia:
- **Cząstki początkowe**:
  - `SB` (Surface-Based): z poziomu ziemi (SBCAPE, SBCIN).
  - `ML` (Mixed-Layer): uśredniony profil z dolnych 100 hPa (~1 km). Najbardziej reprezentatywny dla konwekcji popołudniowej.
  - `MU` (Most Unstable): cząstka o najwyższej energii w dolnej troposferze (kluczowe dla konwekcji uniesionej w nocy/przy froncie chłodnym).
- **Maksymalna prędkość prądu wstępującego**:
  $$W_{max} = \sqrt{2 \cdot CAPE} \quad [\text{m/s}]$$
  Dla CAPE = 2000 J/kg, teoretyczny prąd wstępujący osiąga $W_{max} = \sqrt{4000} \approx 63{,}2\text{ m/s}$ (ok. 227 km/h!).
- **Poziomy charakterystyczne**:
  - `LCL`: Poziom kondensacji z uniesienia (podstawa chmur).
  - `LFC`: Poziom swobodnej konwekcji (początek dodatniej pływalności).
  - `EL`: Poziom równowagi (wierzchołek chmury / kowadło).
  - `Overshooting Top`: Przebicie poziomu równowagi przez rozpędzony prąd wstępujący.

---

## 3. Helikalność i Hodografy (SRH & Kinematyka)
**Pliki**: `srh_pl.pdf`, `srh_from_scratch.pdf`, `warunki.pdf`  

### Kluczowe ustalenia:
- **SRH (Storm Relative Helicity)**: Mierzy potencjał rotacji prądu wstępującego na podstawie skręcenia wektora wiatru z wysokością względem wektora ruchu burzy $\vec{C}$.
- **Wektor Bunkersa ($C_{RM}$)**: Metoda wyznaczania przemieszczania się prawoskrętnej superkomórki (Right-Mover) poprzez odchylenie o 7.5 m/s na prawo od średniego wiatru z warstwy 0-6 km.
- **Progi SRH 0-1km**:
  - $> 100\text{ m}^2/\text{s}^2$: Możliwość mezocyklonu i słabych tornad.
  - $> 250\text{ m}^2/\text{s}^2$: Wysokie ryzyko silnych tornad (IF2+ / EF2+).

---

## 4. Teledetekcja i Sygnatury Radarowe
**Plik**: `radarowe_pilorz.pdf`  
*Autor*: Wojciech Pilorz (Sieć Obserwatorów Burz).

### Kluczowe sygnatury radarowe:
- **Hook Echo (Haczyk)**: Klasyczny haczyk na odbiciowości w dolnej części superkomórki, wskazujący na rotację i wnoszenie opadu wokół mezocyklonu.
- **BWER (Bounded Weak Echo Region)**: Bezopadowa kaskada prądu wstępującego zamknięta z góry przez silne echo opadowe.
- **Bow Echo & Rear Inflow Jet (RIJ)**: Wygięcie linii burzowej w kształt łuku wywołane wcinaniem się suchego, porywistego wiatru z tyłu układu. Główna sygnatura niszczycielskich wiatrów downburst / derecho.
- **TBSS (Three-Body Scatter Spike)**: "Kolec gradowy" powstały przez wielokrotne odbicie fal radarowych od wielkich kul gradowych.

---

## 5. Klasyfikacja Ostrzeżeń SOB / Skywarn Polska
**Plik**: `skywarnpl-zjawiska-2012.pdf`  

### Kryteria wydawania ostrzeżeń:
- **1 Stopień**: Porywy 70-90 km/h, grad 1.5-3 cm, opad 20-30 mm/h.
- **2 Stopień**: Porywy 90-110 km/h, grad 3-5 cm, opad 30-50 mm/h, ryzyko tornada.
- **3 Stopień**: Porywy > 110 km/h, grad > 5 cm, opad > 50 mm/h, wysokie ryzyko niszczycielskiego tornada lub derecho.

---

## 6. Studium Przypadku: Derecho z 11 sierpnia 2017 roku
**Plik**: `Piasecki_Krzysztof_derecho_2017.08.11.pdf`  

### Podsumowanie zdarzenia:
- Najniszczycielniejszy układ konwekcyjny typu **Bow Echo / Derecho** w historii Polski.
- Ścieżka zniszczeń: ponad 300 km (od Dolnego Śląska przez Wielkopolskę, Kujawy po Pomorze).
- Prędkość wiatru: porywy zmierzone na stacji w Elblągu i Milejewie sięgały 150 km/h (estymacje lokalne IF2/IF2.5 > 180 km/h).
- Zniszczenia: zrównane z ziemią 80 000 ha lasów (Bory Tucholskie), 6 ofiar śmiertelnych, dziesiątki tysięcy uszkodzonych budynków.

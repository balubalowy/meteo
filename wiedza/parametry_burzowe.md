# Wzory i Definicje Parametrów Konwekcyjnych — Baza Wiedzy Meteo

Wzory fizyczne, jednostki i progi interpretacyjne kluczowych parametrów meteorologicznych stosowanych w prognozowaniu burz i mezoanalizie.

---

## 1. Energia Dostępna Konwekcyjnie (CAPE - Convective Available Potential Energy)

### Definicja i wzór fizyczny
CAPE to całkowita ilość energii kinetycznej, jaką cząstka powietrza podnoszona od poziomu swobodnej konwekcji (LFC) do poziomu równowagi (EL) zyska dzięki dodatniej pływalności.

$$CAPE = \int_{z_{LFC}}^{z_{EL}} g \left( \frac{T_{v,\text{cz}}} - T_{v,\text{ot}}}{T_{v,\text{ot}}} \right) dz \quad [\text{J/kg}]$$

gdzie:
- $g$: przyspieszenie ziemskie ($9{,}81\text{ m/s}^2$)
- $T_{v,\text{cz}}$: temperatura wirtualna unoszonej cząstki powietrza $[\text{K}]$
- $T_{v,\text{ot}}$: temperatura wirtualna otoczenia $[\text{K}]$
- $z_{LFC}$: wysokość poziomu swobodnej konwekcji $[\text{m}]$
- $z_{EL}$: wysokość poziomu równowagi $[\text{m}]$

### Progi interpretacyjne (ESTOFEX / NOAA)
- **< 300 J/kg**: Bardzo słaba chwiejność (słabe komórki konwekcyjne).
- **300 – 1000 J/kg**: Umiarkowana chwiejność (możliwość burz z ulewami).
- **1000 – 2500 J/kg**: Duża chwiejność (silne burze, silne prądy zstępujące, duży grad).
- **> 2500 J/kg**: Ekstremalna chwiejność (gwałtowne superkomórki i linie szkwałów).

---

## 2. Zahamowanie Konwekcyjne (CIN - Convective Inhibition)

### Definicja i wzór
CIN to ujemna energia pływalności, którą cząstka musi pokonać z poziomu początkowego (np. przy powierzchni) do poziomu swobodnej konwekcji (LFC).

$$CIN = \int_{z_{\text{pocz}}}^{z_{LFC}} g \left( \frac{T_{v,\text{cz}}} - T_{v,\text{ot}}}{T_{v,\text{ot}}} \right) dz \quad [\text{J/kg}]$$

### Interpretacja
- **0 do -50 J/kg**: Słaba powłoka inwersyjna (łatwa inicjacja konwekcji).
- **-50 do -200 J/kg**: Umiarkowane zahamowanie (wymaga wymuszenia dynamicznego/orograficznego).
- **< -200 J/kg**: Silna inwersja (blokuje rozwój konwekcji).

---

## 3. Pionowe Uskoki Wiatru (Deep Layer Shear - DLS & Low Layer Shear - LLS)

### Wzór fizyczny
Pionowy uskok wiatru to różnica wektorowa wiatru pomiędzy dwoma poziomami wysokościowymi w atmosferze:

$$\Delta \vec{V} = \vec{V}(z_2) - \vec{V}(z_1) \quad [\text{m/s} \text{ lub } \text{węzły}]$$

- **DLS (0–6 km)**: Uskok wiatru w warstwie 0–6 km n.p.g.
  - **< 10 m/s (20 kt)**: Pojedyncze komórki konwekcyjne.
  - **10 – 20 m/s (20 – 40 kt)**: Multikomórki (wielokomórkowe układy konwekcyjne).
  - **> 20 m/s (> 40 kt)**: Wysokie prawdopodobieństwo organizacji w **superkomórki burzowe**.
- **LLS (0–1 km)**: Uskok wiatru w warstwie 0–1 km n.p.g.
  - **> 10 m/s (20 kt)**: Zwiększone ryzyko trąb powietrznych / tornad.

---

## 4. Względna Helikalność Konwekcyjna (SRH - Storm Relative Helicity)

### Wzór
$$SRH = \int_{0}^{z} \left( (\vec{V} - \vec{C}) \times \frac{\partial \vec{V}}{\partial z} \right) \cdot \hat{k} \, dz \quad [\text{m}^2/\text{s}^2]$$

gdzie:
- $\vec{V}$: wektor wiatru otoczenia na danej wysokości
- $\vec{C}$: wektor ruchu burzy (storm motion vector)

### Progi SRH (0–1 km)
- **100 – 250 m²/s²**: Podwyższone ryzyko rotacji w prądzie wstępującym (słabe tornada).
- **> 250 m²/s²**: Duże ryzyko silnych tornad (EF2+ / IF2+).

---

## 5. Poziom Kondensacji z Podnoszenia (LCL - Lifted Condensation Level)

### Przybliżony wzór Espy'ego / Inmana
Wysokość podstawy chmur konwekcyjnych $h_{LCL}$ w metrach nad poziomem terenu można oszacować ze wzoru:

$$h_{LCL} \approx 125 \cdot (T - T_d) \quad [\text{m}]$$

gdzie:
- $T$: temperatura powietrza przy powierzchni [°C]
- $T_d$: temperatura punktu rosy przy powierzchni [°C]

---

## Źródła i Literatura
1. **Doswell, C. A. III** (2001): *Severe Convective Storms*. Meteorological Monographs, AMS.
2. **NOAA National Weather Service**: *Storm Prediction Center (SPC) Mesoscale Analysis Parameter Definitions*.
3. **ESTOFEX (European Storm Forecast Experiment)**: *Forecast Guidance & Parameter Thresholds*.

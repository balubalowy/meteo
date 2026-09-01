# B-Meteo

<p align="left">
  <img src="https://img.shields.io/badge/html5-%23E34F26.svg?style=flat&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/css3-%231572B6.svg?style=flat&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/firebase-%23039BE5.svg?style=flat&logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/github%20actions-%232671E5.svg?style=flat&logo=githubactions&logoColor=white" alt="GitHub Actions">
  <img src="https://img.shields.io/badge/Markdown-%23000000.svg?style=flat&logo=markdown&logoColor=white" alt="Markdown">
</p>

>  **Live App:** [**balubalowy.github.io/meteo**](https://balubalowy.github.io/meteo/)

Tutaj znajduje się centralne repozytorium **Centrum Meteo** – baza wiedzy, kalkulatory, mapy pogodowe oraz statyczne podsumowania analiz konwekcyjnych. Całość jest hostowana za darmo przez architekturę Serverless w postaci GitHub Pages, wspieraną przez Firebase do przechowywania logów oraz akcje automatyczne GitHub Actions, pobierające na bieżąco świeże dane pogodowe z IMGW.

System przeszedł wielką refaktoryzację do najnowszych standardów **Design Systemu B-Core** (Dark Mode, szklane cienie, wysoce użyteczny i nowoczesny interfejs) oraz struktur **Clean Code** w Pythonie.

### Stos technologiczny (jak to jest napisane?)
* **HTML5 / CSS3 (Design B-Core) / JavaScript (Vanilla):** Cały front-end aplikacji bazuje na spójnym systemie wizualnym (czcionka Inter/JetBrains Mono, ikony Lucide). Brak ciężkich frameworków, projekt dba o maksymalną wydajność i szybkość wczytywania – interfejs dzieli się na zakładki i dynamicznie rysuje treść.
* **Firebase (Realtime DB & Auth):** Prosta baza NoSQL, która zbiera zautomatyzowane snapshoty pogodowe ze stacji IMGW oraz zapewnia dostęp autoryzowany (zablokowany dla obcych). Z bazy budowana jest historia ekstremów z ostatnich 24h.
* **GitHub Actions:** Skrypty budzą się automatycznie (np. co 15-30 minut), dociągają dane o pogodzie i "pompują" je autoryzowanym kluczem prosto do chronionego Firebase.
* **Python (SciPy, Matplotlib, Plotly, Pandas):** Lokalny / CI ciężki kaliber. Skrypty `generate_map_data_firebase.py` oraz `generuj_dashboard.py` interpolują pola temperatur, ciśnień i burz, a także tworzą potężne, interaktywne siatki. Moduły `core/` zapewniają czysty kod i odpowiednią segmentację logiki (np. `grid_math.py`).
* **Leaflet & Plotly.js:** Frontendowe silniki do renderowania dynamicznych map pogody i danych meteorologicznych nałożonych na warstwy geograficzne.

## Architektura Systemu

1. **Frontend (GitHub Pages):** Służy jako interaktywny hub ze statycznymi zasobami, skalami, bazą wiedzy i interfejsem dla dynamicznych map.
2. **Baza Danych (Firebase Realtime Database):** Przechowuje JSONy z ostatnimi parametrami IMGW.
3. **Backend / Cron (GitHub Actions):** Odpalane regularnie skrypty Pythona agregujące dane pogodowe.
4. **Dane wsadowe z Excela:** Arkusze kalkulacyjne w locie parsowane przez skrypty do interaktywnych paneli.

### Schemat Przepływu Danych

```mermaid
graph TD
    subgraph "Urządzenia Użytkownika"
        PC["Przeglądarka Desktop/Mobile"]
        PC -->|Odczyt Danych Live Plotly/Leaflet| FB[("Firebase DB")]
    end

    subgraph "Źródła Danych"
        IMGW(("API IMGW"))
        EXCEL(("Dane_Mapy_Polska.xlsx"))
    end

    subgraph "Backend (GitHub Actions & Python)"
        GH_CRON{"CRON (Co 15-30 min)"}
        SCR_IMGW["fetch_imgw_firebase.py"]
        SCR_MAP["generate_map_data_firebase.py / prognoza"]
        
        GH_CRON --> SCR_IMGW
        IMGW --> SCR_IMGW
        SCR_IMGW -->|Zrzut Danych (Sekret)| FB
        
        EXCEL --> SCR_MAP
        SCR_MAP -->|Generowanie JSON| FB
    end
```

---

## Instalacja i Konfiguracja (Self-Hosted)
Repozytorium może działać globalnie jako statyczna baza wiedzy (kalkulatory, poradniki IF Scale, aerologia), ale komponenty Live (takie jak dane IMGW) są spięte z prywatną bazą Firebase chronioną sekretami. Odczyt jest publiczny, ale zapis zablokowany bez `FIREBASE_SECRET` zapisanego w ustawieniach *GitHub Repository Secrets*.

---

##  Struktura Katalogów i Plików

System, po potężnym refaktorze z sierpnia 2026, został całkowicie posprzątany z gigantycznych plików spaghetti i działa w ultraczystej architekturze modułowej. Wszystko zostało podzielone na warstwę jawną (`app/`) i niejawną (`.private/`).

###  /app (Frontend)
Katalog zawierający całą publiczną stronę aplikacji webowej (statyczny SPA - Single Page Application).
* `index.html` - Lekki, odchudzony plik główny, opierający się o dynamiczne pobieranie danych.
* `/css/` - Główne źródło prawdy dla designu. Styl Dark Mode Glassmorphism (B-Core).
* `/js/` - Logika zakładek, podłączanie ikon Lucide, Alpine.js, obsługa kalkulatorów i logowania. Tutaj też jest baza zjawisk `clouds-data.js`.
* `/assets/` - Obrazy statyczne używane w aplikacji i pobrane cache danych z IMGW.
* `/partials/` - Rozbite, modułowe pliki HTML, które ładują się na żądanie w ułamku sekundy, drastycznie zmniejszając wagę pliku `index.html`.

###  /.private (Backend i Archiwum)
Pliki i skrypty niewidoczne dla systemu GitHub Pages (dzięki prefiksowi kropki i plikowi .gitignore).
* `AGENTS.md` - Notatki administracyjne.
* `/archiwum/` - Wszystkie historyczne foldery (`klimatologia`, `mapy`, `radar`, `wiedza`, `stacje`), które służyły jako zaszłe repozytorium wiedzy.
* `*.py` - Skrypty backendowe (np. `fetch_imgw_firebase.py`, `generate_map_data_firebase.py`), odpalane cyklicznie przez serwery Microsoftu.

###  /.github
Katalog skryptów automatyzacji i Github Actions. Odpala skrypty z folderu `.private` i karmi nimi folder `app/`.
* `workflows/fetch-imgw.yml` - zautomatyzowane pobieranie stacji IMGW do bazy chmurowej i aktualizacja linków.
* `workflows/pages.yml` - oficjalny skrypt deploymentu dla GitHub Pages (ustawia folder `app/` jako publiczny korzeń).

---

##  Zabezpieczenia i Prawa Autorskie
Reguły Firebase odrzucają jakikolwiek bezpośredni zapis z zewnątrz, jeżeli żądanie nie jest opatrzone unikalnym i tajnym sekretnym kluczem. Kod automatyzacji ładuje ten klucz bezpiecznie do nagłówków w trakcie uruchamiania skryptów `fetch_imgw_firebase.py` z maszyn Microsoftu/GitHuba. Logowanie kontem Google na froncie pozwala wejść na przyszłe sekcje administracyjne (zaplanowane moduły).

---

##  Roadmap & Historia Projektu

### Faza 0 & 1: Baza Wiedzy (MVP)
* Stworzenie encyklopedii parametrów burzowych.
* Statyczny Excel z bazą nawałnic (Pamiętnik).
* Kalkulatory (CAPE, Wmax, DCP).

### Faza 2: Modernizacja B-Core & Refaktor
* Generalny remont wyglądu do ujednoliconego motywu B-Core.
* Podział na małe moduły w `/scripts/core`.
* Separacja ogromnych ładunków (payloadów) `Plotly.js` z kodu HTML do dedykowanych pików `JSON`.

### Co dalej? (Wielkie Plany)
- [ ] Stabilizacja zautomatyzowanych runów GitHub Actions.
- [ ] Automatyczne powiadomienia e-mail / push w razie wykrycia parametru porywu wiatru > 110 km/h w skrypcie stacji IMGW.
- [ ] Integracja bazy z archiwalnymi zobrazowaniami radarowymi.

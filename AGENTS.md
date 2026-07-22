# AGENTS.md — Centrum Wiedzy Meteo Bartka (v2, uproszczone)

## Cel projektu
To NIE jest system pobierania danych w czasie rzeczywistym. To baza wiedzy +
kalkulatory Excel + generator map statycznych do analizy własnej.

## Twoja rola (agent)
- Budujesz pliki referencyjne (Markdown/CSV) i skrypty Python generujące mapy.
- Nie twórz automatycznego pobierania danych — user wkleja dane ręcznie lub
  z pojedynczych zapytań, gdy potrzebuje.
- Każdy wzór/przelicznik musi mieć podane źródło w komentarzu w kodzie/Excelu.

## Struktura repo
/wiedza/                      – Markdown: definicje, wzory, skale (IF, CAPE, shear)
/kalkulatory_excel/            – pliki .xlsx z formułami i źródłami w komentarzach
/mapy/
  ├── skrypty/                 – Python (matplotlib/geopandas) generujące PNG
  └── wygenerowane/            – gotowe mapy PL i Europa
/notatki_prognostyczne/        – moje własne analizy przypadków

## Zasady
- Wzory fizyczne (CAPE, shear, SRH) — zawsze z jednostkami i źródłem.
- Skale zagrożeń (IF, Meteo) — kopiuj z oryginalnej tabeli, nie parafrazuj liczb.
- Mapy: domyślnie PNG 300dpi, projekcja odpowiednia dla PL (EPSG:2180) i Europy.
- Excel: każda kolumna z przelicznikiem ma komórkę z linkiem/opisem źródła.

## Czego NIE robić
- Nie podłączaj API bez wyraźnej prośby — to nie jest system live.
- Nie zgaduj wartości granicznych skal — jeśli nie masz źródła, zostaw puste.

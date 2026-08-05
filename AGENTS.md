# AGENTS.md — Centrum Wiedzy Meteo Bartka (v2, struktura skonsolidowana)

## Cel projektu
To NIE jest system pobierania danych w czasie rzeczywistym. To baza wiedzy +
kalkulatory Excel + statyczne podsumowania do analizy własnej.
Wyjątkiem od braku automatyzacji są opcjonalne workflow w GitHub Actions,
które pobierają określone darmowe otwarte dane.

## Twoja rola (agent)
- Budujesz pliki referencyjne (Markdown/CSV), szablony HTML (naukowy styl)
  i skrypty Python.
- Nie twórz automatycznego pobierania danych uruchamianego z lokalnego IDE. Użytkownik
  wkleja dane ręcznie lub dane są pobierane w wyizolowanym GitHub Actions.
- Każdy wzór/przelicznik musi mieć podane źródło w komentarzu w kodzie/Excelu.

## Struktura repo
/stacje/            – Dane IMGW i synoptyczne (pobierane m.in. przez CI/GitHub Actions)
/prognoza/          – Numeryczne prognozy, GFS/ICON, kalkulatory .xlsx (skale IF, CAPE)
/radar/             – Zobrazowania radarowe (skrypty i info)
/klimatologia/      – Długoterminowe statystyki, skrypty klimatologiczne
/pamietnik/         – Pamiętnik burz, ręcznie wprowadzane rekordy na podstawie Excela
/wiedza/            – Markdown: definicje, wzory, skale
/mapy/              – Python generujące mapy, np. generuj_mapy.py

## Zasady
- Wzory fizyczne (CAPE, shear, SRH) — zawsze z jednostkami i źródłem.
- Skale zagrożeń (IF, Meteo) — kopiuj z oryginalnej tabeli, nie parafrazuj liczb.
- Mapy: domyślnie PNG 300dpi, projekcja odpowiednia dla PL (EPSG:2180) i Europy.
- Excel: każda kolumna z przelicznikiem ma komórkę z linkiem/opisem źródła.
- Frontend HTML: jasny naukowy motyw, czcionka Inter, nawigacja powrotu.

## Czego NIE robić
- Nie podłączaj lokalnego API bez wyraźnej prośby — to nie jest system live (poza opcjonalnym GitHub Actions na `data` branch).
- Nie zgaduj wartości granicznych skal — jeśli nie masz źródła, zostaw puste.

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pobieraj_W_Tle.py
Skrypt uruchamiający pobieranie danych IMGW w nieskończonej pętli co określony czas.
Po prostu uruchom ten skrypt i zminimalizuj okno, a baza historii będzie rosła.
"""

import time
import os
import sys
from datetime import datetime

# Importujemy funkcję pobierającą z naszego głównego skryptu
try:
    import importlib.util
    spec = importlib.util.spec_from_file_location("Pobierz_IMGW", os.path.join(os.path.dirname(__file__), "3_Pobierz_IMGW.py"))
    pobierz_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pobierz_module)
except Exception as e:
    print(f"Błąd ładowania skryptu 3_Pobierz_IMGW.py: {e}")
    sys.exit(1)

# Ustawienia
INTERWAL_MINUT = 5
INTERWAL_SEKUND = INTERWAL_MINUT * 60

def main():
    print("=" * 65)
    print("POBIERANIE DANYCH IMGW")
    print(f" Częstotliwość odświeżania: co {INTERWAL_MINUT} minut")
    print(" Zostaw to okno otwarte (możesz je zminimalizować),")
    print(" aby budować historię pomiarów w pliku Historia_IMGW.json")
    print(" Naciśnij Ctrl+C, aby zatrzymać.")
    print("=" * 65)
    print()

    try:
        while True:
            teraz = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"\n[{teraz}] Rozpoczynam automatyczne pobieranie...")
            
            # Wywołanie funkcji z głównego skryptu
            try:
                pobierz_module.pobierz_dane()
            except Exception as e:
                print(f"  [BŁĄD] Wystąpił problem podczas pobierania: {e}")
            
            nast_pobranie = datetime.fromtimestamp(time.time() + INTERWAL_SEKUND).strftime("%H:%M:%S")
            print(f"\n[OK] Pomyślnie zapisano do historii. Następne pobieranie o: {nast_pobranie}")
            print(f"Oczekuję {INTERWAL_MINUT} minut...\n")
            
            # Oczekiwanie
            time.sleep(INTERWAL_SEKUND)
            
    except KeyboardInterrupt:
        print("\n\n[ZATRZYMANO] Zatrzymano automatyczne pobieranie przez użytkownika.")

if __name__ == "__main__":
    main()

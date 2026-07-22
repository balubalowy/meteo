#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Skrypt automatycznego generowania map i wysyłania zmian na GitHub Pages.
Użycie:
  python push.py "Opis moich zmian"
  lub po prostu: python push.py
"""

import sys
import subprocess

def run_command(cmd, ignore_error=False):
    print(f"➜ {cmd}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0 and not ignore_error:
        print(f"❌ Błąd podczas wykonywania komendy: {cmd}")
        sys.exit(result.returncode)

def main():
    commit_msg = "Aktualizacja wiedzy i danych meteo"
    if len(sys.argv) > 1:
        commit_msg = " ".join(sys.argv[1:])

    print("====================================================")
    print("🚀 AUTOMATYCZNY PUSH METEO HUB DO GITHUB PAGES")
    print("====================================================")

    # 1. Regenerowanie map
    print("\n[1/3] Generowanie zaktualizowanych map 300 DPI...")
    run_command("python mapy/skrypty/generuj_mapy.py")

    # 2. Stagowanie zmian
    print("\n[2/3] Dodawanie zmodyfikowanych plików...")
    run_command("git add .")

    # 3. Commit i push
    print(f"\n[3/3] Tworzenie commita: '{commit_msg}'...")
    run_command(f'git commit -m "{commit_msg}"', ignore_error=True)
    run_command("git push origin main")

    print("\n====================================================")
    print("✅ Pomyślnie wysłano na GitHub Pages!")
    print("🔗 Strona na żywo: https://balubalowy.github.io/meteo/")
    print("====================================================\n")

if __name__ == "__main__":
    main()

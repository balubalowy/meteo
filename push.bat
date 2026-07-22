@echo off
chcp 65001 > nul
echo ====================================================
echo   AUTOMATYCZNY PUSH DO GITHUB PAGES - METEO HUB
echo ====================================================
echo.

set /p commit_msg="Wpisz opis zmian (lub naciśnij Enter dla domyślnego): "
if "%commit_msg%"=="" set commit_msg=Aktualizacja wiedzy i danych meteo

echo.
echo [1/3] Generowanie zaktualizowanych precyzyjnych map 300 DPI...
python mapy\skrypty\generuj_mapy.py

echo.
echo [2/3] Dodawanie zmodyfikowanych plików do Git...
git add .

echo.
echo [3/3] Tworzenie commita i wysyłanie do GitHub Pages...
git commit -m "%commit_msg%"
git push origin main

echo.
echo ====================================================
echo  ✅ SUKCES! Zmiany zostały wysłane do GitHub Pages.
echo  🔗 https://balubalowy.github.io/meteo/
echo ====================================================
echo.
pause

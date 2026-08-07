@echo off
setlocal
color 0B

echo =======================================
echo    Centrum Meteo: Local Sync to Cloud
echo =======================================
echo 1. Zbieranie statystyk burzowych (Excel)...

python scripts/parse_storm_stats.py
python scripts/fetch_dashboard_links.py

echo.
echo 2. Wypychanie na GitHub...
cd /d "E:\meteo"
git add .
git commit -m "auto: aktualizacja danych i zmian w aplikacji"
git push origin main

echo =======================================
echo    GOTOWE. Zmiany wyslane!
echo =======================================
pause

@echo off
setlocal
color 0B

echo =======================================
echo    Centrum Meteo: Local Sync to Cloud
echo =======================================
echo 1. Zbieranie statystyk burzowych (Excel)...

python .private/parse_storm_stats.py
python .private/fetch_dashboard_links.py
python .private/update_burze.py

echo.
echo 2. Wypychanie na GitHub...
cd /d "E:\meteo"
git add .
git commit -m "auto: aktualizacja danych i zmian w aplikacji"
git pull --rebase origin main
git push origin main

echo =======================================
echo    GOTOWE. Zmiany wyslane!
echo =======================================
pause

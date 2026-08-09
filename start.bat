@echo off
echo Uruchamianie lokalnego serwera dla B-Meteo...
echo To okienko musi zostac otwarte podczas uzywania aplikacji.

cd /d "%~dp0"
start http://localhost:8000/app/
python -m http.server 8000

pause

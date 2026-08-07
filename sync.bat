@echo off
setlocal
color 0B

echo =======================================
echo    Centrum Meteo: Local Sync to Cloud
echo =======================================
echo 1. Zbieranie statystyk repozytorium...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$appDataPath = 'E:\meteo\assets\js\local_stats.js';" ^
  "$basePath = 'E:\meteo';" ^
  "$pyFiles = (Get-ChildItem -LiteralPath $basePath -Recurse -File -Filter '*.py').Count;" ^
  "$htmlFiles = (Get-ChildItem -LiteralPath $basePath -Recurse -File -Filter '*.html').Count;" ^
  "$excelFiles = (Get-ChildItem -LiteralPath $basePath -Recurse -File -Filter '*.xlsx').Count;" ^
  "$jsFiles = (Get-ChildItem -LiteralPath $basePath -Recurse -File -Filter '*.js').Count;" ^
  "$js = 'window.meteoStats = { pythonFiles: ' + $pyFiles + ', htmlFiles: ' + $htmlFiles + ', excelFiles: ' + $excelFiles + ', jsFiles: ' + $jsFiles + ', lastSync: ''' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ''' };';" ^
  "Set-Content -Path $appDataPath -Value $js -Encoding UTF8;" ^
  "Write-Host '   - Statystyki pobrane pomyslnie!' -ForegroundColor Cyan;" ^
  "Write-Host 'Zapisano plik local_stats.js' -ForegroundColor Green"

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

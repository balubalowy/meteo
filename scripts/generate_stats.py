import os
import json
from datetime import datetime

base_dir = r"e:\meteo"

# Count files
python_count = 0
html_count = 0
excel_count = 0

for root, dirs, files in os.walk(base_dir):
    if '.git' in root or '.private' in root or 'venv' in root:
        continue
    for f in files:
        if f.endswith('.py'): python_count += 1
        elif f.endswith('.html'): html_count += 1
        elif f.endswith('.xlsx'): excel_count += 1

# If there is an excel file in pamietnik, we could read it here.
# For now, we just output the stats
out_path = os.path.join(base_dir, "assets", "js", "local_stats.js")

stats = {
    "pythonFiles": python_count,
    "htmlFiles": html_count,
    "excelFiles": excel_count,
    "lastSync": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

with open(out_path, "w", encoding="utf-8") as f:
    f.write(f"window.meteoStats = {json.dumps(stats)};")

print("Zapisano local_stats.js")

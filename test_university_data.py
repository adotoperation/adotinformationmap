import urllib.request
import csv
import io
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=541959206"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, timeout=15)
    content = res.read().decode('utf-8')
    
    reader = csv.DictReader(io.StringIO(content))
    fieldnames = reader.fieldnames
    print(f"CSV Field Names: {fieldnames}")
    
    valid_rows = []
    for r in reader:
        name = r.get('대학명', '').strip()
        addr = r.get('도로명', '').strip()
        lat_str = r.get('위도', '').strip()
        lng_str = r.get('경도', '').strip()
        try:
            lat = float(lat_str)
            lng = float(lng_str)
            if name and lat > 0 and lng > 0:
                valid_rows.append({'name': name, 'address': addr, 'lat': lat, 'lng': lng})
        except ValueError:
            continue
            
    print(f"Successfully loaded {len(valid_rows)} valid university records.")
    print("Sample university records:")
    for row in valid_rows[:5]:
        print(f" - {row['name']} | {row['address']} | ({row['lat']}, {row['lng']})")

except Exception as e:
    print(f"Error testing university data fetch: {e}")
    sys.exit(1)

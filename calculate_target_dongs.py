import urllib.request
import csv
import io
import math
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000 # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# 1. Fetch Existing Branches (GID 211834294)
print("1. Fetching Existing A.dot Branches...")
url_branch = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=211834294"
req = urllib.request.Request(url_branch, headers={'User-Agent': 'Mozilla/5.0'})
content_branch = urllib.request.urlopen(req).read().decode('utf-8')
reader_branch = csv.reader(io.StringIO(content_branch))
rows_branch = list(reader_branch)[1:]

branches = []
for row in rows_branch:
    if not row or len(row) < 3: continue
    name = row[0].strip().replace('"', '')
    try:
        lat = float(row[1].strip().replace('"', ''))
        lng = float(row[2].strip().replace('"', ''))
        if lat > 0 and lng > 0:
            branches.append({'name': name, 'lat': lat, 'lng': lng})
    except:
        continue
print(f"Loaded {len(branches)} existing branches.")

# 2. Fetch Schools (GID 630627369)
url_school = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=630627369"
req = urllib.request.Request(url_school, headers={'User-Agent': 'Mozilla/5.0'})
content_school = urllib.request.urlopen(req).read().decode('utf-8')
reader_school = csv.reader(io.StringIO(content_school))
rows_school = list(reader_school)[1:]

schools = []
for row in rows_school:
    if not row or len(row) < 6: continue
    period = row[0].strip().replace('"', '')
    if not period.startswith('26'): continue
    name = row[2].strip().replace('"', '')
    try:
        lat = float(row[3].strip().replace('"', ''))
        lng = float(row[4].strip().replace('"', ''))
        total = int(row[5].strip().replace('"', ''))
        if lat > 0 and lng > 0:
            schools.append({'name': name, 'lat': lat, 'lng': lng, 'total': total})
    except:
        continue

# 3. Fetch Academies (GID 1376867691)
url_academy = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=1376867691"
req = urllib.request.Request(url_academy, headers={'User-Agent': 'Mozilla/5.0'})
content_academy = urllib.request.urlopen(req).read().decode('utf-8')
reader_academy = csv.reader(io.StringIO(content_academy))
rows_academy = list(reader_academy)[1:]

academies = []
for row in rows_academy:
    if not row or len(row) < 5: continue
    addr = row[1].strip().replace('"', '')
    try:
        lat = float(row[2].strip().replace('"', ''))
        lng = float(row[3].strip().replace('"', ''))
        count = int(row[4].strip().replace('"', ''))
        if lat > 0 and lng > 0:
            academies.append({'address': addr, 'lat': lat, 'lng': lng, 'count': count})
    except:
        continue

# 4. Fetch Apartments (GID 642130592)
url_apt = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=642130592"
req = urllib.request.Request(url_apt, headers={'User-Agent': 'Mozilla/5.0'})
content_apt = urllib.request.urlopen(req).read().decode('utf-8')
reader_apt = csv.reader(io.StringIO(content_apt))
rows_apt = list(reader_apt)[1:]

apartments = []
for row in rows_apt:
    if not row or len(row) < 4: continue
    addr = row[0].strip().replace('"', '').replace('\ufeff', '')
    try:
        count = int(row[1].strip().replace('"', '').replace(',', ''))
        lat = float(row[2].strip().replace('"', ''))
        lng = float(row[3].strip().replace('"', ''))
        if lat > 0 and lng > 0:
            apartments.append({'address': addr, 'lat': lat, 'lng': lng, 'count': count})
    except:
        continue

# 5. Fetch Community Centers / Dongs (GID 600107051)
url_dong = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=600107051"
req = urllib.request.Request(url_dong, headers={'User-Agent': 'Mozilla/5.0'})
content_dong = urllib.request.urlopen(req).read().decode('utf-8')
reader_dong = csv.reader(io.StringIO(content_dong))
rows_dong = list(reader_dong)[1:]

dongs = {}
for row in rows_dong:
    if not row or len(row) < 8: continue
    sido = row[1].strip().replace('"', '')
    sigungu = row[2].strip().replace('"', '')
    dong_name = row[3].strip().replace('"', '')
    addr = row[5].strip().replace('"', '')
    
    if sido.startswith('서울') or '서울특별시' in addr or '서울 ' in addr:
        continue

    try:
        lat = float(row[6].strip().replace('"', ''))
        lng = float(row[7].strip().replace('"', ''))
        if lat > 0 and lng > 0:
            full_name = f"{sido} {sigungu} {dong_name}".strip()
            if full_name not in dongs:
                dongs[full_name] = {'name': full_name, 'addr': addr, 'lat': lat, 'lng': lng}
    except:
        continue

# NEW CRITERIA:
# 1) Exclude Seoul
# 2) Exclude Existing Branch in 3km
# 3) Academies <= 50
# 4) Apt Families >= 20,000
# 5) Potential Customers (5% of 3km Students) >= 300  (=> Students >= 6,000)

matched_results = []
LAT_DEG = 0.03   # ~3.3km
LNG_DEG = 0.04   # ~3.5km

for key, d in dongs.items():
    d_lat = d['lat']
    d_lng = d['lng']

    # 0. EXCLUDE IF ANY EXISTING BRANCH IS WITHIN 3KM
    has_branch = False
    for b in branches:
        if abs(b['lat'] - d_lat) <= LAT_DEG and abs(b['lng'] - d_lng) <= LNG_DEG:
            if haversine(d_lat, d_lng, b['lat'], b['lng']) <= 3000:
                has_branch = True
                break
    if has_branch:
        continue

    # 1. Filter Academies (Must be <= 50)
    academies_3km = 0
    for a in academies:
        if abs(a['lat'] - d_lat) <= LAT_DEG and abs(a['lng'] - d_lng) <= LNG_DEG:
            if haversine(d_lat, d_lng, a['lat'], a['lng']) <= 3000:
                academies_3km += a['count']
                if academies_3km > 50: # Early exit if > 50
                    break
    if academies_3km > 50:
        continue

    # 2. Filter Apartments (Must be >= 20,000)
    apt_families_3km = 0
    for ap in apartments:
        if abs(ap['lat'] - d_lat) <= LAT_DEG and abs(ap['lng'] - d_lng) <= LNG_DEG:
            if haversine(d_lat, d_lng, ap['lat'], ap['lng']) <= 3000:
                apt_families_3km += ap['count']
    if apt_families_3km < 20000:
        continue

    # 3. Filter School Students (Potential Customers >= 300 => Students >= 6000)
    students_3km = 0
    for s in schools:
        if abs(s['lat'] - d_lat) <= LAT_DEG and abs(s['lng'] - d_lng) <= LNG_DEG:
            if haversine(d_lat, d_lng, s['lat'], s['lng']) <= 3000:
                students_3km += s['total']
    
    potential_cust = round(students_3km * 0.05)
    if potential_cust < 300:
        continue

    matched_results.append({
        'name': d['name'],
        'addr': d['addr'],
        'lat': d_lat,
        'lng': d_lng,
        'students_3km': students_3km,
        'academies_3km': academies_3km,
        'apt_families_3km': apt_families_3km,
        'potential_customers': potential_cust
    })

matched_results.sort(key=lambda x: x['potential_customers'], reverse=True)

print(f"\n=======================================================")
print(f"🎯 NEW FILTER CRITERIA MATCHED DONGS ({len(matched_results)} locations)")
print(f"Conditions: Exclude Seoul, Exclude Branch in 3km, Academies <= 50, Apt >= 20k, Potential Cust >= 300 (Students >= 6k)")
print(f"=======================================================")
for idx, r in enumerate(matched_results, 1):
    print(f"{idx}. {r['name']} ({r['addr']})")
    print(f"   - 반경 3km 학원수: {r['academies_3km']}개 (<= 50개 충족)")
    print(f"   - 반경 3km 아파트 세대수: {r['apt_families_3km']:,}세대 (>= 20,000세대 충족)")
    print(f"   - 반경 3km 총 학생수: {r['students_3km']:,}명")
    print(f"   - 반경 3km 잠정 고객수 (5%): {r['potential_customers']:,}명 (>= 300명 충족)")
    print("-------------------------------------------------------")

with open('target_dongs.json', 'w', encoding='utf-8') as f:
    json.dump(matched_results, f, ensure_ascii=False, indent=2)
print("Saved newly filtered results to target_dongs.json")

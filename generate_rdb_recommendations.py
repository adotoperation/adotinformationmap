import urllib.request
import csv
import io
import math
import sys

sys.stdout.reconfigure(encoding='utf-8')

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# 1. Fetch Existing Branches
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

# 2. Fetch Schools
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
    school_type = row[1].strip().replace('"', '')
    name = row[2].strip().replace('"', '')
    try:
        lat = float(row[3].strip().replace('"', ''))
        lng = float(row[4].strip().replace('"', ''))
        total = int(row[5].strip().replace('"', ''))
        if lat > 0 and lng > 0:
            schools.append({
                'type': school_type,
                'name': name,
                'lat': lat,
                'lng': lng,
                'total': total,
                'is_high': ('고등학교' in school_type or '고등학교' in name or '고교' in name),
                'is_middle': ('중학교' in school_type or '중학교' in name)
            })
    except:
        continue

# 3. Fetch Academies
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

# 4. Fetch Apartments
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

# 5. Fetch Dong Centers
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
    
    if sido.startswith('서울') or '서울특별시' in addr:
        continue

    try:
        lat = float(row[6].strip().replace('"', ''))
        lng = float(row[7].strip().replace('"', ''))
        if lat > 0 and lng > 0:
            full_name = f"{sido} {sigungu} {dong_name}".strip()
            if full_name not in dongs:
                dongs[full_name] = {'name': full_name, 'addr': addr, 'sido': sido, 'lat': lat, 'lng': lng}
    except:
        continue

LAT_DEG = 0.03
LNG_DEG = 0.04

recommendations = []

for key, d in dongs.items():
    if '파주' in d['name'] or '운정' in d['name']:
        continue
    d_lat = d['lat']
    d_lng = d['lng']

    has_branch = False
    for b in branches:
        if abs(b['lat'] - d_lat) <= LAT_DEG and abs(b['lng'] - d_lng) <= LNG_DEG:
            if haversine(d_lat, d_lng, b['lat'], b['lng']) <= 3000:
                has_branch = True
                break
    if has_branch:
        continue

    academies_3km = 0
    for a in academies:
        if abs(a['lat'] - d_lat) <= LAT_DEG and abs(a['lng'] - d_lng) <= LNG_DEG:
            if haversine(d_lat, d_lng, a['lat'], a['lng']) <= 3000:
                academies_3km += a['count']

    apt_families_3km = 0
    for ap in apartments:
        if abs(ap['lat'] - d_lat) <= LAT_DEG and abs(ap['lng'] - d_lng) <= LNG_DEG:
            if haversine(d_lat, d_lng, ap['lat'], ap['lng']) <= 3000:
                apt_families_3km += ap['count']

    middle_students_3km = 0
    high_students_3km = 0
    for s in schools:
        if abs(s['lat'] - d_lat) <= LAT_DEG and abs(s['lng'] - d_lng) <= LNG_DEG:
            if haversine(d_lat, d_lng, s['lat'], s['lng']) <= 3000:
                if s['is_high']:
                    high_students_3km += s['total']
                elif s['is_middle']:
                    middle_students_3km += s['total']

    total_students_3km = middle_students_3km + high_students_3km
    potential_cust = round(total_students_3km * 0.05)

    # 1. 초희소형: 학원수 < 50, 잠정고객수 > 300, 아파트 세대수 >= 15,000
    is_type1 = (academies_3km < 50 and potential_cust > 300 and apt_families_3km >= 15000)

    # 2. 세대밀집: 아파트 세대수 >= 50,000, 잠정고객수 >= 400, 학원수 < 100
    is_type2 = (apt_families_3km >= 50000 and potential_cust >= 400 and academies_3km < 100)

    # 3. 메가타겟: 잠정고객수 >= 700
    is_type3 = (potential_cust >= 700)

    types = []
    if is_type1: types.append("초희소형")
    if is_type2: types.append("세대밀집")
    if is_type3: types.append("메가타겟")

    if types:
        for t in types:
            recommendations.append({
                'type': t,
                'dong': d['name'],
                'middle_students': middle_students_3km,
                'high_students': high_students_3km,
                'total_students': total_students_3km,
                'potential_customers': potential_cust,
                'academies': academies_3km,
                'apartments': apt_families_3km
            })

recommendations.sort(key=lambda x: (x['type'], -x['potential_customers']))

print(f"Total RDB_추천입지 rows generated: {len(recommendations)}")

with open('RDB_추천입지.csv', 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['유형', '법정동', '중학생', '고등학생', '잠정고객수', '학원수', '아파트세대수'])
    for r in recommendations:
        writer.writerow([
            r['type'],
            r['dong'],
            r['middle_students'],
            r['high_students'],
            r['potential_customers'],
            r['academies'],
            r['apartments']
        ])

print("Saved RDB_추천입지.csv successfully.")

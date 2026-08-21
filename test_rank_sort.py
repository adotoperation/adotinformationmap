import urllib.request
import csv
import io

yoy_raw = urllib.request.urlopen("https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=452840178").read().decode('utf-8')
yoy_rows = list(csv.reader(io.StringIO(yoy_raw)))[1:]

branches = []
for r in yoy_rows:
    if r and len(r) >= 5:
        name = r[0].replace('\ufeff','').replace('"','').strip()
        yoy = int(r[1].strip() or '0')
        count = int(r[2].strip() or '0')
        inc = int(r[3].strip() or '0')
        rate = int(r[4].strip() or '0')
        branches.append({
            'name': name,
            'yoy': yoy,
            'count': count,
            'inc': inc,
            'rate': rate
        })

# Sort by inc descending, then rate descending
branches.sort(key=lambda x: (x['inc'], x['rate']), reverse=True)

print("=== TOP 15 GROWTH BRANCHES (Sorted by inc DESC) ===")
for i, b in enumerate(branches[:15], 1):
    print(f"Rank #{i:2d}: {b['name']:12s} | 작년: {b['yoy']:4d}명 | 금일: {b['count']:4d}명 | 증감: +{b['inc']:3d}명 | 증감율: +{b['rate']:3d}%")

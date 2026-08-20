import urllib.request
import csv
import io

yoy_raw = urllib.request.urlopen("https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=452840178").read().decode('utf-8')
branch_raw = urllib.request.urlopen("https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=211834294").read().decode('utf-8')

yoy_rows = list(csv.reader(io.StringIO(yoy_raw)))[1:]
branch_rows = list(csv.reader(io.StringIO(branch_raw)))[1:]

rdbYoyMap = {}
for r in yoy_rows:
    if r and len(r) >= 3:
        name = r[0].replace('\ufeff','').replace('"','').strip()
        rdbYoyMap[name] = r

def getYoYInfo(branchName):
    if not branchName: return None
    clean = branchName.replace('지점', '').replace('\ufeff','').replace('"','').strip()
    if clean in rdbYoyMap: return rdbYoyMap[clean]
    if (clean + '지점') in rdbYoyMap: return rdbYoyMap[clean + '지점']
    
    keys = list(rdbYoyMap.keys())
    exactKey = next((k for k in keys if k.replace('지점','').replace('\ufeff','').replace('"','').strip() == clean), None)
    if exactKey: return rdbYoyMap[exactKey]
    
    prefixKey = next((k for k in keys if clean.startswith(k.replace('지점','').strip()) or k.replace('지점','').strip().startswith(clean)), None)
    if prefixKey: return rdbYoyMap[prefixKey]
    return None

print("=== Checking all branches ===")
mismatches = 0
for b in branch_rows:
    if not b or not b[0].strip(): continue
    b_name = b[0].strip()
    res = getYoYInfo(b_name)
    if not res:
        print(f"FAILED TO MATCH: '{b_name}'")
        mismatches += 1
    else:
        print(f"Branch: {b_name:12s} -> Matched: {res[0]:12s} (YoY: {res[1]}, 금일: {res[2]}, 증감: {res[3]}, 증감율: {res[4]}%)")

print(f"\nTotal mismatches: {mismatches}")

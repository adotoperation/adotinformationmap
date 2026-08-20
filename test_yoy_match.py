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
        name = r[0].strip()
        rdbYoyMap[name] = r

print("=== YoY map keys containing 안산 ===")
for k, v in rdbYoyMap.items():
    if '안산' in k:
        print(f"YoY Key: '{k}' -> Data: {v}")

print("\n=== Branch CSV rows containing 안산 ===")
for b in branch_rows:
    if b and '안산' in b[0]:
        print(f"Branch CSV Name: '{b[0]}'")

def getYoYInfo_old(branchName):
    if not branchName: return None
    clean = branchName.replace('지점', '').strip()
    for k in rdbYoyMap.keys():
        kClean = k.replace('지점', '').strip()
        if kClean == clean or clean in kClean or kClean in clean:
            return k, rdbYoyMap[k]
    return None, None

print("\n=== OLD getYoYInfo results for Ansan branches ===")
for b in branch_rows:
    if b and '안산' in b[0]:
        matched_k, data = getYoYInfo_old(b[0])
        print(f"Branch: '{b[0]}' matched YoY Key: '{matched_k}' -> Data: {data}")

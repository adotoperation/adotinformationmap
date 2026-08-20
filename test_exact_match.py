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
        name = r[0].replace('지점', '').strip()
        rdbYoyMap[name] = r

def getYoYInfo_exact(branchName):
    if not branchName: return None
    clean = branchName.replace('지점', '').strip()
    # 1. Exact match
    if clean in rdbYoyMap:
        return clean, rdbYoyMap[clean]
    # 2. Prefix / Suffix match only if exact match fails
    for k in rdbYoyMap.keys():
        if k == clean:
            return k, rdbYoyMap[k]
    return None, None

mismatches = []
for b in branch_rows:
    if not b: continue
    b_name = b[0].strip()
    clean = b_name.replace('지점', '').strip()
    matched_k, data = getYoYInfo_exact(b_name)
    print(f"Branch: {b_name:15s} -> Matched: {str(matched_k):15s} -> YoY Data: {data}")
    if not matched_k:
        mismatches.append(b_name)

print("\n=== Unmatched branches ===")
print(mismatches)

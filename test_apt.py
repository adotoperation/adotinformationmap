import urllib.request
import csv
import io

url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=642130592"
raw = urllib.request.urlopen(url).read().decode('utf-8')

lines = raw.split('\n')
print(f"Total lines: {len(lines)}")
for i, line in enumerate(lines[:10]):
    cols = line.strip().split(',')
    print(f"Line {i} ({len(cols)} cols): {cols}")

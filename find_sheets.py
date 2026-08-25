import urllib.request
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pubhtml"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

matches = re.findall(r'name:\s*"([^"]+)"[^\}]*gid:\s*"([^"]+)"', html)

print("Found published sheets:")
for name, gid in matches:
    print(f"Sheet Name: '{name}' -> GID: '{gid}'")


#!/usr/bin/env python3
"""查找 OSM 上我们遗漏的深圳山峰"""
import json, subprocess

# 从 Overpass API 获取深圳所有山峰
result = subprocess.run(
    ['curl', '-s', 'https://overpass-api.de/api/interpreter',
     '--data-urlencode', 'data=[out:json];node["natural"="peak"](22.43,113.75,22.87,114.65);out body;'],
    capture_output=True, text=True
)
osm_data = json.loads(result.stdout)

# 读取现有山峰
with open('client/public/shenzhen-peaks.geojson') as f:
    existing_data = json.load(f)

existing_names = set()
for feat in existing_data['features']:
    existing_names.add(feat['properties']['name'])

elems = osm_data.get('elements', [])
print(f'OSM 共有 {len(elems)} 个 peak')
print()

missing = []
for e in elems:
    name = e.get('tags', {}).get('name', '')
    name_zh = e.get('tags', {}).get('name:zh', '')
    ele = e.get('tags', {}).get('ele', '?')
    lat = e.get('lat', 0)
    lon = e.get('lon', 0)
    display = name or name_zh
    if not display:
        continue
    if display in existing_names or name_zh in existing_names:
        continue
    # 部分匹配
    found = False
    for ex in existing_names:
        if ex in display or display in ex:
            found = True
            break
    if not found:
        missing.append((display, ele, lat, lon, e.get('id')))

print(f'我们没有的山峰 ({len(missing)}):')
def parse_ele(s):
    try:
        return float(s.split(';')[0])
    except:
        return 0

for m in sorted(missing, key=lambda x: -parse_ele(x[1])):
    print(f'  {m[0]}: {m[1]}m [{m[3]:.6f}, {m[2]:.6f}] (osm_id={m[4]})')

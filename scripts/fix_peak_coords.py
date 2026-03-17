#!/usr/bin/env python3
"""修正精度不够的山峰坐标（使用腾讯地图 GCJ02 坐标）"""
import json

# 腾讯地图地理编码返回的 GCJ02 精确坐标
corrections = {
    '平峦山':  [113.876693, 22.608041],
    '笔架山':  [114.077103, 22.556200],
    '淘金山':  [114.131660, 22.548357],
    '尖岗山':  [113.916628, 22.594632],
    '赤湾山':  [113.891236, 22.467371],
    '深云谷':  [113.993528, 22.568763],
    '燕晗山':  [113.986689, 22.540876],
    '石鼓山':  [113.950546, 22.578384],
    '亚婆髻':  [113.880739, 22.686274],
}

geojson_path = 'client/public/shenzhen-peaks.geojson'

with open(geojson_path) as f:
    data = json.load(f)

changed = []
for feat in data['features']:
    name = feat['properties']['name']
    if name in corrections:
        old = feat['geometry']['coordinates']
        new = corrections[name]
        feat['geometry']['coordinates'] = new
        changed.append(f'{name}: {old} -> {new}')

with open(geojson_path, 'w') as f:
    json.dump(data, f, ensure_ascii=False)

print(f'修正了 {len(changed)} 座山峰坐标:')
for c in changed:
    print(f'  {c}')

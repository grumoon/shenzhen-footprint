#!/usr/bin/env python3
"""添加遗漏的深圳山峰到 peaks.geojson"""
import json

# 需要新增的山峰列表
# 坐标说明：
# - 有 OSM 数据的使用 WGS84 坐标（和现有数据一致）
# - 无 OSM 的使用腾讯地图/Wikiloc 等来源的 GCJ02 坐标
new_peaks = [
    {
        "name": "吊神山",
        "elevation": 238,
        "district": "光明区",
        "difficulty": 2,
        "popularity": 3,
        "duration": "2-3h",
        "description": "光明森林公园内，郊野径可达，山顶可观光明湖景",
        "has_park": True,
        "transport": "地铁6号线凤凰城站B口",
        "famous": False,
        # Wikiloc 轨迹中心坐标 113.979695, 22.743837
        "coordinates": [113.979695, 22.743837]
    },
    {
        "name": "钓神山",
        "elevation": 478,
        "district": "大鹏新区",
        "difficulty": 4,
        "popularity": 2,
        "duration": "5-6h",
        "description": "排牙山附属峰，大鹏径西径东端，与排牙山、求水岭遥遥相对",
        "has_park": False,
        "transport": "公交至大鹏中心站转M471",
        "famous": False,
        # 钓神山在排牙山(114.543, 22.624)和求水岭(114.486, 22.603)之间
        # 根据大鹏径西径东端位置估算
        "coordinates": [114.513, 22.613]
    },
    {
        "name": "头崖顶",
        "elevation": 380,
        "district": "大鹏新区",
        "difficulty": 3,
        "popularity": 2,
        "duration": "3-4h",
        "description": "大鹏新区山峰，山势险峻",
        "has_park": False,
        "transport": "公交至大鹏站",
        "famous": False,
        # OSM 数据 osm_id=11218482697
        "coordinates": [114.507274, 22.466258],
        "osm_id": 11218482697
    },
    {
        "name": "大雁山",
        "elevation": 310,
        "district": "光明区",
        "difficulty": 2,
        "popularity": 2,
        "duration": "2-3h",
        "description": "大雁山森林公园，光明区休闲徒步好去处",
        "has_park": True,
        "transport": "地铁6号线光明大街站",
        "famous": False,
        # 腾讯地图 GCJ02 坐标
        "coordinates": [113.928435, 22.706867]
    },
    {
        "name": "亚寄山",
        "elevation": 286.5,
        "district": "龙华区",
        "difficulty": 2,
        "popularity": 2,
        "duration": "1.5-2h",
        "description": "南山区与龙华区界山，又称旭日顶，深圳北站后山",
        "has_park": False,
        "transport": "地铁4号线深圳北站",
        "famous": False,
        # OSM 数据 osm_id=11211796951
        "coordinates": [114.018306, 22.598104],
        "osm_id": 11211796951
    },
    {
        "name": "小笔架山",
        "elevation": 178,
        "district": "福田区",
        "difficulty": 1,
        "popularity": 3,
        "duration": "1-1.5h",
        "description": "笔架山公园内的小峰，适合休闲散步",
        "has_park": True,
        "transport": "地铁7号线黄木岗站",
        "famous": False,
        # 笔架山公园附近，在大笔架山(114.077, 22.556)南偏西
        "coordinates": [114.074, 22.553]
    },
    {
        "name": "马鞍岭",
        "elevation": 179,
        "district": "龙岗区",
        "difficulty": 1,
        "popularity": 1,
        "duration": "1-1.5h",
        "description": "龙岗区小山峰",
        "has_park": False,
        "transport": "地铁3号线龙城广场站",
        "famous": False,
        # OSM 数据 osm_id=11219359210
        "coordinates": [114.260598, 22.681043],
        "osm_id": 11219359210
    },
]

# 读取现有数据
with open('client/public/shenzhen-peaks.geojson') as f:
    data = json.load(f)

existing_names = {f['properties']['name'] for f in data['features']}
added = []

for peak in new_peaks:
    if peak['name'] in existing_names:
        print(f"跳过 {peak['name']}（已存在）")
        continue
    
    coords = peak.pop('coordinates')
    osm_id = peak.pop('osm_id', None)
    
    properties = {
        "name": peak['name'],
        "elevation": peak['elevation'],
        "famous": peak['famous'],
        "district": peak['district'],
        "difficulty": peak['difficulty'],
        "popularity": peak['popularity'],
        "duration": peak['duration'],
        "description": peak['description'],
        "has_park": peak['has_park'],
        "transport": peak['transport'],
    }
    if osm_id:
        properties['osm_id'] = osm_id
    
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": coords
        },
        "properties": properties
    }
    
    data['features'].append(feature)
    added.append(f"{peak['name']} ({peak['elevation']}m) [{coords[0]}, {coords[1]}]")

# 保存
with open('client/public/shenzhen-peaks.geojson', 'w') as f:
    json.dump(data, f, ensure_ascii=False)

print(f"\n新增了 {len(added)} 座山峰（总计 {len(data['features'])} 座）：")
for a in added:
    print(f"  + {a}")

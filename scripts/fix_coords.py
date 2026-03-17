#!/usr/bin/env python3
"""
用高德地图 POI 搜索精确验证有疑问的山峰坐标
高德返回的是 GCJ02 坐标，直接可用
"""
import json
import urllib.request
import urllib.parse
import time
import math
import os

GEOJSON_PATH = '/Users/grumoon/project/shenzhen-footprint/client/public/shenzhen-peaks.geojson'
# 高德 Web API Key（从 client/.env 中读取）
AMAP_KEY = 'e565943cb0fc8136a0971093ef819748'

def haversine(lon1, lat1, lon2, lat2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

def fetch_json(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  [ERR] {e}")
        return None

def amap_poi_search(keyword, city='深圳'):
    """高德地图 POI 搜索"""
    params = urllib.parse.urlencode({
        'key': AMAP_KEY,
        'keywords': keyword,
        'city': city,
        'citylimit': 'true',
        'types': '190300|190301|190302',  # 山峰相关类型
        'offset': 5,
        'output': 'json',
    })
    url = f'https://restapi.amap.com/v3/place/text?{params}'
    return fetch_json(url)

def amap_geocode(address):
    """高德地图地理编码"""
    params = urllib.parse.urlencode({
        'key': AMAP_KEY,
        'address': address,
        'city': '深圳',
    })
    url = f'https://restapi.amap.com/v3/geocode/geo?{params}'
    return fetch_json(url)

# 需要核实的山峰列表
PEAKS_TO_CHECK = [
    # (名称, 备注/搜索关键词)
    ('淘金山', '淘金山 深圳 罗湖'),
    ('铁仔山', '铁仔山 深圳 宝安'),
    ('赤湾山', '赤湾山 深圳 南山'),
    ('钓神山', '钓神山 深圳 大鹏'),
    ('求雨坛', '求雨坛 深圳 龙岗'),
    ('园山', '园山 深圳 龙岗'),
    ('聚龙山', '聚龙山 深圳 坪山'),
    ('吊神山', '吊神山 深圳 光明'),
    ('银湖山', '银湖山 深圳 罗湖'),
    ('梅林山', '梅林山 深圳 福田'),
    ('尖岗山', '尖岗山 深圳 宝安'),
    ('马峦山', '马峦山 深圳 坪山'),
    ('小笔架山', '小笔架山 深圳 福田'),
]

def main():
    with open(GEOJSON_PATH) as f:
        data = json.load(f)
    
    # 建立名称→feature 的索引
    feat_by_name = {}
    for feat in data['features']:
        feat_by_name[feat['properties']['name']] = feat
    
    fixes = []
    
    print("🔍 用高德地图 POI 搜索验证山峰坐标\n")
    
    for name, search_kw in PEAKS_TO_CHECK:
        feat = feat_by_name.get(name)
        if not feat:
            print(f"  ❌ 未找到 {name}")
            continue
        
        cur_coords = feat['geometry']['coordinates']
        cur_lon, cur_lat = cur_coords[0], cur_coords[1]
        
        # 搜索
        time.sleep(0.3)
        result = amap_poi_search(name)
        
        if not result or result.get('status') != '1':
            print(f"  ⚠️  {name}: 高德 POI 搜索失败")
            # 尝试 geocoding
            time.sleep(0.3)
            geo_result = amap_geocode(f"深圳{name}")
            if geo_result and geo_result.get('status') == '1' and geo_result.get('geocodes'):
                loc = geo_result['geocodes'][0]['location'].split(',')
                amap_lon, amap_lat = float(loc[0]), float(loc[1])
                dist = haversine(cur_lon, cur_lat, amap_lon, amap_lat)
                print(f"  📍 {name}: 高德geocode [{amap_lon:.6f}, {amap_lat:.6f}] 偏差 {dist:.0f}m")
            continue
        
        pois = result.get('pois', [])
        if not pois:
            print(f"  ⚠️  {name}: 未找到 POI")
            # 尝试用公园名搜索
            time.sleep(0.3)
            park_names = [f"{name}公园", f"{name}森林公园", f"{name}郊野公园"]
            for pn in park_names:
                result2 = amap_poi_search(pn)
                if result2 and result2.get('status') == '1' and result2.get('pois'):
                    pois = result2['pois']
                    print(f"    (用 '{pn}' 找到)")
                    break
                time.sleep(0.2)
            
            if not pois:
                print(f"  ⚠️  {name}: 所有搜索均未找到")
                continue
        
        # 取第一个结果
        poi = pois[0]
        loc = poi['location'].split(',')
        amap_lon, amap_lat = float(loc[0]), float(loc[1])
        poi_name = poi.get('name', '')
        poi_type = poi.get('type', '')
        
        dist = haversine(cur_lon, cur_lat, amap_lon, amap_lat)
        
        status = '✅' if dist < 500 else '🔶' if dist < 2000 else '⚠️'
        print(f"  {status} {name}: 高德POI='{poi_name}' [{amap_lon:.6f}, {amap_lat:.6f}] 偏差 {dist:.0f}m")
        
        if len(pois) > 1:
            for i, p in enumerate(pois[1:3], 2):
                ploc = p['location'].split(',')
                plon, plat = float(ploc[0]), float(ploc[1])
                pdist = haversine(cur_lon, cur_lat, plon, plat)
                print(f"       备选{i}: '{p.get('name','')}' [{plon:.6f}, {plat:.6f}] 偏差 {pdist:.0f}m")
        
        # 记录需要修正的
        if dist > 800:
            fixes.append({
                'name': name,
                'old': [cur_lon, cur_lat],
                'new': [amap_lon, amap_lat],
                'distance': dist,
                'poi_name': poi_name,
                'poi_type': poi_type,
            })
    
    # 输出修正建议
    if fixes:
        print(f"\n{'='*60}")
        print(f"📝 建议修正 {len(fixes)} 座山峰的坐标:")
        print(f"{'='*60}")
        for fix in fixes:
            print(f"  {fix['name']}: [{fix['old'][0]:.6f},{fix['old'][1]:.6f}] → [{fix['new'][0]:.6f},{fix['new'][1]:.6f}] (偏差{fix['distance']:.0f}m, POI='{fix['poi_name']}')")
        
        # 保存修正建议
        with open('/Users/grumoon/project/shenzhen-footprint/scripts/coord_fixes.json', 'w') as f:
            json.dump(fixes, f, ensure_ascii=False, indent=2)
        print(f"\n修正建议已保存到 scripts/coord_fixes.json")

if __name__ == '__main__':
    main()

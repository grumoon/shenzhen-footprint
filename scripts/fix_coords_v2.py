#!/usr/bin/env python3
"""
用腾讯地图 POI 搜索 + Nominatim 精确验证有疑问的山峰坐标
"""
import json
import urllib.request
import urllib.parse
import time
import math

GEOJSON_PATH = '/Users/grumoon/project/shenzhen-footprint/client/public/shenzhen-peaks.geojson'
TENCENT_KEY = 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77'

def haversine(lon1, lat1, lon2, lat2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

def fetch_json(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 ShenzhenPeaks/1.0'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return None

def tencent_search(keyword, region='深圳'):
    """腾讯地图 POI 搜索"""
    params = urllib.parse.urlencode({
        'keyword': keyword,
        'boundary': f'region({region},0)',
        'page_size': 5,
        'key': TENCENT_KEY,
    })
    url = f'https://apis.map.qq.com/ws/place/v1/search?{params}'
    return fetch_json(url)

def nominatim_search(name, city='深圳'):
    """Nominatim 搜索"""
    params = urllib.parse.urlencode({
        'q': f'{name} {city}',
        'format': 'json',
        'limit': 3,
    })
    url = f'https://nominatim.openstreetmap.org/search?{params}'
    return fetch_json(url)

# 需要核实的山峰及其搜索策略
PEAKS_TO_CHECK = [
    ('淘金山', ['淘金山绿道', '淘金山']),
    ('铁仔山', ['铁仔山公园', '铁仔山']),
    ('赤湾山', ['赤湾左炮台', '赤湾山']),
    ('钓神山', ['钓神山']),
    ('求雨坛', ['求雨坛']),
    ('园山', ['园山风景区', '园山公园']),
    ('聚龙山', ['聚龙山公园', '聚龙山生态公园']),
    ('吊神山', ['光明森林公园吊神山', '吊神山']),
    ('银湖山', ['银湖山郊野公园', '银湖山']),
    ('梅林山', ['梅林山公园', '梅林山']),
    ('尖岗山', ['尖岗山公园', '尖岗山']),
    ('马峦山', ['马峦山郊野公园', '马峦山']),
    ('小笔架山', ['笔架山公园', '小笔架山']),
]

def main():
    with open(GEOJSON_PATH) as f:
        data = json.load(f)
    
    feat_by_name = {}
    for feat in data['features']:
        feat_by_name[feat['properties']['name']] = feat
    
    print("🔍 用腾讯地图 + Nominatim 验证山峰坐标\n")
    
    results = {}
    
    for name, keywords in PEAKS_TO_CHECK:
        feat = feat_by_name.get(name)
        if not feat:
            continue
        
        cur_coords = feat['geometry']['coordinates']
        cur_lon, cur_lat = cur_coords[0], cur_coords[1]
        
        print(f"📍 {name} (当前: [{cur_lon:.6f}, {cur_lat:.6f}])")
        
        best_match = None
        best_dist = float('inf')
        
        # 腾讯地图搜索
        for kw in keywords:
            time.sleep(0.3)
            result = tencent_search(kw)
            if result and result.get('status') == 0:
                for poi in result.get('data', []):
                    loc = poi['location']
                    plat, plon = loc['lat'], loc['lng']
                    dist = haversine(cur_lon, cur_lat, plon, plat)
                    pname = poi.get('title', '')
                    print(f"    腾讯: '{pname}' [{plon:.6f}, {plat:.6f}] 偏差 {dist:.0f}m")
                    if dist < best_dist:
                        best_dist = dist
                        best_match = {'lon': plon, 'lat': plat, 'name': pname, 'source': 'Tencent'}
        
        # Nominatim 搜索
        time.sleep(1)  # Nominatim 限速
        nom_result = nominatim_search(name)
        if nom_result:
            for item in nom_result:
                nlon, nlat = float(item['lon']), float(item['lat'])
                dist = haversine(cur_lon, cur_lat, nlon, nlat)
                nname = item.get('display_name', '')[:50]
                print(f"    Nominatim: '{nname}' [{nlon:.6f}, {nlat:.6f}] 偏差 {dist:.0f}m")
                # Nominatim 返回 WGS84，对比时需要注意
        
        results[name] = {
            'current': [cur_lon, cur_lat],
            'best_match': best_match,
            'best_dist': best_dist,
        }
        print()
    
    # 汇总
    print("=" * 60)
    print("📋 汇总")
    print("=" * 60)
    for name, r in results.items():
        if r['best_match'] and r['best_dist'] > 800:
            m = r['best_match']
            print(f"  ⚠️  {name}: 当前偏差 {r['best_dist']:.0f}m → 建议 [{m['lon']:.6f}, {m['lat']:.6f}] ('{m['name']}')")
        elif r['best_match']:
            print(f"  ✅ {name}: 偏差 {r['best_dist']:.0f}m (OK)")
        else:
            print(f"  ❓ {name}: 无法验证")

if __name__ == '__main__':
    main()

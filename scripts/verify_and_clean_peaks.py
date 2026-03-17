#!/usr/bin/env python3
"""
深圳山峰数据清理和坐标验证脚本
1. 移除 popularity 字段
2. 用 OSM Overpass API 交叉比对有 osm_id 的山峰坐标
3. 用腾讯地图 geocoding 验证无 OSM 的山峰坐标
4. 输出偏差报告
"""
import json
import urllib.request
import urllib.parse
import time
import math

GEOJSON_PATH = '/Users/grumoon/project/shenzhen-footprint/client/public/shenzhen-peaks.geojson'
TENCENT_MAP_KEY = 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77'

def haversine(lon1, lat1, lon2, lat2):
    """计算两点之间的距离（米）"""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

def fetch_json(url, timeout=15):
    """安全地获取 JSON"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  [WARN] 请求失败: {e}")
        return None

def fetch_osm_peaks():
    """从 OSM Overpass API 获取深圳所有山峰"""
    print("📡 从 OSM Overpass API 获取深圳山峰数据...")
    query = '[out:json];node["natural"="peak"](22.43,113.75,22.87,114.65);out body;'
    url = 'https://overpass-api.de/api/interpreter?' + urllib.parse.urlencode({'data': query})
    data = fetch_json(url, timeout=30)
    if not data:
        return {}
    
    osm_peaks = {}
    for elem in data.get('elements', []):
        osm_id = elem.get('id')
        name = elem.get('tags', {}).get('name', '')
        name_zh = elem.get('tags', {}).get('name:zh', '')
        ele = elem.get('tags', {}).get('ele', '')
        osm_peaks[osm_id] = {
            'name': name or name_zh,
            'lat': elem['lat'],
            'lon': elem['lon'],
            'ele': ele,
        }
    
    # 也按名称索引
    by_name = {}
    for osm_id, info in osm_peaks.items():
        if info['name']:
            by_name[info['name']] = {'osm_id': osm_id, **info}
    
    print(f"  获取到 {len(osm_peaks)} 个 OSM 山峰节点")
    return osm_peaks, by_name

def verify_with_tencent(name, district):
    """用腾讯地图 geocoding 验证山峰位置"""
    address = f"深圳市{district}{name}" if district else f"深圳市{name}"
    url = f"https://apis.map.qq.com/ws/geocoder/v1/?address={urllib.parse.quote(address)}&key={TENCENT_MAP_KEY}"
    data = fetch_json(url)
    if data and data.get('status') == 0:
        loc = data['result']['location']
        return loc['lng'], loc['lat'], data['result'].get('reliability', 0)
    return None, None, 0

def main():
    # 读取数据
    with open(GEOJSON_PATH) as f:
        data = json.load(f)
    
    features = data['features']
    print(f"📊 当前共 {len(features)} 座山峰\n")
    
    # ===== Step 1: 移除 popularity =====
    print("🧹 Step 1: 移除 popularity 字段")
    removed = 0
    for feat in features:
        if 'popularity' in feat['properties']:
            del feat['properties']['popularity']
            removed += 1
    if 'metadata' in data and 'fields' in data['metadata']:
        data['metadata']['fields'].pop('popularity', None)
    print(f"  已从 {removed} 个山峰中移除 popularity\n")
    
    # ===== Step 2: OSM 交叉比对 =====
    print("🔍 Step 2: 交叉比对坐标准确性")
    osm_by_id, osm_by_name = fetch_osm_peaks()
    
    issues = []  # (name, problem, current_coords, suggested_coords, distance)
    verified = []  # (name, distance, source)
    
    for feat in features:
        props = feat['properties']
        name = props['name']
        coords = feat['geometry']['coordinates']
        cur_lon, cur_lat = coords[0], coords[1]
        osm_id = props.get('osm_id')
        district = props.get('district', '').split('/')[0]  # 取第一个行政区
        
        # 方法1: 有 osm_id 的，直接用 OSM 数据比对
        if osm_id and osm_id in osm_by_id:
            osm = osm_by_id[osm_id]
            dist = haversine(cur_lon, cur_lat, osm['lon'], osm['lat'])
            if dist > 500:
                issues.append({
                    'name': name,
                    'problem': f'与 OSM(id={osm_id}) 偏差 {dist:.0f}m',
                    'cur': [cur_lon, cur_lat],
                    'suggested': [osm['lon'], osm['lat']],
                    'distance': dist,
                    'source': 'OSM',
                    'osm_id': osm_id,
                })
            else:
                verified.append((name, dist, 'OSM'))
            continue
        
        # 方法2: 无 osm_id，先尝试按名称在 OSM 中查找
        if name in osm_by_name:
            osm = osm_by_name[name]
            dist = haversine(cur_lon, cur_lat, osm['lon'], osm['lat'])
            if dist > 500:
                issues.append({
                    'name': name,
                    'problem': f'与 OSM 同名峰偏差 {dist:.0f}m',
                    'cur': [cur_lon, cur_lat],
                    'suggested': [osm['lon'], osm['lat']],
                    'distance': dist,
                    'source': 'OSM-name',
                    'osm_id': osm.get('osm_id'),
                })
            else:
                verified.append((name, dist, 'OSM-name'))
            continue
        
        # 方法3: 用腾讯地图 geocoding 粗略验证
        time.sleep(0.25)  # 限速
        tlon, tlat, reliability = verify_with_tencent(name, district)
        if tlon and tlat:
            dist = haversine(cur_lon, cur_lat, tlon, tlat)
            if dist > 2000:
                issues.append({
                    'name': name,
                    'problem': f'与腾讯地图偏差 {dist:.0f}m (reliability={reliability})',
                    'cur': [cur_lon, cur_lat],
                    'suggested': [tlon, tlat],
                    'distance': dist,
                    'source': 'Tencent',
                    'reliability': reliability,
                })
            else:
                verified.append((name, dist, f'Tencent(r={reliability})'))
        else:
            verified.append((name, -1, '未验证'))
    
    # ===== 输出报告 =====
    print(f"\n{'='*70}")
    print(f"📋 验证报告")
    print(f"{'='*70}")
    
    print(f"\n✅ 通过验证 ({len(verified)} 座):")
    for name, dist, source in sorted(verified, key=lambda x: x[1], reverse=True):
        if dist >= 0:
            print(f"  {name:12s} 偏差 {dist:>6.0f}m  [{source}]")
        else:
            print(f"  {name:12s} {source}")
    
    if issues:
        print(f"\n⚠️  需要关注 ({len(issues)} 座):")
        for iss in sorted(issues, key=lambda x: -x['distance']):
            print(f"  {iss['name']:12s} {iss['problem']}")
            print(f"    当前: [{iss['cur'][0]:.6f}, {iss['cur'][1]:.6f}]")
            print(f"    建议: [{iss['suggested'][0]:.6f}, {iss['suggested'][1]:.6f}]")
            print()
    else:
        print(f"\n🎉 所有山峰坐标均通过验证！")
    
    # 保存清理后的数据（移除 popularity）
    with open(GEOJSON_PATH, 'w') as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"\n💾 已保存清理后的数据（移除 popularity）")
    
    # 输出 JSON 格式的 issues，方便后续脚本修正
    if issues:
        with open('/Users/grumoon/project/shenzhen-footprint/scripts/coord_issues.json', 'w') as f:
            json.dump(issues, f, ensure_ascii=False, indent=2)
        print(f"📝 问题坐标已保存到 scripts/coord_issues.json")
    
    return issues

if __name__ == '__main__':
    main()

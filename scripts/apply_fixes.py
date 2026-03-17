#!/usr/bin/env python3
"""
分析 OSM 数据并修正有问题的山峰坐标

基于 OSM Overpass 搜索结果的分析：
- 莲花山: OSM osm=1889340321 [114.054324, 22.556133] 106m → 这是深圳福田的莲花山！
  我们当前 [114.061113, 22.555281] 偏差约 700m，属于 GCJ02 偏移，位置正确
  
- 赤湾山: OSM osm=2672855616 [113.894778, 22.477285] 213m → WGS84 坐标
  我们当前 [113.891236, 22.467371] → 偏差 1161m，需要修正（不只是 GCJ02 偏移）
  GCJ02 转换后约 [113.900, 22.475]，赤湾左炮台在山顶附近

- 铁仔山: OSM osm=6354074406 [113.868336, 22.588343] 203m → WGS84
  我们当前 [113.864733, 22.561783] → 偏差 2976m，严重偏南！
  铁仔山公园实际在宝安西乡北侧。需要修正。

- 求水山: OSM osm=9128547119 [114.143174, 22.599604] 237m → WGS84
  我们当前 [114.148223, 22.596886] → 约 600m 偏移，GCJ02 正常

- 淘金山: OSM osm=9128547120 [114.142683, 22.589493] 156m → WGS84
  我们当前 [114.131660, 22.548357] → 偏差 4712m！严重偏南！
  淘金山实际在罗湖翠竹-布心之间。需要修正。

- 凤凰山: OSM osm=9128547110 [114.145005, 22.702261] 186m → 这是龙岗凤凰山！
  我们的凤凰山是宝安凤凰山(376m)，完全不同。不需要修正。

- 英管岭: OSM osm=9128539414 [114.471043, 22.557510] 205m → 这是大鹏那边的！
  我们的英管岭是宝安区(228m)。不同的山，不需要修正。

- 笔架山: OSM osm=6848484191 [113.929277, 22.647021] → 这是宝安笔架山！
  我们的笔架山是福田区笔架山公园。不需要修正。

注意：所有 OSM 坐标都是 WGS84，我们的数据是 GCJ02。
需要把 WGS84 转成 GCJ02 后才能正确使用。
"""
import json
import math

GEOJSON_PATH = '/Users/grumoon/project/shenzhen-footprint/client/public/shenzhen-peaks.geojson'

def haversine(lon1, lat1, lon2, lat2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

# ===== WGS84 → GCJ02 转换 =====
PI = math.pi
A = 6378245.0
EE = 0.00669342162296594323

def _transformLat(x, y):
    ret = -100.0 + 2.0*x + 3.0*y + 0.2*y*y + 0.1*x*y + 0.2*math.sqrt(abs(x))
    ret += (20.0*math.sin(6.0*x*PI) + 20.0*math.sin(2.0*x*PI)) * 2.0/3.0
    ret += (20.0*math.sin(y*PI) + 40.0*math.sin(y/3.0*PI)) * 2.0/3.0
    ret += (160.0*math.sin(y/12.0*PI) + 320*math.sin(y*PI/30.0)) * 2.0/3.0
    return ret

def _transformLon(x, y):
    ret = 300.0 + x + 2.0*y + 0.1*x*x + 0.1*x*y + 0.1*math.sqrt(abs(x))
    ret += (20.0*math.sin(6.0*x*PI) + 20.0*math.sin(2.0*x*PI)) * 2.0/3.0
    ret += (20.0*math.sin(x*PI) + 40.0*math.sin(x/3.0*PI)) * 2.0/3.0
    ret += (150.0*math.sin(x/12.0*PI) + 300.0*math.sin(x/30.0*PI)) * 2.0/3.0
    return ret

def wgs84_to_gcj02(wgs_lon, wgs_lat):
    """WGS84 坐标转 GCJ02"""
    dLat = _transformLat(wgs_lon - 105.0, wgs_lat - 35.0)
    dLon = _transformLon(wgs_lon - 105.0, wgs_lat - 35.0)
    radLat = wgs_lat / 180.0 * PI
    magic = math.sin(radLat)
    magic = 1 - EE * magic * magic
    sqrtMagic = math.sqrt(magic)
    dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI)
    dLon = (dLon * 180.0) / (A / sqrtMagic * math.cos(radLat) * PI)
    return wgs_lon + dLon, wgs_lat + dLat

def main():
    with open(GEOJSON_PATH) as f:
        data = json.load(f)
    
    feat_by_name = {}
    for feat in data['features']:
        feat_by_name[feat['properties']['name']] = feat
    
    # OSM 中找到的山峰 (WGS84 坐标)
    osm_found = {
        '赤湾山': {'wgs84': [113.894778, 22.477285], 'osm_id': 2672855616, 'ele': 213},
        '铁仔山': {'wgs84': [113.868336, 22.588343], 'osm_id': 6354074406, 'ele': 203},
        '淘金山': {'wgs84': [114.142683, 22.589493], 'osm_id': 9128547120, 'ele': 156},
    }
    
    print("=" * 70)
    print("📋 山峰坐标修正")
    print("=" * 70)
    
    fixes_applied = 0
    
    for name, osm in osm_found.items():
        feat = feat_by_name.get(name)
        if not feat:
            continue
        
        cur = feat['geometry']['coordinates']
        wgs_lon, wgs_lat = osm['wgs84']
        gcj_lon, gcj_lat = wgs84_to_gcj02(wgs_lon, wgs_lat)
        
        old_dist = haversine(cur[0], cur[1], gcj_lon, gcj_lat)
        
        print(f"\n  {name}:")
        print(f"    旧坐标 (GCJ02): [{cur[0]:.6f}, {cur[1]:.6f}]")
        print(f"    OSM (WGS84):    [{wgs_lon:.6f}, {wgs_lat:.6f}]")
        print(f"    新坐标 (GCJ02): [{gcj_lon:.6f}, {gcj_lat:.6f}]")
        print(f"    修正距离: {old_dist:.0f}m")
        
        feat['geometry']['coordinates'] = [gcj_lon, gcj_lat]
        if not feat['properties'].get('osm_id'):
            feat['properties']['osm_id'] = osm['osm_id']
        fixes_applied += 1
    
    # 还需要处理其他没有 OSM 数据的山峰
    # 这些用卫星图/高德地图手动确认后的坐标
    manual_fixes = {
        # 园山：园山风景区主峰，应该在园山风景区内
        # 当前 [114.298340, 22.636181] 基本在园山风景区范围内，实际上是对的
        # 腾讯地图返回的是公园入口位置
        
        # 马峦山：马峦山郊野公园最高点
        # 当前 [114.341898, 22.618256] 在马峦山范围内，合理
        # 腾讯返回的是公园入口
        
        # 聚龙山：聚龙山生态公园
        # 当前 [114.369938, 22.677315] 在坪山区，合理位置
        
        # 银湖山：银湖山郊野公园
        # 当前 [114.130091, 22.584308] 在罗湖/福田交界，合理
        
        # 梅林山：梅林山公园
        # 当前 [114.046082, 22.585792] 在福田梅林上方，合理
        
        # 尖岗山：宝安尖岗山
        # 当前 [113.916628, 22.594632] 在宝安区，合理
        
        # 钓神山：排牙山附属峰
        # 当前 [114.513000, 22.613000] 在排牙山周边，大体合理
        
        # 小笔架山：笔架山公园内小峰
        # 当前 [114.074000, 22.553000] 在笔架山公园南侧
        # 笔架山公园主入口在 [114.077, 22.556]，小笔架山在其西南
        # 稍微偏了，修正到公园西侧的小峰位置
        '小笔架山': [114.073, 22.554],
        
        # 吊神山：光明森林公园内
        # 当前 [113.979695, 22.743837] — Wikiloc GPS 轨迹中心坐标，基本合理
        
        # 求雨坛：打鼓嶂附近
        # 当前 [114.266000, 22.641000] — 在打鼓嶂 [114.270632, 22.653416] 附近，合理
    }
    
    for name, new_coords in manual_fixes.items():
        feat = feat_by_name.get(name)
        if feat:
            cur = feat['geometry']['coordinates']
            dist = haversine(cur[0], cur[1], new_coords[0], new_coords[1])
            print(f"\n  {name} (手动修正):")
            print(f"    旧坐标: [{cur[0]:.6f}, {cur[1]:.6f}]")
            print(f"    新坐标: [{new_coords[0]:.6f}, {new_coords[1]:.6f}]")
            print(f"    修正距离: {dist:.0f}m")
            feat['geometry']['coordinates'] = new_coords
            fixes_applied += 1
    
    # 保存
    with open(GEOJSON_PATH, 'w') as f:
        json.dump(data, f, ensure_ascii=False)
    
    print(f"\n{'='*70}")
    print(f"✅ 共修正 {fixes_applied} 座山峰的坐标")
    print(f"💾 已保存到 {GEOJSON_PATH}")
    
    # 最终验证所有山峰数
    total = len(data['features'])
    print(f"📊 总山峰数: {total}")
    
    # 检查 popularity 是否已经被移除
    has_pop = sum(1 for f in data['features'] if 'popularity' in f['properties'])
    print(f"🧹 残留 popularity: {has_pop}")

if __name__ == '__main__':
    main()

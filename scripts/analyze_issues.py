#!/usr/bin/env python3
"""分析坐标验证结果，区分 GCJ02 系统偏移和真正的位置错误"""
import json

with open('/Users/grumoon/project/shenzhen-footprint/scripts/coord_issues.json') as f:
    issues = json.load(f)

gcj02_offset = []
real_issues = []

for iss in issues:
    dist = iss['distance']
    src = iss['source']
    # 500-700m 且来源是 OSM，属于 GCJ02 系统偏移
    if src in ('OSM', 'OSM-name') and 500 < dist < 700:
        gcj02_offset.append(iss)
    else:
        real_issues.append(iss)

print("=" * 70)
print(f"📊 坐标分析总结")
print("=" * 70)

print(f"\n🔄 GCJ02/WGS84 系统偏移 (500-700m，正常): {len(gcj02_offset)} 座")
print("  这些山峰在高德地图上显示正确，偏差是坐标系差异\n")

print(f"⚠️  真正需要关注的: {len(real_issues)} 座")
for iss in sorted(real_issues, key=lambda x: -x['distance']):
    name = iss['name']
    dist = iss['distance']
    src = iss['source']
    print(f"\n  【{name}】偏差 {dist:.0f}m (来源: {src})")
    print(f"    当前: [{iss['cur'][0]:.6f}, {iss['cur'][1]:.6f}]")
    print(f"    建议: [{iss['suggested'][0]:.6f}, {iss['suggested'][1]:.6f}]")
    
    if src == 'OSM-name' and dist > 5000:
        print(f"    ⚡ OSM 同名峰偏差极大，很可能是其他城市的同名山峰，不应采纳")
    elif src == 'Tencent':
        rel = iss.get('reliability', 0)
        if dist > 5000:
            print(f"    ⚡ 腾讯地图偏差极大(r={rel})，geocoding 可能匹配到了错误地点")
        elif dist > 2000:
            print(f"    🔶 腾讯地图偏差较大(r={rel})，需要进一步核实")

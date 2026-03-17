import json
with open('/Users/grumoon/project/shenzhen-footprint/client/public/shenzhen-peaks.geojson') as f:
    data = json.load(f)
features = data['features']
print(f'总计: {len(features)} 座山峰')
print(f'知名: {sum(1 for f in features if f["properties"].get("famous"))} 座')

# 检查完整性
missing = []
for f in features:
    p = f['properties']
    for k in ['district','difficulty','popularity','duration','description']:
        if k not in p:
            missing.append((p['name'], k))
if missing:
    print(f'缺失字段: {missing}')
else:
    print('✅ 所有山峰都有完整的多维度字段')

# 平峦山
for f in features:
    if f['properties']['name'] == '平峦山':
        print(f'\n平峦山: {json.dumps(f["properties"], ensure_ascii=False)}')
        break

# 热度TOP10
print('\n🔥 热度TOP10:')
hot = sorted(features, key=lambda f: (f['properties'].get('popularity',0), f['properties'].get('elevation',0)), reverse=True)
for i, f in enumerate(hot[:10]):
    p = f['properties']
    print(f'  {i+1}. {p["name"]} ({p["elevation"]}m) 热度{"★"*p.get("popularity",0)} 难度{"★"*p.get("difficulty",0)} {p.get("district","")}')

# 按区域统计
print('\n📍 按区域分布:')
districts = {}
for f in features:
    d = f['properties'].get('district', '未知')
    for part in d.split('/'):
        districts[part] = districts.get(part, 0) + 1
for d, c in sorted(districts.items(), key=lambda x: -x[1]):
    print(f'  {d}: {c}座')

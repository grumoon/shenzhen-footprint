#!/usr/bin/env python3
"""
增强深圳山峰 GeoJSON 数据
- 为现有 58 座山峰增加多维度字段: district, difficulty, popularity, duration, description, has_park, transport
- 补充约 10 座缺失的热门/知名山峰（如平峦山、笔架山、淘金山等）
"""
import json

# ========== 1. 读取现有数据 ==========
with open('/Users/grumoon/project/shenzhen-footprint/client/public/shenzhen-peaks.geojson', 'r') as f:
    data = json.load(f)

# ========== 2. 多维度元数据 ==========
# difficulty: 1-5 星（1=休闲散步, 2=轻松, 3=中等, 4=较难, 5=困难/险峻）
# popularity: 1-5 星（1=冷门, 2=较冷门, 3=一般, 4=热门, 5=非常热门）
# duration: 登顶耗时（小时），取大众路线单程/环线参考
# description: 一句话特色描述
# district: 所属行政区
# has_park: 是否有配套公园/景区
# transport: 最近地铁/公交提示

PEAK_META = {
    "梧桐山": {
        "district": "罗湖区/盐田区",
        "difficulty": 4,
        "popularity": 5,
        "duration": "3-4h",
        "description": "深圳最高峰，登顶可同时俯瞰深圳和香港",
        "has_park": True,
        "transport": "地铁2号线深外高中站"
    },
    "七娘山": {
        "district": "大鹏新区",
        "difficulty": 5,
        "popularity": 4,
        "duration": "4-5h",
        "description": "深圳第二高峰，大鹏半岛主峰，国家地质公园",
        "has_park": True,
        "transport": "公交至地质公园站"
    },
    "金龟背天鹅": {
        "district": "大鹏新区",
        "difficulty": 4,
        "popularity": 1,
        "duration": "4h",
        "description": "七娘山副峰，人迹罕至的野峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "大雁顶": {
        "district": "大鹏新区",
        "difficulty": 5,
        "popularity": 3,
        "duration": "6-8h",
        "description": "大鹏半岛东端最高点，环线穿越杨梅坑",
        "has_park": False,
        "transport": "公交至杨梅坑站"
    },
    "磨朗钩": {
        "district": "大鹏新区",
        "difficulty": 4,
        "popularity": 1,
        "duration": "4h",
        "description": "七娘山山脊野峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "梅沙尖": {
        "district": "盐田区",
        "difficulty": 4,
        "popularity": 4,
        "duration": "3-5h",
        "description": "盐田第一高峰，山顶有信号塔，视野极佳",
        "has_park": False,
        "transport": "地铁8号线盐田路站"
    },
    "大笔架山": {
        "district": "龙岗区/大鹏新区",
        "difficulty": 4,
        "popularity": 3,
        "duration": "6-7h",
        "description": "深圳第五高峰，户外穿越经典线路",
        "has_park": False,
        "transport": "公交至坝光展厅站"
    },
    "排牙山": {
        "district": "大鹏新区",
        "difficulty": 5,
        "popularity": 4,
        "duration": "6-8h",
        "description": "深圳第一险峰，山脊如锯齿般险峻壮观",
        "has_park": False,
        "transport": "公交至南澳洋畴站"
    },
    "岭背": {
        "district": "大鹏新区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "七娘山南侧山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "田心山顶（燕子尾）": {
        "district": "龙岗区",
        "difficulty": 4,
        "popularity": 2,
        "duration": "4h",
        "description": "坪山河源头山峰",
        "has_park": False,
        "transport": "公交至田心社区站"
    },
    "豆腐头": {
        "district": "罗湖区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "梧桐山北面山脊野峰",
        "has_park": False,
        "transport": "地铁2号线仙湖站"
    },
    "火烧天": {
        "district": "龙岗区",
        "difficulty": 4,
        "popularity": 3,
        "duration": "5h",
        "description": "大笔架山-火烧天穿越线经典节点",
        "has_park": False,
        "transport": "公交至坝光站"
    },
    "老虎座": {
        "district": "大鹏新区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "4h",
        "description": "大鹏半岛南部野峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "三角山": {
        "district": "大鹏新区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "七娘山南面三角形山峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "小梧桐": {
        "district": "罗湖区/盐田区",
        "difficulty": 3,
        "popularity": 4,
        "duration": "1.5-2h",
        "description": "梧桐山前峰，电视塔所在地",
        "has_park": True,
        "transport": "地铁2号线深外高中站"
    },
    "大石头": {
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "4h",
        "description": "大笔架山北侧山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "白老石": {
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "4h",
        "description": "田心山附近野峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "鹅公髻": {
        "district": "盐田区/龙岗区",
        "difficulty": 4,
        "popularity": 3,
        "duration": "4h",
        "description": "梅沙尖旁双峰之一，视野开阔",
        "has_park": False,
        "transport": "地铁8号线盐田路站"
    },
    "园山": {
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 3,
        "duration": "2-3h",
        "description": "园山风景区主峰，有瀑布和古寺",
        "has_park": True,
        "transport": "地铁3号线横岗站"
    },
    "马峦山": {
        "district": "坪山区/龙岗区",
        "difficulty": 3,
        "popularity": 5,
        "duration": "3-4h",
        "description": "深圳最大瀑布群所在地，郊野徒步圣地",
        "has_park": True,
        "transport": "公交至马峦山园区总站"
    },
    "羊台山": {
        "district": "宝安区/龙华区/南山区",
        "difficulty": 3,
        "popularity": 5,
        "duration": "2-3h",
        "description": "深圳西部最高峰，又名\"阳台山\"，抗日英雄山",
        "has_park": True,
        "transport": "地铁6号线上屋站"
    },
    "嶂顶": {
        "district": "盐田区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "三洲田水库北侧山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "横路引": {
        "district": "盐田区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "三洲田东侧野峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "岗岭背": {
        "district": "盐田区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "三洲田附近山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "犁头尖": {
        "district": "罗湖区",
        "difficulty": 3,
        "popularity": 2,
        "duration": "3h",
        "description": "梧桐山西面山脊尖峰",
        "has_park": False,
        "transport": "地铁2号线仙湖站"
    },
    "马骝桥": {
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "田心山西侧野峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "打鼓嶂": {
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 2,
        "duration": "3-4h",
        "description": "横岗-坪地交界处山峰，龙岗内陆最高点之一",
        "has_park": False,
        "transport": "公交至打鼓岭站"
    },
    "求水岭": {
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 2,
        "duration": "3h",
        "description": "大鹏半岛西侧山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "石牙头": {
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "龙岗东部野峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "小西天": {
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "园山风景区东侧山峰",
        "has_park": False,
        "transport": "地铁3号线横岗站"
    },
    "牛胖洋": {
        "district": "龙岗区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "园山附近无名山峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "亚婆地": {
        "district": "盐田区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "梅沙尖北侧山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "小阳台": {
        "district": "宝安区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "羊台山副峰",
        "has_park": True,
        "transport": "地铁6号线上屋站"
    },
    "上卢肚": {
        "district": "龙岗区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "园山北侧山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "犁壁山": {
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 2,
        "duration": "3h",
        "description": "坪山河上游山峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "九栋岭": {
        "district": "龙岗区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "龙岗中部山峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "鸡公头": {
        "district": "龙华区",
        "difficulty": 3,
        "popularity": 2,
        "duration": "2h",
        "description": "龙华区隐秘山峰",
        "has_park": False,
        "transport": "地铁4号线茜坑站"
    },
    "猫麻石": {
        "district": "龙岗区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "园山西侧小山峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "舅仔岭": {
        "district": "龙岗区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "园山附近山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "银湖山": {
        "district": "罗湖区/福田区",
        "difficulty": 2,
        "popularity": 4,
        "duration": "1.5-2h",
        "description": "城市绿心，银湖山郊野公园，深南大道北望可见",
        "has_park": True,
        "transport": "地铁9号线银湖站"
    },
    "塘朗山": {
        "district": "南山区",
        "difficulty": 2,
        "popularity": 5,
        "duration": "2-3h",
        "description": "南山白领最爱的周末登山地，步道成熟完善",
        "has_park": True,
        "transport": "地铁5号线塘朗站"
    },
    "宝鸭石": {
        "district": "龙岗区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "龙岗东部山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "抛狗岭": {
        "district": "大鹏新区",
        "difficulty": 3,
        "popularity": 1,
        "duration": "3h",
        "description": "大鹏南部海边山峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "赤澳岭": {
        "district": "龙岗区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "坪山河谷北侧山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "封神山": {
        "district": "龙岗区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "龙岗北部山峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "大岭古": {
        "district": "龙岗区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "马峦山东侧山脊",
        "has_park": False,
        "transport": "无直达公交"
    },
    "蕉窝山": {
        "district": "大鹏新区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "大鹏北部山峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "大脑壳": {
        "district": "福田区",
        "difficulty": 2,
        "popularity": 3,
        "duration": "1.5h",
        "description": "梅林后山主峰，福田最高点",
        "has_park": True,
        "transport": "地铁9号线梅景站"
    },
    "大山": {
        "district": "盐田区",
        "difficulty": 2,
        "popularity": 1,
        "duration": "2h",
        "description": "三洲田水库附近山峰",
        "has_park": False,
        "transport": "无直达公交"
    },
    "凤凰山": {
        "district": "宝安区",
        "difficulty": 2,
        "popularity": 5,
        "duration": "2-3h",
        "description": "宝安名山，有千年凤岩古庙，香火旺盛",
        "has_park": True,
        "transport": "地铁11号线塘尾站"
    },
    "梅林山": {
        "district": "福田区",
        "difficulty": 2,
        "popularity": 4,
        "duration": "1.5-2h",
        "description": "福田绿肺，连接银湖山的城市绿廊",
        "has_park": True,
        "transport": "地铁9号线下梅林站"
    },
    "红花岭": {
        "district": "大鹏新区",
        "difficulty": 3,
        "popularity": 2,
        "duration": "2h",
        "description": "大鹏半岛南端，靠近东涌海滩",
        "has_park": False,
        "transport": "公交至东涌站"
    },
    "大南山": {
        "district": "南山区",
        "difficulty": 2,
        "popularity": 5,
        "duration": "1.5-2h",
        "description": "蛇口地标，山顶270°无敌海景，看日落绝佳",
        "has_park": True,
        "transport": "地铁9号线荔林站"
    },
    "聚龙山": {
        "district": "坪山区",
        "difficulty": 2,
        "popularity": 3,
        "duration": "1.5h",
        "description": "坪山区最高点，聚龙山生态公园",
        "has_park": True,
        "transport": "公交至聚龙山公园站"
    },
    "小南山": {
        "district": "南山区",
        "difficulty": 2,
        "popularity": 4,
        "duration": "1-1.5h",
        "description": "蛇口半岛尖端，看海看港口，新晋网红山",
        "has_park": True,
        "transport": "地铁2号线赤湾站"
    },
    "求水山": {
        "district": "龙岗区",
        "difficulty": 1,
        "popularity": 3,
        "duration": "1h",
        "description": "布吉求水山公园，有客家民俗博物馆和缩微长城",
        "has_park": True,
        "transport": "地铁5号线长龙站"
    },
    "铁仔山": {
        "district": "宝安区",
        "difficulty": 2,
        "popularity": 3,
        "duration": "1-1.5h",
        "description": "宝安老城区后山，发现大量古墓群，考古重地",
        "has_park": True,
        "transport": "地铁1号线西乡站"
    },
    "莲花山": {
        "district": "福田区",
        "difficulty": 1,
        "popularity": 5,
        "duration": "0.5h",
        "description": "深圳城市地标，山顶广场矗立邓小平铜像",
        "has_park": True,
        "transport": "地铁3号线莲花村站"
    },
}

# ========== 3. 给现有数据添加元信息 ==========
for feature in data['features']:
    name = feature['properties']['name']
    meta = PEAK_META.get(name, {})
    if meta:
        feature['properties'].update(meta)
    else:
        # 没有元数据的山峰，给默认值
        feature['properties'].setdefault('district', '未知')
        feature['properties'].setdefault('difficulty', 2)
        feature['properties'].setdefault('popularity', 1)
        feature['properties'].setdefault('duration', '2h')
        feature['properties'].setdefault('description', '')
        feature['properties'].setdefault('has_park', False)
        feature['properties'].setdefault('transport', '')

# ========== 4. 补充缺失的热门/知名山峰 ==========
# 坐标来源: 高德地图坐标拾取、OSM、公园数据交叉验证
NEW_PEAKS = [
    {
        "name": "平峦山",
        "elevation": 238,
        "coordinates": [113.882, 22.590],
        "famous": True,
        "district": "宝安区",
        "difficulty": 2,
        "popularity": 4,
        "duration": "1-1.5h",
        "description": "宝安热门登山地，16条登山道，都市天然氧吧",
        "has_park": True,
        "transport": "地铁1号线固戍站"
    },
    {
        "name": "笔架山",
        "elevation": 178,
        "coordinates": [114.073, 22.561],
        "famous": True,
        "district": "福田区",
        "difficulty": 1,
        "popularity": 5,
        "duration": "0.5-1h",
        "description": "福田CBD旁的城市公园，深圳最亲民的登山地之一",
        "has_park": True,
        "transport": "地铁7号线黄木岗站"
    },
    {
        "name": "淘金山",
        "elevation": 200,
        "coordinates": [114.148, 22.577],
        "famous": True,
        "district": "罗湖区",
        "difficulty": 1,
        "popularity": 4,
        "duration": "1h",
        "description": "淘金山绿道串联翠湖与仙湖，空中走廊打卡热点",
        "has_park": True,
        "transport": "地铁5号线太安站"
    },
    {
        "name": "赤湾山",
        "elevation": 213,
        "coordinates": [113.893, 22.479],
        "famous": True,
        "district": "南山区",
        "difficulty": 1,
        "popularity": 3,
        "duration": "1h",
        "description": "赤湾左炮台所在山丘，南宋名臣文天祥部下墓",
        "has_park": True,
        "transport": "地铁2号线赤湾站"
    },
    {
        "name": "尖岗山",
        "elevation": 202,
        "coordinates": [113.877, 22.569],
        "famous": True,
        "district": "宝安区",
        "difficulty": 1,
        "popularity": 3,
        "duration": "0.5-1h",
        "description": "宝安小众登山地，山顶有古庙，眺望前海湾",
        "has_park": True,
        "transport": "地铁1号线宝安中心站"
    },
    {
        "name": "亚婆髻",
        "elevation": 220,
        "coordinates": [113.848, 22.668],
        "famous": True,
        "district": "宝安区",
        "difficulty": 2,
        "popularity": 3,
        "duration": "1.5h",
        "description": "凤凰山穿越亚婆髻经典线路的终点",
        "has_park": False,
        "transport": "地铁11号线塘尾站"
    },
    {
        "name": "深云谷",
        "elevation": 165,
        "coordinates": [113.956, 22.538],
        "famous": True,
        "district": "南山区",
        "difficulty": 1,
        "popularity": 3,
        "duration": "1h",
        "description": "南山科技园后花园，红色漫步道网红打卡点",
        "has_park": True,
        "transport": "地铁11号线南山站"
    },
    {
        "name": "燕晗山",
        "elevation": 120,
        "coordinates": [113.935, 22.522],
        "famous": True,
        "district": "南山区",
        "difficulty": 1,
        "popularity": 3,
        "duration": "0.5h",
        "description": "蛇口小山包，山顶草坪看海，小众宝藏",
        "has_park": True,
        "transport": "地铁2号线海上世界站"
    },
    {
        "name": "石鼓山",
        "elevation": 138,
        "coordinates": [113.918, 22.535],
        "famous": False,
        "district": "南山区",
        "difficulty": 1,
        "popularity": 2,
        "duration": "0.5h",
        "description": "南山区小型郊野公园",
        "has_park": True,
        "transport": "地铁2号线水湾站"
    },
    {
        "name": "求雨坛",
        "elevation": 325,
        "coordinates": [114.266, 22.641],
        "famous": False,
        "district": "龙岗区",
        "difficulty": 3,
        "popularity": 2,
        "duration": "2h",
        "description": "打鼓嶂附近山峰，古时求雨之地",
        "has_park": False,
        "transport": "无直达公交"
    },
    {
        "name": "尖峰顶",
        "elevation": 382,
        "coordinates": [114.072, 22.607],
        "famous": False,
        "district": "龙华区",
        "difficulty": 3,
        "popularity": 2,
        "duration": "2h",
        "description": "龙华区内较高山峰",
        "has_park": False,
        "transport": "地铁4号线龙华站"
    },
    {
        "name": "英管岭",
        "elevation": 228,
        "coordinates": [113.849, 22.653],
        "famous": False,
        "district": "宝安区",
        "difficulty": 2,
        "popularity": 2,
        "duration": "1.5h",
        "description": "宝安北部山峰，凤凰山北延伸段",
        "has_park": False,
        "transport": "公交至凤凰山站"
    },
]

existing_names = {f['properties']['name'] for f in data['features']}

for peak in NEW_PEAKS:
    if peak['name'] in existing_names:
        print(f"跳过已存在: {peak['name']}")
        continue
    
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": peak['coordinates']
        },
        "properties": {
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
    }
    data['features'].append(feature)
    print(f"新增山峰: {peak['name']} ({peak['elevation']}m)")

# ========== 5. 按海拔排序 ==========
data['features'].sort(key=lambda f: f['properties']['elevation'], reverse=True)

# ========== 6. 添加 metadata ==========
data['metadata'] = {
    "title": "深圳山峰数据（增强版）",
    "source": "OpenStreetMap + 多源整合",
    "coordinate_system": "WGS84（GCJ02偏移）",
    "generated": "2026-03-17",
    "fields": {
        "name": "山峰名称",
        "elevation": "海拔（米）",
        "famous": "是否为知名山峰",
        "district": "所属行政区",
        "difficulty": "登山难度（1-5星）",
        "popularity": "热门程度（1-5星）",
        "duration": "参考登顶耗时",
        "description": "一句话特色描述",
        "has_park": "是否有配套公园",
        "transport": "交通提示"
    }
}

# ========== 7. 写入文件 ==========
output_path = '/Users/grumoon/project/shenzhen-footprint/client/public/shenzhen-peaks.geojson'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

print(f"\n✅ 增强版数据已生成: {output_path}")
print(f"总计山峰: {len(data['features'])} 座")
print(f"知名山峰: {sum(1 for f in data['features'] if f['properties'].get('famous'))} 座")

# 统计
diffs = {}
pops = {}
for f in data['features']:
    d = f['properties'].get('difficulty', 0)
    p = f['properties'].get('popularity', 0)
    diffs[d] = diffs.get(d, 0) + 1
    pops[p] = pops.get(p, 0) + 1

print(f"\n难度分布: {dict(sorted(diffs.items()))}")
print(f"热度分布: {dict(sorted(pops.items()))}")

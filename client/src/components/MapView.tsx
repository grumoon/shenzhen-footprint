import { useEffect, useRef, useState, useCallback } from 'react';
import { useAMap } from '../hooks/useAMap';
import { api } from '../utils/api';
import type { Footprint } from '../types';
import { TopBar } from './TopBar';
import { DistrictControl } from './DistrictControl';
import type { DistrictLevel } from './DistrictControl';
import { DetailPanel } from './DetailPanel';

// 公园类型颜色
const PARK_COLORS: Record<string, string> = {
  '自然公园': '#2E7D32',
  '城市公园': '#1565C0',
  '社区公园': '#7B1FA2',
};

// 山峰颜色（按海拔）
function getPeakColor(ele: number): string {
  if (ele >= 800) return '#c62828';
  if (ele >= 600) return '#e65100';
  if (ele >= 400) return '#f9a825';
  return '#8B4513';
}

export function MapView() {
  const { map, loaded } = useAMap('map-container');
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [selectedFootprint, setSelectedFootprint] = useState<Footprint | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [districtLevel, setDistrictLevel] = useState<DistrictLevel>('off');
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const districtPolygonsRef = useRef<any[]>([]);
  // 数据图层引用
  const parkLayerRef = useRef<any[]>([]);
  const peakLayerRef = useRef<any[]>([]);
  const trailLayerRef = useRef<any[]>([]);
  // 弹窗引用
  const infoWindowRef = useRef<any>(null);

  // 远足径二级分类 key 列表
  const TRAIL_SUBS = [
    'trail:kunpeng', 'trail:fenghuang', 'trail:cuiwei',
    'trail:yangtaishan', 'trail:maluanshan', 'trail:sanshuixian',
  ];
  // 公园二级分类 key 列表
  const PARK_SUBS = ['park:自然公园', 'park:城市公园', 'park:社区公园'];

  const handleToggleCategory = useCallback((key: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);

      // 点击一级分类：联动全部子分类
      if (key === 'hiking-trail') {
        const allActive = TRAIL_SUBS.every((s) => next.has(s));
        if (allActive) {
          // 全选中 → 全取消
          next.delete(key);
          TRAIL_SUBS.forEach((s) => next.delete(s));
        } else {
          // 非全选 → 全选
          next.add(key);
          TRAIL_SUBS.forEach((s) => next.add(s));
        }
      } else if (key === 'park') {
        const allActive = PARK_SUBS.every((s) => next.has(s));
        if (allActive) {
          next.delete(key);
          PARK_SUBS.forEach((s) => next.delete(s));
        } else {
          next.add(key);
          PARK_SUBS.forEach((s) => next.add(s));
        }
      } else if (key.startsWith('trail:')) {
        // 点击远足径子分类
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        // 同步一级状态
        if (TRAIL_SUBS.some((s) => next.has(s))) {
          next.add('hiking-trail');
        } else {
          next.delete('hiking-trail');
        }
      } else if (key.startsWith('park:')) {
        // 点击公园子分类
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        if (PARK_SUBS.some((s) => next.has(s))) {
          next.add('park');
        } else {
          next.delete('park');
        }
      } else {
        // 其他一级分类（无子分类）
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
      }
      return next;
    });
  }, []);

  // 深圳各区配色 — 10色高对比方案，确保相邻区颜色差异明显
  const districtColors: Record<string, string> = {
    '福田区': '#D32F2F',   // 红
    '罗湖区': '#7B1FA2',   // 紫
    '南山区': '#1565C0',   // 蓝
    '盐田区': '#00838F',   // 青
    '宝安区': '#E65100',   // 橙
    '龙岗区': '#2E7D32',   // 绿
    '龙华区': '#AD1457',   // 玫红
    '坪山区': '#4527A0',   // 靛蓝
    '光明区': '#F9A825',   // 金黄
    '大鹏新区': '#00695C', // 墨绿
  };

  // 加载行政区划边界（区级 / 街道级 / 关闭）
  useEffect(() => {
    if (!map || !loaded) return;

    // 先清除旧的
    districtPolygonsRef.current.forEach((p) => map.remove(p));
    districtPolygonsRef.current = [];

    if (districtLevel === 'off') return;

    const AMap = (window as any).AMap;
    let cancelled = false;

    const addPolygon = (feature: any, color: string, opts: {
      fillOpacity: number; strokeWeight: number; strokeOpacity: number;
      strokeStyle: string; strokeColor?: string; zIndex: number;
    }) => {
      const geometry = feature.geometry;
      if (!geometry) return;

      const coords = geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : [geometry.coordinates];

      coords.forEach((polygonCoords: number[][][]) => {
        const path = polygonCoords.map((ring: number[][]) =>
          ring.map((coord: number[]) => new AMap.LngLat(coord[0], coord[1]))
        );

        const polygon = new AMap.Polygon({
          path,
          fillColor: color,
          fillOpacity: opts.fillOpacity,
          strokeColor: opts.strokeColor || color,
          strokeWeight: opts.strokeWeight,
          strokeOpacity: opts.strokeOpacity,
          strokeStyle: opts.strokeStyle,
          zIndex: opts.zIndex,
        });
        map.add(polygon);
        districtPolygonsRef.current.push(polygon);
      });
    };

    const addLabel = (text: string, pos: number[], style: Record<string, string>, zIndex: number) => {
      const label = new AMap.Text({
        text,
        position: new AMap.LngLat(pos[0], pos[1]),
        style,
        zIndex,
      });
      map.add(label);
      districtPolygonsRef.current.push(label);
    };

    const loadDistricts = (isBackground: boolean) => {
      return fetch('/shenzhen-districts.geojson')
        .then((res) => res.json())
        .then((geojson: any) => {
          if (cancelled) return;
          const features = geojson.features || [];
          features.forEach((feature: any) => {
            const name = feature.properties?.name;
            const color = districtColors[name] || '#999';

            addPolygon(feature, color, {
              fillOpacity: isBackground ? 0.04 : 0.15,
              strokeWeight: isBackground ? 1.5 : 2.5,
              strokeOpacity: isBackground ? 0.4 : 0.85,
              strokeStyle: 'dashed',
              zIndex: 1,
            });

            const labelPos = feature.properties?.centroid || feature.properties?.center;
            if (labelPos) {
              addLabel(name, labelPos, {
                'font-size': isBackground ? '12px' : '13px',
                'font-weight': 'bold',
                'color': color,
                'background': `rgba(255,255,255,${isBackground ? 0.7 : 0.9})`,
                'border': `1.5px solid ${color}`,
                'border-radius': '4px',
                'padding': '2px 8px',
                'text-align': 'center',
              }, isBackground ? 4 : 2);
            }
          });
        });
    };

    const loadStreets = () => {
      return fetch('/shenzhen-streets.geojson')
        .then((res) => res.json())
        .then((geojson: any) => {
          if (cancelled) return;
          const features = geojson.features || [];

          // 按区分组，给同区内的街道交替深浅填充
          const districtStreetIndex: Record<string, number> = {};

          features.forEach((feature: any) => {
            const name = feature.properties?.name;
            const district = feature.properties?.district;
            const color = districtColors[district] || '#999';

            // 同区内街道交替编号
            if (!(district in districtStreetIndex)) {
              districtStreetIndex[district] = 0;
            }
            const idx = districtStreetIndex[district]++;
            const isEven = idx % 2 === 0;

            // 交替深浅：偶数街道填充深一些，奇数浅一些
            addPolygon(feature, color, {
              fillOpacity: isEven ? 0.14 : 0.06,
              strokeWeight: 1.5,
              strokeOpacity: 0.6,
              strokeColor: '#555',
              strokeStyle: 'solid',
              zIndex: 2,
            });

            const labelPos = feature.properties?.centroid || feature.properties?.center;
            if (labelPos) {
              const shortName = name.replace('街道', '');
              addLabel(shortName, labelPos, {
                'font-size': '11px',
                'font-weight': '600',
                'color': color,
                'background': 'rgba(255,255,255,0.9)',
                'border': `1.5px solid ${color}`,
                'border-radius': '3px',
                'padding': '1px 6px',
                'text-align': 'center',
              }, 3);
            }
          });
        });
    };

    if (districtLevel === 'district') {
      loadDistricts(false).catch((err) => console.error('加载区级数据失败:', err));
    } else if (districtLevel === 'street') {
      Promise.all([loadDistricts(true), loadStreets()])
        .catch((err) => console.error('加载行政区划数据失败:', err));
    }

    return () => {
      cancelled = true;
      districtPolygonsRef.current.forEach((p) => map.remove(p));
      districtPolygonsRef.current = [];
    };
  }, [map, loaded, districtLevel]);

  // ======= 公园图层 =======
  useEffect(() => {
    if (!map || !loaded) return;

    // 清除旧图层
    parkLayerRef.current.forEach((o) => map.remove(o));
    parkLayerRef.current = [];

    // 检查是否有任意公园子分类激活
    const activeParkTypes = new Set<string>();
    if (activeCategories.has('park:自然公园')) activeParkTypes.add('自然公园');
    if (activeCategories.has('park:城市公园')) activeParkTypes.add('城市公园');
    if (activeCategories.has('park:社区公园')) activeParkTypes.add('社区公园');

    if (activeParkTypes.size === 0) return;

    const AMap = (window as any).AMap;
    let cancelled = false;

    fetch('/shenzhen-parks.geojson')
      .then((res) => res.json())
      .then((geojson: any) => {
        if (cancelled) return;

        const features = geojson.features || [];
        features.forEach((feature: any) => {
          const props = feature.properties;
          const geom = feature.geometry;
          const parkType = props.category || '社区公园';

          // 根据二级分类过滤
          if (!activeParkTypes.has(parkType)) return;

          const color = PARK_COLORS[parkType] || '#1565C0';
          const accuracy = props.accuracy || 'unknown';

          if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
            // 有边界的公园 — 用多边形
            const coords = geom.type === 'MultiPolygon'
              ? geom.coordinates
              : [geom.coordinates];

            coords.forEach((polygonCoords: number[][][]) => {
              const path = polygonCoords.map((ring: number[][]) =>
                ring.map((coord: number[]) => new AMap.LngLat(coord[0], coord[1]))
              );
              const polygon = new AMap.Polygon({
                path,
                fillColor: color,
                fillOpacity: 0.25,
                strokeColor: color,
                strokeWeight: 1.5,
                strokeOpacity: 0.7,
                zIndex: 10,
                cursor: 'pointer',
              });
              polygon.on('click', () => {
                const center = polygon.getBounds().getCenter();
                showInfoWindow(AMap, center, props.name, `
                  <div style="font-size:12px;color:#666">
                    ${parkType} · ${props.district || ''}
                    ${props.area_ha ? `<br>面积: ${props.area_ha}公顷` : ''}
                    ${props.address ? `<br>${props.address}` : ''}
                  </div>
                `);
              });
              map.add(polygon);
              parkLayerRef.current.push(polygon);
            });
          } else if (geom.type === 'Point') {
            // 只有点坐标的公园 — 用圆点
            const [lon, lat] = geom.coordinates;
            const opacity = accuracy === 'high' || accuracy === 'medium' ? 0.8 : 0.5;
            const radius = parkType === '自然公园' ? 6 : parkType === '城市公园' ? 5 : 3;

            const circle = new AMap.CircleMarker({
              center: new AMap.LngLat(lon, lat),
              radius,
              fillColor: color,
              fillOpacity: opacity,
              strokeColor: '#fff',
              strokeWeight: 1,
              strokeOpacity: 0.8,
              zIndex: 10,
              cursor: 'pointer',
            });
            circle.on('click', () => {
              showInfoWindow(AMap, new AMap.LngLat(lon, lat), props.name, `
                <div style="font-size:12px;color:#666">
                  ${parkType} · ${props.district || ''}
                  ${props.area_ha ? `<br>面积: ${props.area_ha}公顷` : ''}
                  ${props.address ? `<br>${props.address}` : ''}
                </div>
              `);
            });
            map.add(circle);
            parkLayerRef.current.push(circle);
          }
        });
      })
      .catch((err) => console.error('加载公园数据失败:', err));

    return () => {
      cancelled = true;
      parkLayerRef.current.forEach((o) => map.remove(o));
      parkLayerRef.current = [];
    };
  }, [map, loaded, activeCategories]);

  // ======= 山峰图层 =======
  useEffect(() => {
    if (!map || !loaded) return;

    // 清除旧图层
    peakLayerRef.current.forEach((o) => map.remove(o));
    peakLayerRef.current = [];

    if (!activeCategories.has('peak')) return;

    const AMap = (window as any).AMap;
    let cancelled = false;

    fetch('/shenzhen-peaks.geojson')
      .then((res) => res.json())
      .then((geojson: any) => {
        if (cancelled) return;

        const features = geojson.features || [];
        features.forEach((feature: any) => {
          const props = feature.properties;
          const [lon, lat] = feature.geometry.coordinates;
          const ele = props.elevation;
          const color = getPeakColor(ele);
          const radius = ele >= 800 ? 8 : ele >= 600 ? 6 : ele >= 400 ? 5 : 4;

          // 山峰圆点
          const circle = new AMap.CircleMarker({
            center: new AMap.LngLat(lon, lat),
            radius,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2,
            strokeOpacity: 1,
            zIndex: 20,
            cursor: 'pointer',
          });
          circle.on('click', () => {
            showInfoWindow(AMap, new AMap.LngLat(lon, lat), props.name, `
              <div style="font-size:14px;color:${color};font-weight:700">${ele}m</div>
              <div style="font-size:12px;color:#666">
                排名: #${props.rank}
                ${props.name_en ? `<br>${props.name_en}` : ''}
              </div>
            `);
          });
          map.add(circle);
          peakLayerRef.current.push(circle);

          // 前10名显示名字标注
          if (props.rank <= 10) {
            const label = new AMap.Text({
              text: `${props.name} ${ele}m`,
              position: new AMap.LngLat(lon, lat),
              offset: new AMap.Pixel(10, -8),
              style: {
                'font-size': '11px',
                'font-weight': '700',
                'color': color,
                'background': 'rgba(255,255,255,0.9)',
                'border': `1px solid ${color}`,
                'border-radius': '3px',
                'padding': '1px 5px',
              },
              zIndex: 21,
            });
            map.add(label);
            peakLayerRef.current.push(label);
          }
        });
      })
      .catch((err) => console.error('加载山峰数据失败:', err));

    return () => {
      cancelled = true;
      peakLayerRef.current.forEach((o) => map.remove(o));
      peakLayerRef.current = [];
    };
  }, [map, loaded, activeCategories]);

  // ======= 远足径图层 =======
  // 远足径颜色配置
  const TRAIL_COLORS: Record<string, string> = {
    kunpeng: '#D32F2F',     // 红 — 鲲鹏径（主线）
    fenghuang: '#FF6F00',   // 橙 — 凤凰径
    cuiwei: '#2E7D32',      // 绿 — 翠微径
    yangtaishan: '#1565C0', // 蓝 — 阳台山环线
    maluanshan: '#7B1FA2',  // 紫 — 马峦山环线
    sanshuixian: '#00838F', // 青 — 三水线
  };

  useEffect(() => {
    if (!map || !loaded) return;

    // 清除旧图层
    trailLayerRef.current.forEach((o) => map.remove(o));
    trailLayerRef.current = [];

    // 检查哪些远足径被激活
    const activeTrails = new Set<string>();
    if (activeCategories.has('trail:kunpeng')) activeTrails.add('kunpeng');
    if (activeCategories.has('trail:fenghuang')) activeTrails.add('fenghuang');
    if (activeCategories.has('trail:cuiwei')) activeTrails.add('cuiwei');
    if (activeCategories.has('trail:yangtaishan')) activeTrails.add('yangtaishan');
    if (activeCategories.has('trail:maluanshan')) activeTrails.add('maluanshan');
    if (activeCategories.has('trail:sanshuixian')) activeTrails.add('sanshuixian');

    if (activeTrails.size === 0) return;

    const AMap = (window as any).AMap;
    let cancelled = false;

    fetch('/shenzhen-trails.geojson')
      .then((res) => res.json())
      .then((geojson: any) => {
        if (cancelled) return;

        const features = geojson.features || [];
        features.forEach((feature: any) => {
          const props = feature.properties;
          const trailId = props.trail_id;

          if (!activeTrails.has(trailId)) return;

          const color = TRAIL_COLORS[trailId] || '#666';
          const geom = feature.geometry;

          if (geom.type === 'LineString') {
            const path = geom.coordinates.map(
              (c: number[]) => new AMap.LngLat(c[0], c[1])
            );
            const polyline = new AMap.Polyline({
              path,
              strokeColor: color,
              strokeWeight: props.is_full ? 4 : 3,
              strokeOpacity: props.is_full ? 0.9 : 0.7,
              strokeStyle: props.is_full ? 'solid' : 'solid',
              lineJoin: 'round',
              lineCap: 'round',
              zIndex: 15,
              cursor: 'pointer',
            });
            polyline.on('click', () => {
              const mid = path[Math.floor(path.length / 2)];
              showInfoWindow(AMap, mid, props.name, `
                <div style="font-size:12px;color:#666">
                  ${props.trail_name} · ${props.segment_name || '全程'}
                  <br>长度: ${props.length || '—'}km
                  ${props.duration ? `<br>耗时: ${props.duration}` : ''}
                  ${props.difficulty ? `<br>难度: ${props.difficulty}` : ''}
                </div>
              `);
            });
            map.add(polyline);
            trailLayerRef.current.push(polyline);

            // 全径的起终点标注
            if (props.is_full && path.length > 0) {
              const startLabel = new AMap.Text({
                text: `🚩 ${props.start || '起点'}`,
                position: path[0],
                style: {
                  'font-size': '10px',
                  'font-weight': '600',
                  'color': color,
                  'background': 'rgba(255,255,255,0.9)',
                  'border': `1px solid ${color}`,
                  'border-radius': '3px',
                  'padding': '1px 5px',
                },
                zIndex: 16,
              });
              map.add(startLabel);
              trailLayerRef.current.push(startLabel);
            }
          }
        });
      })
      .catch((err) => console.error('加载远足径数据失败:', err));

    return () => {
      cancelled = true;
      trailLayerRef.current.forEach((o) => map.remove(o));
      trailLayerRef.current = [];
    };
  }, [map, loaded, activeCategories]);

  // 信息窗口辅助函数
  const showInfoWindow = useCallback((AMap: any, position: any, title: string, content: string) => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
    const iw = new AMap.InfoWindow({
      content: `
        <div style="padding:6px 2px;min-width:140px">
          <div style="font-size:14px;font-weight:700;margin-bottom:4px">${title}</div>
          ${content}
        </div>
      `,
      offset: new AMap.Pixel(0, -10),
    });
    iw.open(map, position);
    infoWindowRef.current = iw;
  }, [map]);

  // 加载足迹数据
  const loadFootprints = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      // 如果有选中的分类，传给后端过滤（暂时先加载全部，前端根据 activeCategories 过滤显示）
      const res = await api.getFootprints(params);
      setFootprints(res.data);
    } catch (e) {
      console.error('加载足迹失败:', e);
    }
  }, []);

  useEffect(() => {
    loadFootprints();
  }, [loadFootprints]);

  // 在地图上渲染标注
  useEffect(() => {
    if (!map || !loaded) return;

    // 清除旧标注
    markersRef.current.forEach((m) => map.remove(m));
    polylinesRef.current.forEach((p) => map.remove(p));
    polygonsRef.current.forEach((p) => map.remove(p));
    markersRef.current = [];
    polylinesRef.current = [];
    polygonsRef.current = [];

    const AMap = (window as any).AMap;

    footprints.forEach((fp) => {
      const geo = typeof fp.geometry === 'string' ? JSON.parse(fp.geometry) : fp.geometry;

      if (fp.type === 'marker' && geo.type === 'Point') {
        const marker = new AMap.Marker({
          position: geo.coordinates,
          title: fp.name,
          label: {
            content: fp.name,
            direction: 'top',
            offset: new AMap.Pixel(0, -5),
          },
          extData: fp,
        });
        marker.on('click', () => setSelectedFootprint(fp));
        map.add(marker);
        markersRef.current.push(marker);
      } else if (fp.type === 'polyline' && geo.type === 'LineString') {
        const polyline = new AMap.Polyline({
          path: geo.coordinates.map((c: number[]) => new AMap.LngLat(c[0], c[1])),
          strokeColor: fp.color || '#1677ff',
          strokeWeight: 4,
          strokeOpacity: 0.8,
          extData: fp,
        });
        polyline.on('click', () => setSelectedFootprint(fp));
        map.add(polyline);
        polylinesRef.current.push(polyline);
      } else if (fp.type === 'polygon' && geo.type === 'Polygon') {
        const polygon = new AMap.Polygon({
          path: geo.coordinates[0].map((c: number[]) => new AMap.LngLat(c[0], c[1])),
          fillColor: fp.color || '#1677ff',
          fillOpacity: 0.2,
          strokeColor: fp.color || '#1677ff',
          strokeWeight: 2,
          extData: fp,
        });
        polygon.on('click', () => setSelectedFootprint(fp));
        map.add(polygon);
        polygonsRef.current.push(polygon);
      }
    });
  }, [map, loaded, footprints]);

  // 地图点击事件
  useEffect(() => {
    if (!map || !loaded) return;

    const handleClick = () => {
      // 预留：后续可加交互
    };

    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, loaded]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('确定删除？')) return;
    await api.deleteFootprint(id);
    setSelectedFootprint(null);
    loadFootprints();
  }, [loadFootprints]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <div id="map-container" style={{ width: '100%', height: '100%' }} />

      <TopBar
        activeCategories={activeCategories}
        onToggleCategory={handleToggleCategory}
      />

      <DistrictControl
        districtLevel={districtLevel}
        onDistrictLevelChange={setDistrictLevel}
      />

      {selectedFootprint && (
        <DetailPanel
          footprint={selectedFootprint}
          onClose={() => setSelectedFootprint(null)}
          onDelete={handleDelete}
          onUpdate={loadFootprints}
        />
      )}
    </div>
  );
}

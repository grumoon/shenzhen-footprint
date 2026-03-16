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
  // 弹窗引用
  const infoWindowRef = useRef<any>(null);

  const handleToggleCategory = useCallback((key: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
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

    if (!activeCategories.has('park')) return;

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
          const parkType = props.park_type || '社区公园';
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
                    ${props.area ? `<br>面积: ${props.area}公顷` : ''}
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
                  ${props.area ? `<br>面积: ${props.area}公顷` : ''}
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

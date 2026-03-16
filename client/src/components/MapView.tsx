import { useEffect, useRef, useState, useCallback } from 'react';
import { useAMap } from '../hooks/useAMap';
import { api } from '../utils/api';
import type { Footprint } from '../types';
import { Sidebar } from './Sidebar';
import { DetailPanel } from './DetailPanel';

export function MapView() {
  const { map, loaded } = useAMap('map-container');
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [selectedFootprint, setSelectedFootprint] = useState<Footprint | null>(null);
  const [filter, setFilter] = useState<{ category?: string; status?: string }>({});
  const [showDistricts, setShowDistricts] = useState(true);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const districtPolygonsRef = useRef<any[]>([]);

  // 深圳各区配色（加深版）
  const districtColors: Record<string, string> = {
    '福田区': '#D32F2F',
    '罗湖区': '#00897B',
    '南山区': '#1976D2',
    '盐田区': '#2E7D32',
    '宝安区': '#F9A825',
    '龙岗区': '#8E24AA',
    '龙华区': '#00796B',
    '坪山区': '#E65100',
    '光明区': '#388E3C',
    '大鹏新区': '#1565C0',
  };

  // 加载深圳各区行政区划边界（本地 GeoJSON 数据）
  useEffect(() => {
    if (!map || !loaded) return;

    // 先清除旧的
    districtPolygonsRef.current.forEach((p) => map.remove(p));
    districtPolygonsRef.current = [];

    if (!showDistricts) return;

    const AMap = (window as any).AMap;
    let cancelled = false;

    fetch('/shenzhen-districts.geojson')
      .then((res) => res.json())
      .then((geojson: any) => {
        if (cancelled) return;

        const features = geojson.features || [];
        features.forEach((feature: any) => {
          const name = feature.properties?.name;
          const color = districtColors[name] || '#999';
          const geometry = feature.geometry;
          if (!geometry) return;

          // GeoJSON MultiPolygon → 高德 Polygon
          const coords = geometry.type === 'MultiPolygon'
            ? geometry.coordinates
            : [geometry.coordinates]; // Polygon → 包一层

          coords.forEach((polygonCoords: number[][][]) => {
            // polygonCoords[0] 是外环，后续是洞
            const path = polygonCoords.map((ring: number[][]) =>
              ring.map((coord: number[]) => new AMap.LngLat(coord[0], coord[1]))
            );

            const polygon = new AMap.Polygon({
              path,
              fillColor: color,
              fillOpacity: 0.15,
              strokeColor: color,
              strokeWeight: 2.5,
              strokeOpacity: 0.85,
              strokeStyle: 'dashed',
              zIndex: 1,
            });
            map.add(polygon);
            districtPolygonsRef.current.push(polygon);
          });

          // 区名标注 — 用 centroid（质心）或 center
          const labelPos = feature.properties?.centroid || feature.properties?.center;
          if (labelPos) {
            const text = new AMap.Text({
              text: name,
              position: new AMap.LngLat(labelPos[0], labelPos[1]),
              style: {
                'font-size': '13px',
                'font-weight': 'bold',
                'color': color,
                'background': 'rgba(255,255,255,0.9)',
                'border': `1.5px solid ${color}`,
                'border-radius': '4px',
                'padding': '2px 8px',
                'text-align': 'center',
              },
              zIndex: 2,
            });
            map.add(text);
            districtPolygonsRef.current.push(text);
          }
        });
      })
      .catch((err) => {
        console.error('加载行政区划数据失败:', err);
      });

    return () => {
      cancelled = true;
      districtPolygonsRef.current.forEach((p) => map.remove(p));
      districtPolygonsRef.current = [];
    };
  }, [map, loaded, showDistricts]);

  // 加载足迹数据
  const loadFootprints = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filter.category) params.category = filter.category;
      if (filter.status) params.status = filter.status;
      const res = await api.getFootprints(params);
      setFootprints(res.data);
    } catch (e) {
      console.error('加载足迹失败:', e);
    }
  }, [filter]);

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
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar
        filter={filter}
        onFilterChange={setFilter}
        footprintCount={footprints.length}
        showDistricts={showDistricts}
        onToggleDistricts={() => setShowDistricts(!showDistricts)}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <div id="map-container" style={{ width: '100%', height: '100%' }} />

        {selectedFootprint && (
          <DetailPanel
            footprint={selectedFootprint}
            onClose={() => setSelectedFootprint(null)}
            onDelete={handleDelete}
            onUpdate={loadFootprints}
          />
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAMap } from '../hooks/useAMap';
import { api } from '../utils/api';
import type { Footprint } from '../types';
import { Sidebar } from './Sidebar';
import { DetailPanel } from './DetailPanel';
import { AddPanel } from './AddPanel';

export function MapView() {
  const { map, loaded } = useAMap('map-container');
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [selectedFootprint, setSelectedFootprint] = useState<Footprint | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addingLngLat, setAddingLngLat] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<{ category?: string; status?: string }>({});
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);

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

  // 地图点击事件 — 添加模式
  useEffect(() => {
    if (!map || !loaded) return;

    const handleClick = (e: any) => {
      if (isAdding) {
        setAddingLngLat([e.lnglat.getLng(), e.lnglat.getLat()]);
      }
    };

    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, loaded, isAdding]);

  const handleAddComplete = useCallback(() => {
    setIsAdding(false);
    setAddingLngLat(null);
    loadFootprints();
  }, [loadFootprints]);

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
        isAdding={isAdding}
        onToggleAdd={() => {
          setIsAdding(!isAdding);
          setAddingLngLat(null);
          setSelectedFootprint(null);
        }}
        footprintCount={footprints.length}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <div id="map-container" style={{ width: '100%', height: '100%' }} />

        {isAdding && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1677ff',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: 20,
              fontSize: 14,
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            点击地图选择位置
          </div>
        )}

        {selectedFootprint && !isAdding && (
          <DetailPanel
            footprint={selectedFootprint}
            onClose={() => setSelectedFootprint(null)}
            onDelete={handleDelete}
            onUpdate={loadFootprints}
          />
        )}

        {addingLngLat && isAdding && (
          <AddPanel
            lngLat={addingLngLat}
            onComplete={handleAddComplete}
            onCancel={() => {
              setAddingLngLat(null);
              setIsAdding(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

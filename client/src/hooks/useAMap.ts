import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

// 高德地图安全密钥配置
(window as any)._AMapSecurityConfig = {
  securityJsCode: import.meta.env.VITE_AMAP_SECRET,
};

export function useAMap(containerId: string) {
  const mapRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: '2.0',
      plugins: [
        'AMap.Scale',
        'AMap.ToolBar',
        'AMap.Geolocation',
        'AMap.MarkerCluster',
        'AMap.MouseTool',
        'AMap.DistrictSearch',
      ],
    })
      .then((AMap) => {
        const map = new AMap.Map(containerId, {
          viewMode: '2D',
          zoom: 11,
          center: [114.05, 22.55], // 深圳中心
          mapStyle: 'amap://styles/normal',
        });

        // 添加控件
        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar({ position: 'RB' }));

        mapRef.current = map;
        setLoaded(true);
      })
      .catch((e) => {
        console.error('高德地图加载失败:', e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, [containerId]);

  return { map: mapRef.current, loaded };
}

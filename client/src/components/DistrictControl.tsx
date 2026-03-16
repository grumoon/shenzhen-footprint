import { useIsMobile } from '../hooks/useIsMobile';

export type DistrictLevel = 'off' | 'district' | 'street';

const DISTRICT_LEVELS: { value: DistrictLevel; label: string }[] = [
  { value: 'off', label: '关' },
  { value: 'district', label: '区级' },
  { value: 'street', label: '街道' },
];

interface DistrictControlProps {
  districtLevel: DistrictLevel;
  onDistrictLevelChange: (level: DistrictLevel) => void;
}

export function DistrictControl({ districtLevel, onDistrictLevelChange }: DistrictControlProps) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: isMobile ? 16 : 20,
        // 移动端放左下角，桌面端放右下角（避开高德缩放按钮）
        ...(isMobile
          ? { left: 10 }
          : { right: 120 }),
        zIndex: 200,
        background: '#fff',
        borderRadius: isMobile ? 8 : 10,
        padding: isMobile ? '6px 8px' : '8px 10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 4 : 6,
      }}
    >
      <span
        style={{
          fontSize: isMobile ? 11 : 12,
          color: '#666',
          fontWeight: 600,
          marginRight: 2,
        }}
      >
        区划
      </span>
      {DISTRICT_LEVELS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onDistrictLevelChange(opt.value)}
          style={{
            padding: isMobile ? '3px 8px' : '4px 10px',
            borderRadius: 6,
            border: `1px solid ${districtLevel === opt.value ? '#1677ff' : '#ddd'}`,
            background: districtLevel === opt.value ? '#1677ff' : '#fff',
            color: districtLevel === opt.value ? '#fff' : '#333',
            fontSize: isMobile ? 10 : 11,
            fontWeight: districtLevel === opt.value ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

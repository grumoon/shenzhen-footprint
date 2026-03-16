import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

// 一级分类定义 — 多选叠加
export interface PrimaryCategory {
  key: string;
  label: string;
  color: string;
}

const PRIMARY_CATEGORIES: PrimaryCategory[] = [
  { key: 'around-shenzhen', label: '环深圳', color: '#D32F2F' },
  { key: 'hiking-trail', label: '远足径', color: '#2E7D32' },
  { key: 'park', label: '公园', color: '#1565C0' },
  { key: 'peak', label: '山峰', color: '#8B4513' },
];

interface TopBarProps {
  activeCategories: Set<string>;
  onToggleCategory: (key: string) => void;
}

export function TopBar({ activeCategories, onToggleCategory }: TopBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          background: '#fff',
          border: '1px solid #e8e8e8',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: isMobile ? '5px 14px' : '6px 20px',
          cursor: 'pointer',
          fontSize: isMobile ? 12 : 13,
          color: '#666',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'auto',
        }}
      >
        <span style={{ fontWeight: 600, color: '#222' }}>深圳足迹</span>
        <span style={{ fontSize: 11 }}>▼</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200 }}>
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          padding: isMobile ? '8px 12px' : '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 8 : 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: isMobile ? 15 : 18,
            color: '#222',
            whiteSpace: 'nowrap',
          }}
        >
          深圳足迹
        </div>

        <div style={{ width: 1, height: isMobile ? 20 : 24, background: '#e0e0e0' }} />

        <div style={{ display: 'flex', gap: isMobile ? 6 : 8, flex: 1 }}>
          {PRIMARY_CATEGORIES.map((cat) => {
            const active = activeCategories.has(cat.key);
            return (
              <button
                key={cat.key}
                onClick={() => onToggleCategory(cat.key)}
                style={{
                  padding: isMobile ? '4px 12px' : '6px 18px',
                  borderRadius: 20,
                  border: `2px solid ${active ? cat.color : '#ddd'}`,
                  background: active ? cat.color : '#fff',
                  color: active ? '#fff' : '#555',
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: isMobile ? 16 : 18,
            color: '#999',
            padding: isMobile ? '4px 4px' : '4px 8px',
            lineHeight: 1,
            flexShrink: 0,
          }}
          title="收起"
        >
          ▲
        </button>
      </div>
    </div>
  );
}

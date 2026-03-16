import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { Category } from '../types';

interface SidebarProps {
  filter: { category?: string; status?: string };
  onFilterChange: (f: { category?: string; status?: string }) => void;
  footprintCount: number;
  showDistricts: boolean;
  onToggleDistricts: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'visited', label: '去过' },
  { value: 'want', label: '想去' },
  { value: 'collected', label: '收藏' },
];

export function Sidebar({ filter, onFilterChange, footprintCount, showDistricts, onToggleDistricts }: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.data)).catch(console.error);
  }, []);

  return (
    <div
      style={{
        width: 260,
        background: '#fff',
        borderRight: '1px solid #e8e8e8',
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        gap: 16,
        overflowY: 'auto',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>深圳足迹</h1>
        <p style={{ margin: '4px 0 0', color: '#999', fontSize: 13 }}>
          共 {footprintCount} 个标注
        </p>
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>分类筛选</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <FilterChip
            label="全部"
            active={!filter.category}
            color="#666"
            onClick={() => onFilterChange({ ...filter, category: undefined })}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={cat.name}
              active={filter.category === cat.name}
              color={cat.color}
              onClick={() =>
                onFilterChange({
                  ...filter,
                  category: filter.category === cat.name ? undefined : cat.name,
                })
              }
            />
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>状态筛选</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {STATUS_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={filter.status === opt.value || (!filter.status && opt.value === '')}
              color="#666"
              onClick={() =>
                onFilterChange({ ...filter, status: opt.value || undefined })
              }
            />
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>行政区划</span>
        <button
          onClick={onToggleDistricts}
          style={{
            position: 'relative',
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            background: showDistricts ? '#1677ff' : '#ddd',
            cursor: 'pointer',
            transition: 'background 0.2s',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: showDistricts ? 22 : 2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s',
            }}
          />
        </button>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 14,
        border: `1px solid ${active ? color : '#ddd'}`,
        background: active ? color : '#fff',
        color: active ? '#fff' : '#333',
        fontSize: 12,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );
}

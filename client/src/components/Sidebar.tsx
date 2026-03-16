import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { Category } from '../types';

interface SidebarProps {
  filter: { category?: string; status?: string };
  onFilterChange: (f: { category?: string; status?: string }) => void;
  isAdding: boolean;
  onToggleAdd: () => void;
  footprintCount: number;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'visited', label: '去过' },
  { value: 'want', label: '想去' },
  { value: 'collected', label: '收藏' },
];

export function Sidebar({ filter, onFilterChange, isAdding, onToggleAdd, footprintCount }: SidebarProps) {
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

      <button
        onClick={onToggleAdd}
        style={{
          padding: '10px 0',
          background: isAdding ? '#ff4d4f' : '#1677ff',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {isAdding ? '✕ 取消添加' : '＋ 添加标注'}
      </button>

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

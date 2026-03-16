import type { Footprint } from '../types';

interface DetailPanelProps {
  footprint: Footprint;
  onClose: () => void;
  onDelete: (id: number) => void;
  onUpdate: () => void;
}

const STATUS_MAP: Record<string, string> = {
  visited: '✅ 去过',
  want: '📌 想去',
  collected: '⭐ 收藏',
};

export function DetailPanel({ footprint, onClose, onDelete }: DetailPanelProps) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        top: 16,
        width: 320,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{footprint.name}</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span
              style={{
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 10,
                background: footprint.color + '20',
                color: footprint.color,
              }}
            >
              {footprint.category}
            </span>
            <span style={{ fontSize: 12, color: '#999' }}>
              {STATUS_MAP[footprint.status] || footprint.status}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#999',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* 内容 */}
      <div style={{ padding: 16 }}>
        {footprint.description && (
          <p style={{ margin: '0 0 12px', fontSize: 14, color: '#333', lineHeight: 1.6 }}>
            {footprint.description}
          </p>
        )}

        {footprint.rating && (
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            评分：{'⭐'.repeat(footprint.rating)}
          </div>
        )}

        {footprint.visit_date && (
          <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
            到访日期：{footprint.visit_date}
          </div>
        )}

        {footprint.tags && footprint.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {(typeof footprint.tags === 'string' ? JSON.parse(footprint.tags) : footprint.tags).map(
              (tag: string, i: number) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: '#f5f5f5',
                    color: '#666',
                  }}
                >
                  #{tag}
                </span>
              )
            )}
          </div>
        )}

        <div style={{ fontSize: 12, color: '#bbb' }}>
          类型：{footprint.type === 'marker' ? '标记点' : footprint.type === 'polyline' ? '路线' : '区域'}
        </div>
      </div>

      {/* 操作 */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <button
          onClick={() => onDelete(footprint.id)}
          style={{
            padding: '6px 16px',
            border: '1px solid #ff4d4f',
            background: '#fff',
            color: '#ff4d4f',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}

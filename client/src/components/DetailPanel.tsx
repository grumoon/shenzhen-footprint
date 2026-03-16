import type { Footprint } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

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
  const isMobile = useIsMobile();

  // 移动端：底部全宽弹出；桌面端：右上角浮动卡片
  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        zIndex: 1000,
        overflow: 'hidden',
        maxHeight: '60vh',
        overflowY: 'auto',
      }
    : {
        position: 'absolute',
        right: 16,
        top: 16,
        width: 320,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        zIndex: 1000,
        overflow: 'hidden',
      };

  return (
    <div style={containerStyle}>
      {/* 移动端拉手指示条 */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: '#ddd',
            }}
          />
        </div>
      )}

      {/* 头部 */}
      <div
        style={{
          padding: isMobile ? '12px 16px 10px' : '16px 16px 12px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 700 }}>
            {footprint.name}
          </h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span
              style={{
                fontSize: isMobile ? 11 : 12,
                padding: '2px 8px',
                borderRadius: 10,
                background: footprint.color + '20',
                color: footprint.color,
              }}
            >
              {footprint.category}
            </span>
            <span style={{ fontSize: isMobile ? 11 : 12, color: '#999' }}>
              {STATUS_MAP[footprint.status] || footprint.status}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: isMobile ? 22 : 20,
            cursor: 'pointer',
            color: '#999',
            padding: isMobile ? '0 4px' : 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* 内容 */}
      <div style={{ padding: isMobile ? '12px 16px' : 16 }}>
        {footprint.description && (
          <p
            style={{
              margin: '0 0 12px',
              fontSize: isMobile ? 13 : 14,
              color: '#333',
              lineHeight: 1.6,
            }}
          >
            {footprint.description}
          </p>
        )}

        {footprint.rating && (
          <div style={{ fontSize: isMobile ? 13 : 14, marginBottom: 8 }}>
            评分：{'⭐'.repeat(footprint.rating)}
          </div>
        )}

        {footprint.visit_date && (
          <div style={{ fontSize: isMobile ? 12 : 13, color: '#999', marginBottom: 8 }}>
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
                    fontSize: isMobile ? 10 : 11,
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

        <div style={{ fontSize: isMobile ? 11 : 12, color: '#bbb' }}>
          类型：{footprint.type === 'marker' ? '标记点' : footprint.type === 'polyline' ? '路线' : '区域'}
        </div>
      </div>

      {/* 操作 */}
      <div
        style={{
          padding: isMobile ? '10px 16px 16px' : '12px 16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          // 移动端留安全区域
          ...(isMobile ? { paddingBottom: 'max(16px, env(safe-area-inset-bottom))' } : {}),
        }}
      >
        <button
          onClick={() => onDelete(footprint.id)}
          style={{
            padding: isMobile ? '8px 20px' : '6px 16px',
            border: '1px solid #ff4d4f',
            background: '#fff',
            color: '#ff4d4f',
            borderRadius: 6,
            fontSize: isMobile ? 14 : 13,
            cursor: 'pointer',
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}

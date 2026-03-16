import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { Category } from '../types';

interface AddPanelProps {
  lngLat: [number, number];
  onComplete: () => void;
  onCancel: () => void;
}

export function AddPanel({ lngLat, onComplete, onCancel }: AddPanelProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('其他');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'visited' | 'want' | 'collected'>('collected');
  const [rating, setRating] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('请输入名称');
      return;
    }
    setSubmitting(true);
    try {
      const cat = categories.find((c) => c.name === category);
      await api.createFootprint({
        name: name.trim(),
        type: 'marker',
        category,
        geometry: { type: 'Point', coordinates: lngLat },
        description: description.trim() || undefined,
        status,
        rating: rating || undefined,
        color: cat?.color || '#1677ff',
      });
      onComplete();
    } catch (e) {
      alert('添加失败');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

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
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>添加标注</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>
          经度 {lngLat[0].toFixed(6)}，纬度 {lngLat[1].toFixed(6)}
        </p>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>名称 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入地点名称"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div>
          <label style={labelStyle}>分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>状态</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'visited' as const, label: '去过' },
              { value: 'want' as const, label: '想去' },
              { value: 'collected' as const, label: '收藏' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  border: `1px solid ${status === opt.value ? '#1677ff' : '#ddd'}`,
                  background: status === opt.value ? '#e6f4ff' : '#fff',
                  color: status === opt.value ? '#1677ff' : '#333',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>评分</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(rating === n ? 0 : n)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  opacity: n <= rating ? 1 : 0.3,
                }}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>备注</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="写点什么..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <button onClick={onCancel} style={cancelBtnStyle}>
          取消
        </button>
        <button onClick={handleSubmit} disabled={submitting} style={submitBtnStyle}>
          {submitting ? '添加中...' : '确认添加'}
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: '#666',
  marginBottom: 4,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  border: '1px solid #ddd',
  background: '#fff',
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  border: 'none',
  background: '#1677ff',
  color: '#fff',
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
  fontWeight: 600,
};

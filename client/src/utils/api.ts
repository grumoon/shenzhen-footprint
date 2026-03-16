import type { Footprint, Category, ApiResponse } from '../types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  // 足迹
  getFootprints: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<ApiResponse<Footprint[]>>(`/footprints${qs}`);
  },

  getFootprint: (id: number) =>
    request<ApiResponse<Footprint>>(`/footprints/${id}`),

  createFootprint: (data: Partial<Footprint>) =>
    request<ApiResponse<{ id: number }>>('/footprints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFootprint: (id: number, data: Partial<Footprint>) =>
    request<ApiResponse<null>>(`/footprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFootprint: (id: number) =>
    request<ApiResponse<null>>(`/footprints/${id}`, {
      method: 'DELETE',
    }),

  // 分类
  getCategories: () =>
    request<ApiResponse<Category[]>>('/categories'),
};

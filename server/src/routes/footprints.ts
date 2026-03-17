import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';

// 数据文件路径
const DATA_DIR = path.join(__dirname, '../../data');
const FOOTPRINTS_FILE = path.join(DATA_DIR, 'footprints.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

interface Footprint {
  id: number;
  name: string;
  type: 'marker' | 'polyline' | 'polygon';
  category: string;
  geometry: object;
  description?: string;
  photos?: string[];
  status: 'visited' | 'want' | 'collected';
  visit_date?: string;
  rating?: number;
  tags?: string[];
  color: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FootprintBody {
  name: string;
  type: 'marker' | 'polyline' | 'polygon';
  category: string;
  geometry: object;
  description?: string;
  photos?: string[];
  status?: 'visited' | 'want' | 'collected';
  visit_date?: string;
  rating?: number;
  tags?: string[];
  color?: string;
  icon?: string;
  sort_order?: number;
}

interface FootprintQuery {
  type?: string;
  category?: string;
  status?: string;
  keyword?: string;
}

// ---- JSON 文件读写工具 ----

function readFootprints(): Footprint[] {
  try {
    const raw = fs.readFileSync(FOOTPRINTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeFootprints(data: Footprint[]): void {
  fs.writeFileSync(FOOTPRINTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readCategories(): any[] {
  try {
    const raw = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function nextId(items: { id: number }[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}

// ---- 路由 ----

export async function footprintRoutes(app: FastifyInstance) {
  // 获取所有足迹
  app.get<{ Querystring: FootprintQuery }>('/api/footprints', async (request) => {
    const { type, category, status, keyword } = request.query;
    let rows = readFootprints();

    if (type) rows = rows.filter((r) => r.type === type);
    if (category) rows = rows.filter((r) => r.category === category);
    if (status) rows = rows.filter((r) => r.status === status);
    if (keyword) {
      const kw = keyword.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(kw) ||
          (r.description && r.description.toLowerCase().includes(kw))
      );
    }

    // 排序：sort_order ASC, updated_at DESC
    rows.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return { code: 0, data: rows };
  });

  // 获取单个足迹
  app.get<{ Params: { id: string } }>('/api/footprints/:id', async (request, reply) => {
    const id = Number(request.params.id);
    const rows = readFootprints();
    const item = rows.find((r) => r.id === id);
    if (!item) {
      return reply.code(404).send({ code: 1, message: '未找到' });
    }
    return { code: 0, data: item };
  });

  // 创建足迹
  app.post<{ Body: FootprintBody }>('/api/footprints', async (request) => {
    const body = request.body;
    const rows = readFootprints();
    const now = new Date().toISOString();

    const newItem: Footprint = {
      id: nextId(rows),
      name: body.name,
      type: body.type || 'marker',
      category: body.category || '其他',
      geometry: body.geometry,
      description: body.description || undefined,
      photos: body.photos || undefined,
      status: body.status || 'collected',
      visit_date: body.visit_date || undefined,
      rating: body.rating || undefined,
      tags: body.tags || undefined,
      color: body.color || '#1677ff',
      icon: body.icon || undefined,
      sort_order: body.sort_order || 0,
      created_at: now,
      updated_at: now,
    };

    rows.push(newItem);
    writeFootprints(rows);
    return { code: 0, data: { id: newItem.id }, message: '创建成功' };
  });

  // 更新足迹
  app.put<{ Params: { id: string }; Body: Partial<FootprintBody> }>(
    '/api/footprints/:id',
    async (request, reply) => {
      const id = Number(request.params.id);
      const body = request.body;
      const rows = readFootprints();
      const idx = rows.findIndex((r) => r.id === id);

      if (idx === -1) {
        return reply.code(404).send({ code: 1, message: '未找到' });
      }

      // 动态更新字段
      const updatableFields = [
        'name', 'type', 'category', 'geometry', 'description',
        'photos', 'status', 'visit_date', 'rating', 'tags',
        'color', 'icon', 'sort_order',
      ] as const;

      let changed = false;
      for (const field of updatableFields) {
        if ((body as any)[field] !== undefined) {
          (rows[idx] as any)[field] = (body as any)[field];
          changed = true;
        }
      }

      if (!changed) {
        return reply.code(400).send({ code: 1, message: '没有要更新的字段' });
      }

      rows[idx].updated_at = new Date().toISOString();
      writeFootprints(rows);
      return { code: 0, message: '更新成功' };
    }
  );

  // 删除足迹
  app.delete<{ Params: { id: string } }>('/api/footprints/:id', async (request) => {
    const id = Number(request.params.id);
    let rows = readFootprints();
    rows = rows.filter((r) => r.id !== id);
    writeFootprints(rows);
    return { code: 0, message: '删除成功' };
  });

  // 获取所有分类
  app.get('/api/categories', async () => {
    const rows = readCategories();
    rows.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    return { code: 0, data: rows };
  });
}

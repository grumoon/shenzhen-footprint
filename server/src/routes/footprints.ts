import { FastifyInstance } from 'fastify';
import pool from '../db/index';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

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

export async function footprintRoutes(app: FastifyInstance) {
  // 获取所有足迹
  app.get<{ Querystring: FootprintQuery }>('/api/footprints', async (request, reply) => {
    const { type, category, status, keyword } = request.query;
    
    let sql = 'SELECT * FROM footprints WHERE 1=1';
    const params: any[] = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY sort_order ASC, updated_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return { code: 0, data: rows };
  });

  // 获取单个足迹
  app.get<{ Params: { id: string } }>('/api/footprints/:id', async (request, reply) => {
    const { id } = request.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM footprints WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return reply.code(404).send({ code: 1, message: '未找到' });
    }
    return { code: 0, data: rows[0] };
  });

  // 创建足迹
  app.post<{ Body: FootprintBody }>('/api/footprints', async (request, reply) => {
    const body = request.body;
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO footprints (name, type, category, geometry, description, photos, status, visit_date, rating, tags, color, icon, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.name,
        body.type || 'marker',
        body.category || '其他',
        JSON.stringify(body.geometry),
        body.description || null,
        body.photos ? JSON.stringify(body.photos) : null,
        body.status || 'collected',
        body.visit_date || null,
        body.rating || null,
        body.tags ? JSON.stringify(body.tags) : null,
        body.color || '#1677ff',
        body.icon || null,
        body.sort_order || 0,
      ]
    );
    return { code: 0, data: { id: result.insertId }, message: '创建成功' };
  });

  // 更新足迹
  app.put<{ Params: { id: string }; Body: Partial<FootprintBody> }>(
    '/api/footprints/:id',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      const fields: string[] = [];
      const values: any[] = [];

      if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
      if (body.type !== undefined) { fields.push('type = ?'); values.push(body.type); }
      if (body.category !== undefined) { fields.push('category = ?'); values.push(body.category); }
      if (body.geometry !== undefined) { fields.push('geometry = ?'); values.push(JSON.stringify(body.geometry)); }
      if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
      if (body.photos !== undefined) { fields.push('photos = ?'); values.push(JSON.stringify(body.photos)); }
      if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
      if (body.visit_date !== undefined) { fields.push('visit_date = ?'); values.push(body.visit_date); }
      if (body.rating !== undefined) { fields.push('rating = ?'); values.push(body.rating); }
      if (body.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(body.tags)); }
      if (body.color !== undefined) { fields.push('color = ?'); values.push(body.color); }
      if (body.icon !== undefined) { fields.push('icon = ?'); values.push(body.icon); }
      if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order); }

      if (fields.length === 0) {
        return reply.code(400).send({ code: 1, message: '没有要更新的字段' });
      }

      values.push(id);
      await pool.query(`UPDATE footprints SET ${fields.join(', ')} WHERE id = ?`, values);
      return { code: 0, message: '更新成功' };
    }
  );

  // 删除足迹
  app.delete<{ Params: { id: string } }>('/api/footprints/:id', async (request, reply) => {
    const { id } = request.params;
    await pool.query('DELETE FROM footprints WHERE id = ?', [id]);
    return { code: 0, message: '删除成功' };
  });

  // 获取所有分类
  app.get('/api/categories', async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    );
    return { code: 0, data: rows };
  });
}

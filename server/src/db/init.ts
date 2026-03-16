import pool from './index';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS footprints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT '名称',
  type ENUM('marker', 'polyline', 'polygon') NOT NULL DEFAULT 'marker' COMMENT '类型：点/线/区域',
  category VARCHAR(100) NOT NULL DEFAULT '其他' COMMENT '分类（公园、山、海滩、路线、美食等）',
  geometry JSON NOT NULL COMMENT 'GeoJSON格式坐标数据',
  description TEXT COMMENT '个人备注',
  photos JSON COMMENT '照片URL数组',
  status ENUM('visited', 'want', 'collected') DEFAULT 'collected' COMMENT '去过/想去/收藏',
  visit_date DATE COMMENT '去过的日期',
  rating TINYINT COMMENT '个人评分1-5',
  tags JSON COMMENT '标签数组',
  color VARCHAR(20) DEFAULT '#1677ff' COMMENT '地图标注颜色',
  icon VARCHAR(50) COMMENT '图标类型',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='深圳足迹标注';
`;

const CREATE_CATEGORIES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '分类名',
  icon VARCHAR(50) COMMENT '图标',
  color VARCHAR(20) DEFAULT '#1677ff' COMMENT '默认颜色',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类管理';
`;

const INSERT_DEFAULT_CATEGORIES_SQL = `
INSERT IGNORE INTO categories (name, icon, color, sort_order) VALUES
  ('公园', 'park', '#52c41a', 1),
  ('山/徒步', 'mountain', '#8b5cf6', 2),
  ('海滩', 'beach', '#06b6d4', 3),
  ('景点', 'attraction', '#f59e0b', 4),
  ('美食', 'food', '#ef4444', 5),
  ('商圈', 'shopping', '#ec4899', 6),
  ('博物馆', 'museum', '#6366f1', 7),
  ('路线', 'route', '#14b8a6', 8),
  ('其他', 'other', '#6b7280', 99);
`;

export async function initDatabase() {
  try {
    const conn = await pool.getConnection();
    
    await conn.query(CREATE_TABLE_SQL);
    console.log('✅ footprints 表已就绪');
    
    await conn.query(CREATE_CATEGORIES_TABLE_SQL);
    console.log('✅ categories 表已就绪');
    
    await conn.query(INSERT_DEFAULT_CATEGORIES_SQL);
    console.log('✅ 默认分类已插入');
    
    conn.release();
    console.log('🎉 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

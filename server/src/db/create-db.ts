import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createDatabase() {
  // 先不指定数据库，连上去创建
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 13090,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    charset: 'utf8mb4',
  });

  await conn.query(
    'CREATE DATABASE IF NOT EXISTS `shenzhen_footprint` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
  );
  console.log('✅ 数据库 shenzhen_footprint 创建成功');

  const [rows] = await conn.query('SHOW DATABASES');
  console.log('当前所有数据库:', rows);

  await conn.end();
}

createDatabase().catch((err) => {
  console.error('❌ 创建数据库失败:', err.message);
  process.exit(1);
});

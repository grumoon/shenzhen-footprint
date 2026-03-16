import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/init';
import { footprintRoutes } from './routes/footprints';

dotenv.config();

const app = Fastify({ logger: true });

async function start() {
  // CORS - 开发时允许前端跨域
  await app.register(cors, {
    origin: true,
  });

  // 注册路由
  await app.register(footprintRoutes);

  // 健康检查
  app.get('/api/health', async () => {
    return { status: 'ok', name: '深圳足迹 API', timestamp: new Date().toISOString() };
  });

  // 初始化数据库
  await initDatabase();

  // 启动服务
  const port = Number(process.env.PORT) || 3001;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen({ port, host });
  console.log(`🚀 深圳足迹 API 运行在 http://${host}:${port}`);
}

start().catch((err) => {
  console.error('启动失败:', err);
  process.exit(1);
});

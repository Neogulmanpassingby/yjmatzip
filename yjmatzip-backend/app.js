const express = require('express');
const { Pool } = require('pg');
const app = express();

// PostgreSQL 연결 설정 (아까 만든 서비스 주소 활용)
const pool = new Pool({
  host: 'postgres-svc.yjmatzip.svc.cluster.local',
  user: 'admin',
  password: 'password123',
  database: 'yjmatzip',
  port: 5432,
});

app.use((req, res, next) => {
  const allowedOrigins = ['https://matzip.yjmatzip.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// 메인 페이지 접속 및 DAU 기록 API
app.get('/api/visit', async (req, res) => {
  const { uuid } = req.query; // 프론트의 LocalStorage에서 보낸 UUID
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    // 오늘 날짜로 해당 UUID의 접속 기록이 있는지 확인 후 Insert
    await pool.query(
      `INSERT INTO access_log (uuid, ip, accessed_at)
       VALUES ($1, $2, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date)
       ON CONFLICT (uuid, accessed_at) DO NOTHING`,
      [uuid, ip]
    );

    // 현재 DAU 조회
    const result = await pool.query(
      `SELECT COUNT(DISTINCT uuid) as dau FROM access_log WHERE accessed_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date`
    );
    
    res.json({ success: true, dau: result.rows[0].dau });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB Error' });
  }
});

app.listen(8080, () => console.log('Backend running on port 8080'));

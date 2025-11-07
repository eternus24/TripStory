// routers/festivalRouter.js
const express = require('express');
const fs = require('fs').promises;
const fssync = require('fs');
const path = require('path');

module.exports = (app) => {
  const router = express.Router();

  const categoryFileMap = {
    '불꽃축제': 'fireworks.json',
    '꽃축제': 'flower.json',
    '빛 축제': 'light.json',
    '먹거리 축제': 'food.json',
    '음악·공연 축제': 'music.json',
    '체험형 축제': 'experience.json',
  };

  // ✅ 후보 디렉토리들을 준비(개발 환경별 폴백)
  const CANDIDATE_DIRS = [
    path.resolve(__dirname, '..', 'tripstory', 'src', 'assets', 'api'),
    path.resolve(process.cwd(), 'tripstory', 'src', 'assets', 'api'),
    path.resolve(__dirname, '..', '..', 'tripstory', 'src', 'assets', 'api'),
  ];

  // 존재하는 첫 번째 폴더 선택
  const assetsApiDir =
    CANDIDATE_DIRS.find((p) => fssync.existsSync(p)) || CANDIDATE_DIRS[0];

  console.log('📂 assets-api base:', assetsApiDir);

  router.get('/category/:category', async (req, res) => {
    try {
      const category = decodeURIComponent(req.params.category);
      const fileName = categoryFileMap[category];
      if (!fileName) {
        return res.status(400).json({ success: false, message: '유효하지 않은 카테고리입니다.' });
      }

      const filePath = path.join(assetsApiDir, fileName);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // 프론트는 success/count/data 형태를 기대함 :contentReference[oaicite:0]{index=0}
      return res.json({ success: true, count: data.length, data });
    } catch (err) {
      console.error('카테고리별 축제 조회 오류:', err);
      return res.status(500).json({ success: false, message: '축제 데이터를 불러오는데 실패했습니다.', error: err.message });
    }
  });

  app.use('/api/festivals', router);
};

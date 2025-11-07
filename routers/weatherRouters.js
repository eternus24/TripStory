// routers/weatherRouters.js
const express = require('express');
const axios = require('axios');

module.exports = (app) => {
  const router = express.Router();

  // 타일 프록시 (OpenWeather 타일 키 숨김용)
  router.get('/tiles/:layer/:z/:x/:y.png', async (req, res) => {
  const { layer, z, x, y } = req.params;
  const tileUrl =
      `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${process.env.OPENWEATHER_API_KEY}`;
    try {
      const r = await axios.get(tileUrl, { responseType: 'arraybuffer' });
      res.set('Content-Type', 'image/png');
      res.send(r.data);
    } catch (e) {
      const status = e.response?.status || 500;
      const msg = e.response?.data?.toString?.() || e.message;
      console.error('[OWM TILE ERROR]', status, tileUrl, msg);
      res.status(status).send(msg);
    }
  });

  app.use('/api/weather', router);
};

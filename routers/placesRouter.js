// routers/placesRouter.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

const KAKAO_REST_KEY = process.env.KAKAO_REST_KEY;

// GET /api/places/near?lat=37.5&lon=127.0&category=FD6
// category 기본 FD6(음식), CE7(카페), AT4(관광명소)
router.get("/near", async (req, res) => {
  const { lat, lon, category } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ message: "lat/lon 쿼리 파라미터가 필요합니다." });
  }

  const categoryCode = category || "FD6";

  try {
    const url =
      `https://dapi.kakao.com/v2/local/search/category.json` +
      `?category_group_code=${categoryCode}` +
      `&y=${lat}` +
      `&x=${lon}` +
      `&radius=2000` +
      `&size=10` +
      `&sort=distance`;

    const kakaoRes = await axios.get(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_KEY}`,
      },
    });

    const docs = kakaoRes.data?.documents || [];

    const places = docs.map((p) => ({
      id: p.id,
      name: p.place_name,
      category: p.category_group_name || p.category_name,
      address: p.road_address_name || p.address_name,
      distanceM: p.distance ? Number(p.distance) : null,
      link: p.place_url,
      x: p.x,
      y: p.y,
    }));

    res.json({ places });
  } catch (err) {
    console.error("[placesRouter near] 서버 에러", err.response?.data || err.message);
    res.status(500).json({
      message: "카카오 API 호출 실패",
      detail: err.response?.data || err.message,
    });
  }
});

module.exports = router;
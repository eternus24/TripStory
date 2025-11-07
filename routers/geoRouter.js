// routers/geoRouter.js
const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

/**
 * GET /geo/kakao/:id?name=장소이름&region=강릉
 *
 * 1) placeId만으로 카카오 keyword 검색 시도
 * 2) 실패하면 name(+region)으로 다시 검색
 *    → 제일 첫 결과 lat/lng 반환
 *
 * 응답:
 *   200 { lat, lng, source, name, address }
 *   404 { error: "not_found", lat: null, lng: null }
 */

router.get("/kakao/:id", async (req, res) => {
  const placeId = req.params.id;
  const placeName = req.query.name || "";
  const regionName = req.query.region || "";
  const kakaoKey = process.env.KAKAO_REST_KEY;

  if (!kakaoKey) {
    console.error("[/geo/kakao] KAKAO_REST_KEY not set");
    return res.status(500).json({ error: "server_missing_kakao_key" });
  }

  // 내부 유틸: 카카오 키워드 검색
  async function kakaoKeywordSearch(query) {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
      query
    )}`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${kakaoKey}`,
      },
    });

    if (!resp.ok) {
      console.warn("[/geo/kakao] kakao bad status", resp.status);
      return null;
    }

    const data = await resp.json();
    if (!data.documents || data.documents.length === 0) {
      return null;
    }

    const best = data.documents[0];
    const lng = parseFloat(best.x);
    const lat = parseFloat(best.y);

    if (isNaN(lat) || isNaN(lng)) {
      console.warn("[/geo/kakao] invalid coords in doc", best);
      return null;
    }

    return {
      lat,
      lng,
      source: "kakao",
      name: best.place_name || null,
      address: best.road_address_name || best.address_name || null,
    };
  }

  try {
    let result = null;

    // 1차 시도: placeId 숫자 그대로
    if (placeId) {
      result = await kakaoKeywordSearch(placeId);
    }

    // 2차 시도: "지역 + 장소명" 조합으로 다시 검색
    if (!result && placeName) {
      const combo = regionName
        ? `${regionName} ${placeName}`
        : placeName;
      result = await kakaoKeywordSearch(combo);
    }

    if (!result) {
      console.warn("[/geo/kakao] no hit for", {
        placeId,
        placeName,
        regionName,
      });
      return res
        .status(404)
        .json({ error: "not_found", lat: null, lng: null });
    }

    return res.json(result);
  } catch (err) {
    console.error("[/geo/kakao] exception", err);
    return res
      .status(500)
      .json({ error: "exception", details: err.message });
  }
});

module.exports = router;
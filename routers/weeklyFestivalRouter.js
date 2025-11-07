// routers/weeklyFestivalRouter.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");

const router = express.Router();

/* -------------------------------------------------
   ✅ JSON 파일 경로 — 확정 버전 (절대경로로 고정)
   (server.js 기준 ../tripstory/src/assets/api/festivalData.json)
---------------------------------------------------*/
const JSON_PATH = path.resolve(
  __dirname,
  "../tripstory/src/assets/api/festivalData.json"
);

// 디버그 용 — 실제 읽는 경로 확인
router.get("/weekly-festival/_where", (_req, res) => {
  res.json({
    using: JSON_PATH,
    exists: fs.existsSync(JSON_PATH),
  });
});

/* -------------------------------------------------
   날짜 처리 (월·일만 보고 올해/내년 중 가까운 날짜)
---------------------------------------------------*/
function nextOccurrenceMonthDay(dateLike) {
  if (!dateLike) return null;
  const cleaned = String(dateLike).replace(/[^\d]/g, "");
  let mm, dd;

  if (cleaned.length >= 8) { // YYYYMMDD → 뒤 4자리 MMDD
    mm = cleaned.slice(-4, -2);
    dd = cleaned.slice(-2);
  } else if (cleaned.length === 4) { // MMDD
    mm = cleaned.slice(0, 2);
    dd = cleaned.slice(2);
  } else if (cleaned.length === 3) { // MDD → 0MDD
    mm = "0" + cleaned[0];
    dd = cleaned.slice(1);
  } else return null;

  const today = dayjs().startOf("day");
  let d = dayjs(`${today.year()}-${mm}-${dd}`, "YYYY-MM-DD", true);
  if (!d.isValid()) return null;
  if (d.isBefore(today)) d = d.add(1, "year");
  return d;
}

/* -------------------------------------------------
   축제 데이터 정규화
---------------------------------------------------*/
function normalize(rec, idx) {
  const get = (...keys) => {
    for (const k of keys) {
      if (rec[k] !== undefined && rec[k] !== null && String(rec[k]).trim() !== "") return rec[k];
    }
    return "";
  };

  return {
    id: get("id", "_id", "관리번호") || `festival_${idx}`,
    name: get("축제명", "행사명", "name", "title"),
    place: get("개최장소", "장소", "place", "location"),
    area: get("지역명", "지역", "시도명", "시군구명", "area"),
    startDate: get("축제시작일자", "개최시작일자", "startDate", "시작일"),
    endDate: get("축제종료일자", "개최종료일자", "endDate", "종료일"),
    desc: get("개요", "내용", "설명", "description"),
    imageUrl: get("이미지URL", "imageUrl", "image_url", "thumbnail", "mainImg"),
  };
}

/* -------------------------------------------------
   메인 API
   GET /api/weekly-festival?windowDays=7&limit=8
---------------------------------------------------*/
router.get("/weekly-festival", (req, res) => {
  try {
    const windowDays = parseInt(req.query.windowDays || "7", 10);
    const limit = parseInt(req.query.limit || "12", 10);

    const raw = fs.readFileSync(JSON_PATH, "utf8");
    const data = JSON.parse(raw);
    const listRaw = Array.isArray(data.records) ? data.records : data;

    const today = dayjs().startOf("day");
    const until = today.add(windowDays, "day").endOf("day");

    const list = listRaw
      .map(normalize)
      .map((f, i) => {
        const next = nextOccurrenceMonthDay(f.startDate || f.endDate);
        return next ? { ...f, _next: next } : null;
      })
      .filter(Boolean)
      .filter((f) => f._next.isSame(today) || (f._next.isAfter(today) && f._next.isBefore(until)))
      .sort((a, b) => a._next - b._next)
      .slice(0, limit)
      .map((f) => ({
        ...f,
        nextMonthDay: f._next.format("MM-DD"),
        nextDateISO: f._next.format("YYYY-MM-DD"),
      }));

    res.json({ total: list.length, list });
  } catch (err) {
    console.error("[weekly-festival] error:", err);
    res.status(500).json({ error: "failed to read festivalData.json", path: JSON_PATH });
  }
});

module.exports = router;
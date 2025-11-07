// routers/weatherCourseRouter.js
// Weather-based course recommender (KMA + KTO)
// - 7s axios timeout, 전체 8s 예산
// - 시군구 목록(areaCode1) 조회 → 병렬 스윕 → 좌표 폴백
// - 프록시/SSL/HTTP 폴백 대응
// - 🔍 KTO 원응답(resultCode/resultMsg) 노출 + /_probe/kto 패스스루 추가

const express = require("express");
const axios = require("axios");
const dayjs = require("dayjs");
const http = require("http");
const https = require("https");

const router = express.Router();

/* ========= ENV ========= */
const KMA_KEY = process.env.KMA_SERVICE_KEY || "";
const KTO_KEY = process.env.KTO_SERVICE_KEY || "";

/* ========= Endpoints ========= */
const KMA_URL =
  process.env.WEATHER_API_URL ||
  "https://apis.data.go.kr/1360000/TourStnInfoService1/getTourStnVilageFcst1";
const KTO_AREA_LIST_URL =
  process.env.KTO_API_URL ||
  "https://apis.data.go.kr/B551011/KorService2/areaBasedList2";
const KTO_LOC_LIST_URL =
  process.env.KTO_LOC_API_URL ||
  "https://apis.data.go.kr/B551011/KorService2/locationBasedList2";
const KTO_AREACODE_URL =
  process.env.KTO_AREACODE_API_URL ||
  "https://apis.data.go.kr/B551011/KorService2/areaCode2";

/* ========= Proxy / Agents ========= */
let HttpProxyAgent, HttpsProxyAgent;
try {
  HttpProxyAgent =
    require("http-proxy-agent").HttpProxyAgent || require("http-proxy-agent");
  HttpsProxyAgent =
    require("https-proxy-agent").HttpsProxyAgent || require("https-proxy-agent");
} catch {}
const HTTPS_PROXY =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy ||
  "";

const baseHttpAgent = new http.Agent({
  keepAlive: true,
  insecureHTTPParser: true,
});
const baseHttpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: process.env.NODE_ENV === "production" ? true : false,
});
const httpAgent =
  HTTPS_PROXY && HttpProxyAgent ? new HttpProxyAgent(HTTPS_PROXY) : baseHttpAgent;
const httpsAgent =
  HTTPS_PROXY && HttpsProxyAgent
    ? new HttpsProxyAgent(HTTPS_PROXY)
    : baseHttpsAgent;

/* ========= axios 공통 옵션 ========= */
const axiosOpts = {
  timeout: 7000,
  headers: { Accept: "*/*" },
  httpAgent,
  httpsAgent,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  transitional: { silentJSONParsing: false },
  validateStatus: () => true,
};

/* ========= Region maps ========= */
const REGION_ALIAS = {
  seoul: "seoul",
  incheon: "incheon",
  busan: "busan",
  daegu: "daegu",
  gwangju: "gwangju",
  daejeon: "daejeon",
  ulsan: "ulsan",
  gangwon: "gangwon",
  jeonbuk: "jeonbuk",
  jeonnam: "jeonnam",
  gyeongbuk: "gyeongbuk",
  gyeongnam: "gyeongnam",
  jeju: "jeju",
};
const COURSE_ID_MAP = {
  seoul: 1,
  incheon: 2,
  busan: 3,
  daegu: 4,
  gwangju: 5,
  daejeon: 6,
  ulsan: 7,
  gangwon: 8,
  jeonbuk: 9,
  jeonnam: 10,
  gyeongbuk: 11,
  gyeongnam: 12,
  jeju: 13,
};
const REGION_TO_AREA = {
  seoul: 1,
  incheon: 2,
  daejeon: 3,
  daegu: 4,
  gwangju: 5,
  busan: 6,
  ulsan: 7,
  gangwon: 32,
  jeonbuk: 37,
  jeonnam: 38,
  gyeongbuk: 35,
  gyeongnam: 36,
  jeju: 39,
};
const REGION_CENTER = {
  seoul: { mapX: 126.978, mapY: 37.566 },
  incheon: { mapX: 126.705, mapY: 37.456 },
  busan: { mapX: 129.075, mapY: 35.179 },
  daegu: { mapX: 128.601, mapY: 35.871 },
  gwangju: { mapX: 126.853, mapY: 35.159 },
  daejeon: { mapX: 127.384, mapY: 36.351 },
  ulsan: { mapX: 129.312, mapY: 35.539 },
  gangwon: { mapX: 127.729, mapY: 37.885 },
  jeonbuk: { mapX: 127.149, mapY: 35.824 },
  jeonnam: { mapX: 126.463, mapY: 34.816 },
  gyeongbuk: { mapX: 128.729, mapY: 36.576 },
  gyeongnam: { mapX: 128.691, mapY: 35.237 },
  jeju: { mapX: 126.531, mapY: 33.499 },
};

/* ========= Utils ========= */
const s = (v) => (typeof v === "string" ? v.trim() : v);
const decodeKeyMaybe = (k) =>
  k.includes("%")
    ? (() => {
        try {
          return decodeURIComponent(k);
        } catch {
          return k;
        }
      })()
    : k;

const toSkyCategory = (wf) => {
  const t = (wf || "").toLowerCase();
  if (/(비|rain)/.test(t)) return "rain";
  if (/(눈|snow)/.test(t)) return "snow";
  if (/(맑|sunny|clear)/.test(t)) return "sunny";
  if (/(구름|흐림|cloud)/.test(t)) return "cloudy";
  return "etc";
};

async function safeGet(url, config = {}) {
  let lastErr;
  for (let i = 0; i < 3; i++) { // 최대 3번
    try {
      return await axios.get(url, config);
    } catch (err) {
      lastErr = err;
      if (err.code === "ECONNABORTED") {
        // 기상청 응답 지연 → 200~500ms 쉬고 재시도
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
        continue;
      }
      break; // 다른 에러는 재시도 안함
    }
  }
  throw lastErr;
}

function scoreCourseByWeather(course, sky) {
  const title = (course.title || course.courseName || "").toLowerCase();
  const overview = (
    course.overview ||
    course.overviewShort ||
    course.comment ||
    ""
  ).toLowerCase();
  const txt = `${title} ${overview}`;
  const outdoor =
    /(해변|바다|호수|섬|산책|공원|정원|전망대|둘레길|산|트레킹|드라이브|해안|모래)/;
  const indoor =
    /(박물관|미술관|전시|갤러리|과학관|체험관|카페|쇼핑|아울렛|아쿠아리움|영화관|시장|온천)/;
  let base = 0;
  if (/(코스|루트|일주|트레킹|워크|로드)/.test(txt)) base += 3;
  switch (sky) {
    case "sunny":
      if (outdoor.test(txt)) base += 8;
      if (indoor.test(txt)) base += 2;
      break;
    case "cloudy":
      if (outdoor.test(txt)) base += 5;
      if (indoor.test(txt)) base += 5;
      break;
    case "rain":
    case "snow":
      if (indoor.test(txt)) base += 8;
      if (outdoor.test(txt)) base += 1;
      break;
    default:
      base += 3;
  }
  if (course.firstimage || course.imageUrl) base += 1;
  return base;
}

const normalizeKtoItem = (it, region) => ({
  id: String(
    it.contentid || `${region}-${Math.random().toString(36).slice(2, 8)}`
  ),
  areaName: region.toUpperCase(),
  courseName: s(it.title) || "여행 코스",
  comment: s(it.overview) || s(it.overview_short) || s(it.addr1) || "",
  imageUrl: s(it.firstimage) || s(it.firstimage2) || "",
  title: s(it.title),
  overview: s(it.overview) || s(it.overview_short) || "",
});

/* ========= KMA (robust) ========= */
async function fetchKmaSummary(region) {
  const COURSE_ID = COURSE_ID_MAP[region] || 1;
  const baseHttps = KMA_URL;
  const baseHttp = KMA_URL.replace("https://", "http://");
  const keyCandidates = [decodeKeyMaybe(KMA_KEY), KMA_KEY];
  const hoursToTry = [0, -1];

  for (const h of hoursToTry) {
    const CURRENT_DATE = dayjs().add(h, "hour").format("YYYYMMDDHH");
    const paramsBase = {
      dataType: "JSON",
      pageNo: 1,
      numOfRows: 10,
      CURRENT_DATE,
      HOUR: 24,
      COURSE_ID,
    };

    for (const srvKey of keyCandidates) {
      try {
        const res = await safeGet(baseHttps, {
          params: { ...paramsBase, serviceKey: srvKey },
          ...axiosOpts,
        });
        const item0 = res.data?.response?.body?.items?.item?.[0];
        if (res.status === 200 && item0)
          return {
            ok: true,
            status: res.status,
            data: res.data,
            url: `${baseHttps}?…`,
            label: "KMA",
          };
      } catch (e) {
        console.error("[UPSTREAM KMA:HTTPS]", e.code || e.message);
      }
    }
    if (process.env.NODE_ENV !== "production") {
      for (const srvKey of keyCandidates) {
        try {
          const res = await axios.get(baseHttp, {
            params: { ...paramsBase, serviceKey: srvKey },
            ...axiosOpts,
          });
          const item0 = res.data?.response?.body?.items?.item?.[0];
          if (res.status === 200 && item0)
            return {
              ok: true,
              status: res.status,
              data: res.data,
              url: `${baseHttp}?…`,
              label: "KMA",
            };
        } catch (e) {
          console.error("[UPSTREAM KMA:HTTP]", e.code || e.message);
        }
      }
    }
  }
  return {
    ok: false,
    status: 0,
    data: null,
    url: `${KMA_URL}?…`,
    label: "KMA",
    error: "network/ssl blocked or empty item",
  };
}

/* ========= KTO helpers ========= */
function pickKtoMeta(res) {
  const head = res?.data?.response?.header;
  const body = res?.data?.response?.body;
  return {
    status: res?.status,
    resultCode: head?.resultCode,
    resultMsg: head?.resultMsg,
    totalCount: body?.totalCount,
    pageNo: body?.pageNo,
    numOfRows: body?.numOfRows,
  };
}

async function tryAxios(url, params) {
  // https → (dev) http 폴백
  try {
    const r = await axios.get(url, { params, ...axiosOpts });
    return { via: "https", res: r };
  } catch (e) {
    console.error("[KTO https err]", e.code || e.message);
  }
  if (process.env.NODE_ENV !== "production") {
    const httpBase = url.replace("https://", "http://");
    try {
      const r = await axios.get(httpBase, { params, ...axiosOpts });
      return { via: "http", res: r };
    } catch (e) {
      console.error("[KTO http err]", e.code || e.message);
    }
  }
  return { via: "none", res: null };
}

/** 시군구 목록 */
async function callKtoSigunguList(areaCode) {
  const params = {
    _type: "json",
    MobileOS: "ETC",
    MobileApp: "TripStory",
    areaCode,
    numOfRows: 100,
  };
  for (const key of [decodeKeyMaybe(KTO_KEY), KTO_KEY]) {
    const r = await tryAxios(KTO_AREACODE_URL, { ...params, serviceKey: key });
    if (r.res) {
      const meta = pickKtoMeta(r.res);
      let items = r.res.data?.response?.body?.items?.item;
      if (!Array.isArray(items) && items) items = [items];
      const codes = (items || []).map((it) => Number(it.code)).filter(Boolean);
      return { ok: true, via: r.via, meta, codes, count: codes.length };
    }
  }
  return { ok: false, via: "none", meta: null, codes: [], count: 0 };
}

/** areaBasedList1 */
async function callKtoArea({
  areaCode,
  contentTypeId,
  sigunguCode,
  rows = 30,
  page = 1,
}) {
  const params = {
    _type: "json",
    MobileOS: "ETC",
    MobileApp: "TripStory",
    areaCode,
    numOfRows: rows,
    pageNo: page,
    arrange: "A",
    ...(contentTypeId ? { contentTypeId } : {}),
    ...(sigunguCode ? { sigunguCode } : {}),
  };
  for (const key of [decodeKeyMaybe(KTO_KEY), KTO_KEY]) {
    const r = await tryAxios(KTO_AREA_LIST_URL, { ...params, serviceKey: key });
    if (r.res) {
      const meta = pickKtoMeta(r.res);
      return {
        ok: true,
        via: r.via,
        meta,
        data: r.res.data,
        where: sigunguCode ? "area+sigungu" : "area",
      };
    }
  }
  return { ok: false, via: "none", meta: null, data: null, where: "area" };
}

/** locationBasedList1 */
async function callKtoLoc({
  mapX,
  mapY,
  contentTypeId,
  radius = 15000,
  rows = 15,
  page = 1,
}) {
  const params = {
    _type: "json",
    MobileOS: "ETC",
    MobileApp: "TripStory",
    contentTypeId,
    mapX,
    mapY,
    radius,
    numOfRows: rows,
    pageNo: page,
    arrange: "A",
  };
  for (const key of [decodeKeyMaybe(KTO_KEY), KTO_KEY]) {
    const r = await tryAxios(KTO_LOC_LIST_URL, { ...params, serviceKey: key });
    if (r.res) {
      const meta = pickKtoMeta(r.res);
      return { ok: true, via: r.via, meta, data: r.res.data, where: "loc" };
    }
  }
  return { ok: false, via: "none", meta: null, data: null, where: "loc" };
}

/* ========= KTO 스마트 수집 (8초 예산) ========= */
async function fetchKtoSmart({ region, areaCode, contentTypeId }) {
  const START = Date.now();
  const BUDGET_MS = 8000;
  const withinBudget = () => Date.now() - START < BUDGET_MS;
  const ROWS_FAST = 15;
  const trace = [];

  // 0) 시군구 목록
  const sgs = await callKtoSigunguList(areaCode);
  const SIGUNGU_CODES = sgs.ok && sgs.count ? sgs.codes : [];
  if (sgs.meta) trace.push({ step: "areacode", meta: sgs.meta });

  // 1) area 단독
  if (!withinBudget())
    return { items: [], trace: [...trace, { step: "area", reason: "budget" }] };
  let r = await callKtoArea({
    areaCode,
    contentTypeId,
    rows: ROWS_FAST,
    page: 1,
  });
  trace.push({ step: r.where, via: r.via, meta: r.meta });
  let items = r.data?.response?.body?.items?.item;
  if (!Array.isArray(items) && items) items = [items];
  if (Array.isArray(items) && items.length > 0) return { items, trace };

  // 2) 시군구 병렬 (최대 12개)
  if (!withinBudget())
    return {
      items: [],
      trace: [...trace, { step: "sigungu", reason: "budget" }],
    };
  const subset = SIGUNGU_CODES.slice(0, 12);
  if (subset.length) {
    const settled = await Promise.allSettled(
      subset.map((sg) =>
        callKtoArea({
          areaCode,
          contentTypeId,
          sigunguCode: sg,
          rows: ROWS_FAST,
          page: 1,
        })
      )
    );
    for (const p of settled) {
      if (p.status === "fulfilled") {
        const rr = p.value;
        trace.push({
          step: `${rr.where}+sigungu=${
            rr.data?.response?.body?.items ? rr.where.split("+")[1] : "?"
          }`,
          via: rr.via,
          meta: rr.meta,
        });
        let it = rr.data?.response?.body?.items?.item;
        if (!Array.isArray(it) && it) it = [it];
        if (Array.isArray(it) && it.length > 0) return { items: it, trace };
      }
    }
  } else {
    trace.push({ step: "sigungu", reason: "no-list" });
  }

  // 3) 좌표 기반
  if (!withinBudget())
    return { items: [], trace: [...trace, { step: "loc", reason: "budget" }] };
  const center = REGION_CENTER[region] || REGION_CENTER["seoul"];
  r = await callKtoLoc({
    mapX: center.mapX,
    mapY: center.mapY,
    contentTypeId,
    radius: 15000,
    rows: ROWS_FAST,
    page: 1,
  });
  trace.push({ step: r.where, via: r.via, meta: r.meta });
  items = r.data?.response?.body?.items?.item;
  if (!Array.isArray(items) && items) items = [items];
  if (Array.isArray(items) && items.length > 0) return { items, trace };

  // 4) 폴백: contentTypeId 없이 재시도 (area → loc)
  if (!withinBudget())
    return {
      items: [],
      trace: [...trace, { step: "area(any)", reason: "budget" }],
    };
  r = await callKtoArea({ areaCode, rows: ROWS_FAST, page: 1 });
  trace.push({ step: "area(any)", via: r.via, meta: r.meta });
  items = r.data?.response?.body?.items?.item;
  if (!Array.isArray(items) && items) items = [items];
  if (Array.isArray(items) && items.length > 0) return { items, trace };

  if (!withinBudget())
    return {
      items: [],
      trace: [...trace, { step: "loc(any)", reason: "budget" }],
    };
  r = await callKtoLoc({
    mapX: center.mapX,
    mapY: center.mapY,
    radius: 15000,
    rows: ROWS_FAST,
    page: 1,
  });
  trace.push({ step: "loc(any)", via: r.via, meta: r.meta });
  items = r.data?.response?.body?.items?.item;
  if (!Array.isArray(items) && items) items = [items];

  return { items: Array.isArray(items) ? items : [], trace };
}

/* ========= 진단 ========= */
router.get("/_diag", async (req, res) => {
  const region =
    REGION_ALIAS[String(req.query.region || "seoul").toLowerCase()] || "seoul";
  const areaCode = REGION_TO_AREA[region] || 1;

  const kma = await fetchKmaSummary(region);
  const d25 = await fetchKtoSmart({ region, areaCode, contentTypeId: 25 });
  const d12 = await fetchKtoSmart({ region, areaCode, contentTypeId: 12 });
  const d39 = await fetchKtoSmart({ region, areaCode, contentTypeId: 39 });

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  const kmaItem0 = kma.data?.response?.body?.items?.item?.[0] || null;
  res.json({
    kma: { status: kma.status, item0: kmaItem0 },
    kto25: { count: Array.isArray(d25.items) ? d25.items.length : 0, trace: d25.trace },
    kto12: { count: Array.isArray(d12.items) ? d12.items.length : 0, trace: d12.trace },
    kto39: { count: Array.isArray(d39.items) ? d39.items.length : 0, trace: d39.trace },
  });
});

/* ========= 🔍 패스스루: KTO 그대로 호출 ========= */
router.get("/_probe/kto", async (req, res) => {
  const mode = String(req.query.mode || "area");
  const contentTypeId = parseInt(req.query.contentTypeId || "12", 10);
  const areaCode = parseInt(req.query.areaCode || "1", 10);
  const sigunguCode = req.query.sigunguCode
    ? parseInt(req.query.sigunguCode, 10)
    : undefined;
  const mapX = req.query.mapX ? Number(req.query.mapX) : undefined;
  const mapY = req.query.mapY ? Number(req.query.mapY) : undefined;

  let out = {};
  try {
    if (mode === "areacode") {
      const r = await callKtoSigunguList(areaCode);
      out = {
        ok: r.ok,
        via: r.via,
        meta: r.meta,
        count: r.count,
        codes: r.codes?.slice(0, 30),
      };
    } else if (mode === "loc") {
      const r = await callKtoLoc({
        mapX,
        mapY,
        contentTypeId,
        radius: 15000,
        rows: 15,
        page: 1,
      });
      out = {
        where: r.where,
        via: r.via,
        meta: r.meta,
        sample:
          r.data?.response?.body?.items?.item?.slice?.(0, 3) ||
          r.data?.response?.body?.items?.item ||
          null,
      };
    } else {
      const r = await callKtoArea({
        areaCode,
        contentTypeId,
        sigunguCode,
        rows: 15,
        page: 1,
      });
      out = {
        where: r.where,
        via: r.via,
        meta: r.meta,
        sample:
          r.data?.response?.body?.items?.item?.slice?.(0, 3) ||
          r.data?.response?.body?.items?.item ||
          null,
      };
    }
  } catch (e) {
    out = { error: e.message || String(e) };
  }

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  return res.json(out);
});

/* ========= 메인 ========= */
router.get("/", async (req, res) => {
  // 무한 로딩 방지
  req.setTimeout(9000);
  res.setTimeout(9000);

  const limit = Math.max(1, parseInt(req.query.limit || "4", 10));
  const regionReq = String(req.query.region || "seoul").toLowerCase();
  const region = REGION_ALIAS[regionReq] || "seoul";

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  if (!KMA_KEY) return res.status(400).json({ message: "KMA_SERVICE_KEY(Encoding) 누락" });
  if (!KTO_KEY) return res.status(400).json({ message: "KTO_SERVICE_KEY(Encoding) 누락" });

  // 1) KMA
  const kma = await fetchKmaSummary(region);
  if (!kma.ok) {
    return res.status(kma.status || 502).json({
      message: "weather-course upstream error (KMA)",
      upstream: { label: kma.label, status: kma.status, url: kma.url, data: kma.data },
    });
  }

  const it = kma.data?.response?.body?.items?.item?.[0] || {};

  // 대/소문자 & 대체키 모두 커버 (절대 null 금지)
  const pick = (o, keys) => {
    for (const k of keys) {
      const v = o?.[k];
      if (v !== null && v !== undefined && v !== "") return v;
    }
    return null;
  };

  // SKY 문자/코드 처리
  const skyRaw = pick(it, ["WF", "wf", "WF_KOR", "wfKor", "WF_EN", "wfEn", "SKY", "sky"]);
  const sky =
    typeof skyRaw === "number"
      ? skyRaw === 1
        ? "맑음"
        : skyRaw === 3
        ? "구름많음"
        : skyRaw === 4
        ? "흐림"
        : "기상"
      : skyRaw || "맑음";

  // TEMP: 여러 후보 → TMX/TMN 평균 → 안전망 20
  const tempRaw = pick(it, [
    "TA",
    "ta",
    "TAAVG",
    "taavg",
    "T1H",
    "t1h",
    "TMX",
    "tmx",
    "TMAX",
    "tmax",
    "TMN",
    "tmn",
    "TMIN",
    "tmin",
    "TEMP",
    "temp",
  ]);
  const asNum = (v) =>
    v === null || v === undefined || v === "" ? NaN : Number(v);
  let tempNum = Number.isFinite(asNum(tempRaw)) ? Number(tempRaw) : NaN;
  if (!Number.isFinite(tempNum)) {
    const tmx = asNum(pick(it, ["TMX", "tmx", "TMAX", "tmax"]));
    const tmn = asNum(pick(it, ["TMN", "tmn", "TMIN", "tmin"]));
    if (Number.isFinite(tmx) && Number.isFinite(tmn)) tempNum = (tmx + tmn) / 2;
  }
  const tempFinal = Number.isFinite(tempNum) ? Math.round(tempNum) : 20;

  const weatherSummary = {
    sky,
    temp: tempFinal,
    msg: "지금 날씨에 어울리는 코스를 골라봤어요 👇",
  };
  const skyCat = toSkyCategory(weatherSummary.sky);

  // 2) KTO 수집 (25 → 12 → 39)
  const areaCode = REGION_TO_AREA[region] || 1;
  const tryTypes = [25, 12, 39];
  let rawItems = [];
  let lastTrace = [];

  for (const ct of tryTypes) {
    const got = await fetchKtoSmart({ region, areaCode, contentTypeId: ct });
    if (got.items.length) {
      rawItems = got.items;
      lastTrace = got.trace;
      break;
    }
    lastTrace = got.trace;
  }

  if (!rawItems.length) {
    return res.status(200).json({
      weatherSummary,
      list: [],
      note: "KTO empty or error",
      upstreamHint: { trace: lastTrace },
    });
  }

  const normalized = rawItems.map((x) => normalizeKtoItem(x, region));
  const scored = normalized
    .map((c) => ({ ...c, __score: scoreCourseByWeather(c, skyCat) }))
    .sort((a, b) => b.__score - a.__score);

  // 각 아이템에도 sky/temp 주입 (프론트 배지 일관성)
  const list = scored.slice(0, limit).map(({ __score, title, overview, ...rest }) => ({
    ...rest,
    sky: weatherSummary.sky,
    temp: weatherSummary.temp,
  }));

  return res.json({ weatherSummary, list });
});

module.exports = router;
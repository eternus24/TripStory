import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DaengTrip from "../../assets/image/DaengTrip3.jpg";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import NoticeModalPost from "./NoticeModalPost";
import "./Main.css";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:8080").replace(/\/+$/, "");

// 기존 abs (상대경로 → 절대경로)
const abs = (src, bustKey) => {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.includes("uploads")) {
    const rel = src.substring(src.indexOf("uploads")).replace(/^\.?\/*/, "");
    return `${API_BASE}/${rel}${bustKey ? `?v=${bustKey}` : ""}`;
  }
  return `${API_BASE}/${src}${bustKey ? `?v=${bustKey}` : ""}`;
};

/* ---------- 이미지 404 방지: 다단계 후보 + 폴백 ---------- */
const buildImageCandidates = (src, bustKey) => {
  const s = typeof src === "string" ? src.trim() : "";
  if (!s) return [];
  if (/^https?:\/\//i.test(s)) return [s]; // 절대 URL이면 그거부터
  if (s.includes("/")) return [abs(s, bustKey)]; // 디렉터리가 있으면 abs 적용
  const q = bustKey ? `?v=${bustKey}` : "";
  return [
    `${API_BASE}/${s}${q}`,
    `${API_BASE}/uploads/${s}${q}`,
    `${API_BASE}/uploads/trip/${s}${q}`,
    `${API_BASE}/images/${s}${q}`,
    `${API_BASE}/static/${s}${q}`,
  ];
};
const travelFallback = () =>
  `https://source.unsplash.com/featured/?festival,travel,landscape&sig=${Math.floor(Math.random() * 100000)}`;
const TRAVEL_SVG_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="480">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfefff"/>
        <stop offset="1" stop-color="#eaf7ff"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g fill="#5aa6d1" opacity="0.9">
      <path d="M80 360 Q200 260 320 340 T560 340 T800 360 L800 480 L0 480 Z"/>
      <circle cx="680" cy="90" r="45" fill="#ffd66b"/>
    </g>
  </svg>`);

// 지역 목록
const WEATHER_REGIONS = [
  { label: "서울", value: "seoul" },
  { label: "인천/경기", value: "incheon" },
  { label: "부산", value: "busan" },
  { label: "대구", value: "daegu" },
  { label: "광주", value: "gwangju" },
  { label: "대전", value: "daejeon" },
  { label: "울산", value: "ulsan" },
  { label: "강원", value: "gangwon" },
  { label: "전북", value: "jeonbuk" },
  { label: "전남", value: "jeonnam" },
  { label: "경북", value: "gyeongbuk" },
  { label: "경남", value: "gyeongnam" },
  { label: "제주", value: "jeju" },
];

/* ====== OpenWeather(외국 API) 설정: always-on for sky/temp ====== */
const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const REGION_TO_COORDS = {
  seoul: { lat: 37.5665, lon: 126.978 },
  incheon: { lat: 37.4563, lon: 126.7052 },
  busan: { lat: 35.1796, lon: 129.0756 },
  daegu: { lat: 35.8714, lon: 128.6014 },
  gwangju: { lat: 35.1595, lon: 126.8526 },
  daejeon: { lat: 36.3504, lon: 127.3845 },
  ulsan: { lat: 35.5384, lon: 129.3114 },
  gangwon: { lat: 37.8813, lon: 127.7298 },
  jeonbuk: { lat: 35.8242, lon: 127.148 },
  jeonnam: { lat: 34.8118, lon: 126.3922 },
  gyeongbuk: { lat: 36.576, lon: 128.505 },
  gyeongnam: { lat: 35.237, lon: 128.692 },
  jeju: { lat: 33.4996, lon: 126.5312 },
};
const skyMap = {
  "clear sky": "맑음",
  "few clouds": "구름 조금",
  "scattered clouds": "구름 많음",
  "broken clouds": "대체로 흐림",
  "overcast clouds": "흐림",
  rain: "비",
  "light rain": "약한 비",
  "moderate rain": "보통 비",
  "heavy intensity rain": "강한 비",
  snow: "눈",
  "light snow": "약한 눈",
  mist: "안개",
};


/* ————————————————— 공지 카드 ————————————————— */
function NoticeCard({ item, index, current, setCurrent, setSkipScroll, onOpen }) {
  const isActive = current === index;
  const [width, setWidth] = useState("5rem");
  useEffect(() => { setWidth(isActive ? "30rem" : "5rem"); }, [isActive]);

  const raw = item.image || item.image_url || "";
  const bust = item.updatedAt || item.id || Date.now();
  const bg = abs(raw, bust);

  const handleClick = () => {
    setSkipScroll(true);
    if (isActive) onOpen(item.id);
    else setCurrent(index);
  };

  const titleToShow = isActive ? item.title : (item.thumbnailTitle || (item.title || "").slice(0, 6));

  return (
    <article
      className={`project-card vertical-layout notice-card ${isActive ? "active" : ""}`}
      style={{ width, transition: "width .55s cubic-bezier(.25,46,45,94)" }}
      onMouseEnter={() => { setSkipScroll(true); setCurrent(index); }}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") handleClick(); }}
    >
      <div className="project-card__bgimg" style={{ backgroundImage: `url("${bg}")` }} />
      <div className="project-card__content notice">
        <h3 className="project-card__title">{titleToShow}</h3>
        <p className="project-card__desc">{item.preview}</p>
        <button
          className="project-card__btn"
          onClick={(e) => { e.stopPropagation(); onOpen(item.id); }}
        >
          자세히 보기
        </button>
      </div>
    </article>
  );
}

export default function Main() {
  const navigate = useNavigate();

  // 캐러셀
  const trackRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [skipScroll, setSkipScroll] = useState(false);

  // 공지
  const [notices, setNotices] = useState([]);
  const [openId, setOpenId] = useState(null);

  // 날씨 코스
  const [weatherCourses, setWeatherCourses] = useState([]);
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [region, setRegion] = useState("seoul");

  // ✅ 다가오는 축제(7일)
  const [weeklyFestivals, setWeeklyFestivals] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");

  // 공지 가져오기
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get(`/notices`, {
          params: { limit: 5, _ts: Date.now() },
          withCredentials: true,
        });

        const arr = data?.notices || data?.items || data || [];
        const norm = arr.map((n) => ({
          id: n._id || n.id,
          title: n.title || "",
          thumbnailTitle: n.thumbnailTitle || "",
          content: n.content || "",
          preview: (n.content || "").replace(/<[^>]+>/g, "").slice(0, 120),
          image: n.image || "",
          image_url: n.image_url || "",
          isPinned: !!n.isPinned,
          updatedAt: n.updatedAt || n.createdAt || "",
        }));
        norm.sort((a, b) => b.isPinned - a.isPinned);

        if (alive) setNotices(norm);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 날씨별 코스 — sky/temp는 OpenWeather만 사용
  useEffect(() => {
    let alive = true;

    const fetchCourses = async () => {
      try {
        const { data } = await axios.get("/api/weather-course", {
          params: { limit: 4, region },
          withCredentials: true,
          timeout: 4000,
        });
        if (!alive) return;
        const list = data?.list || [];
        setWeatherCourses(list.slice(0, 4));
      } catch (err) {
        if (!alive) return;
        console.warn("[weather-course] list fallback:", err?.message || err);
        setWeatherCourses([]);
      }
    };

    const fetchOpenWeather = async () => {
      try {
        const coord = REGION_TO_COORDS[region] || REGION_TO_COORDS.seoul;
        if (!process.env.REACT_APP_WEATHER_API_KEY) {
          if (!alive) return;
          setWeatherSummary({ sky: "정보 없음", temp: null, msg: "정보 없음 / 온도 없음" });
          return;
        }
        const ow = await axios.get(OPENWEATHER_URL, {
          params: {
            lat: coord.lat,
            lon: coord.lon,
            units: "metric",
            lang: "en",
            appid: process.env.REACT_APP_WEATHER_API_KEY,
          },
          timeout: 5000,
        });
        if (!alive) return;
        const temp = Math.round(Number(ow.data?.main?.temp) * 10) / 10;
        const desc = (ow.data?.weather?.[0]?.description || "").toLowerCase();
        const sky = skyMap[desc] || "정보 없음";
        setWeatherSummary({
          sky,
          temp: Number.isFinite(temp) ? temp : null,
          msg: Number.isFinite(temp) ? `${sky} / ${temp}℃` : `${sky} / 온도 없음`,
        });
      } catch (err) {
        if (!alive) return;
        console.warn("[openweather] error:", err?.message || err);
        setWeatherSummary({ sky: "정보 없음", temp: null, msg: "정보 없음 / 온도 없음" });
      }
    };

    fetchCourses();
    fetchOpenWeather();

    return () => { alive = false; };
  }, [region]);

  // ✅ 다가오는 축제(7일) 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get("/api/weekly-festival", {
          params: { windowDays: 7, limit: 8 },
          withCredentials: true,
        });
        if (!alive) return;
        setWeeklyFestivals(data?.list || []);
      } catch (e) {
        console.warn("[weekly-festival] load fail:", e?.message || e);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 캐러셀 길이 (TripStory + 공지들 + More 카드)
  const total = 2 + notices.length;

  const goPrev = () => { setSkipScroll(false); setCurrent((c) => Math.max(0, c - 1)); };
  const goNext = () => { setSkipScroll(false); setCurrent((c) => Math.min(total - 1, c + 1)); };

  // current 변할 때 중앙 정렬
  useEffect(() => {
    if (skipScroll) return;
    const trackEl = trackRef.current;
    if (!trackEl) return;
    const cards = trackEl.querySelectorAll(".project-card");
    const activeEl = cards[current];
    if (!activeEl) return;

    const trackRect = trackEl.getBoundingClientRect();
    const cardRect = activeEl.getBoundingClientRect();
    const nextScrollLeft = activeEl.offsetLeft + cardRect.width / 2 - trackRect.width / 2;
    trackEl.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
  }, [current, skipScroll, total]);

  useEffect(() => {
    if (!skipScroll) return;
    const t = setTimeout(() => setSkipScroll(false), 450);
    return () => clearTimeout(t);
  }, [skipScroll]);

  const openNotice = useCallback((id) => setOpenId(id), []);
  const closeNotice = useCallback(() => setOpenId(null), []);

  // ✅ 네이버 일반 검색 링크 (코스/축제 공통 사용)
  const searchLink = (name, areaOrPlace) =>
    `https://search.naver.com/search.naver?query=${encodeURIComponent(`${name} ${areaOrPlace || ""}`.trim())}`;

  const courseLinkFrom = (c) => {
    const direct = c.link || c.url || c.homepage || c.homePage;
    if (direct) return String(direct);
    const name = c.courseName || c.title || "";
    const area = c.areaName || c.area || "";
    return searchLink(name, area);
  };

  return (
    <main className="home">
      {/* 1) 상단 공지 캐러셀 */}
      <section className="projects">
        <button className="nav-arrow left" onClick={goPrev} disabled={current === 0}>
          <FaChevronLeft />
        </button>
        <button className="nav-arrow right" onClick={goNext} disabled={current === total - 1}>
          <FaChevronRight />
        </button>

        <div id="track" className="track" ref={trackRef}>
          {/* TripStory 카드 */}
          <article
            className={`project-card vertical-layout ${current === 0 ? "active" : ""}`}
            onMouseEnter={() => { setSkipScroll(true); setCurrent(0); }}
            onClick={() => navigate("/story")}
            tabIndex={0}
          >
            <img className="project-card__bg" src="https://picsum.photos/id/22/1200/800" alt="TripStory" />
            <div className="project-card__content vertical">
              <h3 className="project-card__title">TripStory</h3>
              <p className="project-card__desc">나만의 여행을 기록하고 공유해보세요.</p>
            </div>
          </article>

          {/* 공지 카드들 */}
          {notices.map((n, i) => (
            <NoticeCard
              key={n.id || i}
              item={n}
              index={1 + i}
              current={current}
              setCurrent={setCurrent}
              setSkipScroll={setSkipScroll}
              onOpen={openNotice}
            />
          ))}

          {/* 마지막 More 카드 */}
          <article
            className={`project-card vertical-layout ${current === 1 + notices.length ? "active" : ""}`}
            onMouseEnter={() => { setSkipScroll(true); setCurrent(1 + notices.length); }}
            onClick={() => window.location.href = "http://192.168.0.19:3000"}
          >
            <img className="project-card__bg" src={DaengTrip} alt="More" />
            <div className="project-card__content vertical">
              <h3 className="project-card__title">DaengTrip</h3>
              <p className="project-card__desc">애완동물과 여행을 떠나보세요!</p>
            </div>
          </article>
        </div>
      </section>

      {/* 2) 오늘 날씨에 맞는 추천 코스 */}
      <section className="weather-reco" id="weather-course-section">
        <header className="section-head">
          <h2 className="section-title">🌤 오늘 날씨에 맞는 추천 코스</h2>
        </header>

        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", maxWidth: 1200, padding: "0 24px 12px" }}>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="select-ghost" aria-label="지역 선택">
            {WEATHER_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {weatherSummary && (
          <div className="weather-summary-box">
            <div className="weather-now-left">
              <div className="weather-now-sky">{weatherSummary.sky || "날씨 정보"}</div>
              <div className="weather-now-temp">{weatherSummary.temp ?? "--"}°C</div>
            </div>
            <div className="weather-now-right">
              <p className="weather-now-msg">{weatherSummary.msg || "지금 날씨에 어울리는 코스를 골라봤어요 👇"}</p>
            </div>
          </div>
        )}

        <div className="card-grid">
          {weatherCourses.length === 0 && <p className="section-empty">현재 날씨 조건에 맞는 코스를 불러오는 중이에요...</p>}

          {weatherCourses.map((c, idx) => {
            const href = courseLinkFrom(c);
            const bust = c.updatedAt || c.id || Date.now();
            const candidates = buildImageCandidates(c.imageUrl, bust);
            const firstSrc = candidates[0] || travelFallback();

            // ✅ 제목/지역/설명 폴백
            const displayName =
              c.courseName || c.title || c.name || c.spotName || c.place || `추천 코스 #${idx + 1}`;
            const displayArea = c.areaName || c.area || "-";
            const displayDesc = c.comment || "지금 기온/날씨에 특히 잘 맞는 코스예요.";

            return (
              <article className="info-card" key={c.id || idx}>
                <a
                  className="card-link"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${displayName} 상세보기`}
                >
                  상세보기
                </a>

                <div className="info-thumb">
                  <img
                    src={firstSrc}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    data-candidates={JSON.stringify(candidates.slice(1))}
                    onError={(e) => {
                      try {
                        const rest = JSON.parse(e.currentTarget.dataset.candidates || "[]");
                        if (rest.length) {
                          const next = rest.shift();
                          e.currentTarget.dataset.candidates = JSON.stringify(rest);
                          e.currentTarget.src = next;
                          return;
                        }
                      } catch {}
                      if (!e.currentTarget.dataset.retryUnsplash) {
                        e.currentTarget.dataset.retryUnsplash = "1";
                        e.currentTarget.src = travelFallback();
                        return;
                      }
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = TRAVEL_SVG_FALLBACK;
                    }}
                  />
                  <div className="info-chip">
                    {(weatherSummary?.sky || "날씨") + " / " + ((weatherSummary?.temp ?? "--") + "°C")}
                  </div>
                </div>

                <div className="info-body">
                  <h3 className="info-name">{displayName}</h3>
                  <p className="info-desc">{displayDesc}</p>
                  <p className="info-meta">📍 {displayArea}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3) 🎉 다가오는 축제 (7일 이내) */}
      <section className="weather-reco" style={{ marginTop: 30 }}>
        <header className="section-head">
          <h2 className="section-title">🎉 다가오는 축제 (7일 이내)</h2>
        </header>

        {weeklyFestivals.length === 0 && (
          <p className="section-empty">일주일 내 예정된 축제가 없어요.</p>
        )}

        {/* 리스트 출력 */}
        <ul className="festival-list">
          {weeklyFestivals
            .filter((f) => !selectedRegion || (f.area && f.area.includes(selectedRegion)))
            .map((f) => {
              const placeQuery = (f.place || f['개최장소'] || f.location || f.name || '').trim();
              const mapUrl = `https://map.naver.com/p/search/${encodeURIComponent(placeQuery)}`;
              return (
                <li key={f.id} className="festival-item">
                  <h4 className="festival-title">
                    {f.area ? <span className="festival-area">[{f.area}]</span> : null}
                    {f.name}
                  </h4>

                  <div className="festival-meta">
                    <div className="festival-row">
                      <span className="ico">📍</span>
                      <span className="txt">{f.place || "장소 정보 없음"}</span>
                    </div>
                    <div className="festival-row">
                      <span className="ico">🗓</span>
                      <span className="txt">{(f.startDate || f.start)} ~ {(f.endDate || f.end)}</span>
                    </div>
                  </div>

                  <a
                    className="festival-link"
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${f.name} 네이버 지도에서 열기`}
                  >
                    ▶ 네이버 지도에서 열기
                  </a>
                </li>
              );
            })}
        </ul>
      </section>

      {/* 공지 상세 모달 */}
      <NoticeModalPost openId={openId} onClose={() => setOpenId(null)} />
    </main>
  );
}
// src/components/ai/TripRouteMapNaver.jsx
import React, { useEffect, useRef, useState } from "react";

const TripRouteMapNaver = ({ result, onClose }) => {
  const mapRef = useRef(null);
  const [enrichedDays, setEnrichedDays] = useState(null);

  // 모드는 자동차(trafast) 고정
  const travelMode = "trafast";

  const normalizeRegion = (rawRegion) => {
    if (!rawRegion) return "";
    if (rawRegion.includes("강릉")) return "강원도 강릉시";
    if (rawRegion.includes("부산")) return "부산광역시";
    if (rawRegion.includes("제주")) return "제주특별자치도";
    if (rawRegion.includes("경주")) return "경상북도 경주시";
    if (rawRegion.includes("전주")) return "전라북도 전주시";
    if (rawRegion.includes("여수")) return "전라남도 여수시";
    return rawRegion;
  };

  const getRegionFallbackCoords = (rawRegion) => {
    if (!rawRegion) return { lat: 37.5665, lng: 126.978 };
    if (rawRegion.includes("강릉")) return { lat: 37.7521, lng: 128.875 };
    if (rawRegion.includes("부산")) return { lat: 35.1796, lng: 129.0756 };
    if (rawRegion.includes("제주")) return { lat: 33.4996, lng: 126.5312 };
    if (rawRegion.includes("경주")) return { lat: 35.8562, lng: 129.2247 };
    if (rawRegion.includes("전주")) return { lat: 35.8242, lng: 127.148 };
    if (rawRegion.includes("여수")) return { lat: 34.7604, lng: 127.6622 };
    return { lat: 37.5665, lng: 126.978 };
  };

  const fallbackCoords = (regionName, offsetIdx = 0) => {
    const base = getRegionFallbackCoords(regionName);
    return {
      lat: base.lat + 0.002 * Math.cos(offsetIdx * 1.7),
      lng: base.lng + 0.002 * Math.sin(offsetIdx * 1.3),
      source: "fallback-jitter",
    };
  };

  const loadNaverScript = () =>
    new Promise((resolve) => {
      const scriptId = "naver-map-script-direction";
      if (document.getElementById(scriptId) && window.naver?.maps) {
        resolve();
        return;
      }
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.async = true;
        script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.REACT_APP_NAVER_CLIENT_ID}&submodules=geocoder,direction`;
        script.onload = () => resolve();
        document.head.appendChild(script);
      } else {
        document.getElementById(scriptId).onload = () => resolve();
      }
    });

  const geocodeByNaver = (placeName, regionName = "") =>
    new Promise((resolve) => {
      if (!window.naver?.maps?.Service) return resolve(null);
      const query = `${normalizeRegion(regionName)} ${placeName}`;
      window.naver.maps.Service.geocode({ query }, (status, response) => {
        if (
          status === window.naver.maps.Service.Status.OK &&
          response?.v2?.addresses?.length
        ) {
          const { x, y } = response.v2.addresses[0];
          resolve({ lat: parseFloat(y), lng: parseFloat(x), source: "naver" });
        } else resolve(null);
      });
    });

  const geocodeByKakaoId = async (placeUrl, placeName, regionName = "") => {
    try {
      if (!placeUrl || !placeUrl.includes("kakao.com")) return null;
      const placeId = placeUrl.split("/").pop();
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8080";
      const url = new URL(`${apiBase}/geo/kakao/${placeId}`);
      if (placeName) url.searchParams.set("name", placeName);
      if (regionName) url.searchParams.set("region", regionName);
      const resp = await fetch(url.toString());
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data?.lat && data?.lng) return { lat: data.lat, lng: data.lng, source: "kakao" };
      return null;
    } catch {
      return null;
    }
  };

  // 일정 데이터에 좌표 추가
  useEffect(() => {
    async function enrichSchedules() {
      if (!result?.itinerary) return;
      await loadNaverScript();
      const regionName = result.region || "";
      const finalDays = [];

      for (const day of result.itinerary) {
        const newSchedule = [];
        for (let i = 0; i < (day.schedule || []).length; i++) {
          const stop = day.schedule[i];
          const place = stop.place || {};
          let { lat, lng } = place;
          let coords = null;
          if (!(lat && lng)) {
            coords = await geocodeByNaver(place.name, regionName);
            if (!coords && place.url)
              coords = await geocodeByKakaoId(place.url, place.name, regionName);
            if (!coords) coords = fallbackCoords(regionName, i);
            lat = coords.lat;
            lng = coords.lng;
          }
          newSchedule.push({ ...stop, place: { ...place, lat, lng } });
        }
        finalDays.push({ ...day, schedule: newSchedule });
      }
      setEnrichedDays(finalDays);
    }
    enrichSchedules();
  }, [result]);

  // 지도 렌더링
  useEffect(() => {
    if (!enrichedDays || !window.naver?.maps) return;
    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(36.5, 127.8),
      zoom: 7,
      mapTypeControl: true,
    });
    const bounds = new window.naver.maps.LatLngBounds();
    const colors = ["#9333EA", "#3B82F6", "#14B8A6", "#F59E0B", "#EF4444"];

    enrichedDays.forEach((day, idx) => {
      const color = colors[idx % colors.length];
      const stops = (day.schedule || []).filter((s) => s.place?.lat && s.place?.lng);
      const latLngs = stops.map((s) => new window.naver.maps.LatLng(s.place.lat, s.place.lng));
      latLngs.forEach((ll) => bounds.extend(ll));

      // 마커
      stops.forEach((s) => {
        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(s.place.lat, s.place.lng),
          map,
          icon: {
            content: `<div style="background:${color};color:#fff;padding:6px 10px;border-radius:12px;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.15);white-space:nowrap;">${s.place.name}</div>`,
            anchor: new window.naver.maps.Point(10, 10),
          },
        });
      });

      // 경로 직선 (진하게)
      if (latLngs.length >= 2) {
        new window.naver.maps.Polyline({
          map,
          path: latLngs,
          strokeColor: color,
          strokeOpacity: 0.95,
          strokeWeight: 6,
          strokeLineJoin: "round",
          strokeLineCap: "round",
          strokeStyle: "solid",
        });
      }
    });

    try {
      if (bounds.getNE && bounds.getSW) map.fitBounds(bounds);
    } catch {}
  }, [enrichedDays]);

  return (
    <div style={{ marginTop: 40, maxWidth: "900px", margin: "0 auto", background: "rgba(255,255,255,0.7)", borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2563EB", margin: 0 }}>
        🗺️ AI 여행 동선 지도 <span style={{ color: "#6b7280", fontWeight: 500 }}>(네이버 도로 경로)</span>
      </h2>
      <div ref={mapRef} style={{ width: "100%", height: "500px", borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.1)", overflow: "hidden", background: "#dcdcdc" }} />
      <button onClick={onClose} style={{ marginTop: 20, padding: "10px 20px", background: "linear-gradient(to right, #60A5FA, #A78BFA)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>
        닫기
      </button>
    </div>
  );
};

export default TripRouteMapNaver;
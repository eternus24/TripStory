import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../assets/api/index';
import './TravelReview.css';

export default function TravelReviewForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 해시태그
  const [hashtags, setHashtags] = useState([]);    // ["바다","카페", ...]
  const [newTag, setNewTag] = useState("");

  // 링크
  const [links, setLinks] = useState([]);          // [{title,url}]
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState(""); // ✅ 기본값 https://

  // 타입/이미지
  const [type, setType] = useState("domestic");    // 'domestic' | 'international'
  const [images, setImages] = useState([]);        // base64/URL 배열
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // UI <-> 서버 값 변환
  const toServerType = (v) => (v === "international" ? "국외" : "국내");
  const fromServerType = (v) => (v === "국외" ? "international" : "domestic");

  // -------- 수정 모드: 상세 불러오기 --------
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/api/travel-reviews/${id}`, { withCredentials: true });
        const r = data?.data || {};
        setTitle(r.title || "");
        setContent(r.content || "");
        setHashtags(Array.isArray(r.hashtags) ? r.hashtags : []);
        setLinks(Array.isArray(r.recommendLinks) ? r.recommendLinks : []);
        setType(fromServerType(r.type));
        setImages(Array.isArray(r.images) ? r.images : (r.coverUrl ? [r.coverUrl] : []));
      } catch (e) {
        setError(e.message || "불러오기 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  // -------- 이미지 업로드/프리뷰 --------
  const handleFiles = (files) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setImages((prev) => [...prev, e.target.result]);
      reader.readAsDataURL(f);
    });
  };

  // -------- 해시태그: 쉼표/Enter로 자동 추가 --------
  const addTagsFromInput = (raw) => {
    const tokens = String(raw)
      .split(',')
      .map((t) => t.trim().replace(/^#/, "")) // 앞의 # 제거
      .filter(Boolean);

    if (tokens.length === 0) return;

    setHashtags((prev) => {
      const set = new Set(prev);
      tokens.forEach((t) => set.add(t));
      return Array.from(set);
    });
  };

  const onTagChange = (e) => {
    const value = e.target.value;
    if (value.includes(',')) {
      // 마지막 미완성 토큰을 제외하고 즉시 추가
      const parts = value.split(',');
      const done = parts.slice(0, -1).join(',');
      if (done.trim()) addTagsFromInput(done);
      setNewTag(parts[parts.length - 1]); // 마지막 조각만 input에 남김
    } else {
      setNewTag(value);
    }
  };

  const onTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTag.trim()) {
        addTagsFromInput(newTag);
        setNewTag('');
      }
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      addTagsFromInput(newTag);
      setNewTag('');
    }
  };

  const removeTag = (t) => setHashtags((prev) => prev.filter((x) => x !== t));

  // -------- 링크: https:// 기본값 + 정규화 --------
const normalizeUrl = (u) => {
  if (!u) return '';
  // 사용자가 http://로 시작하면 그대로, 없으면 http:// 붙이기
  if (!/^https?:\/\//i.test(u)) return `http://${u}`;
  return u;
};

  const addLink = () => {
    const t = linkTitle.trim();
    let u = linkUrl.trim();
    if (!t) return alert('링크 제목을 입력해 주세요.');
    if (!u) return alert('링크 URL을 입력해 주세요.');

    u = normalizeUrl(u);

    setLinks((prev) => [...prev, { title: t, url: u }]);
    setLinkTitle('');
    setLinkUrl(''); // ✅ 다시 기본값으로
  };

  const removeLink = (i) => setLinks((prev) => prev.filter((_, idx) => idx !== i));

  // -------- 제출 --------
  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('제목을 입력해 주세요.');
    if (!content.trim()) return alert('내용을 입력해 주세요.');

    const payload = {
      title: title.trim(),
      content: content.trim(),
      hashtags,                         // 쉼표/Enter로 수집된 배열
      recommendLinks: links,            // 서버 기대 필드명
      type: toServerType(type),         // '국내' | '국외'
      images,                           // 업로드 파이프라인에 맞춰 조정 가능
    };

    try {
      setSubmitting(true);
      const url = `/api/travel-reviews${isEdit ? `/${id}` : ""}`;
      const method = isEdit ? "put" : "post";
      const { data } = await api[method](url, payload, { withCredentials: true });

      const saved = data?.data;
      const targetId = saved?._id || id;
      nav(`/reviews/${targetId}`, { replace: true });
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "저장 실패");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="travel-review-container loading">불러오는 중…</div>;
  if (error) return <div className="travel-review-container empty-state"><p>⚠️ {error}</p></div>;

  return (
    <div className="travel-review-container">
      <div className="form-container">
        <h2 className="form-title">{isEdit ? "후기 수정" : "후기 작성"}</h2>

        <form className="review-form" onSubmit={submit}>
          {/* 국내/해외 선택 */}
          <div className="form-group">
            <label className="form-label">여행 종류</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="type"
                  value="domestic"
                  checked={type === "domestic"}
                  onChange={() => setType("domestic")}
                />
                <span>국내</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="type"
                  value="international"
                  checked={type === "international"}
                  onChange={() => setType("international")}
                />
                <span>해외</span>
              </label>
            </div>
          </div>

          {/* 제목 */}
          <div className="form-group required">
            <label className="form-label">제목</label>
            <input
              className="form-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
            />
          </div>

          {/* 내용 */}
          <div className="form-group required">
            <label className="form-label">내용</label>
            <textarea
              className="form-textarea"
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
            />
            <div className="char-count">{content.length}자</div>
          </div>

          {/* 이미지 업로드 (프리뷰) */}
          <div className="form-group image-upload-area">
            <input
              ref={fileRef}
              className="image-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
            <label className="upload-label" onClick={() => fileRef.current?.click()}>
              이미지 선택
            </label>
            <div className="image-preview-grid">
              {images.map((src, idx) => (
                <div className="preview-item" key={idx}>
                  <img src={src} alt={`preview-${idx}`} />
                  <button
                    className="remove-image-btn"
                    type="button"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 해시태그 */}
          <div className="form-group">
            <label className="form-label">해시태그</label>
            <div className="hashtag-input-group">
              <input
                className="form-input"
                type="text"
                value={newTag}
                onChange={onTagChange}
                onKeyDown={onTagKeyDown}
                placeholder="예: 바다, 맛집, 캠핑  (쉼표로 여러 개 추가)"
              />
              <button type="button" className="add-btn" onClick={addTag}>
                추가
              </button>
            </div>
            <div className="form-hint">힌트: 한 개 입력 후 <b>쉼표(,)</b> 또는 <b>Enter</b>를 누르면 바로 추가됩니다.</div>
            <div className="tag-list">
              {hashtags.map((t) => (
                <div className="tag-item" key={t}>
                  #{t}
                  <button
                    className="remove-tag-btn"
                    type="button"
                    onClick={() => removeTag(t)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 관련 링크 */}
          <div className="form-group">
            <label className="form-label">관련 링크</label>
            <div className="link-input-group">
              <input
                className="form-input"
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="링크 제목 (예: 공식 사이트)"
              />
              <input
                className="form-input"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder=""
              />
              <button type="button" className="add-btn" onClick={addLink}>
                추가
              </button>
            </div>
            <div className="form-hint">URL은 기본적으로 <code>https://</code>로 시작합니다. 스킴이 없으면 자동으로 붙여줘요.</div>
            <div className="link-list">
              {links.map((lk, i) => (
                <div className="link-item" key={`${lk.title}-${i}`}>
                  <span className="link-title-display">{lk.title}</span>
                  <a className="link-url-display" href={lk.url} target="_blank" rel="noreferrer">
                    {lk.url}
                  </a>
                  <button className="remove-link-btn" type="button" onClick={() => removeLink(i)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 제출/취소 */}
          <div className="form-buttons">
            <button type="button" className="cancel-btn" disabled={submitting} onClick={() => nav("/reviews")}>
              취소
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {isEdit ? "수정 완료" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

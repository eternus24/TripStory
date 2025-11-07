// src/pages/reviews/TravelReviewDetail.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BiCommentDetail } from "react-icons/bi";
import {
  IoEyeOutline,
  IoChevronBack,
  IoChevronForward,
  IoArrowBack,
  IoLinkOutline,
} from "react-icons/io5";
import api from "../../assets/api/index";
import CommentSection from "./CommentSection";
import "./TravelReview.css";

export default function TravelReviewDetail({ user }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [commentLen, setCommentLen] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 현재 로그인 유저 id (프로젝트 규칙: prop만 사용)
  const currentUserId = user?._id || user?.id;

  // ====== 작성자 판별: 서버 응답의 다양한 케이스를 보수적으로 커버 ======
  // ✅ 핵심 보완: review.author(ObjectId 문자열) 자체도 비교 후보에 포함
  const authorIdCandidates = [
    review?.author,                // ← 백엔드 모델 기본 필드(ObjectId 문자열)
    review?.authorId,
    review?.author?._id,
    review?.author?._id?.$oid,     // 몽고 직렬화 케이스
    review?.userId,
    review?.user,
    review?.writerId,
    review?.writer,
    review?.ownerId,
    review?.createdBy,
    review?.author?.id,
  ];
  const authorId = authorIdCandidates.find(Boolean) || null;

  const getAuthorDisplayName = (r) => {
    if (!r) return "익명";
    if (r.isAnonymous === true) return "익명";
    const candidates = [
      r.authorName,
      r.authorNickname,
      r.author?.nickname,
      r.author?.name,
      r.author?.username,
      r.author?.displayName,
      r.userName,
      r.userNickname,
      r.writerName,
      r.createdByName,
    ].filter((v) => typeof v === "string" && v.trim().length > 0);
    if (candidates.length > 0) return candidates[0].trim();
    // 마지막 안전장치: author가 문자열(ObjectId)인 경우 마스킹
    if (typeof r.author === "string" && r.author.length >= 6) {
      return `user_${r.author.slice(-6)}`;
    }
    return "익명";
  };
  const displayName = useMemo(() => getAuthorDisplayName(review), [review]);

  // 서버가 isMine/canEdit을 내려줄 수도 있으니 우선 사용, 아니면 id 비교
  const isOwner =
    Boolean(review?.isMine || review?.canEdit) ||
    (currentUserId && authorId && String(currentUserId) === String(authorId));

  const loadReview = async () => {
    try {
      const { data } = await api.get(`/api/travel-reviews/${id}`);
      const reviewData = data?.data;
      setReview(reviewData);

      if (reviewData) {
        const uid = currentUserId;
        const liked = Array.isArray(reviewData.likes)
          ? reviewData.likes.some((x) => String(x) === String(uid))
          : Boolean(reviewData.liked);
        setIsLiked(liked);
      }
    } catch (err) {
      alert("게시물을 불러오는데 실패했습니다.");
      navigate("/reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ====== 이미지 슬라이더에 사용할 이미지 정규화 ======
  const normalizedImages = useMemo(() => {
    const srcs = Array.isArray(review?.images) ? review.images : [];
    const toUrl = (it) =>
      typeof it === "string" ? it : it?.url || it?.src || it?.path || "";
    const list = srcs.map(toUrl).filter(Boolean);
    if (list.length === 0 && review?.coverUrl) list.push(review.coverUrl);
    return list;
  }, [review]);

  const handleLike = async () => {
    if (!currentUserId) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    try {
      const { data } = await api.post(`/api/travel-reviews/${id}/like`);
      if (data?.success) {
        setIsLiked(Boolean(data.liked));
        setReview((prev) =>
          prev ? { ...prev, likeCount: data.likeCount } : prev
        );
      } else {
        alert(data?.message || "좋아요 처리에 실패했습니다.");
      }
    } catch {
      alert("좋아요 처리에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!currentUserId) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { data } = await api.delete(`/api/travel-reviews/${id}`);
      if (data?.success === false) {
        alert(data?.message || "삭제에 실패했습니다.");
        return;
      }
      alert("삭제되었습니다.");
      navigate("/reviews");
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  if (loading)
    return (
      <div className="travel-review-container">
        <div className="loading">로딩 중...</div>
      </div>
    );

  if (!review) return null;

  return (
    <div className="travel-review-container">
      <div className="detail-container">
        <button className="back-btn" onClick={() => navigate("/reviews")}>
          <IoArrowBack size={18} style={{ marginRight: "6px" }} />
          목록으로
        </button>

        {/* ===== 헤더: 타입/제목 + 액션 버튼 ===== */}
        <div className="detail-header">
          <div className="header-left">
            <div
              className={`type-badge-large ${
                review.type === "국내" ? "domestic" : "international"
              }`}
            >
              {review.type === "국내" ? "🇰🇷 국내 여행" : "🌏 국외 여행"}
            </div>
            {review.title && <h1 className="detail-title">{review.title}</h1>}
          </div>

          {/* ▶ 오른쪽 액션 버튼: 소유자에게만 노출 */}
          <div className="action-buttons">
            {isOwner && (
              <>
                <button
                  className="edit-btn"
                  onClick={() => navigate(`/reviews/${id}/edit`)}
                >
                  수정
                </button>
                <button className="delete-btn" onClick={handleDelete}>
                  삭제
                </button>
              </>
            )}
          </div>
        </div>

        {/* ===== 이미지 슬라이더 ===== */}
        {normalizedImages.length > 0 && (
          <div className="image-slider">
            <img
              src={normalizedImages[currentImageIndex]}
              alt={`여행 사진 ${currentImageIndex + 1}`}
              className="detail-image"
            />

            {normalizedImages.length > 1 && (
              <>
                <button
                  className="slider-btn prev"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? normalizedImages.length - 1 : prev - 1
                    )
                  }
                  aria-label="이전 이미지"
                >
                  <IoChevronBack size={20} />
                </button>
                <button
                  className="slider-btn next"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === normalizedImages.length - 1 ? 0 : prev + 1
                    )
                  }
                  aria-label="다음 이미지"
                >
                  <IoChevronForward size={20} />
                </button>
              </>
            )}
          </div>
        )}

        {/* ===== 작성자 / 통계 ===== */}
        <div className="author-section">
          <div className="author-info-detail">
            <span className="author-name-detail">{displayName}</span>
            <span className="date-detail">
              {review.createdAt
                ? new Date(review.createdAt).toLocaleString("ko-KR")
                : ""}
            </span>
          </div>

          <div className="stats-detail">
            <span
              className={`like-inline-wrapper ${isLiked ? "liked" : ""}`}
              onClick={handleLike}
              style={{ cursor: "pointer" }}
              title="좋아요"
            >
              {isLiked ? (
                <AiFillHeart size={22} />
              ) : (
                <AiOutlineHeart size={22} />
              )}
              {review.likeCount}
            </span>
            <span title="댓글 수">
              <BiCommentDetail size={20} /> {commentLen}
            </span>
            <span title="조회수">
              <IoEyeOutline size={20} /> {review.viewCount}
            </span>
          </div>
        </div>

        {/* ===== 본문 ===== */}
        <div className="detail-content">
          <p className="content-text">{review.content}</p>
        </div>

        {/* ===== 관련 링크 ===== */}
        {Array.isArray(review?.recommendLinks) &&
          review.recommendLinks.length > 0 && (
            <div className="recommend-section">
              <div className="section-title">관련 링크</div>
              <div className="recommend-links">
                {review.recommendLinks.map((lk, i) => (
                  <a
                    key={`${lk.title || lk.url}-${i}`}
                    href={/^https?:\/\//i.test(lk.url) ? lk.url : `http://${lk.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="recommend-link"
                    title={lk.url}
                  >
                    <span className="link-icon">
                      <IoLinkOutline size={16} />
                    </span>
                    <span className="link-title">{lk.title || lk.url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

    {/* ===== 해시태그 ===== */}
{Array.isArray(review?.hashtags) && review.hashtags.length > 0 && (
  <div className="hashtag-like-row">
    <div className="hashtag-section">
      {review.hashtags.map((t, idx) => (
        <button
          key={`${t}-${idx}`}
          type="button"
          className="hashtag-detail"   // 기존 스타일 그대로 사용
          onClick={() => {
            navigate({
              pathname: "/reviews",
              search: `?hashtag=${encodeURIComponent(t)}&page=1&size=9&type=all`,
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate({
                pathname: "/reviews",
                search: `?hashtag=${encodeURIComponent(t)}&page=1&size=9&type=all`,
              });
            }
          }}
        >
          #{t}
        </button>
      ))}
    </div>
  </div>
)}
        {/* ===== 댓글 ===== */}
        <CommentSection
          reviewId={id}
          currentUser={user}
          onCommentUpdate={async () => {
            // 상세 재조회하여 상단 카운터 동기화
            await loadReview();
          }}
          onCommentsLoaded={(list) =>
            setCommentLen(Array.isArray(list) ? list.length : 0)
          }
        />
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import api from '../../assets/api/index';
import './TravelReview.css';

/**
 * CommentSection (완전체)
 * - 서버에서 댓글 평면 리스트를 받아와 로컬 상태로 관리
 * - 부모/자식/손자(최대 depth=2) 렌더링, 손자는 토글
 * - 작성/수정/삭제/답글 처리 후:
 *    1) 로컬 목록 갱신
 *    2) onCommentsLoaded(list)로 부모에 최신 길이 전달
 *    3) onCommentUpdate() 호출해 상세 재조회 (commentCount 동기화)
 */
const CommentSection = ({ reviewId, comments = [], currentUser, onCommentUpdate, onCommentsLoaded }) => {
  const navigate = useNavigate();
  const [list, setList] = useState(Array.isArray(comments) ? comments : []);
  const [openGrand, setOpenGrand] = useState(() => new Set()); // 손자 토글

  // 최초 마운트 시 서버에서 최신 댓글 로드
  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  // props.comments가 외부에서 초기 렌더링에만 쓰였을 가능성 고려
  useEffect(() => {
    if (Array.isArray(comments) && comments.length && list.length === 0) {
      setList(comments);
      onCommentsLoaded?.(comments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/travel-reviews/${reviewId}/comments`);
      const data = res?.data?.data || [];
      setList(data);
      onCommentsLoaded?.(data); // ✅ 부모에 최신 길이 전달
    } catch (e) {
      console.error('댓글 목록 조회 실패:', e);
    }
  };

  const requireLogin = () => {
    alert('로그인이 필요합니다.');
    navigate('/login');
  };

   const currentUserId =
   currentUser?._id || currentUser?.id || currentUser?.userId || currentUser?.uid;

  // ---- Handlers ----
  const handleCreate = async (content) => {
    if (!currentUserId) { requireLogin(); return false; }
    try {
      const { data } = await api.post(`/api/travel-reviews/${reviewId}/comments`, { content });
      if (data?.success) {
        await fetchComments();
        await onCommentUpdate?.();
        return true;
      }
      alert(data?.message || '댓글 작성에 실패했습니다.');
      return false;
    } catch (e) {
      if (e?.response?.status === 401) requireLogin();
      else alert('댓글 작성에 실패했습니다.');
      return false;
    }
  };

  const handleReplySubmit = async (parentId, content) => {
    if (!currentUserId) { requireLogin(); return false; }
    try {
      const { data } = await api.post(`/api/travel-reviews/${reviewId}/comments`, { content, parentId });
      if (data?.success) {
        await fetchComments();
        await onCommentUpdate?.();
        return true;
      }
      alert(data?.message || '답글 작성에 실패했습니다.');
      return false;
    } catch (e) {
      if (e?.response?.status === 401) requireLogin();
      else alert('답글 작성에 실패했습니다.');
      return false;
    }
  };

  const handleCommentEdit = async (commentId, content) => {
    if (!currentUserId) { requireLogin(); return false; }
    try {
      const { data } = await api.put(`/api/travel-reviews/${reviewId}/comments/${commentId}`, { content });
      if (data?.success) {
        await fetchComments();
        return true;
      }
      alert(data?.message || '댓글 수정에 실패했습니다.');
      return false;
    } catch (e) {
      alert('댓글 수정에 실패했습니다.');
      return false;
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!currentUserId) { requireLogin(); return; }
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const { data } = await api.delete(`/api/travel-reviews/${reviewId}/comments/${commentId}`);
      if (data?.success) {
        // ✅ 부모 + 모든 하위 댓글 재귀적으로 제거
        const toDelete = new Set([String(commentId)]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const c of list) {
            const pid = c.parent ? String(c.parent) : null;
            if (pid && toDelete.has(pid)) {
              const cid = String(c._id);
              if (!toDelete.has(cid)) { toDelete.add(cid); changed = true; }
            }
          }
        }
        const updated = list.filter(c => !toDelete.has(String(c._id)));
        setList(updated);
        onCommentsLoaded?.(updated); // ✅ 삭제 즉시 상위로 최신 개수 전달
        await onCommentUpdate?.();   // 서버 동기화 (loadReview 호출됨)
      }
    } catch (e) {
      console.error('댓글 삭제 실패:', e);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // ---- Tree helpers ----
  const byParent = useMemo(() => {
    const map = new Map();
    (list || []).forEach((c) => {
      const key = c.parent ? String(c.parent) : 'root';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    });
    return map;
  }, [list]);

  const getChildren = (idOrRoot) => byParent.get(idOrRoot ?? 'root') || [];

  const toggleGrand = (childId) => {
    setOpenGrand((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) next.delete(childId);
      else next.add(childId);
      return next;
    });
  };

  // ---- Render ----
  const roots = getChildren('root');
  const total = list.length;

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">
        💬 댓글 <span className="comment-count">({total})</span>
      </h3>

      {/* 최상위 댓글 작성 */}
      <div className="comment-form-wrapper">
        <CommentForm
          onSubmit={handleCreate}
          placeholder="여행 후기에 대한 댓글을 남겨주세요!"
        />
      </div>

      {/* 부모 → 자식(보임) → 손자(토글) */}
      <div className="comment-list">
        {total === 0 ? (
          <div className="empty-comment">첫 댓글을 남겨보세요! 💬</div>
        ) : (
          roots.map((parent) => {
            const children = getChildren(String(parent._id));

            return (
              <div key={parent._id}>
                {/* 부모 */}
                <CommentItem
                  comment={parent}
                  currentUserId={currentUserId}
                  onEdit={handleCommentEdit}
                  onDelete={handleCommentDelete}
                  onReply={handleReplySubmit}
                  isReply={false}
                  depth={0}
                />

                {/* 자식(1단계) */}
                {children.map((child) => {
                  const grands = getChildren(String(child._id)); // 손자 목록
                  const childKey = String(child._id);
                  const isOpen = openGrand.has(childKey);

                  return (
                    <div key={child._id}>
                      <CommentItem
                        comment={child}
                        currentUserId={currentUserId}
                        onEdit={handleCommentEdit}
                        onDelete={handleCommentDelete}
                        onReply={handleReplySubmit}
                        isReply
                        depth={1}
                      />

                      {/* 손자 토글 (인스타 스타일) */}
                      {grands.length > 0 && (
                        <div className="reply-toggle depth-1">
                          <button
                            type="button"
                            className="reply-toggle-btn"
                            onClick={() => toggleGrand(childKey)}
                          >
                            {isOpen ? '답글 숨기기' : `답글 보기 ${grands.length}개`}
                          </button>
                        </div>
                      )}

                      {/* 손자(2단계) - 접힘/펼침 */}
                      {isOpen && grands.map((grand) => (
                        <CommentItem
                          key={grand._id}
                          comment={grand}
                          currentUserId={currentUserId}
                          onEdit={handleCommentEdit}
                          onDelete={handleCommentDelete}
                          onReply={handleReplySubmit}
                          isReply
                          depth={2}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentSection;
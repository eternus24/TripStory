import React, { useState } from 'react';
import CommentForm from './CommentForm';
import './TravelReview.css';

const CommentItem = ({ comment, currentUserId, onEdit, onDelete, onReply, isReply = false, depth = 0 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const isAuthor =
    currentUserId && comment?.user && String(currentUserId) === String(comment.user);

  const handleEditSubmit = async (content) => {
    const success = await onEdit(comment._id, content);
    if (success) setIsEditing(false);
    return success;
  };

  const handleDelete = () => { onDelete(comment._id); };

  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (m < 1) return '방금 전';
    if (m < 60) return `${m}분 전`;
    if (h < 24) return `${h}시간 전`;
    if (day < 7) return `${day}일 전`;
    return d.toLocaleDateString('ko-KR');
  };

  const isEdited =
    comment.updatedAt &&
    new Date(comment.updatedAt).getTime() !== new Date(comment.createdAt).getTime();

  return (
    <div className={`comment-item${isReply ? ' is-reply' : ''} depth-${depth}`}>
      <div className="comment-header">
        <div className="comment-author-info">
          <span className="comment-author">
            {comment.username}
            {isReply && <span style={{ marginLeft: 8, fontSize: '0.85em', color: '#6F7B6A' }}>↳ 답글</span>}
          </span>
          <span className="comment-time">
            {formatTime(comment.createdAt)}
            {isEdited && <span className="edited-mark"> (수정됨)</span>}
          </span>
        </div>

        {!isEditing && (
          <div className="comment-actions">
            {/* 깊이 2(손자)부터는 답글 버튼 숨김 */}
            {depth < 2 && (
              <button
                className="comment-action-btn reply"
                onClick={() => setReplying((v) => !v)}
              >
                답글
              </button>
            )}
            {isAuthor && (
              <>
                <button className="comment-action-btn edit" onClick={() => setIsEditing(true)}>수정</button>
                <button className="comment-action-btn delete" onClick={handleDelete}>삭제</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="comment-content">
        {isEditing ? (
          <CommentForm
            initialValue={comment.content}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
            placeholder="댓글을 수정해주세요"
            submitText="수정 완료"
          />
        ) : (
          <p className="comment-text">{comment.content}</p>
        )}

        {/* 깊이 2 이상에서는 답글 입력 폼 숨김 */}
        {replying && !isEditing && depth < 2 && (
          <div className="reply-form">
            <CommentForm
              placeholder="이 댓글에 답글 달기..."
              submitText="답글 작성"
              onSubmit={async (content) => {
                const ok = await onReply(comment._id, content);
                if (ok) setReplying(false);
                return ok;
              }}
              onCancel={() => setReplying(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;

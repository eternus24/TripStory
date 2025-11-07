import React, { useState, useEffect } from 'react';
import './TravelReview.css';

const CommentForm = ({
  initialValue = '',
  onSubmit,
  onCancel = null,
  placeholder = '댓글을 입력하세요',
  submitText = '댓글 작성',
  rows = 3,                 // ✅ 입력창 높이 제어
  compact = false,          // ✅ 대댓글용 컴팩트 스타일
  reverseButtons = false,   // ✅ 버튼 순서: true => [제출][취소]
}) => {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setContent(initialValue); }, [initialValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) { alert('댓글 내용을 입력해주세요.'); return; }
    if (trimmed.length > 500) { alert('댓글은 500자 이내로 입력해주세요.'); return; }
    setIsSubmitting(true);
    const ok = await onSubmit(trimmed);
    setIsSubmitting(false);
    if (ok) setContent('');
  };

  const handleCancel = () => {
    setContent(initialValue);
    if (onCancel) onCancel();
  };

  const Buttons = () => {
    const nodes = [];
    if (onCancel) {
      nodes.push(
        <button
          key="cancel"
          type="button"
          className="comment-cancel-btn"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          취소
        </button>
      );
    }
    nodes.push(
      <button
        key="submit"
        type="submit"
        className="comment-submit-btn"
        disabled={isSubmitting}
      >
        {isSubmitting ? '저장 중...' : submitText}
      </button>
    );
    // reverseButtons=true 이면 [제출][취소], 기본은 [취소][제출]
    return reverseButtons ? [...nodes].reverse() : nodes;
  };

  return (
    <form onSubmit={handleSubmit} className={`comment-form${compact ? ' compact' : ''}`}>
      <textarea
        className="comment-input"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={rows}
        maxLength={500}
        disabled={isSubmitting}
      />
      <div className="comment-form-footer">
        <span className="comment-char-count">{content.length} / 500</span>
        <div className="comment-form-buttons">
          <Buttons />
        </div>
      </div>
    </form>
  );
};

export default CommentForm;

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  addComment,
  fetchComments,
  updateComment,
  deleteComment,
} from "../../assets/api/tripStoryApi";

const CommentBox = styled.div`
  margin-top: 20px;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
  font-family: "Pretendard", sans-serif;
`;

const CommentItem = styled.div`
  background: ${({ isEditing }) => (isEditing ? "#eef2ff" : "#f9fafb")};
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 6px;
  color: #334155;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: background 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }

  strong {
    color: #1e293b;
  }

  .actions {
    display: flex;
    gap: 8px;
    font-size: 0.8rem;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 2px 4px;
    transition: 0.2s;

    &:hover {
      color: #4f46e5;
    }
  }
`;

const ReplyItem = styled.div`
  margin-left: ${({ depth }) => Math.min(depth * 20, 60)}px;
  position: relative;

  &:before {
    content: "";
    position: absolute;
    left: -12px;
    top: 0;
    bottom: 0;
    border-left: 2px solid #e2e8f0;
  }
`;

const InputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  margin-left: ${({ depth }) => Math.min(depth * 20, 60)}px;

  input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.9rem;
    background: #fff;

    &:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 1px #6366f1;
    }
  }

  button {
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;

    &:hover {
      background: #4f46e5;
      transform: translateY(-1px);
    }
  }
`;

function TripStoryComments({ storyId, user }) {
  const [comments, setComments] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [editMode, setEditMode] = useState(null);
  const [editText, setEditText] = useState("");

  // ✅ 댓글 로드
  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await fetchComments(storyId);
        setComments(data || []);
      } catch (err) {
        console.error("댓글 로드 실패:", err);
      }
    };
    loadComments();
  }, [storyId]);

  // ✅ 댓글 등록 / 대댓글 등록
  const handleAddComment = async (parentId = null) => {
    const inputText = replyInputs[parentId || "root"];
    if (!user) return alert("로그인 후 이용하세요");
    if (!inputText?.trim()) return alert("댓글을 입력하세요");

    try {
      const newComment = await addComment(storyId, {
        text: inputText,
        parentId,
      });
      setComments((prev) => [...prev, newComment]);
      setReplyInputs((prev) => ({ ...prev, [parentId || "root"]: "" }));
    } catch (err) {
      console.error("댓글 등록 실패:", err);
      alert("댓글 등록 실패");
    }
  };

  // ✅ 댓글 수정
  const handleUpdateComment = async (commentId) => {
    if (!editText.trim()) return alert("내용을 입력하세요");
    try {
      const updated = await updateComment(storyId, commentId, { text: editText });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, text: updated.text } : c))
      );
      setEditMode(null);
      setEditText("");
    } catch (err) {
      console.error("댓글 수정 실패:", err);
      alert("댓글 수정 실패");
    }
  };

  // ✅ 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteComment(storyId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("댓글 삭제 실패:", err);
      alert("댓글 삭제 실패");
    }
  };

  // ✅ 트리형 렌더링 (대댓글 재귀)
  const renderComments = (parentId = null, depth = 0) =>
    comments
      .filter((c) => c.parentId === parentId)
      .map((c) => (
        <ReplyItem key={c._id} depth={depth}>
          <CommentItem isEditing={editMode === c._id}>
            <div style={{ flex: 1 }}>
              <strong>{c.authorName || c.user?.nickname || "익명"}</strong> :{" "}
              {editMode === c._id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    padding: "5px 8px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    width: "90%",
                  }}
                />
              ) : (
                c.text
              )}
            </div>

            <div className="actions">
              {editMode === c._id ? (
                <>
                  <button onClick={() => handleUpdateComment(c._id)}>💾 저장</button>
                  <button onClick={() => setEditMode(null)}>❌ 취소</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      setReplyInputs((prev) => ({
                        ...prev,
                        activeReply: prev.activeReply === c._id ? null : c._id,
                      }))
                    }
                  >
                    💬 답글
                  </button>

                  {user && String(c.user?._id) === String(user.uid) && (
                    <>
                      <button
                        onClick={() => {
                          setEditMode(c._id);
                          setEditText(c.text);
                        }}
                      >
                        ✏️ 수정
                      </button>
                      <button onClick={() => handleDeleteComment(c._id)}>🗑️ 삭제</button>
                    </>
                  )}
                </>
              )}
            </div>
          </CommentItem>

          {replyInputs.activeReply === c._id && (
            <InputWrap depth={depth + 1}>
              <input
                type="text"
                placeholder="답글 입력..."
                value={replyInputs[c._id] || ""}
                onChange={(e) =>
                  setReplyInputs((prev) => ({
                    ...prev,
                    [c._id]: e.target.value,
                  }))
                }
              />
              <button onClick={() => handleAddComment(c._id)}>등록</button>
            </InputWrap>
          )}

          {renderComments(c._id, depth + 1)}
        </ReplyItem>
      ));

  return (
    <CommentBox>
      <h4
        style={{
          fontSize: "0.95rem",
          color: "#1e293b",
          marginBottom: "10px",
          fontWeight: 600,
        }}
      >
        💬 댓글
      </h4>

      {renderComments(null, 0)}

      <InputWrap depth={0}>
        <input
          type="text"
          placeholder="댓글을 입력하세요..."
          value={replyInputs["root"] || ""}
          onChange={(e) =>
            setReplyInputs((prev) => ({ ...prev, root: e.target.value }))
          }
        />
        <button onClick={() => handleAddComment(null)}>등록</button>
      </InputWrap>
    </CommentBox>
  );
}

export default TripStoryComments;

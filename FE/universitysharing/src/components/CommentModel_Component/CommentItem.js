import { useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import { useDispatch } from "react-redux";
import AvatarDefault from "../../assets/AvatarDefault.png";
import { getReplyComment, updateComment } from "../../stores/action/listPostActions";
import "../../styles/PostDetail/CommentItem.scss";
import getUserIdFromToken from "../../utils/JwtDecode";
import CommentOption from "./CommentOption";

const CommentItem = ({ comments, handleLikeComment, post, usersProfile, handleReplyComment }) => {
  const dispatch = useDispatch();
  const userId = getUserIdFromToken();
  
  // State quản lý hiển thị
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comments.content);
  const [showOptions, setShowOptions] = useState(false);
  
  // State quản lý reply
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(1);
  const [areRepliesExpanded, setAreRepliesExpanded] = useState(false);

  // Handlers
  const handleToggleOptions = () => setShowOptions(!showOptions);

  const onEdit = () => {
    setIsEditing(true);
    setShowOptions(false);
  };

  const onSaveEdit = () => {
    if (editContent.trim() !== comments.content) {
      dispatch(updateComment({ postId: post.id, commentId: comments.id, content: editContent }));
    }
    setIsEditing(false);
  };

  const onReplyClick = () => {
    setIsReplying(true);
    setAreRepliesExpanded(true); // Mở list reply nếu đang đóng
  };

  const onSendReply = () => {
    if (!replyText.trim()) return;
    handleReplyComment(comments.id, replyText);
    setReplyText("");
    setIsReplying(false);
  };

  const onLoadMoreReplies = () => {
    if (comments.hasMoreReplies) {
      dispatch(getReplyComment(comments.id));
    }
    setVisibleRepliesCount((prev) => prev + 5);
  };

  const replies = comments.replies || [];
  const displayReplies = replies.slice(0, visibleRepliesCount);
  const hasHiddenReplies = replies.length > visibleRepliesCount || comments.hasMoreReplies;

  return (
    <div className="comment-item-container">
      {/* --- Nội dung Comment chính --- */}
      <div className="comment-row">
        <img className="avatar" src={comments.profilePicture || AvatarDefault} alt="user" />
        
        <div className="content-area">
          {isEditing ? (
            <div className="edit-mode">
              <textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)} 
                rows={2} 
                autoFocus 
              />
              <div className="edit-actions">
                <button className="cancel" onClick={() => setIsEditing(false)}>Hủy</button>
                <button className="save" onClick={onSaveEdit}>Lưu</button>
              </div>
            </div>
          ) : (
            <div className="bubble-wrapper">
              <div className="bubble">
                <span className="user-name">{comments.userName}</span>
                <span className="text">{comments.content}</span>
              </div>
              
              {/* Nút 3 chấm */}
              <button className={`options-btn ${showOptions ? 'active' : ''}`} onClick={handleToggleOptions}>
                <FiMoreHorizontal />
              </button>
              
              {showOptions && (
                <CommentOption 
                  isOwner={userId === comments.userId}
                  onClose={() => setShowOptions(false)}
                  idComment={comments.id}
                  post={post}
                  onEdit={onEdit}
                />
              )}
            </div>
          )}

          {/* Actions: Like, Reply, Time */}
          {!isEditing && (
            <div className="actions">
              <span 
                className={comments.hasLiked ? "liked" : ""} 
                onClick={() => handleLikeComment(comments.id)}
              >
                Thích {comments.likeCountComment > 0 && `(${comments.likeCountComment})`}
              </span>
              <span onClick={onReplyClick}>Trả lời</span>
              <span className="time">1 giờ</span> {/* Bạn có thể thêm hàm format time ở đây */}
            </div>
          )}
        </div>
      </div>

      {/* --- Khu vực Replies --- */}
      {(replies.length > 0 || isReplying) && (
         <div className="replies-wrapper">
           {/* Render đệ quy các replies con */}
           {areRepliesExpanded && displayReplies.map(reply => (
             <CommentItem 
                key={reply.id} 
                comments={reply} 
                post={post}
                usersProfile={usersProfile}
                handleLikeComment={handleLikeComment}
                handleReplyComment={handleReplyComment}
             />
           ))}

           {/* Nút xem thêm reply */}
           {areRepliesExpanded && hasHiddenReplies && (
             <div 
                style={{fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '5px 0', color: '#65676b'}}
                onClick={onLoadMoreReplies}
             >
               Xem thêm bình luận...
             </div>
           )}

           {/* Input trả lời */}
           {isReplying && (
             <div className="reply-input-area">
               <img className="reply-avatar" src={usersProfile?.profilePicture || AvatarDefault} alt="me" />
               <div className="input-box">
                 <input 
                    placeholder={`Trả lời ${comments.userName}...`} 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSendReply()}
                    autoFocus
                 />
               </div>
             </div>
           )}
         </div>
      )}
    </div>
  );
};

export default CommentItem;
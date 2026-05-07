import { debounce } from "lodash";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { replyComments } from "../../stores/action/listPostActions";
import "../../styles/PostDetail/CommentList.scss";
import getUserIdFromToken from "../../utils/JwtDecode";
import Spinner from "../../utils/Spinner";
import CommentItem from "./CommentItem";

const CommentList = ({
  comment,
  commentEndRef,
  handleLikeComment,
  post,
  usersProfile,
  isLoadingMore,
}) => {
  const dispatch = useDispatch();
  const userId = getUserIdFromToken();

  // Sử dụng useCallback để không tạo lại hàm mỗi lần render
  // Debounce được bọc bên trong để tránh gọi API quá nhiều
  const handleReplyComment = useCallback(
    debounce((commentId, content) => {
      if (!content.trim()) return;
      dispatch(
        replyComments({
          postId: post.id,
          parentId: commentId,
          content: content,
          userId: userId,
        })
      );
    }, 500),
    [dispatch, post.id, userId]
  );

  return (
    <div className="comment-list-container">
      {Array.isArray(comment) && comment.length > 0 ? (
        comment.map((item) => (
          <CommentItem
            key={item.id}
            comments={item}
            handleLikeComment={handleLikeComment}
            post={post}
            handleReplyComment={handleReplyComment}
            usersProfile={usersProfile}
          />
        ))
      ) : (
        <div className="no-comment">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
      )}

      {isLoadingMore && (
        <div className="loading-more-spinner">
          <Spinner size={30} />
        </div>
      )}

      <div ref={commentEndRef} style={{ height: "1px" }} />
    </div>
  );
};

export default CommentList;
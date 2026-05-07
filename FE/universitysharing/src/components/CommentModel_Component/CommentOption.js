import { useEffect, useRef } from "react";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { useDispatch } from "react-redux";
import { deleteComments } from "../../stores/action/listPostActions";
import "../../styles/PostDetail/CommentOption.scss"; // Import file SCSS riêng

const CommentOption = ({ isOwner, onClose, idComment, post, onEdit }) => {
  const optionRef = useRef(null);
  const dispatch = useDispatch();

  // Xử lý click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionRef.current && !optionRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleDelete = () => {
    confirmAlert({
      title: "Xóa bình luận?",
      message: "Hành động này không thể hoàn tác.",
      buttons: [
        {
          label: "Xóa",
          onClick: () => {
            dispatch(deleteComments({ postId: post.id, commentId: idComment }));
            onClose();
          },
        },
        { label: "Hủy", onClick: onClose },
      ],
    });
  };

  return (
    <div className="comment-options-menu" ref={optionRef}>
      {isOwner ? (
        <>
          <div className="menu-item" onClick={() => { onEdit(); onClose(); }}>
            Sửa bình luận
          </div>
          <div className="menu-item delete" onClick={handleDelete}>
            Xóa bình luận
          </div>
        </>
      ) : (
        <div className="menu-item" onClick={onClose}>
          Báo cáo bình luận
        </div>
      )}
    </div>
  );
};

export default CommentOption;
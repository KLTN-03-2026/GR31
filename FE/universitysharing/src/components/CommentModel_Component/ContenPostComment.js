import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { FaHeart } from "react-icons/fa";
import { FiClock, FiHeart, FiMessageSquare, FiShare2, FiX } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import AvatarDefault from "../../assets/AvatarDefault.png";
import { fetchLikes } from "../../stores/action/likeAction";
import { likePost } from "../../stores/action/listPostActions";
import { fetchShares } from "../../stores/action/shareAction";
import { openInteractorModal, openInteractorShareModal, openShareModal } from "../../stores/reducers/listPostReducers";
import "../../styles/PostDetail/ContentPost.scss";

const ContentPost = ({ post, onClose }) => {
  const dispatch = useDispatch();
  // Lấy data realtime từ store để đảm bảo đồng bộ like/share
  const currentPost = useSelector((state) => state.posts.posts.find((p) => p.id === post.id)) || post;
  const { postLikes, postShares } = useSelector((state) => state.posts);

  const handleLikePost = () => dispatch(likePost(currentPost.id));

  const handleOpenLikes = async () => {
    if (!postLikes[currentPost.id]) await dispatch(fetchLikes({ postId: currentPost.id }));
    dispatch(openInteractorModal(currentPost));
  };

  const handleOpenShares = async () => {
    if (!postShares[currentPost.id]) await dispatch(fetchShares({ postId: currentPost.id }));
    dispatch(openInteractorShareModal(currentPost));
  };

  const formattedDate = formatDistanceToNow(new Date(currentPost.createdAt), { addSuffix: true, locale: vi });

  return (
    <div className="content-post-header">
      {/* User Info */}
      <div className="header-top">
        <div className="user-info-group">
          <img className="avatar" src={currentPost.profilePicture || AvatarDefault} alt="avatar" />
          <div className="info">
            <span className="name">{currentPost.fullName}</span>
            <span className="time"><FiClock size={12} /> {formattedDate}</span>
          </div>
        </div>
        <div className="close-btn" onClick={onClose}><FiX size={24} /></div>
      </div>

      {/* Caption */}
      <div className="caption">{currentPost.content}</div>

      {/* Stats */}
      <div className="stats">
        <div className="stat-item" onClick={handleOpenLikes}>
          <FaHeart color="#f3425f" /> {currentPost.likeCount}
        </div>
        <div className="stat-item" onClick={handleOpenShares}>
            {currentPost.commentCount} bình luận • {currentPost.shareCount?.shareCount || currentPost.shareCount || 0} chia sẻ
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className={currentPost.hasLiked ? "active" : ""} onClick={handleLikePost}>
          {currentPost.hasLiked ? <FaHeart /> : <FiHeart />} Thích
        </button>
        <button><FiMessageSquare /> Bình luận</button>
        <button onClick={() => dispatch(openShareModal(currentPost))}><FiShare2 /> Chia sẻ</button>
      </div>
    </div>
  );
};

export default ContentPost;
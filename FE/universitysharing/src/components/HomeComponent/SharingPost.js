// SharingPost.js - Phiên bản cập nhật
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import avatarWeb from "../../assets/AvatarDefault.png";
import dieImage from "../../assets/Imgae Not found.png";
import "../../styles/SharingPost.scss";
import getUserIdFromToken from "../../utils/JwtDecode";

const SharedPost = ({ post }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = getUserIdFromToken();
  const baseUrl = process.env.REACT_APP_BASE_URL;

  const handleOpenCommentModal = (post, index = 0) => {
    navigate(`/post/${post.postId}`, { state: { background: location } });
  };

  const navigateUser = (userId) => {
    if (userId === getUserIdFromToken()) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  // Xác định class grid dựa trên số lượng media
  const getMediaGridClass = (post) => {
    const imageUrls = post.imageUrl ? post.imageUrl.split(",").map(url => url.trim()) : [];
    const hasVideo = !!post.videoUrl;
    const totalMedia = imageUrls.length + (hasVideo ? 1 : 0);
    const displayCount = Math.min(totalMedia, 4);

    return `media-container-share grid-${displayCount}`;
  };

  // Render media items với grid layout mới
  const renderMediaItems = (post) => {
    const imageUrls = post.imageUrl ? post.imageUrl.split(",").map(url => url.trim()) : [];
    const hasVideo = !!post.videoUrl;
    const totalMedia = imageUrls.length + (hasVideo ? 1 : 0);
    const displayCount = Math.min(totalMedia, 4);
    const hasMore = totalMedia > 4;

    if (totalMedia === 0) return null;

    // Tạo danh sách media hỗn hợp
    let mediaList = imageUrls.map(url => ({ 
      type: 'image', 
      url: url.startsWith("http") ? url : `${baseUrl}${url}` 
    }));
    if (hasVideo) {
      mediaList.push({ type: 'video', url: post.videoUrl });
    }

    return (
      <div className={getMediaGridClass(post)}>
        <div className="media-grid-share">
          {mediaList.slice(0, displayCount).map((media, index) => {
            const isLastDisplayed = index === 3;
            const isOverlayItem = isLastDisplayed && hasMore;

            const mediaContent = media.type === 'video' ? (
              <video 
                src={media.url} 
                controls 
                onClick={(e) => {
                  e.stopPropagation(); 
                  handleOpenCommentModal(post, index);
                }} 
              />
            ) : (
              <img 
                src={media.url} 
                alt={`Post media ${index}`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = dieImage;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCommentModal(post, index);
                }}
              />
            );

            return (
              <div key={index} className="media-item-share">
                {mediaContent}
                {isOverlayItem && (
                  <div 
                    className="more-images-overlay-share"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCommentModal(post, index);
                    }}
                  >
                    <span>+{totalMedia - 4}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Xác định trạng thái quyền riêng tư
  const getPrivacyStatus = (privacy) => {
    switch (privacy) {
      case 0:
        return "Công khai";
      case 1:
        return "Riêng tư";
      case 2:
        return "Bạn bè";
      default:
        return "Công khai";
    }
  };

  const privacyStatus = getPrivacyStatus(post.originalPost.scope);

  return (
    <div className="shared-post-container">
      <div className="post-share" key={post.id}>
        {/* Header Post */}
        <div className="header-post-share">
          <div className="AvaName-share">
            <img
              className="avtardefaut-share"
              src={post.originalPost.author.profilePicture || avatarWeb}
              alt="Avatar"
            />
            <div className="user-info-share">
              <strong
                onClick={() => navigateUser(post.originalPost.author.userId)}
              >
                {post.originalPost.author.userName || "University Sharing"}
              </strong>
              <div className="status-time-post-share">
                <span className="timePost-share">
                  {formatDistanceToNow(new Date(post.originalPost.createAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
                <span 
                  className="status-post-share"
                  data-privacy={privacyStatus}
                >
                  {privacyStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung bài viết */}
        <span className="content-posts-share">{post.originalPost.content}</span>

        {/* Media với grid layout mới */}
        {renderMediaItems(post.originalPost)}
      </div>
    </div>
  );
};

export default SharedPost;
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useEffect, useRef } from "react";
import "react-confirm-alert/src/react-confirm-alert.css";
import { FaHeart } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

// Actions & Reducers
import {
  fetchReportedPosts,
  fetchUserUserReports,
} from "../../../stores/action/adminActions";
import { openCommentModal } from "../../../stores/reducers/listPostReducers";
import getUserIdFromToken from "../../../utils/JwtDecode";

// Components
import AllReportFromUser from "./ReportFromUser";
import UserUserReport from "./UserUserReport";

// Assets & Styles
import avatarWeb from "../../../assets/AvatarDefault.png";
import "../../styles/AllReport.scss";

const AllReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const postsEndRef = useRef(null);

  // SỬA LỖI 1: Thêm giá trị mặc định để tránh undefined/null
  const { 
    reportedPosts = [], 
    userUserReports = [], 
    loading = false, 
    error 
  } = useSelector((state) => state.reportAdmintSlice || {});

  useEffect(() => {
    dispatch(fetchReportedPosts());
    dispatch(fetchUserUserReports());
  }, [dispatch]);

  const navigateUser = (userId) => {
    if (userId === getUserIdFromToken()) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const handleOpenCommentModal = (post, index = 0) => {
    dispatch(openCommentModal({ ...post, initialMediaIndex: index }));
    navigate(`/post/${post.id}`, { state: { background: location } });
  };

  const convertUTCToVNTime = (utcDate) => {
    if (!utcDate) return new Date();
    const date = new Date(utcDate);
    date.setHours(date.getHours() + 7);
    return date;
  };

  const getMediaContainerClass = (post) => {
    const imageCount = post.imageUrl ? post.imageUrl.split(",").length : 0;
    const hasVideo = !!post.videoUrl;
    const totalMedia = imageCount + (hasVideo ? 1 : 0);

    let className = "media-container";
    switch (totalMedia) {
      case 1:
        className += hasVideo ? " single-video" : " single-image";
        break;
      case 2:
        className += " two-items";
        if (hasVideo) className += " has-video";
        break;
      default:
        if (totalMedia >= 3) {
          className += " multi-items";
          if (hasVideo) className += " has-video";
        }
    }
    return className;
  };

  const renderMediaItems = (post) => {
    const imageUrls = post.imageUrl ? post.imageUrl.split(",") : [];
    const hasVideo = !!post.videoUrl;
    const totalMedia = imageUrls.length + (hasVideo ? 1 : 0);

    if (totalMedia === 0) return null;

    return (
      <div className={getMediaContainerClass(post)}>
        {imageUrls.map((url, index) => {
          const fullUrl = url.startsWith("http")
            ? url.trim()
            : `${process.env.REACT_APP_BASE_URL}${url.trim()}`;
            
          const showOverlay = totalMedia > 2 && index === (hasVideo ? 0 : 1);

          if (totalMedia > 2 && index > (hasVideo ? 0 : 1)) return null;
          if (hasVideo && index > 0) return null;

          return (
            <div 
              className="media-item" 
              key={`img-${index}`}
              onClick={() => handleOpenCommentModal(post, index)}
              style={{ cursor: 'pointer' }}
            >
              <img src={fullUrl} alt={`Post media ${index}`} />
              {showOverlay && (
                <div className="media-overlay">
                  +{totalMedia - (hasVideo ? 1 : 2)}
                </div>
              )}
            </div>
          );
        })}
        {hasVideo && (
          <div className="media-item video-item">
            <video controls>
              <source src={post.videoUrl} type="video/mp4" />
            </video>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="all-posts-report">
      {error && <div className="error-message">{error.message || error}</div>}
      
      {/* Báo cáo người dùng */}
      {Array.isArray(userUserReports) && userUserReports.length > 0 && (
        <UserUserReport reports={userUserReports} />
      )}

      {/* SỬA LỖI 2: Logic hiển thị báo cáo bài viết */}
      
        <>
          {reportedPosts.map((post) => (
            <div className="post-container" key={post.id}>
              <div className="post">
                <div className="header-post">
                  <div className="AvaName">
                    <img
                      className="avtardefaut"
                      src={
                        post?.profilePicture
                          ? `${process.env.REACT_APP_BASE_URL}${post.profilePicture}`
                          : avatarWeb
                      }
                      alt="Avatar"
                    />
                    <div className="user-info">
                      <strong onClick={() => navigateUser(post.userId)}>
                        {post.fullName}
                      </strong>
                      <div className="status-time-post">
                        <span className="timePost">
                          <FiClock size={12} style={{ marginRight: 4 }} />
                          {post.createdAt && formatDistanceToNow(
                            convertUTCToVNTime(post.createdAt),
                            {
                              addSuffix: true,
                              locale: { ...vi },
                              includeSeconds: true,
                            }
                          )}
                        </span>
                        <span className="status-post">
                          {post.scope === 0 ? "Công khai" : "Riêng tư"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-posts">{post.content}</div>

                {renderMediaItems(post)}

                <div className="post-actions-summary">
                  <div className="reactions" style={{ cursor: "pointer" }}>
                    <FaHeart className="like-icon" size={16} color="#f3425f" />
                    <span style={{ marginLeft: 4 }}>{post.likeCount}</span>
                  </div>
                  <div className="comments-shares">
                    <span style={{ cursor: "pointer", marginRight: 10 }}>
                      {post.commentCount} bình luận
                    </span>
                    <span style={{ cursor: "pointer" }}>
                      {post.shareCount} chia sẻ
                    </span>
                  </div>
                </div>
              </div>

              {/* Action xử lý báo cáo */}
              <AllReportFromUser reports={post.reports} postId={post.id} />
            </div>
          ))}
          
          <div ref={postsEndRef} className="load-more-indicator">
            {loading && <p>Đang tải thêm...</p>}
          </div>
        </>
      
      
      {/* Hiển thị loading khi mới vào trang và chưa có dữ liệu */}
      {loading && reportedPosts.length === 0 && (
         <div className="load-more-indicator">
            <p>Đang tải dữ liệu...</p>
         </div>
      )}
    </div>
  );
};

export default AllReport;
// AllPostHome.js - Phiên bản cập nhật
import { useCallback, useEffect, useRef, useState } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { FaHeart } from "react-icons/fa";
import {
  FiMessageSquare,
  FiMoreVertical,
  FiShare2
} from "react-icons/fi";
import avatarWeb from "../../assets/AvatarDefault.png";
import dieImage from "../../assets/Imgae Not found.png";
import { fetchLikes } from "../../stores/action/likeAction";
import { fetchShares } from "../../stores/action/shareAction";
import "../../styles/AllPosts.scss";
import "../../styles/MoblieReponsive/HomeViewMobile/AllpostMobile.scss";
import CommentModal from "../CommentModal";
import ShareModal from "../shareModal";
import SharedPost from "./SharingPost";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { debounce } from "lodash";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  deletePost,
  fetchPosts,
  fetchPostsByOtherUser,
  fetchPostsByOwner,
  likePost,
} from "../../stores/action/listPostActions";
import {
  closeCommentModal,
  closeInteractorModal,
  closeInteractorShareModal,
  closePostOptionModal,
  closeShareModal,
  openCommentModal,
  openInteractorModal,
  openInteractorShareModal,
  openPostOptionModal,
  openShareModal
} from "../../stores/reducers/listPostReducers";
import getUserIdFromToken from "../../utils/JwtDecode";
import InteractorModal from "../InteractorModal";
import InteractorShareModal from "../InteractorShareModal";
import PostOptionsModal from "./PostOptionModal";

const AllPosts = ({
  usersProfile,
  showOwnerPosts = false,
  isFriendProfile = false,
  userFriendId = null,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const postsEndRef = useRef(null);

  const {
    posts,
    hasMoreAllPosts,
    hasMoreOwnerPosts,
    selectedPost,
    isShareModalOpen,
    selectedPostToShare,
    selectedPostToOption,
    isPostOptionsOpen,
    isInteractorModalOpen,
    isInteractorShareModalOpen,
    selectedPostForInteractions,
    loading,
    loadingCreatePost,
    postLikes,
    likesLoading,
    likesError,
    postShares,
    sharesLoading,
    sharesError,
  } = useSelector((state) => state.posts);

  const hasMorePosts = showOwnerPosts ? hasMoreOwnerPosts : hasMoreAllPosts;
  const [lastPostId, setLastPostId] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});

  useEffect(() => {
    setLastPostId(null);

    if (showOwnerPosts) {
      if (isFriendProfile && userFriendId) {
        dispatch(fetchPostsByOtherUser({ userId: userFriendId }));
      } else {
        dispatch(fetchPostsByOwner());
      }
    } else {
      dispatch(fetchPosts());
    }
  }, [dispatch, showOwnerPosts, isFriendProfile, userFriendId]);

  useEffect(() => {
    if (posts.length > 0) {
      setLastPostId(posts[posts.length - 1].id);
    }
  }, [posts]);

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
  const loadMorePosts = useCallback(() => {
    if (loadingMore || !hasMorePosts || !lastPostId) return;

    setLoadingMore(true);

    if (isFriendProfile && userFriendId) {
      dispatch(
        fetchPostsByOtherUser({
          userId: userFriendId,
          lastPostId: lastPostId,
        })
      )
        .unwrap()
        .catch(() => {})
        .finally(() => setLoadingMore(false));
    } else {
      const fetchAction = showOwnerPosts ? fetchPostsByOwner : fetchPosts;
      dispatch(fetchAction(lastPostId))
        .unwrap()
        .catch(() => {})
        .finally(() => setLoadingMore(false));
    }
  }, [
    dispatch,
    lastPostId,
    loadingMore,
    hasMorePosts,
    showOwnerPosts,
    isFriendProfile,
    userFriendId,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );
    if (postsEndRef.current) observer.observe(postsEndRef.current);
    return () => {
      if (postsEndRef.current) observer.unobserve(postsEndRef.current);
    };
  }, [loadMorePosts]);

  const userId = getUserIdFromToken();
  const navigateUser = (userId) => {
    if (userId === getUserIdFromToken()) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  // Xử lý comment input
  const handleCommentTextChange = (postId, text) => {
    setCommentTexts(prev => ({
      ...prev,
      [postId]: text
    }));
  };

  const handleAddComment = (post) => {
    const commentText = commentTexts[post.id];
    if (commentText && commentText.trim()) {
      // Dispatch action để thêm comment
      console.log("Adding comment:", commentText, "to post:", post.id);
      // Reset input
      handleCommentTextChange(post.id, "");
    }
  };

  const handleKeyPress = (e, post) => {
    if (e.key === 'Enter') {
      handleAddComment(post);
    }
  };

  // Các hàm xử lý khác giữ nguyên
  const handleOpenCommentModal = (post, index = 0) => {
    dispatch(openCommentModal({ ...post, initialMediaIndex: index }));
    navigate(`/post/${post.id}`, { state: { background: location } });
  };

  const handleCloseCommentModal = () => {
    dispatch(closeCommentModal());
    navigate(-1);
  };

  const handleOpenPostOptions = (event, post) => {
    event.stopPropagation();
    const rect = event.target.getBoundingClientRect();
    dispatch(
      openPostOptionModal({
        post,
        position: { top: rect.bottom + 5, left: rect.left - 120 },
      })
    );
  };

  const handleDeletePost = debounce((postId) => {
    dispatch(deletePost(postId));
  }, 300);

  const confirmDelete = (postId) => {
    confirmAlert({
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa bài viết này không?",
      buttons: [
        { label: "Có", onClick: () => handleDeletePost(postId) },
        { label: "Không", onClick: () => console.log("Hủy xóa") },
      ],
    });
  };

  const handleLikePost = (postId) => {
    dispatch(likePost(postId));
  };

  const handleOpenInteractorModal = async (post) => {
    if (!postLikes[post.id]) {
      await dispatch(fetchLikes({ postId: post.id }));
    }
    dispatch(openInteractorModal(post));
  };

  const handleCloseInteractorModal = () => {
    dispatch(closeInteractorModal());
  };

  const handleOpenInteractorShareModal = async (post) => {
    if (!postShares[post.id]) {
      await dispatch(fetchShares({ postId: post.id }));
    }
    dispatch(openInteractorShareModal(post));
  };

  const handleCloseInteractorShareModal = () => {
    dispatch(closeInteractorShareModal());
  };

  const convertUTCToVNTime = (utcDate) => {
    const date = new Date(utcDate);
    date.setHours(date.getHours() + 7);
    return date;
  };

const getMediaContainerClass = (post) => {
  const imageCount = post.imageUrl ? post.imageUrl.split(",").length : 0;
  const hasVideo = !!post.videoUrl;
  const totalMedia = imageCount + (hasVideo ? 1 : 0);

  let className = "media-container";

  if (totalMedia === 1) {
    className += hasVideo ? " single-video" : " single-image";
  } else if (totalMedia === 2) {
    className += " two-items";
    if (hasVideo) className += " has-video";
  } else if (totalMedia >= 3) {
    className += " multi-items";
    if (hasVideo) className += " has-video";
  }

  return className;
};

const renderMediaItems = (post) => {
  const imageUrls = post.imageUrl ? post.imageUrl.split(",").map(url => url.trim()) : [];
  const hasVideo = !!post.videoUrl;
  const totalMedia = imageUrls.length + (hasVideo ? 1 : 0);
  const baseUrl = process.env.REACT_APP_BASE_URL;

  if (totalMedia === 0) return null;

  // Xác định chỉ số của item sẽ hiển thị overlay (+X)
  const overlayIndex = hasVideo ? 1 : 2; // ảnh thứ 2 khi có video, ảnh thứ 3 khi không có video
  const overlayCount = totalMedia - (hasVideo ? 2 : 3); // số lượng còn lại

  return (
    <div className={getMediaContainerClass(post)}>
      {/* Render tối đa 2 ảnh (hoặc 1 ảnh nếu có video) */}
      {imageUrls.slice(0, hasVideo ? 1 : 2).map((url, index) => {
        const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

        const isOverlayItem = index === overlayIndex && totalMedia > (hasVideo ? 2 : 3);

        return (
          <div className="media-item" key={`img-${index}`}>
            <img
              src={fullUrl}
              alt={`Post media ${index}`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = dieImage;
              }}
              onClick={() => handleOpenCommentModal(post, index)}
            />
            {isOverlayItem && (
              <div
                className="media-overlay"
                onClick={() => handleOpenCommentModal(post, index)}
              >
                +{overlayCount}
              </div>
            )}
          </div>
        );
      })}

      {/* Video luôn hiển thị cuối cùng (nếu có) */}
      {hasVideo && (
        <div className="media-item video-item">
          <video
            controls
            onClick={() => handleOpenCommentModal(post, imageUrls.length)}
          >
            <source src={post.videoUrl} type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );
};

  return (
    <div className="all-posts">
      {Array.isArray(posts) && posts.length > 0 ? (
        <>
          {posts.map((post) => (
            <div className="post" key={post.id}>
              <div className="header-post">
                <div className="AvaName">
                  <img
                    className="avtardefaut"
                    src={post.profilePicture || avatarWeb}
                    alt="Avatar"
                    onClick={() => navigateUser(post.userId)}
                  />
                  <div className="user-info">
                    <strong onClick={() => navigateUser(post.userId)}>
                      {post.fullName}
                    </strong>
                    <div className="status-time-post">
                      <span className="timePost">
                        {formatDistanceToNow(
                          convertUTCToVNTime(post.createdAt),
                          {
                            addSuffix: true,
                            locale: {
                              ...vi,
                              formatDistance: (token, count) => {
                                switch (token) {
                                  case "lessThanXSeconds": return "vài giây trước";
                                  case "xSeconds": return `${count} giây trước`;
                                  case "halfAMinute": return "30 giây trước";
                                  case "lessThanXMinutes": return `${count} phút trước`;
                                  case "xMinutes": return `${count} phút trước`;
                                  case "aboutXHours": return `${count} giờ trước`;
                                  case "xHours": return `${count} giờ trước`;
                                  case "xDays": return `${count} ngày trước`;
                                  case "aboutXMonths": return `${count} tháng trước`;
                                  case "xMonths": return `${count} tháng trước`;
                                  case "aboutXYears": return `${count} năm trước`;
                                  case "xYears": return `${count} năm trước`;
                                  default: return "";
                                }
                              },
                            },
                            includeSeconds: true,
                          }
                        )}
                      </span>
                      {/* Thêm trạng thái quyền riêng tư */}
                      <span 
                        className="status-post"
                        data-privacy={getPrivacyStatus(post.scope)}
                      >
                        {getPrivacyStatus(post.scope)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="post-actions">
                  <FiMoreVertical
                    className="btn-edit"
                    size={20}
                    onClick={(event) => handleOpenPostOptions(event, post)}
                  />
                </div>
              </div>

              <div className="content-posts">{post.content}</div>

              {post.isSharedPost && (
                <div className="Share-Post-origigin">
                  <SharedPost post={post} />
                </div>
              )}

              {/* MEDIA POST (IMAGES/VIDEOS) - Logic MỚI đã sửa lỗi */}
                {(post.imageUrl || post.videoUrl) && (() => {
                  // 1. Phân tích dữ liệu media
                  const baseUrl = process.env.REACT_APP_BASE_URL;
                  const imageURLs = post.imageUrl ? post.imageUrl.split(",").map(url => url.trim()) : [];
                  const videoURL = post.videoUrl;
                  
                  // Tạo danh sách media hỗn hợp (images + video, nếu có)
                  let mediaList = imageURLs.map(url => ({ 
                    type: 'image', 
                    url: url.startsWith("http") ? url : `${baseUrl}${url}` 
                  }));
                  if (videoURL) {
                    mediaList.push({ type: 'video', url: videoURL });
                  }

                  const totalMedia = mediaList.length;
                  const displayCount = Math.min(totalMedia, 4); // Chỉ hiển thị tối đa 4 item
                  const hasMore = totalMedia > 4;

                  if (totalMedia === 0) return null;

                  return (
                    <div className={`media-container grid-${displayCount}`}> {/* Class grid-1, grid-2, grid-3, hoặc grid-4 */}
                      <div className="media-grid">
                        {mediaList.slice(0, displayCount).map((media, index) => {
                          
                          const isLastDisplayed = index === 3; // Item cuối cùng hiển thị (vị trí thứ 4)
                          const isOverlayItem = isLastDisplayed && hasMore; 
                          
                          const mediaContent = media.type === 'video' ? (
                            <video src={media.url} controls onClick={(e) => {e.stopPropagation(); handleOpenCommentModal(post, index);}} />
                          ) : (
                            <img 
                              src={media.url} 
                              alt={`Post media ${index}`} 
                              onError={(e) => { e.target.onerror = null; e.target.src = dieImage; }} 
                              onClick={(e) => {e.stopPropagation(); handleOpenCommentModal(post, index);}}
                            />
                          );

                          return (
                            <div 
                              key={index} 
                              className="media-item" 
                              // Bỏ onClick ở media-item vì đã có ở mediaContent và overlay
                            >
                              {mediaContent}
                              
                              {/* Hiển thị OVERLAY trên item thứ 4 nếu có nhiều hơn 4 media */}
                              {isOverlayItem && (
                                <div 
                                  className="more-images-overlay" 
                                  onClick={(e) => { e.stopPropagation(); handleOpenCommentModal(post, index); }}
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
                })()}

              <div className="post-actions-summary">
                <div 
                  className="action-stat" 
                  onClick={() => handleOpenInteractorModal(post)}
                >
                  <FaHeart className="like-icon" />
                  <span>{post.likeCount}</span>
                </div>
                <div 
                  className="action-stat" 
                  onClick={() => handleOpenCommentModal(post, 0)}
                >
                  <FiMessageSquare />
                  <span>{post.commentCount}</span>
                </div>
                <div 
                  className="action-stat" 
                  onClick={() => dispatch(openShareModal(post))}
                >
                  <FiShare2 />
                  <span>{post.shareCount}</span>
                </div>
              
              {/* NÚT LIKE ĐỘC LẬP (BÊN PHẢI) */}
                <div 
                  className="action-button-like" 
                  onClick={() => handleLikePost(post.id)}
                >
                  {/* Sử dụng FaHeart, có thể thêm class để đổi màu khi đã like */}
                  <FaHeart 
                  // Dùng post.isLikedByCurrentUser để thêm class 'liked'
                  // Nếu true, class 'liked' được thêm vào và CSS sẽ chuyển màu đỏ
                  className={`like-button ${post.hasLiked ? 'liked' : ''}`}
              />
                </div>
              </div>
              {/* Inline Comment Input */}
              <div className="inline-comment-input">
                <img
                  src={usersProfile?.profilePicture || avatarWeb}
                  alt="User Avatar"
                  className="mini-avatar"
                />
                <div className="comment-input-wrapper">
                  <input
                    type="text"
                    placeholder="Write your comment..."
                    className="comment-text-input"
                    value={commentTexts[post.id] || ""}
                    onChange={(e) => handleCommentTextChange(post.id, e.target.value)}
                    onClick={() => handleOpenCommentModal(post, 0)}
                    onKeyPress={(e) => handleKeyPress(e, post)}
                  />
                  <BsEmojiSmile className="emoji-icon" />
                </div>
              </div>
            </div>
          ))}

          <div ref={postsEndRef} className="load-more-indicator">
            {loadingMore && <p>Đang tải thêm bài viết...</p>}
          </div>
        </>
      ) : (
        <div className="no-posts">
          <p>Không có bài viết nào.</p>
        </div>
      )}

      {/* Các modal giữ nguyên */}
      {isPostOptionsOpen && selectedPostToOption && (
        <PostOptionsModal
          isOwner={userId === selectedPostToOption.post.userId}
          onClose={() => dispatch(closePostOptionModal())}
          position={selectedPostToOption.position}
          postId={selectedPostToOption.post.id}
          handleDeletePost={confirmDelete}
          post={selectedPostToOption.post}
        />
      )}

      {selectedPost && location.pathname.includes(`/post/${selectedPost.id}`) && (
        <CommentModal
          post={selectedPost}
          onClose={handleCloseCommentModal}
          usersProfile={usersProfile}
        />
      )}

      {selectedPostToShare && (
        <ShareModal
          post={selectedPostToShare}
          isOpen={isShareModalOpen}
          onClose={() => dispatch(closeShareModal())}
          usersProfile={usersProfile}
        />
      )}

      {isInteractorModalOpen && selectedPostForInteractions && (
        <InteractorModal
          isOpen={isInteractorModalOpen}
          onClose={handleCloseInteractorModal}
          likesData={postLikes[selectedPostForInteractions.id]}
          isLoading={likesLoading}
          error={likesError}
          postId={selectedPostForInteractions.id}
        />
      )}

      {isInteractorShareModalOpen && selectedPostForInteractions && (
        <InteractorShareModal
          isOpen={isInteractorShareModalOpen}
          onClose={handleCloseInteractorShareModal}
          sharesData={postShares[selectedPostForInteractions.id]}
          isLoading={sharesLoading}
          error={sharesError}
          postId={selectedPostForInteractions.id}
        />
      )}
    </div>
  );
};

export default AllPosts;
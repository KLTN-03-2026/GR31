// File: components/Materials/StudyMaterialDetailModal.js

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  FaBook,
  FaCalendar,
  FaDownload,
  FaEdit,
  FaEye,
  FaFile,
  FaFileArchive,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaGraduationCap,
  FaStar,
  FaThumbsUp,
  FaTimes,
  FaTrash,
  FaUniversity
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createMaterialReview,
  deleteMaterialReview,
  fetchMaterialReviews,
  updateMaterialReview
} from "../../stores/action/materialReviewAction";
import { fetchStudyMaterialDetail } from "../../stores/action/studyMaterialAction";
import "../../styles/Material/StudyMaterialDetail.scss";
import getUserIdFromToken from '../../utils/JwtDecode';
import CreateReviewModal from "./CreateReviewModal";
import UpdateReviewModal from "./UpdateReviewModal";

// File type mapping for icons
const FILE_TYPE_ICONS = {
  pdf: <FaFilePdf className="file-icon pdf" />,
  doc: <FaFileWord className="file-icon word" />,
  docx: <FaFileWord className="file-icon word" />,
  xls: <FaFileExcel className="file-icon excel" />,
  xlsx: <FaFileExcel className="file-icon excel" />,
  jpg: <FaFileImage className="file-icon image" />,
  jpeg: <FaFileImage className="file-icon image" />,
  png: <FaFileImage className="file-icon image" />,
  gif: <FaFileImage className="file-icon image" />,
  zip: <FaFileArchive className="file-icon archive" />,
  rar: <FaFileArchive className="file-icon archive" />,
  '7z': <FaFileArchive className="file-icon archive" />,
};

const STATUS_CONFIG = {
  Pending: { color: '#FFA500', label: 'Đang chờ duyệt' },
  Approved: { color: '#4CAF50', label: 'Đã duyệt' },
  Rejected: { color: '#F44336', label: 'Đã từ chối' },
};

const RATING_CONFIG = {
  1: { label: 'Rất tệ', color: '#f44336' },
  2: { label: 'Tệ', color: '#ff9800' },
  3: { label: 'Bình thường', color: '#ffc107' },
  4: { label: 'Tốt', color: '#8bc34a' },
  5: { label: 'Rất tốt', color: '#4caf50' },
};

const StudyMaterialDetailModal = ({ isOpen, onClose, materialId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux selectors
  const materialDetail = useSelector((state) => state.studyMaterials?.materialDetail || {});
  const reviewState = useSelector((state) => state.materialReviews || {});
  const { reviews = [], loading: reviewsLoading, nextCursor } = reviewState;

  const currentUserId = getUserIdFromToken();
  
  // Local states
  const [isCreateReviewModalOpen, setIsCreateReviewModalOpen] = useState(false);
  const [isUpdateReviewModalOpen, setIsUpdateReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState(new Set());

  // Check if current user is owner of material
  const isMaterialOwner = materialDetail.userId === currentUserId;

  // Get file icon based on extension
  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return <FaFile className="file-icon default" />;
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    return FILE_TYPE_ICONS[extension] || <FaFile className="file-icon default" />;
  };

  // Get file name from URL
  const getFileName = (fileUrl) => {
    if (!fileUrl) return 'Không có tên file';
    return fileUrl.split('/').pop() || 'File đính kèm';
  };

  // Handle download file
  const handleDownload = async (fileUrl) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', '');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Đang tải file xuống...');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Lỗi khi tải file');
    }
  };

  // Handle user profile navigation
  const navigateUser = (userId) => {
    const currentUserId = localStorage.getItem('userId');
    if (userId === currentUserId) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle review expansion
  const toggleReviewExpansion = (reviewId) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  // Handle create review
  const handleCreateReview = (reviewData) => {
    dispatch(createMaterialReview({
      studyMaterialId: materialId,
      ...reviewData
    })).then((result) => {
      if (!result.error) {
        setIsCreateReviewModalOpen(false);
      }
    });
  };

  // Handle edit review
  const handleEditReview = (review) => {
    setSelectedReview(review);
    setIsUpdateReviewModalOpen(true);
  };

  // Handle update review
  const handleUpdateReview = (reviewData) => {
    dispatch(updateMaterialReview({
      reviewId: selectedReview.id,
      ...reviewData
    })).then((result) => {
      if (!result.error) {
        setIsUpdateReviewModalOpen(false);
        setSelectedReview(null);
      }
    });
  };

  // Handle delete review
  const handleDeleteReview = (reviewId) => {
    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?");
    if (isConfirmed) {
      dispatch(deleteMaterialReview(reviewId));
    }
  };

  // Check if current user is review owner
  const isReviewOwner = (review) => {
    return review.userId === currentUserId;
  };

  // Check if user has already reviewed
  const hasUserReviewed = useMemo(() => {
    return reviews.some(review => review.userId === currentUserId);
  }, [reviews, currentUserId]);

  // Load more reviews
  const handleLoadMore = () => {
    if (nextCursor) {
      dispatch(fetchMaterialReviews({
        studyMaterialId: materialId,
        lastStudyMaterialRatingId: nextCursor,
        pageSize: 10
      }));
    }
  };

  // Close modal handler
  const handleClose = () => {
    onClose();
    // Reset states when closing
    setExpandedReviews(new Set());
    setSelectedReview(null);
  };

  // Fetch material detail and reviews when modal opens
  useEffect(() => {
    if (isOpen && materialId) {
      dispatch(fetchStudyMaterialDetail(materialId));
      dispatch(fetchMaterialReviews({
        studyMaterialId: materialId,
        lastStudyMaterialRatingId: null,
        pageSize: 10
      }));
    }
  }, [dispatch, materialId, isOpen]);

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar 
        key={index}
        className={`star ${index < rating ? 'filled' : 'empty'}`}
      />
    ));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="study-material-detail-modal" onClick={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <button className="close-modal-btn" onClick={handleClose}>
            <FaTimes />
          </button>

          {/* Material Detail Section */}
          <div className="modal-content">
            <div className="material-detail-section">
              {/* Header with status */}
              <div className="material-header">
                <div className="title-section">
                  <h1 className="material-title">
                    {materialDetail.title?.replace(/"/g, '') || 'Không có tiêu đề'}
                  </h1>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: STATUS_CONFIG[materialDetail.approvalStatus]?.color || '#666' }}
                  >
                    {STATUS_CONFIG[materialDetail.approvalStatus]?.label || materialDetail.approvalStatus}
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="stats-overview">
                  <div className="stat">
                    <FaStar className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-value">{materialDetail.averageRating?.toFixed(1) || '0.0'}</span>
                      <span className="stat-label">Đánh giá</span>
                    </div>
                  </div>
                  <div className="stat">
                    <FaDownload className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-value">{materialDetail.downloadCount || 0}</span>
                      <span className="stat-label">Lượt tải</span>
                    </div>
                  </div>
                  <div className="stat">
                    <FaEye className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-value">{materialDetail.viewCount || 0}</span>
                      <span className="stat-label">Lượt xem</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Information */}
              <div className="meta-section">
                <div className="meta-item">
                  <FaBook className="meta-icon" />
                  <div className="meta-content">
                    <span className="meta-label">Môn học</span>
                    <span className="meta-value">{materialDetail.subject?.replace(/"/g, '') || 'N/A'}</span>
                  </div>
                </div>
                <div className="meta-item">
                  <FaUniversity className="meta-icon" />
                  <div className="meta-content">
                    <span className="meta-label">Khoa</span>
                    <span className="meta-value">{materialDetail.faculty?.replace(/"/g, '') || 'N/A'}</span>
                  </div>
                </div>
                <div className="meta-item">
                  <FaGraduationCap className="meta-icon" />
                  <div className="meta-content">
                    <span className="meta-label">Học kỳ</span>
                    <span className="meta-value">{materialDetail.semester?.replace(/"/g, '') || 'N/A'}</span>
                  </div>
                </div>
                <div className="meta-item">
                  <FaCalendar className="meta-icon" />
                  <div className="meta-content">
                    <span className="meta-label">Ngày đăng</span>
                    <span className="meta-value">{formatDate(materialDetail.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="description-section">
                <h3 className="section-title">Mô tả</h3>
                <div className="description-content">
                  {materialDetail.description?.replace(/"/g, '') || 'Không có mô tả'}
                </div>
              </div>

              {/* File Attachments */}
              <div className="files-section">
                <h3 className="section-title">File đính kèm ({materialDetail.fileUrls?.length || 0})</h3>
                <div className="files-grid">
                  {materialDetail.fileUrls?.map((fileUrl, index) => (
                    <div key={index} className="file-card">
                      <div className="file-header">
                        {getFileIcon(fileUrl)}
                        <span className="file-name">{getFileName(fileUrl)}</span>
                      </div>
                      <button 
                        onClick={() => handleDownload(fileUrl)}
                        className="download-btn"
                        title="Tải xuống"
                      >
                        <FaDownload />
                      </button>
                    </div>
                  ))}
                  {(!materialDetail.fileUrls || materialDetail.fileUrls.length === 0) && (
                    <div className="no-files">Không có file đính kèm</div>
                  )}
                </div>
              </div>

              {/* Author Information */}
              <div className="author-section">
                <h3 className="section-title">Người đăng</h3>
                <div className="author-card">
                  <img 
                    src={`${process.env.REACT_APP_BASE_URL || ''}${materialDetail.profilePicture || '/default-avatar.png'}`}
                    alt="Avatar"
                    className="author-avatar"
                    onClick={() => navigateUser(materialDetail.userId)}
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div className="author-info">
                    <span 
                      className="author-name"
                      onClick={() => navigateUser(materialDetail.userId)}
                    >
                      {materialDetail.userName || 'Người dùng'}
                    </span>
                    <span className="author-trust-score">
                      Điểm tin cậy: {materialDetail.trustScore || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
              <div className="reviews-header">
                <h2 className="section-title">Đánh giá ({reviews.length})</h2>
                {!hasUserReviewed && !isMaterialOwner && (
                  <button 
                    className="create-review-btn"
                    onClick={() => setIsCreateReviewModalOpen(true)}
                  >
                    <FaEdit />
                    Viết đánh giá
                  </button>
                )}
              </div>

              {/* Reviews List */}
              <div className="reviews-list">
                {reviewsLoading && reviews.length === 0 ? (
                  <div className="loading-reviews">
                    <div className="loading-spinner"></div>
                    <p>Đang tải đánh giá...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="no-reviews">
                    <FaStar className="no-reviews-icon" />
                    <h4>Chưa có đánh giá nào</h4>
                    <p>Hãy là người đầu tiên đánh giá tài liệu này</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <img 
                            src={`${process.env.REACT_APP_BASE_URL || ''}${review.userAvatarUrl || '/default-avatar.png'}`}
                            alt="Avatar"
                            className="reviewer-avatar"
                            onClick={() => navigateUser(review.userId)}
                            onError={(e) => {
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                          <div className="reviewer-details">
                            <span 
                              className="reviewer-name"
                              onClick={() => navigateUser(review.userId)}
                            >
                              {review.userName || 'Người dùng'}
                            </span>
                            <span className="review-date">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                        {isReviewOwner(review) && (
                          <div className="review-actions">
                            <button 
                              onClick={() => handleEditReview(review)}
                              className="action-btn edit"
                              title="Chỉnh sửa"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              onClick={() => handleDeleteReview(review.id)}
                              className="action-btn delete"
                              title="Xóa"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="review-content">
                        <div className="rating-section">
                          <div className="stars">
                            {renderStars(review.ratingLevel)}
                          </div>
                          <span 
                            className="rating-label"
                            style={{ color: RATING_CONFIG[review.ratingLevel]?.color }}
                          >
                            {RATING_CONFIG[review.ratingLevel]?.label}
                          </span>
                          {review.isHelpful && (
                            <div className="helpful-badge">
                              <FaThumbsUp />
                              Hữu ích
                            </div>
                          )}
                        </div>

                        {review.comment && (
                          <div className="comment-section">
                            <p className={expandedReviews.has(review.id) ? 'expanded' : 'collapsed'}>
                              {review.comment}
                            </p>
                            {review.comment.length > 200 && (
                              <button 
                                className="expand-btn"
                                onClick={() => toggleReviewExpansion(review.id)}
                              >
                                {expandedReviews.has(review.id) ? 'Thu gọn' : 'Xem thêm'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Load More Reviews */}
              {nextCursor && (
                <div className="load-more-section">
                  <button 
                    onClick={handleLoadMore}
                    className="load-more-btn"
                    disabled={reviewsLoading}
                  >
                    {reviewsLoading ? 'Đang tải...' : 'Tải thêm đánh giá'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateReviewModal 
        isOpen={isCreateReviewModalOpen}
        onClose={() => setIsCreateReviewModalOpen(false)}
        onSubmit={handleCreateReview}
        loading={reviewsLoading}
      />

      <UpdateReviewModal 
        isOpen={isUpdateReviewModalOpen}
        onClose={() => {
          setIsUpdateReviewModalOpen(false);
          setSelectedReview(null);
        }}
        onSubmit={handleUpdateReview}
        review={selectedReview}
        loading={reviewsLoading}
      />
    </>
  );
};

export default StudyMaterialDetailModal;
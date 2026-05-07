// File: components/AccommodationComponent/AccommodationReviews.js

import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaEdit, FaRegStar, FaStar, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import {
  createAccommodationReview,
  deleteAccommodationReview,
  fetchAccommodationReviews,
  updateAccommodationReview
} from "../../stores/action/accommodationReviewAction";
import "../../styles/Accommodation/AccommodationReviews.scss";
import getUserIdFromToken from '../../utils/JwtDecode';
  const baseUrl = process.env.REACT_APP_BASE_URL;
const AccommodationReviews = ({ postId, show, onToggle }) => {
  const dispatch = useDispatch();
  
  // FIX: Thêm fallback value để tránh undefined
  const { reviews = [], loading, error } = useSelector(
    (state) => state.accommodationReviews || {}
  );

  const currentUserId = getUserIdFromToken();

  // Local states
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '', safetyScore: null, priceScore: null });
  const [editReview, setEditReview] = useState({ rating: 0, comment: '' });
  const navigate = useNavigate();
  // Fetch reviews when postId or show changes
  useEffect(() => {
    if (show && postId) {
      console.log('🔄 Fetching reviews for postId:', postId);
      dispatch(fetchAccommodationReviews({ postId, lastReviewId: null, pageSize: 50 }));
    }
  }, [dispatch, postId, show]);
    const navigateUser = (userId) => {
    if (userId === getUserIdFromToken()) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };
  // Render stars for rating
  const renderStars = (rating, onClick = null, isEditable = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const starProps = {
        key: i,
        className: "star",
        onClick: onClick ? () => onClick(i) : undefined,
        style: { cursor: isEditable ? 'pointer' : 'default' }
      };
      if (rating >= i) {
        stars.push(<FaStar {...starProps} />);
      } else {
        stars.push(<FaRegStar {...starProps} />);
      }
    }
    return stars;
  };

  // Handle star click for new review
  const handleStarClick = (rating) => {
    setNewReview(prev => ({ ...prev, rating }));
  };

  // Handle star click for edit review
  const handleEditStarClick = (rating) => {
    setEditReview(prev => ({ ...prev, rating }));
  };

  // Submit new review
  const handleSubmitNewReview = async () => {
    if (!newReview.rating || !postId) {
      toast.error("Vui lòng chọn đánh giá và nhập bình luận nếu muốn.");
      return;
    }
    try {
      await dispatch(createAccommodationReview({
        accommodationPostId: postId,
        userId: currentUserId,
        rating: newReview.rating,
        comment: newReview.comment.trim() || null,
        safetyScore: newReview.safetyScore,
        priceScore: newReview.priceScore
      })).unwrap();
      setNewReview({ rating: 0, comment: '', safetyScore: null, priceScore: null });
      setIsAddingReview(false);
      // Refetch reviews
      dispatch(fetchAccommodationReviews({ postId, lastReviewId: null, pageSize: 50 }));
    } catch (error) {
      toast.error("Lỗi khi tạo đánh giá");
    }
  };

  // Start editing a review
  const handleStartEdit = (review) => {
    setEditingReviewId(review.id);
    setEditReview({ rating: review.rating, comment: review.comment || '' });
  };

  // Submit edit review
  const handleSubmitEditReview = async () => {
    if (!editReview.rating) {
      toast.error("Vui lòng chọn đánh giá.");
      return;
    }
    try {
      await dispatch(updateAccommodationReview({
        id: editingReviewId,
        rating: editReview.rating,
        comment: editReview.comment.trim() || null
      })).unwrap();
      setEditingReviewId(null);
      setEditReview({ rating: 0, comment: '' });
      // Refetch reviews
      dispatch(fetchAccommodationReviews({ postId, lastReviewId: null, pageSize: 50 }));
    } catch (error) {
      toast.error("Lỗi khi cập nhật đánh giá");
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      await dispatch(deleteAccommodationReview(reviewId)).unwrap();
      // Refetch reviews
      dispatch(fetchAccommodationReviews({ postId, lastReviewId: null, pageSize: 50 }));
    } catch (error) {
      toast.error("Lỗi khi xóa đánh giá");
    }
  };

  //if (!show) return null;

  // FIX: Thêm kiểm tra reviews tồn tại trước khi tính toán
  const safeReviews = reviews || [];
  const averageRating = safeReviews.length > 0 
    ? (safeReviews.reduce((sum, r) => sum + r.rating, 0) / safeReviews.length).toFixed(1)
    : 0;

  console.log('🔍 AccommodationReviews Debug:', {
    postId,
    show,
    reviewsCount: safeReviews.length,
    loading,
    error
  });

  return (
    <div className="reviews-section">
      <div className="reviews-header" onClick={onToggle}>
        <span className="reviews-title">
          {show ? <FaChevronUp /> : <FaChevronDown />} Đánh giá và bình luận 
        </span>
        {averageRating > 0 && (
          <span className="average-rating">
            {averageRating}/5
          </span>
        )}
      </div>

      {show && (
        <div className="reviews-content">
          {loading ? (
            <div className="loading-reviews">Đang tải đánh giá...</div>
          ) : error ? (
            <div className="error-reviews">Lỗi: {error}</div>
          ) : safeReviews.length === 0 ? (
            <div className="no-reviews">
              <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            <div className="reviews-list">
              {safeReviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <img 
                      src={`${baseUrl}${review.userAvatar || '/default-avatar.png'}`}
                      alt={review.userName} 
                      className="reviewer-avatar"
                      onClick={() => navigateUser(review.userId)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div className="reviewer-info">
                      <span className="reviewer-name" onClick={() => navigateUser(review.userId)}
                      style={{ cursor: 'pointer' }} >{review.userName}</span>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    {review.userId === currentUserId && (
                      <div className="review-actions">
                        <button 
                          className="edit-btn" 
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(review); }}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteReview(review.id); }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="review-body">
                    {editingReviewId === review.id ? (
                      <div className="edit-form">
                        <div className="rating-stars">
                          {renderStars(editReview.rating, handleEditStarClick, true)}
                        </div>
                        <textarea
                          className="edit-comment"
                          value={editReview.comment}
                          onChange={(e) => setEditReview(prev => ({ ...prev, comment: e.target.value }))}
                          placeholder="Nhập bình luận..."
                          rows="3"
                        />
                        <div className="edit-buttons">
                          <button className="save-btn" onClick={handleSubmitEditReview}>
                            Lưu
                          </button>
                          <button 
                            className="cancel-btn" 
                            onClick={() => { setEditingReviewId(null); setEditReview({ rating: 0, comment: '' }); }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rating-stars">
                          {renderStars(review.rating)}
                        </div>
                        {review.comment && <p className="review-comment">{review.comment}</p>}
                      </>
                    )}
                  </div>
                  {/* {review.isApproved === false && (
                    <div className="review-status">Chờ duyệt</div>
                  )} */}
                </div>
              ))}
            </div>
          )}

          {/* Add New Review Form */}
          <div className="add-review-section">
            <button 
              className="add-review-btn" 
              onClick={() => setIsAddingReview(!isAddingReview)}
            >
              {isAddingReview ? 'Hủy' : 'Viết đánh giá'}
            </button>
            {isAddingReview && (
              <div className="new-review-form">
                <div className="rating-stars">
                  {renderStars(newReview.rating, handleStarClick, true)}
                </div>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  rows="3"
                  className="new-comment"
                />
                
                <button className="submit-review-btn" onClick={handleSubmitNewReview}>
                  Gửi đánh giá
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccommodationReviews;
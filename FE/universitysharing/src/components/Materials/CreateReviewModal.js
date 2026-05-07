// File: components/Materials/CreateReviewModal.js

import { useState } from "react";
import { FaStar, FaThumbsUp, FaTimes } from "react-icons/fa";
import "../../styles/Material/CreateReviewModal.scss";

const CreateReviewModal = ({ isOpen, onClose, onSubmit, loading = false }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isHelpful, setIsHelpful] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Vui lòng chọn số sao đánh giá");
      return;
    }

    onSubmit({
      ratingLevel: rating,
      comment: comment.trim(),
      isHelpful
    });

    // Reset form
    setRating(0);
    setComment("");
    setIsHelpful(false);
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    setIsHelpful(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay review-modal-overlay" onClick={handleClose}>
      <div className="create-review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={handleClose}>
          <FaTimes />
        </button>

        <div className="modal-header">
          <h2>Viết đánh giá</h2>
          <p>Chia sẻ trải nghiệm của bạn về tài liệu này</p>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          {/* Rating Section */}
          <div className="form-section">
            <label className="form-label">Đánh giá của bạn *</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="star-btn"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <FaStar
                    className={`star ${
                      star <= (hoverRating || rating) ? "filled" : "empty"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>Rất tệ</span>
              <span>Rất tốt</span>
            </div>
          </div>

          {/* Comment Section */}
          <div className="form-section">
            <label className="form-label">Nhận xét</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ chi tiết về trải nghiệm của bạn với tài liệu này..."
              className="comment-textarea"
              rows="4"
              maxLength="500"
            />
            <div className="char-count">{comment.length}/500</div>
          </div>

          {/* Helpful Section */}
          <div className="form-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isHelpful}
                onChange={(e) => setIsHelpful(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkmark"></span>
              <div className="checkbox-content">
                <FaThumbsUp className="thumbs-up-icon" />
                <div>
                  <div className="checkbox-title">Đánh dấu là hữu ích</div>
                  <div className="checkbox-description">
                    Tài liệu này có giúp ích cho việc học của bạn không?
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="cancel-btn"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || rating === 0}
            >
              {loading ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReviewModal;
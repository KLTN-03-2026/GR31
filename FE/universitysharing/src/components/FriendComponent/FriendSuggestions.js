import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  sendFriendRequest,
  cancelFriendRequest,
} from "../../stores/action/friendAction";
import "../../styles/FriendViews/FriendViewComponent.scss";
import "../../styles/FriendViews/SearchBox.scss";
import AvatarDefault from "../../assets/AvatarDefaultFill.png";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import getUserIdFromToken from "../../utils/JwtDecode";

const FriendSuggestions = ({
  suggestions,
  loading,
  error,
  hasMore,
  onLoadMore,
}) => {
  const dispatch = useDispatch();
  const [localSuggestions, setLocalSuggestions] = useState(suggestions);
  const [isProcessing, setIsProcessing] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const userId = getUserIdFromToken();

  useEffect(() => {
    setLocalSuggestions(suggestions);
  }, [suggestions]);

  const navigateUser = (userId) => {
    if (userId === getUserIdFromToken()) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const handleFriendRequest = async (suggestionId, isPending) => {
    if (isProcessing[suggestionId]) return;

    setIsProcessing((prev) => ({ ...prev, [suggestionId]: true }));

    try {
      if (isPending) {
        // Cancel friend request
        await dispatch(cancelFriendRequest(suggestionId)).unwrap();
        toast.success("Đã hủy lời mời kết bạn", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        // Send friend request
        await dispatch(sendFriendRequest(suggestionId)).unwrap();
        toast.success("Đã gửi lời mời kết bạn", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      // Update local state
      setLocalSuggestions((prev) =>
        prev.map((suggestion) =>
          suggestion.id === suggestionId
            ? { ...suggestion, isPending: !isPending }
            : suggestion
        )
      );
    } catch (error) {
      toast.error(error.message || "Thao tác thất bại", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsProcessing((prev) => ({ ...prev, [suggestionId]: false }));
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredSuggestions = localSuggestions.filter((suggestion) =>
    suggestion.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="friend-request-container">
      <h3 className="friend-request-title">Gợi ý kết bạn</h3>
      <div className="search-box-friend">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm gợi ý theo tên..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {error && <div className="error-message">Lỗi: {error}</div>}
      {loading && filteredSuggestions.length === 0 && (
        <div className="loading-message">Đang tải...</div>
      )}
      {!loading && filteredSuggestions.length === 0 && !error && (
        <div className="no-requests-message">
          {searchQuery
            ? "Không tìm thấy gợi ý nào khớp với từ khóa"
            : "Không có gợi ý kết bạn nào"}
        </div>
      )}

      {filteredSuggestions.length > 0 && (
        <div className="friend-request-grid">
          {filteredSuggestions.map((suggestion, index) => (
            <div key={suggestion.id || index} className="friend-request-card">
              <div className="friend-info">
                <div className="Avatar-Friend">
                  <img
                    src={suggestion.profilePicture || AvatarDefault}
                    alt="avatar"
                  />
                </div>
                <div className="friend-details">
                  <label
                    htmlFor={`suggestion-${index}`}
                    onClick={() => navigateUser(suggestion.id)}
                    className="friend-name"
                  >
                    {suggestion.fullName}
                  </label>
                  <div className="friend-meta">
                    <span className="trust-score">
                      Điểm uy tín: {suggestion.trustScore.toFixed(2)}
                    </span>
                    <span className="common-interests">
                      {suggestion.commonInterests > 0
                        ? `${suggestion.commonInterests} sở thích chung`
                        : "Không có sở thích chung"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="friend-actions">
                <button
                  className="profile-btn"
                  disabled={loading}
                  onClick={() => navigateUser(suggestion.id)}
                >
                  Trang cá nhân
                </button>
                <button
                  className={
                    suggestion.isPending ? "delete-btn" : "confirm-btn"
                  }
                  onClick={() =>
                    handleFriendRequest(suggestion.id, suggestion.isPending)
                  }
                  disabled={loading || isProcessing[suggestion.id]}
                >
                  {isProcessing[suggestion.id]
                    ? "Đang xử lý..."
                    : suggestion.isPending
                    ? "Hủy lời mời"
                    : "Thêm bạn bè"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={onLoadMore}
          className="load-more-btn"
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Xem thêm"}
        </button>
      )}
    </div>
  );
};

export default FriendSuggestions;

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  cancelFriendRequest,
  fetchSentFriendRequests,
} from "../../stores/action/friendAction";
import "../../styles/FriendViews/FriendViewComponent.scss";
import "../../styles/FriendViews/SearchBox.scss"; // Import file SCSS cho search-box
import AvatarDefault from "../../assets/AvatarDefaultFill.png";
import { useNavigate } from "react-router-dom";
import getUserIdFromToken from "../../utils/JwtDecode";
import { toast } from "react-toastify";
import { FiSearch } from "react-icons/fi"; // Thêm icon tìm kiếm

const FriendRequestsSent = ({
  requests,
  onLoadMore,
  hasMore,
  loading,
  error,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userId = getUserIdFromToken();
  const [localRequests, setLocalRequests] = useState(requests);
  const [isCanceling, setIsCanceling] = useState({});
  const [searchQuery, setSearchQuery] = useState(""); // Thêm state cho từ khóa tìm kiếm

  // Sync localRequests with props.requests when it changes
  useEffect(() => {
    setLocalRequests(requests);
  }, [requests]);

  const navigateUser = (userId) => {
    if (userId === getUserIdFromToken()) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const handleCancel = async (friendId, fullName) => {
    if (isCanceling[friendId]) return;

    setIsCanceling((prev) => ({ ...prev, [friendId]: true }));
    try {
      const result = await dispatch(cancelFriendRequest(friendId)).unwrap();

      toast.success(`Đã hủy lời mời kết bạn với ${fullName}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setLocalRequests((prev) =>
        prev.filter((request) => request.friendId !== friendId)
      );

      dispatch(fetchSentFriendRequests()).catch((error) => {
        console.error("Failed to fetch updated sent requests:", error);
      });
    } catch (error) {
      toast.error(error.message || "Hủy lời mời thất bại", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsCanceling((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  // Xử lý thay đổi giá trị tìm kiếm
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Lọc danh sách lời mời đã gửi theo từ khóa tìm kiếm
  const filteredRequests = localRequests.filter((request) =>
    request.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="friend-request-container">
      <h3 className="friend-request-title">Lời mời của bạn</h3>
      {/* Thanh tìm kiếm */}
      <div className="search-box-friend">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm lời mời đã gửi theo tên..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {error && <div className="error-message">Lỗi: {error}</div>}
      {loading && filteredRequests.length === 0 && (
        <div className="loading-message">Đang tải...</div>
      )}
      {!loading && filteredRequests.length === 0 && !error && (
        <div className="no-requests-message">
          {searchQuery
            ? "Không tìm thấy lời mời nào khớp với từ khóa"
            : "Không có lời mời đi"}
        </div>
      )}

      {filteredRequests.length > 0 && (
        <div className="friend-request-grid">
          {filteredRequests.map((request, index) => (
            <div
              key={request.friendId || index}
              className="friend-request-card"
            >
              <div className="friend-info">
                <div className="Avatar-Friend">
                  <img
                    src={request.pictureProfile || AvatarDefault}
                    alt="avatar"
                  />
                </div>
                <label htmlFor={`friend-${index}`}>{request.fullName}</label>
              </div>
              <div className="friend-actions">
                <button
                  className="confirm-btn"
                  disabled={loading || isCanceling[request.friendId]}
                  onClick={() => navigateUser(request.friendId)}
                >
                  Trang cá nhân
                </button>
                <button
                  className="delete-btn"
                  onClick={() =>
                    handleCancel(request.friendId, request.fullName)
                  }
                  disabled={loading || isCanceling[request.friendId]}
                >
                  {isCanceling[request.friendId]
                    ? "Đang xử lý..."
                    : "Hủy lời mời"}
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

export default FriendRequestsSent;

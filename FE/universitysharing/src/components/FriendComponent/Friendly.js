import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  removeFriend,
  fetchListFriend,
} from "../../stores/action/friendAction";
import "../../styles/FriendViews/FriendViewComponent.scss";
import "../../styles/FriendViews/SearchBox.scss";
import AvatarDefault from "../../assets/AvatarDefaultFill.png";
import { toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { useNavigate } from "react-router-dom";
import getUserIdFromToken from "../../utils/JwtDecode";
import { FiSearch } from "react-icons/fi";

const Friendly = ({ friends, onLoadMore, hasMore, loading, error }) => {
  const dispatch = useDispatch();
  const [localFriends, setLocalFriends] = useState(friends);
  const [isRemoving, setIsRemoving] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLocalFriends(friends);
  }, [friends]);

  const navigate = useNavigate();
  const userId = getUserIdFromToken();

  const navigateUser = (userId) => {
    if (userId === getUserIdFromToken()) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const handleRemove = (friendId, fullName) => {
    if (isRemoving[friendId]) return;

    confirmAlert({
      title: "Xác nhận hủy kết bạn",
      message: `Bạn có chắc chắn muốn hủy kết bạn với ${fullName}?`,
      buttons: [
        {
          label: "Xác nhận",
          onClick: async () => {
            setIsRemoving((prev) => ({ ...prev, [friendId]: true }));
            try {
              const result = await dispatch(removeFriend(friendId)).unwrap();

              toast.success("Đã hủy kết bạn thành công", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });

              setLocalFriends((prev) =>
                prev.filter((friend) => friend.friendId !== friendId)
              );

              dispatch(fetchListFriend()).catch((error) => {
                console.error("Failed to fetch updated friend list:", error);
              });
            } catch (error) {
              toast.error(error.message || "Hủy kết bạn thất bại", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
            } finally {
              setIsRemoving((prev) => ({ ...prev, [friendId]: false }));
            }
          },
        },
        {
          label: "Hủy",
          onClick: () => {},
        },
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
    });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredFriends = localFriends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="friend-request-container">
      <h3 className="friend-request-title">Bạn bè</h3>
      <div className="search-box-friend">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm bạn bè theo tên..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {error && <div className="error-message">Lỗi: {error}</div>}
      {loading && filteredFriends.length === 0 && (
        <div className="loading-message">Đang tải...</div>
      )}
      {!loading && filteredFriends.length === 0 && !error && (
        <div className="no-requests-message">
          {searchQuery
            ? "Không tìm thấy bạn bè nào khớp với từ khóa"
            : "Không có bạn bè nào"}
        </div>
      )}

      {filteredFriends.length > 0 && (
        <div className="friend-request-grid">
          {filteredFriends.map((friend, index) => (
            <div key={friend.friendId || index} className="friend-request-card">
              <div className="friend-info">
                <div className="Avatar-Friend">
                  <img
                    src={friend.pictureProfile || AvatarDefault}
                    alt="avatar"
                  />
                </div>
                <label htmlFor={`friend-${index}`}>{friend.fullName}</label>
              </div>
              <div className="friend-actions">
                <button
                  className="confirm-btn"
                  disabled={loading}
                  onClick={() => navigateUser(friend.friendId)}
                >
                  Trang cá nhân
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleRemove(friend.friendId, friend.fullName)}
                  disabled={loading || isRemoving[friend.friendId]}
                >
                  {isRemoving[friend.friendId] ? "Đang xử lý..." : "Hủy bạn bè"}
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

export default Friendly;

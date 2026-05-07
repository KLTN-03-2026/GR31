import { useCallback, useEffect, useMemo, useState } from "react";
import { FiMoreVertical, FiSearch } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import avatarDefault from "../../assets/AvatarDefault.png";
import { fetchFriends } from "../../stores/action/friendAction";
import "../../styles/MessageView/RightSidebar.scss";
import Spinner from "../../utils/Spinner";

import {
  getConversationss,
  getMessagess
} from "../../stores/action/messageAction";
import {
  useChatHandle
} from "../../utils/MesengerHandle";

import {
  closeChatBox,
  openChatBox,
  resetMessages,
  setSelectFriend,
} from "../../stores/reducers/messengerReducer";

const RightSidebar = () => {
  const dispatch = useDispatch();

  const {
    handleJoin,
    handleLeaveChat,
    handleSendMessage,
    markConversationAsSeen,
  } = useChatHandle();

  const {
    friends,
    loading: friendsLoading,
    error: friendsError,
  } = useSelector((state) => state.friends);
  const {
    onlineStatus,
    loading: onlineLoading,
    error: onlineError,
  } = useSelector((state) => state.onlineUsers);

  const [activeFriend, setActiveFriendLocal] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); 

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  // Hàm tính toán thời gian lastSeen
  const getLastSeenText = useCallback((lastSeen) => {
    if (!lastSeen) return "Đã ẩn trạng thái"; 
    const diff = (new Date() - new Date(lastSeen)) / 1000 / 60;
    if (diff < 1) return "Vừa mới hoạt động";
    if (diff < 60) return `Hoạt động ${Math.floor(diff)} phút trước`;

    const diffHours = Math.floor(diff / 60);
    if (diffHours < 24) return `Hoạt động ${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hôm qua";
    return `Hoạt động ${diffDays} ngày trước`;
  }, []);

  // Lọc và Chia Nhóm Bạn Bè (Logic Đã Sửa Lỗi Tìm Kiếm)
  const { onlineFriends, offlineFriends } = useMemo(() => {
    // Tăng tính ổn định: đảm bảo friends là mảng
    const friendList = Array.isArray(friends) ? friends : []; 

    // Lọc theo tên
    const filtered = friendList.filter((friend) =>
      friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const result = {
      onlineFriends: [],
      offlineFriends: [],
    };

    // 1. Sắp xếp: Online trước, sau đó là LastSeen
    const sorted = [...filtered].sort((a, b) => {
      const isOnlineA = onlineStatus[a.friendId] ?? false;
      const isOnlineB = onlineStatus[b.friendId] ?? false;

      // Online vs Offline
      if (isOnlineA && !isOnlineB) return -1;
      if (!isOnlineA && isOnlineB) return 1;

      // Nếu cả hai cùng Offline, sắp xếp theo lastSeen gần nhất
      if (!isOnlineA && !isOnlineB) {
        const lastSeenA = new Date(a.lastSeen || 0).getTime();
        const lastSeenB = new Date(b.lastSeen || 0).getTime();
        return lastSeenB - lastSeenA;
      }
      return 0;
    });

    // 2. Chia nhóm
    sorted.forEach(friend => {
        const isOnline = onlineStatus[friend.friendId] ?? false;
        if (isOnline) {
            result.onlineFriends.push(friend);
        } else {
            result.offlineFriends.push(friend);
        }
    });

    return result;
  }, [friends, onlineStatus, searchQuery]); 


  // Xử lý thay đổi giá trị tìm kiếm
  const handleSearchChange = (e) => { 
    setSearchQuery(e.target.value);
  };

  const messengerState = useSelector((state) => state.messenges || {});

  //chọn bạn nhắn tin để mở chatbox (Giữ nguyên)
  const handleSelectedFriend = async (friendData) => {
    const token = localStorage.getItem("token");
    try {
      if (messengerState.conversationId) {
        await handleLeaveChat(messengerState.conversationId);
      }
      
      const conversationData = await dispatch(
        getConversationss({ friendId: friendData.friendId, token })
      ).unwrap();

      const conversationId = conversationData.id;

      dispatch(resetMessages());
      dispatch(setSelectFriend(friendData));

      await handleJoin(conversationId);
      const messages = await dispatch(
        getMessagess({
          conversationId,
          token,
          nextCursor: null,
          pageSize: 20,
        })
      );

      await markConversationAsSeen({
        conversationId: conversationId,
        friendId: friendData.friendId,
        messages: messages.payload.data || [],
        status: 2,
      });

      dispatch(closeChatBox());
      dispatch(openChatBox());
    } catch (error) {
      console.error("Lỗi chọn bạn để chat:", error);
    }
  };
  
  // Hàm render danh sách bạn bè
  const renderFriendList = (list) => (
    <ul>
      {list.map((friend) => {
        const isOnline = onlineStatus[friend.friendId] ?? false;
        return (
          <li
            key={friend.friendId}
            className={activeFriend === friend.friendId ? "active" : ""}
            onClick={() =>
              handleSelectedFriend({
                friendId: friend.friendId,
                fullName: friend.fullName,
                pictureProfile: friend.pictureProfile,
                conversationId: 0,
              })
            }
          >
            <div className="friend-info">
              <div className="avatar-container">
                <img
                  src={friend.pictureProfile || avatarDefault}
                  alt={`${friend.fullName || "Bạn bè"}'s avatar`}
                  // --- THÊM ĐOẠN NÀY ---
                  onError={(e) => {
                    e.target.onerror = null; // Ngăn chặn vòng lặp vô hạn nếu ảnh mặc định cũng lỗi
                    e.target.src = avatarDefault; // Thay thế bằng ảnh mặc định
                  }}
                  // ---------------------
                />
                <span
                  className={`status-dot ${isOnline ? "online" : "offline"}`}
                ></span>
              </div>

              <div className="name-status">
                <div className="friend-name">
                  {friend.fullName || "Không tên"}
                </div>
                <div className="status-text">
                  <span className={isOnline ? "online-text" : ""}>
                    {isOnline
                      ? "Đang hoạt động"
                      : getLastSeenText(friend.lastSeen)}
                  </span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  const totalFriendsCount = onlineFriends.length + offlineFriends.length;
  const totalAvailableFriends = Array.isArray(friends) ? friends.length : 0; 
  const isListEmpty = totalAvailableFriends === 0 && searchQuery === "";
  const isNoResult = totalFriendsCount === 0 && searchQuery !== "";


  return (
    <>
      <aside className="right-sidebar">
        
        {/* BỐ CỤC MỚI - HEADER */}
        <div className="sidebar-header">
            <h3>Bạn Bè & Chuyện Trò</h3>
            <button className="action-button">
                <FiMoreVertical />
            </button>
        </div>

        {/* BỐ CỤC MỚI - SEARCH CONTAINER */}
        <div className="search-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* LOADING & ERROR */}
        {(friendsLoading || onlineLoading) && (
          <div className="loading-message">
            <Spinner size={30} />
          </div>
        )}

        {friendsError && (
          <p className="error-message">
            Lỗi tải danh sách bạn bè: {friendsError}
          </p>
        )}

        {onlineError && (
          <p className="error-message">
            Lỗi tải trạng thái online: {onlineError}
          </p>
        )}

        {/* BỐ CỤC MỚI - DANH SÁCH CHIA NHÓM */}
        {!friendsLoading && !friendsError && (
            <div className="friends-list">

                {/* Nhóm 1: Online */}
                {onlineFriends.length > 0 && (
                    <>
                        <div className="list-group-title">
                            Đang Hoạt Động ({onlineFriends.length})
                        </div>
                        {renderFriendList(onlineFriends)}
                    </>
                )}

                {/* Nhóm 2: Gần Đây / Kết quả tìm kiếm khác */}
                {/* ĐÃ SỬA: Xóa điều kiện 'searchQuery === ""' để hiển thị bạn bè offline khi đang tìm kiếm */}
                {offlineFriends.length > 0 && ( 
                    <>
                        <div className="list-group-title">
                            {/* Đổi tiêu đề khi đang tìm kiếm */}
                            {searchQuery 
                                ? "Kết Quả Khác" 
                                : `Hoạt Động Gần Đây (${offlineFriends.length})`
                            }
                        </div>
                        {renderFriendList(offlineFriends)}
                    </>
                )}

                {/* Trạng thái Không có kết quả tìm kiếm */}
                {isNoResult && (
                    <div className="loading-error">
                        Không tìm thấy bạn bè có tên "{searchQuery}".
                    </div>
                )}
                
                {/* Trạng thái Danh sách trống */}
                {isListEmpty && (
                    <div className="loading-error">
                        Bạn chưa có bạn bè nào.
                    </div>
                )}
            </div>
        )}
      </aside>
    </>
  );
};

export default RightSidebar;
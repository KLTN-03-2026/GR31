// File: FriendView.js
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Friendly from "../components/FriendComponent/Friendly";
import FriendRequestsReceived from "../components/FriendComponent/FriendRequestReceived";
import FriendRequestsSent from "../components/FriendComponent/FriendRequestSent";
import FriendSuggestions from "../components/FriendComponent/FriendSuggestions";
import Header from "../components/HomeComponent/Header";
import LeftSidebar from "../components/HomeComponent/LeftSideBarHome";
import {
  fetchFriendSuggestions,
  fetchFriendsWithCursor,
  fetchReceivedRequestsWithCursor,
  fetchSentRequestsWithCursor,
} from "../stores/action/friendAction";
import { userProfile } from "../stores/action/profileActions";
import "../styles/FriendViews/FriendView.scss";
import "../styles/HomeView.scss"; // Dùng chung để main-content co giãn đúng

const FriendView = () => {
  const dispatch = useDispatch();
  const usersState = useSelector((state) => state.users) || {};
  const { users } = usersState;

  const {
    listFriendsCursor,
    listFriendReceivedCursor,
    listFriendsSentCursor,
    friendSuggestions,
  } = useSelector((state) => state.friends || {});

  // Tab hiện tại
  const [activeTab, setActiveTab] = useState("friends");

  useEffect(() => {
    dispatch(userProfile());
  }, [dispatch]);

  // Fetch dữ liệu theo tab
  useEffect(() => {
    switch (activeTab) {
      case "friends":
        dispatch(fetchFriendsWithCursor());
        break;
      case "requests-received":
        dispatch(fetchReceivedRequestsWithCursor());
        break;
      case "requests-sent":
        dispatch(fetchSentRequestsWithCursor());
        break;
      case "suggestions":
        dispatch(fetchFriendSuggestions({ limit: 10, offset: 0 }));
        break;
      default:
        break;
    }
  }, [activeTab, dispatch]);

  // Load more
  const handleLoadMore = () => {
    switch (activeTab) {
      case "friends":
        if (listFriendsCursor.nextCursor) {
          dispatch(fetchFriendsWithCursor(listFriendsCursor.nextCursor));
        }
        break;
      case "requests-received":
        if (listFriendReceivedCursor.nextCursor) {
          dispatch(fetchReceivedRequestsWithCursor(listFriendReceivedCursor.nextCursor));
        }
        break;
      case "requests-sent":
        if (listFriendsSentCursor.nextCursor) {
          dispatch(fetchSentRequestsWithCursor(listFriendsSentCursor.nextCursor));
        }
        break;
      case "suggestions":
        if (friendSuggestions.hasMore) {
          dispatch(fetchFriendSuggestions({
            limit: 10,
            offset: friendSuggestions.offset || 0 + 10,
          }));
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="home-view with-sidebar">
      <Header usersProfile={users} />

      <div className="main-content">
        {/* LeftSidebar tự xử lý collapse + mobile */}
        <LeftSidebar usersProfile={users} />

        {/* Nội dung chính */}
        <div className="center-content">
          {/* Tab buttons */}
          <div className="friend-tab-buttons">
            <button
              className={activeTab === "requests-received" ? "active" : ""}
              onClick={() => setActiveTab("requests-received")}
            >
              Lời mời kết bạn
            </button>
            <button
              className={activeTab === "friends" ? "active" : ""}
              onClick={() => setActiveTab("friends")}
            >
              Bạn bè
            </button>
            <button
              className={activeTab === "requests-sent" ? "active" : ""}
              onClick={() => setActiveTab("requests-sent")}
            >
              Đã gửi
            </button>
            <button
              className={activeTab === "suggestions" ? "active" : ""}
              onClick={() => setActiveTab("suggestions")}
            >
              Gợi ý
            </button>
          </div>

          {/* Nội dung từng tab */}
          <div className="friend-tab-content">
            {activeTab === "requests-received" && (
              <FriendRequestsReceived
                requests={listFriendReceivedCursor.data || []}
                onLoadMore={handleLoadMore}
                hasMore={!!listFriendReceivedCursor.nextCursor}
                loading={listFriendReceivedCursor.loading}
                error={listFriendReceivedCursor.error}
              />
            )}

            {activeTab === "friends" && (
              <Friendly
                friends={listFriendsCursor.data || []}
                onLoadMore={handleLoadMore}
                hasMore={!!listFriendsCursor.nextCursor}
                loading={listFriendsCursor.loading}
                error={listFriendsCursor.error}
              />
            )}

            {activeTab === "requests-sent" && (
              <FriendRequestsSent
                requests={listFriendsSentCursor.data || []}
                onLoadMore={handleLoadMore}
                hasMore={!!listFriendsSentCursor.nextCursor}
                loading={listFriendsSentCursor.loading}
                error={listFriendsSentCursor.error}
              />
            )}

            {activeTab === "suggestions" && (
              <FriendSuggestions
                suggestions={friendSuggestions.data || []}
                loading={friendSuggestions.loading}
                error={friendSuggestions.error}
                hasMore={friendSuggestions.hasMore}
                onLoadMore={handleLoadMore}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendView;
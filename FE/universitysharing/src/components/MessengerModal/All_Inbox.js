import React from "react";
import avatartDefault from "../../assets/AvatarDefaultFill.png";
import Spinner from "../../utils/Spinner";
import "../../styles/MessageView/ChatList.scss";

const AllInbox = ({
  inboxRead = [],
  countInbox = {},
  onlineUsers,
  isLoading = false,
  handleSelectedFriend,
}) => {
  const chatList = inboxRead.length > 0 ? inboxRead : [];

  return (
    <div className="chat-list__items">
      {isLoading ? (
        <div className="chat-list__loading">
          <Spinner size={70} />
        </div>
      ) : chatList.length === 0 ? (
        <div className="chat-list__empty">Không có cuộc trò chuyện nào</div>
      ) : (
        chatList.map((chat, index) => {
          const friendId = chat.user?.id;
          const fullName = chat.user?.fullName;
          const avatar = chat.user?.profilePicture
            ? chat.user.profilePicture.startsWith(
                process.env.REACT_APP_BASE_URL
              )
              ? chat.user.profilePicture
              : `${process.env.REACT_APP_BASE_URL}${chat.user.profilePicture}`
            : avatartDefault;

          const lastMessage = chat.lastMessage || "";
          const lastMessageDate = chat.lastMessageDate
            ? new Date(chat.lastMessageDate + "Z")
            : null;
          const time = lastMessageDate
            ? lastMessageDate.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          const unreadCount = countInbox[friendId] || 0;
          const isOnline = onlineUsers?.[friendId] ?? false;

          // console.warn("isOnline>>", isOnline);
          return (
            <div
              key={index}
              className="chat-list__item"
              onClick={() =>
                handleSelectedFriend({
                  friendId: friendId,
                  fullName: fullName,
                  pictureProfile: avatar,
                  conversationId: chat.conversationId,
                })
              }
            >
              <div className="chat-list__avatar-wrapper">
                <img
                  src={avatar}
                  alt={fullName}
                  className="chat-list__avatar"
                />
                {isOnline && (
                  <div className="chat-list__online-indicator"></div>
                )}
              </div>

              <div className="inbox">
                <span className="chat-list__name">{fullName}</span>
                <div className="action-last-mess">
                  <span className="last-mess">{lastMessage}</span>
                  <span className="time-mess">{time}</span>
                  {unreadCount > 0 && (
                    <div className="notify-inbox">{unreadCount}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AllInbox;

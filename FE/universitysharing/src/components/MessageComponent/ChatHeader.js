// import React from "react";
// import "../../styles/MessageView/ChatHeader.scss";
// import avatartDefault from "../../assets/AvatarDefaultFill.png";
// import {
//   FiPhone,
//   FiVideo,
//   FiMoreHorizontal,
//   FiArrowLeft,
// } from "react-icons/fi";

// const ChatHeader = ({ toggleSidebar, goBack, selectedFriend, onlineUsers }) => {
//   // console.error("Tên bạn bè >>", selectedFriend);
//   return (
//     <div className="chat-header">
//       <div className="chat-header__info">
//         <div className="return-chat-list" onClick={goBack}>
//           <FiArrowLeft />
//         </div>
//         <img
//           src={selectedFriend?.pictureProfile || avatartDefault}
//           alt="Avatar"
//           className="chat-header__avatar"
//         />
//         <span className="chat-header__name">{selectedFriend?.fullName}</span>
//       </div>
//       <div className="chat-header__actions">
//         <FiPhone className="chat-header__icon" />
//         <FiVideo className="chat-header__icon" />
//         <FiMoreHorizontal
//           className="chat-header__icon"
//           onClick={toggleSidebar}
//           style={{ cursor: "pointer" }}
//         />
//       </div>
//     </div>
//   );
// };

// export default ChatHeader;

import {
  FiArrowLeft,
  FiMoreHorizontal,
  FiPhone,
  FiVideo,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import avatartDefault from "../../assets/AvatarDefaultFill.png";
import "../../styles/MessageView/ChatHeader.scss";

const Notifi = () => {
  toast.info("Chức năng đang được phát triển!", {
    position: "top-right",
    autoClose: 3000,
  });
};
const ChatHeader = ({
  toggleSidebar,
  goBack,
  selectedFriend,
  onlineUsers,
  navigateUser,
}) => {
  const isOnline = onlineUsers?.[selectedFriend?.friendId] ?? false;

  return (
    <div className="chat-header">
      <div className="chat-header__info">
        <div className="return-chat-list" onClick={goBack}>
          <FiArrowLeft />
        </div>
        <img
          src={selectedFriend?.pictureProfile || avatartDefault}
          alt="Avatar"
          className="chat-header__avatar"
        />
        <div className="chat-header__details">
          <span
            className="chat-header__name"
            onClick={() => navigateUser(selectedFriend?.friendId)}
          >
            {selectedFriend?.fullName}
          </span>
          <span
            className={`chat-header__status ${isOnline ? "online" : "offline"}`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
      <div className="chat-header__actions">
        <FiPhone className="chat-header__icon" onClick={Notifi} />
        <FiVideo className="chat-header__icon"onClick={Notifi} />
        <FiMoreHorizontal
          className="chat-header__icon"
          onClick={toggleSidebar}
          style={{ cursor: "pointer" }}
        />
      </div>
    </div>
  );
};

export default ChatHeader;

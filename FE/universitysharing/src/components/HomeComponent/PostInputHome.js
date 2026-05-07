import { useState } from "react";
import { FiBarChart2, FiImage, FiSmile, FiVideo } from "react-icons/fi"; // Thêm icon
import avatarDefault from "../../assets/AvatarDefault.png"; // Import ảnh mặc định nếu cần
import "../../styles/PostInput.scss";
import CreatePostModal from "../CreatePostModal";

const PostInput = ({ usersProfile }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const openPost = () => {
    setIsShareModalOpen(true);
  };
  const ClosePost = () => {
    setIsShareModalOpen(false);
  };

  // Lấy ảnh avatar, nếu không có thì dùng ảnh mặc định
  const userAvatar = usersProfile?.profilePicture || avatarDefault;

  return (
    <>
      <div className="new-post-card">
        <div className="input-section" onClick={() => openPost()}>
          <img src={userAvatar} alt="Me" className="current-user-avatar" />
          <div className="fake-input">
            <span>Bạn đang nghĩ gì thế, {usersProfile?.lastName || "bạn ơi"}?</span>
            <FiSmile className="emoji-icon" />
          </div>
        </div>
        
        <div className="divider"></div>

        <div className="actions-section">
          <button className="action-btn" onClick={() => openPost()}>
            <FiImage className="icon color-green" />
            <span>Ảnh</span>
          </button>
          <button className="action-btn" onClick={() => openPost()}>
            <FiVideo className="icon color-red" />
            <span>Video</span>
          </button>
          <button className="action-btn" onClick={() => openPost()}>
            <FiBarChart2 className="icon color-blue" />
            <span>Thăm dò</span>
          </button>
        </div>
      </div>

      {isShareModalOpen && (
        <CreatePostModal
          isOpen={isShareModalOpen}
          onClose={ClosePost}
          usersProfile={usersProfile}
        ></CreatePostModal>
      )}
    </>
  );
};

export default PostInput;
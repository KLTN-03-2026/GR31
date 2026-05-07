import Picker from "emoji-picker-react"; // Thêm import đúng
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaSmile } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify"; // Thêm toast
import avatarDeafault from "../assets/AvatarDefault.png";
import closeIcon from "../assets/iconweb/closeIcon.svg";
import imageIcon from "../assets/iconweb/imageIcon.svg";
import videoIcon from "../assets/iconweb/videoIcon.svg";
import { createPost } from "../stores/action/listPostActions";
import "../styles/CreatePostModal.scss";
import Spinner from "../utils/Spinner";

const CreatePostModal = ({ isOpen, onClose, usersProfile }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const dispatch = useDispatch();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState(4);
  const [scope, setScope] = useState(0);
  const loading = useSelector((state) => state.posts.loading);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  // Cleanup URL.createObjectURL
  useEffect(() => {
    return () => {
      mediaFiles.forEach((media) => URL.revokeObjectURL(media.url));
    };
  }, [mediaFiles]);

  // Đóng emoji picker khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest(".emoji-btn")
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý chọn emoji
  const onEmojiClick = (emojiObject) => {
    if (emojiObject?.emoji) {
      setContent((prev) => prev + emojiObject.emoji);
    }
    setShowEmojiPicker(false);
  };

  // Xử lý phím Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Giới hạn kích thước file (10MB)
    const maxSize = 10 * 1024 * 1024;
    const invalidFiles = files.filter((file) => file.size > maxSize);
    if (invalidFiles.length) {
      toast.error("Một số file quá lớn (tối đa 10MB)");
      return;
    }

    const newMediaFiles = files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
      file,
    }));

    setMediaFiles((prev) => {
      const currentImages = prev.filter((media) => media.type === "image");
      const hasNewVideo = newMediaFiles.some((media) => media.type === "video");
      const newVideo = newMediaFiles.find((media) => media.type === "video");
      const newImages = newMediaFiles.filter((media) => media.type === "image");

      // Cleanup URL cũ
      prev.forEach((media) => {
        if (hasNewVideo && media.type === "video") {
          URL.revokeObjectURL(media.url);
        }
      });

      if (hasNewVideo) {
        return [...currentImages, newVideo];
      } else {
        return [...currentImages, ...newImages];
      }
    });
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].url); // Cleanup URL
      return newFiles;
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFiles.length) {
      toast.error("Vui lòng nhập nội dung hoặc thêm media!");
      return;
    }

    const formData = new FormData();
    formData.append("Content", content);
    formData.append("PostType", postType);
    formData.append("Scope", scope);

    if (mediaFiles.length > 0) {
      const videoFile = mediaFiles.find((media) => media.type === "video");
      const imageFiles = mediaFiles.filter((media) => media.type === "image");

      if (videoFile) {
        formData.append("Video", videoFile.file);
      }

      imageFiles.forEach((image) => {
        formData.append("Images", image.file);
      });
    }

    try {
      await dispatch(
        createPost({
          formData,
          fullName: usersProfile.fullName || "University Sharing",
          profilePicture: usersProfile.profilePicture || avatarDeafault,
        })
      );
      toast.success("Đăng bài thành công!");
    } catch (error) {
      toast.error("Không thể đăng bài: " + error.message);
    }

    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="create-post-overlay" onClick={onClose}></div>
      <div className="create-post-modal">
        <div className="header-post-modal">
          <span>Đăng bài</span>
          <img
            src={closeIcon}
            alt="Close"
            onClick={onClose}
            className="close-icon"
          />
        </div>
        <div className="user-create-post">
          <img
            src={usersProfile.profilePicture || avatarDeafault}
            alt="Avatar"
          />
          <span className="userName-share">
            {usersProfile.fullName || "University Sharing"}
          </span>
        </div>
        <div className="textarea-container">
          <textarea
            placeholder="Bạn đang nghĩ gì thế?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            type="button"
            className="emoji-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FaSmile />
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker-container" ref={emojiPickerRef}>
              <Picker
                onEmojiClick={onEmojiClick}
                pickerStyle={{
                  width: "100%",
                  boxShadow: "none",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
                groupVisibility={{ flags: false, symbols: false }}
                native
              />
            </div>
          )}
        </div>
        <div className="preview-imgae-or-video">
          {mediaFiles.map((media, index) => (
            <div key={index} className="media-preview">
              {media.type === "video" ? (
                <video src={media.url} controls />
              ) : (
                <img src={media.url} alt={`Preview ${index}`} />
              )}
              <button
                className="remove-media"
                onClick={() => handleRemoveMedia(index)}
              >
                ✖
              </button>
            </div>
          ))}
        </div>
        <div className="option-create">
          <label className="file-upload-btn">
            <img src={imageIcon} alt="Upload Image" />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              hidden
            />
          </label>
          <label className="file-upload-btn">
            <img src={videoIcon} alt="Upload Video" />
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              hidden
            />
          </label>
        </div>
        <div className="type-status-post">
          <select
            className="status-post"
            value={scope}
            onChange={(e) => setScope(Number(e.target.value))}
          >
            <option value="0">Công khai</option>
            <option value="1">Riêng tư</option>
            <option value="2">Chỉ bạn bè</option>
          </select>
        </div>
        <button
          className="btn-create-post"
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !mediaFiles.length)}
        >
          {loading ? <Spinner size={20} color="#fff" /> : "Đăng bài"}
        </button>
      </div>
    </>,
    document.body
  );
};

export default CreatePostModal;
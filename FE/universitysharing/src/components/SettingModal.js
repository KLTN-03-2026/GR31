import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Thêm để điều hướng
import { toast } from "react-toastify"; // Thêm toast
import avatarDefaut from "../assets/AvatarDefault.png";
import { useAuth } from "../contexts/AuthContext"; // Tích hợp authContext
import "../styles/SettingModal.scss";

import "../styles/MoblieReponsive/HomeViewMobile/SettingModalMobile.scss";
const SettingModal = ({ isOpen, onClose, users, UserProfile }) => {
  const modalRef = useRef(null);
  const navigate = useNavigate(); // Thêm navigate
  const { logout } = useAuth(); // Lấy logout từ context

  const handleClickOutside = useCallback(
    (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    },
    [onClose]
  );
  const handleSetting = () => {
    navigate("/settings");
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
    onClose(); // Đóng modal
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="setting-modal-background"></div>
      <div className="setting-Overlay" ref={modalRef}>
        <div className="Account" onClick={UserProfile}>
          <img
            className="AvatarUser"
            src={users?.profilePicture || avatarDefaut}
            alt="Avatar"
          />
          <span className="UserName">
            {users?.fullName || "University Sharing"}
          </span>
        </div>
        <div className="setting">
          <span className="btn-changeProfile" onClick={handleSetting}>
            Cài đặt
          </span>
          <span className="btn-yourScore">Điểm uy tín</span>
          <span className="btn-logout" onClick={handleLogout}>
            Đăng xuất
          </span>
        </div>
      </div>

      {/* <div className="setting">
        <span className="btn-changeProfile">Sửa thông tin cá nhân</span>
        <span className="btn-yourScore">Điểm uy tín</span>
        <span className="btn-logout" onClick={handleLogout}>
          Đăng xuất
        </span>
      </div> */}
    </>
  );
};

export default SettingModal;

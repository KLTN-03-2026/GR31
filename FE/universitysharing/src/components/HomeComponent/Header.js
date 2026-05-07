import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { FiArrowLeft, FiBell, FiMessageSquare, FiSearch } from "react-icons/fi";
import avatarweb from "../../assets/AvatarDefault.png";
import logoweb from "../../assets/Logo.png";
import { useSignalR } from "../../Service/SignalRProvider";

import MessengerModal from "../MessengerModal";
import NotifyModal from "../NotifyModal";
import SettingModal from "../SettingModal";

import { fetchUnreadNotificationCount } from "../../stores/action/notificationAction";
import { searchPost } from "../../stores/action/searchAction";

import "animate.css";
import "../../styles/headerHome.scss";
import "../../styles/MoblieReponsive/HomeViewMobile/HeaderHomeReponsive.scss";

const Header = ({ usersProfile }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { signalRService } = useSignalR();

  // Redux & State
  const unreadNotificationCount = useSelector((state) => state.notifications.unreadCount);
  const messengerState = useSelector((state) => state.messenges || {});
  const isRejectChatbox = messengerState?.isMessengerView;

  const [unreadCount, setUnreadCount] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [modalPosition, setModalPosition] = useState({});
  const [modalState, setModalState] = useState({
    notify: false,
    messenger: false,
    setting: false,
  });

  // Refs for Mobile Animation
  const searchRef = useRef(null);
  const logoRef = useRef(null);
  const rightRef = useRef(null);

  // --- EFFECTS ---
  useEffect(() => {
    dispatch(fetchUnreadNotificationCount());
  }, [dispatch]);

  useEffect(() => {
    const handleUnreadCount = (count) => setUnreadCount(count);
    signalRService.onReceiveUnreadCount(handleUnreadCount);
    return () => {}; // Cleanup if needed
  }, [signalRService]);

  useEffect(() => {
    if (modalState.messenger) {
      setUnreadCount(0);
    }
  }, [modalState.messenger]);

  // --- HANDLERS ---
  const handleHomeView = () => navigate("/home");
  const UserProfile = () => navigate("/ProfileUserView");
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      dispatch(searchPost(searchKeyword));
      navigate(`/ResultSearchView?q=${encodeURIComponent(searchKeyword)}`);
      setSearchKeyword("");
      hideSearchBox(); // Ẩn search box sau khi search trên mobile
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // Tính toán vị trí modal
  const getButtonPosition = (buttonId) => {
    const button = document.getElementById(buttonId);
    if (button) {
      const rect = button.getBoundingClientRect();
      return {
        top: rect.bottom + window.scrollY + 5,
        right: window.innerWidth - rect.right - window.scrollX,
      };
    }
    return {};
  };

  const toggleModal = (modalName) => {
    if (!modalState[modalName]) {
      setModalPosition(getButtonPosition(`${modalName}-button`));
    }
    setModalState((prev) => ({
      ...prev,
      [modalName]: !prev[modalName],
    }));
  };

  // --- MOBILE SEARCH LOGIC ---
  const showSearchBox = () => {
    if (window.innerWidth <= 768) {
      searchRef.current?.classList.remove("hide-mobile");
      searchRef.current?.classList.add("active-mobile");
      logoRef.current?.classList.add("hide-content");
      rightRef.current?.classList.add("hide-content");
    }
  };

  const hideSearchBox = () => {
    if (window.innerWidth <= 768) {
      searchRef.current?.classList.add("hide-mobile");
      searchRef.current?.classList.remove("active-mobile");
      logoRef.current?.classList.remove("hide-content");
      rightRef.current?.classList.remove("hide-content");
    }
  };

  // Click outside to close search on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        window.innerWidth <= 768 &&
        searchRef.current?.classList.contains("active-mobile") &&
        !searchRef.current.contains(event.target) &&
        !logoRef.current.contains(event.target) // Tránh conflict khi bấm nút search
      ) {
        hideSearchBox();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="header">
        {/* LOGO AREA */}
        <div className="logoWeb" ref={logoRef}>
          <div className="logo-container" onClick={handleHomeView}>
            <img className="logowebsite" src={logoweb} alt="University Sharing" />
            <div className="app-name">
              <span className="university-text">UNIVERSITY</span>
              <span className="sharing-text">SHARING</span>
            </div>
          </div>
          {/* Nút kính lúp chỉ hiện trên mobile */}
          <div className="btn-search-mobile" onClick={showSearchBox}>
            <FiSearch className="search-icon-btn" />
          </div>
        </div>

        {/* SEARCH BOX AREA */}
        <div className="search hide-mobile" ref={searchRef}>
          <div className="close-search-btn" onClick={hideSearchBox}>
            <FiArrowLeft className="close-btn-search" />
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="search-input"
                autoFocus={window.innerWidth <= 768} // Tự động focus trên mobile
              />
            </div>
          </form>
        </div>

        {/* RIGHT ACTION ICONS */}
        <div className="rightHeader" ref={rightRef}>
          {!isRejectChatbox && (
            <button
              id="messenger-button"
              className={`icon-button ${modalState.messenger ? "active" : ""}`}
              onClick={() => toggleModal("messenger")}
            >
              <FiMessageSquare className="icon" />
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
          )}

          <button
            id="notify-button"
            className={`icon-button ${modalState.notify ? "active" : ""}`}
            onClick={() => toggleModal("notify")}
          >
            <FiBell className="icon" />
            {unreadNotificationCount > 0 && <span className="badge">{unreadNotificationCount}</span>}
          </button>

          <button
            id="setting-button"
            className="avatar-button"
            onClick={() => toggleModal("setting")}
          >
            <img
              className="avatarweb"
              src={usersProfile?.profilePicture || avatarweb}
              alt="Avatar"
            />
          </button>
        </div>
      </div>

      {/* MODALS */}
      {modalState.notify && (
        <NotifyModal isOpen={modalState.notify} onClose={() => toggleModal("notify")} />
      )}
      {modalState.messenger && (
        <MessengerModal
          isOpen={modalState.messenger}
          onClose={() => toggleModal("messenger")}
          position={modalPosition}
        />
      )}
      {modalState.setting && (
        <SettingModal
          isOpen={modalState.setting}
          onClose={() => toggleModal("setting")}
          users={usersProfile}
          UserProfile={UserProfile}
          logout={handleLogout}
        />
      )}
    </>
  );
};

export default Header;
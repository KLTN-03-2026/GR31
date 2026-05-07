import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FiHome,
  FiMapPin,
  FiMessageSquare,
  FiUsers,
} from "react-icons/fi";
import {
  RiAiGenerate,
  RiArrowLeftLine,
  RiCloseFill,
  RiFilePaper2Line,
  RiHotelLine,
  RiMenu3Fill,
  RiUserLocationLine
} from "react-icons/ri";

import { useLocation, useNavigate } from "react-router-dom";
import avatartDefault from "../../assets/AvatarDefaultFill.png";
import "../../styles/LeftSideBarHome.scss";

const LeftSidebar = ({ usersProfile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  //const [collapsed, setCollapsed] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
  // Đọc trạng thái từ localStorage
  const saved = localStorage.getItem("sidebarCollapsed");
  // Nếu chưa có lần nào lưu → mặc định là đóng (true)
  if (saved === null) return true; // ĐÚNG Ý BẠN: mặc định đóng
  // Nếu đã lưu rồi thì dùng lại trạng thái cũ
  return saved === "true";
});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileOpen, setMobileOpen] = useState(false);

  const username = usersProfile?.fullName || "Người dùng";

  const menuItems = [
    { path: "/home", icon: <FiHome />, label: "Trang chủ" },
    { path: "/friend", icon: <FiUsers />, label: "Bạn bè" },
    { path: "/MessageView", icon: <FiMessageSquare />, label: "Nhắn tin" },
    { path: "/chatBoxAI", icon: <RiAiGenerate />, label: "Sharing AI" },
    { path: "/sharing-ride", icon: <FiMapPin />, label: "Chia sẻ xe" },
    { path: "/your-ride", icon: <RiUserLocationLine />, label: "Chuyến đi của bạn" },
    { path: "/accommodation", icon: <RiHotelLine />, label: "Tìm trọ" },
    { path: "/material", icon: <RiFilePaper2Line />, label: "Tài liệu học tập" },
  ];

  // Xử lý resize + tự động mở full trên mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(false);
        setMobileOpen(false);
        updateMainContentClass(false);
      } else {
        updateMainContentClass(collapsed);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed]);


// Mỗi lần toggle thì lưu lại vào localStorage

  // Cập nhật class cho main content khi collapsed thay đổi
  const updateMainContentClass = (isCollapsed) => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      if (isCollapsed) {
        mainContent.classList.add('sidebar-collapsed');
      } else {
        mainContent.classList.remove('sidebar-collapsed');
      }
    }
  };

  useEffect(() => {
    if (!isMobile) {
      updateMainContentClass(collapsed);
    }
  }, [collapsed, isMobile]);

  // Mở sidebar trên mobile
  const openMobileSidebar = (e) => {
    e.stopPropagation();
    if (isMobile) {
      setMobileOpen(true);
      document.body.classList.add("mobile-sidebar-open");
    }
  };

  // Đóng sidebar khi click vào overlay (mobile)
  useEffect(() => {
    if (!isMobile) return;
    
    const closeSidebar = () => {
      setMobileOpen(false);
      document.body.classList.remove("mobile-sidebar-open");
    };

    document.addEventListener("click", closeSidebar);

    return () => {
      document.removeEventListener("click", closeSidebar);
    };
  }, [isMobile]);

  const handleSidebarClick = (e) => {
    e.stopPropagation();
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
      document.body.classList.remove("mobile-sidebar-open");
    }
  };

  const handleToggleSidebar = () => {
  setCollapsed(prev => {
    const newState = !prev;
    localStorage.setItem("sidebarCollapsed", newState.toString());
    return newState;
  });
};

  return (
    <>
      {/* Sidebar chính */}
      <aside
        className={`left-sidebar-menu ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
        onClick={handleSidebarClick}
      >
        {/* Logo Container với nút menu (3 gạch) - LUÔN HIỆN */}
        <motion.div 
          className="logo-container"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div 
  className="logo-content"
  onClick={() => handleNavigation("/home")}
>
  <svg 
    className="logo-icon" 
    viewBox="0 0 24 24" 
    width="40" 
    height="40"
    fill="none"
  >
    {/* Vòng tròn đỏ DTU */}
    <circle cx="12" cy="12" r="11" fill="#ff4444" stroke="#ffffff" strokeWidth="2"/>
    
    {/* Chữ DTU trắng, đậm, giữa */}
    <text 
      x="12" 
      y="15.5" 
      textAnchor="middle" 
      fontSize="10" 
      fontWeight="800" 
      fill="white"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      DTU
    </text>
  </svg>

  {/* Tên app chỉ hiện khi sidebar mở rộng */}
  {!collapsed && (
    <span className="logo-text">DTU Sharing</span>
  )}
</div>

          {/* Nút menu (3 gạch) - LUÔN HIỆN TRÊN DESKTOP */}
          {!isMobile && (
            <div
              className="toggle-sidebar-btn"
              onClick={handleToggleSidebar}
              title={collapsed ? "Mở rộng" : "Thu gọn"}
            >
              <RiArrowLeftLine />
            </div>
          )}
        </motion.div>

        {/* Menu */}
        <ul>
          {menuItems.map((item) => (
            <motion.li
              key={item.path}
              className={location.pathname === item.path ? "active" : ""}
              onClick={() => handleNavigation(item.path)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="menu-item-content">
                <span className="sidebar-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </div>

              {/* Tooltip khi collapsed */}
              {collapsed && !isMobile && (
                <span className="tooltip">{item.label}</span>
              )}

              {/* Thanh active */}
              {location.pathname === item.path && (
                <motion.div
                  className="active-indicator"
                  layoutId="activeIndicator"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.li>
          ))}
        </ul>

        {/* User Profile */}
        <motion.div
          className="user-profile-navigate"
          onClick={() => handleNavigation("/ProfileUserView")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <img
            src={usersProfile?.profilePicture || avatartDefault}
            alt="Avatar"
            className="profile-icon"
            onError={(e) => {
              e.target.src = avatartDefault;
            }}
          />
          <span className="User-Name">{username}</span>
        </motion.div>
      </aside>

      {/* Nút mở sidebar trên mobile - 3 gạch */}
      {isMobile && (
        <motion.div 
          className="mobile-menu-btn" 
          onClick={openMobileSidebar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {mobileOpen ? <RiCloseFill /> : <RiMenu3Fill />}
        </motion.div>
      )}
    </>
  );
};

export default LeftSidebar;
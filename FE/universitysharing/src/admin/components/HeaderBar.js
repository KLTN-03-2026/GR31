import {
  BellOutlined,
  CarOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MenuOutlined,
  NotificationOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Layout, Menu } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import avatarDefault from "../../assets/AvatarDefaultFill.png";
import logoWeb from "../../assets/Logo white.png"; // Import logo cho drawer mobile
import { userProfile } from "../../stores/action/profileActions";
import "../styles/DashBoard.scss";
import SettingModal from "./SettingModal";

const { Header } = Layout;

const AppHeader = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const usersState = useSelector((state) => state.users) || {};
  const { users } = usersState;

  const handleToggleModal = (callback) => {
    setIsModalOpen((prev) => {
      const nextState = !prev;
      if (typeof callback === "function") {
        callback(nextState);
      }
      return nextState;
    });
  };

  useEffect(() => {
    dispatch(userProfile());
  }, [dispatch]);

  // Logic Active Key cho Menu Mobile
  const pathToKey = {
    "/admin/dashboard": "1",
    "/admin/users": "2",
    "/admin/userreport": "3",
    "/admin/postmanager": "4",
    "/admin/tripnotifications": "5",
    "/admin/rides": "6",
  };
  const selectedKey = pathToKey[location.pathname] || "1";

  const handleMobileMenuClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <Header
        style={{
          backgroundColor: "#1890ff",
          padding: "0 20px",
          color: "#fff",
          position: "sticky", // Giữ header dính trên cùng
          top: 0,
          zIndex: 999,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        {/* Nút mở Menu Mobile (Ẩn trên desktop bằng CSS hoặc logic width) */}
        <div className="mobile-menu-trigger" style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
                type="text" 
                icon={<MenuOutlined style={{ color: 'white', fontSize: '20px' }} />} 
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden" // Class giả định, bạn có thể dùng media query trong SCSS
                style={{ marginRight: 15, display: 'none' }} // Mặc định ẩn, hiện bằng CSS media query
            />
            {/* Tiêu đề hoặc Logo nhỏ trên Header nếu cần */}
        </div>

        <div className="header-content" style={{ marginLeft: 'auto' }}>
          <div className="Avatar-admin" onClick={() => handleToggleModal()}>
            <img 
                src={users?.profilePicture || avatarDefault} 
                alt="Avatar"
                style={{ cursor: 'pointer' }} 
            />
          </div>
        </div>
      </Header>

      {/* Drawer Menu Mobile */}
      <Drawer
        title={
            <div style={{ textAlign: 'center' }}>
                <img src={logoWeb} alt="Logo" style={{ width: '120px', filter: 'invert(1)' }} />
            </div>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        visible={mobileMenuOpen}
        bodyStyle={{ padding: 0, backgroundColor: '#001529' }}
        headerStyle={{ backgroundColor: '#001529', borderBottom: '1px solid #333' }}
        width={250}
      >
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]}>
          <Menu.Item key="1" icon={<DashboardOutlined />} onClick={() => handleMobileMenuClick("/admin/dashboard")}>
            DashBoard
          </Menu.Item>
          <Menu.Item key="2" icon={<UserOutlined />} onClick={() => handleMobileMenuClick("/admin/users")}>
            Quản lý người dùng
          </Menu.Item>
          <Menu.Item key="3" icon={<BellOutlined />} onClick={() => handleMobileMenuClick("/admin/userreport")}>
            Báo cáo từ người dùng
          </Menu.Item>
          <Menu.Item key="4" icon={<FileTextOutlined />} onClick={() => handleMobileMenuClick("/admin/postmanager")}>
            Quản lý bài viết
          </Menu.Item>
          <Menu.Item key="5" icon={<NotificationOutlined />} onClick={() => handleMobileMenuClick("/admin/tripnotifications")}>
            Thông báo chuyến đi
          </Menu.Item>
          <Menu.Item key="6" icon={<CarOutlined />} onClick={() => handleMobileMenuClick("/admin/rides")}>
            Quản lý chuyến đi
          </Menu.Item>
        </Menu>
      </Drawer>

      {/* Setting Modal */}
      <SettingModal
        isOpen={isModalOpen}
        onClose={handleToggleModal}
        UserProfile={users}
        users={users}
      />
    </>
  );
};

export default AppHeader;
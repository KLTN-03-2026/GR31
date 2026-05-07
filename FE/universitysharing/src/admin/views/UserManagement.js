import React, { useState, useEffect } from "react";
import "../../admin/styles/UserManagement.scss";
import AppHeader from "../components/HeaderBar";
import AppSidebar from "../components/SideBarMenu";
import {
  FaSearch,
  FaBan,
  FaPause,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { message } from "antd";
import BlockUserModal from "../components/UserManager/BlockUserModal";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  blockUser,
  suspendUser,
  activateUser,
} from "../../stores/action/adminActions";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPhoneNumbers, setShowPhoneNumbers] = useState({});
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  const dispatch = useDispatch();
  const { users, loading, error } = useSelector(
    (state) => state.reportAdmintSlice
  );

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(
        () => dispatch({ type: "reportAdmintSlice/clearReportState" }),
        5000
      );
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showBlockModal = (id, action) => {
    console.log(`Opening modal for action: ${action}, user ID: ${id}`);
    setSelectedUserId(id);
    setModalAction(action);
    setModalTitle(
      action === "block"
        ? "Chọn thời gian hết hạn chặn"
        : "Chọn thời gian hết hạn tạm ngưng"
    );
    setBlockModalVisible(true);
  };

  const handleModalConfirm = async (untilISO) => {
    try {
      if (modalAction === "block") {
        await dispatch(
          blockUser({ userId: selectedUserId, untilISO })
        ).unwrap();
        message.success("Chặn người dùng thành công!");
      } else {
        await dispatch(
          suspendUser({ userId: selectedUserId, untilISO })
        ).unwrap();
        message.success("Tạm ngưng người dùng thành công!");
      }
      // Chỉ đóng modal và reset trạng thái sau khi dispatch thành công
      setBlockModalVisible(false);
      setSelectedUserId(null);
      setModalAction(null);
    } catch (err) {
      message.error(err.message || "Đã xảy ra lỗi!");
    }
  };

  const handleActivate = async (id) => {
    try {
      await dispatch(activateUser(id)).unwrap();
      message.success("Kích hoạt người dùng thành công!");
    } catch (err) {
      message.error(err.message || "Đã xảy ra lỗi!");
    }
  };

  const handleModalCancel = () => {
    setBlockModalVisible(false);
    setSelectedUserId(null);
    setModalAction(null);
  };

  const togglePhoneVisibility = (id, type) => {
    setShowPhoneNumbers((prev) => ({
      ...prev,
      [`${id}-${type}`]: !prev[`${id}-${type}`],
    }));
  };

  const maskPhoneNumber = (phone, id, type) => {
    if (!phone || phone === "N/A") return "N/A";
    if (showPhoneNumbers[`${id}-${type}`]) return phone;
    return "****" + phone.slice(-3);
  };

  return (
    <>
      <AppHeader />
      <AppSidebar />
      <div className="user-management">
        <h1>Quản lý người dùng</h1>

        {error && <div className="error-message">{error}</div>}

        {loading && <div className="loading">Đang tải dữ liệu...</div>}

        {!loading && (
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Nhập bằng tên hoặc email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <BlockUserModal
          visible={blockModalVisible}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          userId={selectedUserId}
          title={modalTitle}
        />

        {!loading && (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Họ Tên</th>
                  <th>Email</th>
                  <th>Ngày tạo</th>
                  <th>Xác thực</th>
                  <th>Điểm uy tín</th>
                  <th>Role</th>
                  <th>Trạng thái</th>
                  <th>Số liên lạc</th>
                  <th>Số người thân</th>
                  <th>Reports</th>
                  <th>Lần đăng nhập cuối</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>{user.isVerifiedEmail ? "Có" : "Không"}</td>
                    <td>{user.trustScore}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td className="phone-cell">
                      <span>
                        {maskPhoneNumber(user.phone, user.id, "phone")}
                      </span>
                      <button
                        className="toggle-visibility"
                        onClick={() => togglePhoneVisibility(user.id, "phone")}
                      >
                        {showPhoneNumbers[`${user.id}-phone`] ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>
                    </td>
                    <td className="phone-cell">
                      <span>
                        {maskPhoneNumber(
                          user.relativePhone,
                          user.id,
                          "relativePhone"
                        )}
                      </span>
                      <button
                        className="toggle-visibility"
                        onClick={() =>
                          togglePhoneVisibility(user.id, "relativePhone")
                        }
                      >
                        {showPhoneNumbers[`${user.id}-relativePhone`] ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>
                    </td>
                    <td>{user.totalReports}</td>
                    <td>
                      {user.lastLoginDate
                        ? new Date(user.lastLoginDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="actions">
                      <button
                        title="Chặn người dùng"
                        onClick={() => showBlockModal(user.id, "block")}
                        disabled={user.status === "Blocked"}
                      >
                        <FaBan />
                      </button>
                      <button
                        title="Tạm ngưng người dùng"
                        onClick={() => showBlockModal(user.id, "suspend")}
                        disabled={user.status === "Suspended"}
                      >
                        <FaPause />
                      </button>
                      <button
                        title="Kích hoạt người dùng"
                        onClick={() => handleActivate(user.id)}
                        disabled={user.status === "Active"}
                      >
                        <FaCheckCircle />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagement;

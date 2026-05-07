import React, { useState, useEffect } from "react";
import { Layout, Card, Typography, Tabs, Pagination, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";
import "../../admin/styles/AdminRideManagement.scss";
import AppHeader from "../components/HeaderBar";
import AppSidebar from "../components/SideBarMenu";
import { userProfile } from "../../stores/action/profileActions";
import { fetchRidesByStatus } from "../../stores/action/adminActions"; // Sửa import
import { clearRideState } from "../../stores/reducers/adminReducer";

const { Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;

const AdminRideManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Accepted");
  const pageSize = 10;

  const usersState = useSelector((state) => state.users) || {};
  const { users } = usersState;
  const {
    rides = [],
    rideTotalCount = 0,
    loading = false,
    error = null,
    success = false,
  } = useSelector((state) => state.reportAdmintSlice || {});

  console.log("Redux State:", {
    rides,
    rideTotalCount,
    loading,
    error,
    success,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const action = fetchRidesByStatus({
          status: activeTab,
          pageNumber: currentPage,
          pageSize,
        });
        if (action) {
          await dispatch(action);
        } else {
          console.error("fetchRidesByStatus returned undefined");
        }
      } catch (err) {
        console.error("Error dispatching fetchRidesByStatus:", err);
      }
    };
    fetchData();
  }, [dispatch, activeTab, currentPage]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const action = userProfile();
        if (action) {
          await dispatch(action);
        } else {
          console.error("userProfile returned undefined");
        }
      } catch (err) {
        console.error("Error dispatching userProfile:", err);
      }
    };
    fetchProfile();
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      console.log("Rides:", rides);
      message.success("Lấy danh sách chuyến đi thành công");
      dispatch(clearRideState()); // Có thể gây reset rideDetails
    }
  }, [error, success, dispatch, rides]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  const handleViewDetails = (rideId) => {
    navigate(`/admin/ride-details/${rideId}`);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar />
      <Layout style={{ marginLeft: 200 }}>
        <AppHeader usersProfile={users} />
        <Content style={{ margin: "20px" }}>
          <Title level={3}>Quản lý chuyến đi</Title>
          <Card>
            <Tabs activeKey={activeTab} onChange={handleTabChange}>
              <TabPane tab="Đang di chuyển" key="Accepted" />
              <TabPane tab="Đã hoàn thành" key="Completed" />
            </Tabs>
            <div className="ride-table-container">
              <table className="ride-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Điểm bắt đầu</th>
                    <th>Điểm kết thúc</th>
                    <th>Tài xế</th>
                    <th>Hành khách</th>
                    <th>Thời gian bắt đầu</th>
                    <th>Thời gian kết thúc</th>
                    <th>Thời gian dự kiến</th>
                    <th>Ngày tạo</th>
                    <th>An toàn</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center" }}>
                        Đang tải...
                      </td>
                    </tr>
                  ) : rides.length > 0 ? (
                    rides.map((ride) => (
                      <tr key={ride.id}>
                        <td>{ride.id.substring(0, 8)}...</td>
                        <td>{ride.startLocation}</td>
                        <td>{ride.endLocation}</td>
                        <td>{ride.driverId.substring(0, 8)}...</td>
                        <td>{ride.passengerId.substring(0, 8)}...</td>
                        <td>
                          {ride.startTime
                            ? new Date(ride.startTime).toLocaleString()
                            : "N/A"}
                        </td>
                        <td>
                          {ride.endTime
                            ? new Date(ride.endTime).toLocaleString()
                            : "N/A"}
                        </td>
                        <td>{ride.estimatedDuration} phút</td>
                        <td>{new Date(ride.createdAt).toLocaleString()}</td>
                        <td>{ride.isSafetyTrackingEnabled ? "Có" : "Không"}</td>
                        <td>
                          <button
                            className="action-btn view"
                            onClick={() => handleViewDetails(ride.id)}
                          >
                            <FiEye /> Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center" }}>
                        Không có chuyến đi nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {rideTotalCount > 0 && (
              <div className="pagination-container">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={rideTotalCount}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            )}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminRideManagement;

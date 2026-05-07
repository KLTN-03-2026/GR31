import {
  Button,
  Card,
  Col,
  Layout,
  message,
  Row,
  Spin,
  Tabs,
  Typography,
} from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import "../../admin/styles/AdminRideDetails.scss";
import { fetchRideDetails } from "../../stores/action/adminActions";
import { userProfile } from "../../stores/action/profileActions";
import { clearRideState } from "../../stores/reducers/adminReducer";
import AppHeader from "../components/HeaderBar";
import AppSidebar from "../components/SideBarMenu";

// Define custom icons with colors only
const driverIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
  className: "driver-marker",
});

const passengerIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
  className: "passenger-marker",
});

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const AdminRideDetails = () => {
  const { rideId } = useParams();
  const dispatch = useDispatch();
  const [showMap, setShowMap] = useState(false);
  const [activeTab, setActiveTab] = useState("both");

  const usersState = useSelector((state) => state.users || {});
  const { users } = usersState;
  const reportAdminSlice = useSelector(
    (state) => state.reportAdmintSlice || {}
  );
  const { rideDetails, loading, error, success } = reportAdminSlice;

  // Da Nang bounds
  const daNangBounds = L.latLngBounds(
    L.latLng(15.975, 108.05),
    L.latLng(16.15, 108.35)
  );

  const fetchData = useCallback(async () => {
    if (!rideId) {
      message.error("Invalid ride ID");
      return;
    }
    try {
      await dispatch(fetchRideDetails(rideId)).unwrap();
    } catch (err) {
      message.error(err.message || "Lỗi khi lấy chi tiết chuyến đi");
    }
  }, [dispatch, rideId]);

  useEffect(() => {
    fetchData();
    return () => dispatch(clearRideState());
  }, [fetchData]);

  useEffect(() => {
    dispatch(userProfile());
  }, [dispatch]);

  useEffect(() => {
    if (error) message.error(error);
    if (success && rideDetails)
      message.success("Lấy chi tiết chuyến đi thành công");
  }, [error, success, rideDetails]);
  
  // Loading State
  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <AppSidebar />
        <Layout className="site-layout">
          <AppHeader usersProfile={users} />
          <Content style={{ margin: "20px", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin tip="Đang tải..." size="large" />
          </Content>
        </Layout>
      </Layout>
    );
  }

  // Not Found State
  if (!rideDetails) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <AppSidebar />
        <Layout className="site-layout">
          <AppHeader usersProfile={users} />
          <Content style={{ margin: "20px" }}>
            <Title level={3}>Chi tiết chuyến đi</Title>
            <Text>Không tìm thấy chuyến đi.</Text>
          </Content>
        </Layout>
      </Layout>
    );
  }

  // Map Logic (Giữ nguyên)
  const renderMapElements = () => {
    const elements = [];
    const sortedDriverLocations = [...(rideDetails.driverLocations || [])].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    const sortedPassengerLocations = [
      ...(rideDetails.passengerLocations || []),
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (activeTab === "both" || activeTab === "driver") {
      sortedDriverLocations.forEach((loc, index) => {
        elements.push(
          <Marker key={`driver-${index}`} position={[loc.latitude, loc.longitude]} icon={driverIcon}>
            <Popup>Tài xế<br />{new Date(loc.timestamp).toLocaleString()}</Popup>
          </Marker>
        );
      });
      if (sortedDriverLocations.length > 1) {
        elements.push(
          <Polyline key="driver-path" positions={sortedDriverLocations.map(l => [l.latitude, l.longitude])} color="#3182ce" weight={4} opacity={0.7} />
        );
      }
    }

    if (activeTab === "both" || activeTab === "passenger") {
      sortedPassengerLocations.forEach((loc, index) => {
        elements.push(
          <Marker key={`passenger-${index}`} position={[loc.latitude, loc.longitude]} icon={passengerIcon}>
            <Popup>Hành khách<br />{new Date(loc.timestamp).toLocaleString()}</Popup>
          </Marker>
        );
      });
      if (sortedPassengerLocations.length > 1) {
        elements.push(
          <Polyline key="passenger-path" positions={sortedPassengerLocations.map(l => [l.latitude, l.longitude])} color="#28a745" weight={4} opacity={0.7} />
        );
      }
    }
    return elements;
  };

  return (
    <div className="admin-ride-details">
      <Layout style={{ minHeight: "100vh" }}>
        <AppSidebar />
        {/* CSS: .site-layout xử lý responsive margin */}
        <Layout className="site-layout">
          <AppHeader usersProfile={users} />
          <Content className="ride-details-content">
            <Title level={3} className="page-title">
              Chi tiết chuyến đi
            </Title>

            {/* Row 1: Ride Information */}
            <Card className="ride-card" title="Thông tin chuyến đi" style={{marginBottom: 16}}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <div className="info-item">
                    <Text strong>Nội dung:</Text>
                    <Text>{rideDetails.ridePost?.content}</Text>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="info-item">
                    <Text strong>Điểm bắt đầu:</Text>
                    <Text>{rideDetails.ridePost?.startLocation}</Text>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="info-item">
                    <Text strong>Điểm kết thúc:</Text>
                    <Text>{rideDetails.ridePost?.endLocation}</Text>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="info-item">
                    <Text strong>Thời gian bắt đầu:</Text>
                    <Text>
                      {rideDetails.ridePost?.startTime
                        ? new Date(rideDetails.ridePost.startTime).toLocaleString()
                        : "N/A"}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="info-item">
                    <Text strong>Ngày tạo:</Text>
                    <Text>
                      {rideDetails.ridePost?.createdAt
                        ? new Date(rideDetails.ridePost.createdAt).toLocaleString()
                        : "N/A"}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Row 2: Driver and Passenger Information */}
            {/* Sử dụng gutter để tạo khoảng cách giữa các card khi xếp chồng */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card className="user-card" title="Thông tin tài xế" style={{ height: '100%' }}>
                  <div className="info-item"><Text strong>Họ tên:</Text><Text>{rideDetails.driver?.fullName}</Text></div>
                  <div className="info-item"><Text strong>Email:</Text><Text>{rideDetails.driver?.email}</Text></div>
                  <div className="info-item"><Text strong>Điểm uy tín:</Text><Text>{rideDetails.driver?.trustScore}</Text></div>
                  <div className="info-item"><Text strong>SĐT:</Text><Text>{rideDetails.driver?.phone}</Text></div>
                  <div className="info-item"><Text strong>SĐT người thân:</Text><Text>{rideDetails.driver?.relativePhone}</Text></div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card className="user-card" title="Thông tin hành khách" style={{ height: '100%' }}>
                  <div className="info-item"><Text strong>Họ tên:</Text><Text>{rideDetails.passenger?.fullName}</Text></div>
                  <div className="info-item"><Text strong>Email:</Text><Text>{rideDetails.passenger?.email}</Text></div>
                  <div className="info-item"><Text strong>Điểm uy tín:</Text><Text>{rideDetails.passenger?.trustScore}</Text></div>
                  <div className="info-item"><Text strong>SĐT:</Text><Text>{rideDetails.passenger?.phone}</Text></div>
                  <div className="info-item"><Text strong>SĐT người thân:</Text><Text>{rideDetails.passenger?.relativePhone}</Text></div>
                </Card>
              </Col>
            </Row>

            {/* Row 4: Map Display */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card title="Bản đồ vị trí">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10}}>
                    <Button
                      type="primary"
                      className="toggle-map-btn"
                      onClick={() => setShowMap(!showMap)}
                    >
                      {showMap ? "Ẩn bản đồ" : "Hiện bản đồ"}
                    </Button>
                    <Tabs
                      activeKey={activeTab}
                      onChange={setActiveTab}
                      type="card"
                      size="small"
                    >
                      <TabPane tab="Cả hai" key="both" />
                      <TabPane tab="Tài xế" key="driver" />
                      <TabPane tab="Hành khách" key="passenger" />
                    </Tabs>
                  </div>

                  {showMap && rideDetails && (rideDetails.driverLocations?.length > 0 || rideDetails.passengerLocations?.length > 0) && (
                      <div className="map-container">
                        <MapContainer
                          center={[16.06, 108.22]}
                          zoom={13}
                          minZoom={12}
                          maxZoom={18}
                          style={{ height: "100%", width: "100%" }}
                          maxBounds={daNangBounds}
                          zoomControl={true}
                          scrollWheelZoom={true}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          {renderMapElements()}
                        </MapContainer>
                      </div>
                    )}

                  {showMap && (!rideDetails || (rideDetails.driverLocations?.length === 0 && rideDetails.passengerLocations?.length === 0)) && (
                      <Text style={{display: 'block', marginTop: 10}}>Không có đủ dữ liệu để hiển thị bản đồ.</Text>
                    )}
                </Card>
              </Col>
            </Row>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default AdminRideDetails;
import { Alert, Layout, Spin, Table, Tag, Typography } from "antd";
import moment from "moment";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../../admin/styles/DashBoard.scss"; // Import SCSS chung để nhận style responsive
import { fetchNotifications } from "../../stores/action/adminActions";
import AppHeader from "../components/HeaderBar";
import AppSidebar from "../components/SideBarMenu";

const { Title } = Typography;
const { Content } = Layout;

const NotificationAdmin = () => {
  const dispatch = useDispatch();
  const { notifications, loading, error } = useSelector(
    (state) => state.reportAdmintSlice
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (text, record, index) => index + 1,
    },
    {
      title: "Ride ID",
      dataIndex: "rideId",
      key: "rideId",
      width: 100,
      render: (text) => <span>{text?.slice(0, 8)}...</span>,
    },
    {
      title: "Tên hành khách",
      dataIndex: "namePassenger",
      key: "namePassenger",
      width: 150,
      render: (text) => <span>{text || "Không có"}</span>,
    },
    {
      title: "Tên tài xế",
      dataIndex: "nameDriver",
      key: "nameDriver",
      width: 150,
      render: (text) => <span>{text || "Không có"}</span>,
    },
    {
      title: "SĐT hành khách",
      dataIndex: "phonePassenger",
      key: "phonePassenger",
      width: 120,
      render: (text) => <span>{text || "Không có"}</span>,
    },
    {
      title: "SĐT tài xế",
      dataIndex: "phoneDriver",
      key: "phoneDriver",
      width: 120,
      render: (text) => <span>{text || "Không có"}</span>,
    },
    {
      title: "SĐT người thân HK",
      dataIndex: "relativePhonePassenger",
      key: "relativePhonePassenger",
      width: 140,
      render: (text) => <span>{text || "Không có"}</span>,
    },
    {
      title: "SĐT người thân TX",
      dataIndex: "relativePhoneDriver",
      key: "relativePhoneDriver",
      width: 140,
      render: (text) => <span>{text || "Không có"}</span>,
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      width: 200,
      render: (text) => (
        <span style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Loại cảnh báo",
      dataIndex: "alertType",
      key: "alertType",
      width: 120,
      render: (type) => (
        <Tag color={type === 0 ? "red" : "orange"}>
          {type === 0 ? "Nghiêm trọng" : "Cảnh báo"}
        </Tag>
      ),
    },
    {
      title: "Thời gian tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (text) => moment(text).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar />
      {/* Di chuyển marginLeft: 200 ra Layout bao ngoài để CSS responsive hoạt động */}
      <Layout style={{ marginLeft: 200 }}>
        <AppHeader />
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
            minHeight: 280,
            // marginLeft: 200, // Đã bỏ dòng này
          }}
        >
          <Title level={3} style={{ marginBottom: 20 }}>Thông báo chuyến đi</Title>
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: "16px" }}
            />
          )}
          {loading ? (
            <Spin
              size="large"
              style={{ display: "block", margin: "50px auto" }}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={notifications}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              // Thêm scroll ngang để không vỡ layout trên mobile
              scroll={{ x: 1500 }} 
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default NotificationAdmin;
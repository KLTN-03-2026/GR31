import {
  Card,
  Col,
  Divider,
  Layout,
  Radio,
  Row,
  Spin,
  Table,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import "../../admin/styles/DashBoard.scss";
import {
  fetchDashboardOverview,
  fetchInteractionActivity,
  fetchRatingStatistics,
  fetchRecentPosts,
  fetchReportStats,
  fetchRideStatusStatistics,
  fetchUserStats,
  fetchUserStatsScore,
  fetchUserTrend,
} from "../../stores/action/dashboardActions";
import InteractionActivityChart from "../components/DashBoard/InteractionActivityChart";
import RatingStatisticsChart from "../components/DashBoard/RatingStatisticsChart";
import RideStatusStatisticsChart from "../components/DashBoard/RideStatusStatisticsChart";
import UserStatsScoreChart from "../components/DashBoard/UserStatsScoreChart";
import UserTrendChart from "../components/DashBoard/UserTrendChart";
import AppHeader from "../components/HeaderBar";
import AppSidebar from "../components/SideBarMenu";

const { Content } = Layout;
const { Title } = Typography;

const columns = [
  {
    title: "Tác giả",
    dataIndex: "author",
    key: "author",
    responsive: ["md"], // Ẩn cột này trên mobile
  },
  {
    title: "Nội dung",
    dataIndex: "content",
    key: "content",
    render: (text) => <span>{text?.replace(/\r\n/g, " ") || ""}</span>,
  },
  {
    title: "Trạng thái",
    dataIndex: "approvalStatus",
    key: "approvalStatus",
    width: 100,
    render: (status) => {
      switch (status) {
        case 1: return <span style={{color: 'green'}}>Đã duyệt</span>;
        case 0: return <span style={{color: 'orange'}}>Chờ duyệt</span>;
        default: return "Không xác định";
      }
    },
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    responsive: ["lg"],
    render: (date) => (date ? new Date(date).toLocaleString("vi-VN") : "-"),
  },
  {
    title: "Báo cáo",
    dataIndex: "reportCount",
    key: "reportCount",
    width: 80,
    align: 'center',
    render: (count) => count ?? 0,
  },
];

const Dashboard = () => {
  const dispatch = useDispatch();
  const {
    overview,
    recentPosts,
    ratingStatistics,
    rideStatusStatistics,
    loading,
    error,
  } = useSelector((state) => state.dashboard);

  const [groupBy, setGroupBy] = useState("day");

  useEffect(() => {
    dispatch(fetchDashboardOverview());
    dispatch(fetchUserStats());
    dispatch(fetchReportStats());
    dispatch(fetchRecentPosts({ pageNumber: 1, pageSize: 5 }));
    dispatch(fetchUserTrend({ timeRange: "month" }));
    dispatch(fetchInteractionActivity());
    dispatch(fetchUserStatsScore());
    dispatch(fetchRatingStatistics());
    dispatch(fetchRideStatusStatistics({ groupBy }));
  }, [dispatch, groupBy]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar />
      {/* Thay đổi quan trọng: Xóa marginLeft inline, dùng class site-layout để SCSS xử lý */}
      <Layout className="site-layout">
        <AppHeader />
        <Content style={{ margin: "20px" }} className="dashboard-content">
          <Title level={3} style={{ marginBottom: 20 }}>Dashboard</Title>
          {loading ? (
            <div style={{ textAlign: "center", margin: "50px 0" }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Cards thống kê tổng quan */}
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={12} lg={6}>
                  <Card title="Tổng số người dùng" bordered={false}>
                    <Title level={3} style={{ color: "#3f8600", margin: 0 }}>
                      {overview?.totalUsers?.toLocaleString() || 0}
                    </Title>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={6}>
                  <Card title="Người dùng bị khóa" bordered={false}>
                    <Title level={3} style={{ color: "#cf1322", margin: 0 }}>
                      {overview?.totalLockedUsers?.toLocaleString() || 0}
                    </Title>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={6}>
                  <Card title="Báo cáo người dùng" bordered={false}>
                    <Title level={3} style={{ color: "#faad14", margin: 0 }}>
                      {overview?.totalUserReports?.toLocaleString() || 0}
                    </Title>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={6}>
                  <Card title="Báo cáo bài viết" bordered={false}>
                    <Title level={3} style={{ color: "#faad14", margin: 0 }}>
                      {overview?.totalPostReports?.toLocaleString() || 0}
                    </Title>
                  </Card>
                </Col>
              </Row>

              <Divider />

              {/* Hàng biểu đồ 1 */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Xu hướng người dùng" bordered={false}>
                    <div className="dashboard-chart-container">
                      <UserTrendChart />
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Hoạt động tương tác" bordered={false}>
                     <div className="dashboard-chart-container">
                      <InteractionActivityChart />
                    </div>
                  </Card>
                </Col>
              </Row>

              <Divider />

              {/* Hàng biểu đồ 2 */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Phân bổ người dùng theo độ uy tín" bordered={false}>
                    <div className="dashboard-chart-container">
                      <UserStatsScoreChart />
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Thống kê phần trăm đánh giá chuyến đi" bordered={false}>
                    <div className="dashboard-chart-container">
                      <RatingStatisticsChart ratingStatistics={ratingStatistics} />
                    </div>
                  </Card>
                </Col>
              </Row>

              <Divider />

              {/* Biểu đồ lớn */}
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card
                    title="Thống kê số lượng chuyến đi theo trạng thái"
                    bordered={false}
                    extra={
                      <Radio.Group
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        size="small"
                        buttonStyle="solid"
                      >
                        <Radio.Button value="day">Ngày</Radio.Button>
                        <Radio.Button value="week">Tuần</Radio.Button>
                        <Radio.Button value="month">Tháng</Radio.Button>
                      </Radio.Group>
                    }
                  >
                    <div className="dashboard-chart-container">
                      <RideStatusStatisticsChart rideStatusStatistics={rideStatusStatistics} />
                    </div>
                  </Card>
                </Col>
              </Row>

              <Divider />

              {/* Bảng bài viết mới */}
              <Card title="Bài viết mới từ người dùng" bordered={false}>
                <Table
                  dataSource={
                    recentPosts?.map((post) => ({
                      ...post,
                      key: post?.id || Math.random(),
                    })) || []
                  }
                  columns={columns}
                  pagination={false}
                  scroll={{ x: 600 }} // Scroll ngang trên mobile
                />
              </Card>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
import { Empty, Spin } from "antd";
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { useSelector } from "react-redux";
// Import file SCSS chung nếu cần, hoặc dựa vào DashBoardView đã import
// import "../../styles/DashBoard.scss"; 

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const UserStatsScoreChart = () => {
  const { userStatsScore, loading } = useSelector((state) => state.dashboard);

  const hasData =
    userStatsScore &&
    userStatsScore.labels &&
    userStatsScore.data &&
    userStatsScore.data.some((val) => val > 0);

  const data = {
    labels: userStatsScore?.labels || [],
    datasets: [
      {
        label: "Số lượng người dùng",
        data: userStatsScore?.data || [],
        backgroundColor: ["#ff4d4f", "#faad14", "#52c41a"],
        borderColor: ["#fff", "#fff", "#fff"],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#333",
          font: { size: 12 },
          padding: 15,
          boxWidth: 15, // Giảm kích thước hộp màu cho gọn trên mobile
        },
      },
      title: { display: false },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#333",
        bodyColor: "#333",
        borderColor: "#f0f0f0",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.chart._metasets[context.datasetIndex].total;
            const percentage = total > 0 ? Math.round((value / total) * 100) + "%" : "0%";
            return ` ${label}: ${value} (${percentage})`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="chart-state-container">
        <Spin size="default" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="chart-state-container">
        <Empty
          description="Chưa có dữ liệu thống kê"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-chart-container">
      <Pie data={data} options={options} />
    </div>
  );
};

export default UserStatsScoreChart;
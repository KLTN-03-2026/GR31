import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const RatingStatisticsChart = ({ ratingStatistics }) => {
  // Kiểm tra xem tất cả giá trị có phải đều là 0 không
  const isEmpty =
    ratingStatistics.poorPercentage === 0 &&
    ratingStatistics.averagePercentage === 0 &&
    ratingStatistics.goodPercentage === 0 &&
    ratingStatistics.excellentPercentage === 0;

  // Nếu không có dữ liệu, hiển thị thông điệp
if (isEmpty) {
    return (
      <div className="chart-state-container">
        <p>Không có dữ liệu đánh giá nào để hiển thị.</p>
      </div>
    );
  }

  const data = {
    labels: [
      "Thấp (Poor)",
      "Trung bình (Average)",
      "Tốt (Good)",
      "Xuất sắc (Excellent)",
    ],
    datasets: [
      {
        label: "Phần trăm đánh giá",
        data: [
          ratingStatistics.poorPercentage,
          ratingStatistics.averagePercentage,
          ratingStatistics.goodPercentage,
          ratingStatistics.excellentPercentage,
        ],
        backgroundColor: [
          "#FF4D4F", // Poor: Đỏ
          "#FAAD14", // Average: Vàng
          "#52C41A", // Good: Xanh lá
          "#1890FF", // Excellent: Xanh dương
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Tắt tỷ lệ khung hình để khớp với chiều cao cố định
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#333",
          font: { size: 12 },
        },
      },
      title: {
        display: true,
        text: "Thống kê phần trăm đánh giá chuyến đi",
        color: "#333",
        font: { size: 16 },
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#333",
        bodyColor: "#333",
        borderColor: "#ddd",
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  return (
    <div className="dashboard-chart-container">
      <Pie data={data} options={options} />
    </div>
  );
};

export default RatingStatisticsChart;

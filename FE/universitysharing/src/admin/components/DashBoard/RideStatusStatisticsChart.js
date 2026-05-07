import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartDataLabels,
  Title
);

const RideStatusStatisticsChart = ({ rideStatusStatistics }) => {
  // Kiểm tra nếu không có dữ liệu
  if (!rideStatusStatistics || rideStatusStatistics.length === 0) {
    return (
      <div className="chart-state-container">
        <p>Không có dữ liệu để hiển thị biểu đồ.</p>
      </div>
    );
}

  const data = {
    labels: rideStatusStatistics.map((item) => item.timeLabel),
    datasets: [
      {
        label: "Từ chối (Rejected)",
        data: rideStatusStatistics.map((item) => item.rejectedCount),
        backgroundColor: "rgba(255, 77, 79, 0.8)",
        borderColor: "rgba(255, 77, 79, 1)",
        borderWidth: 1,
        stack: "stack",
        barThickness: 18,
        borderRadius: 4,
      },
      {
        label: "Đang đi (Accepted)",
        data: rideStatusStatistics.map((item) => item.acceptedCount),
        backgroundColor: "rgba(250, 173, 20, 0.8)",
        borderColor: "rgba(250, 173, 20, 1)",
        borderWidth: 1,
        stack: "stack",
        barThickness: 18,
        borderRadius: 4,
      },
      {
        label: "Hoàn thành (Completed)",
        data: rideStatusStatistics.map((item) => item.completedCount),
        backgroundColor: "rgba(82, 196, 26, 0.8)",
        borderColor: "rgba(82, 196, 26, 1)",
        borderWidth: 1,
        stack: "stack",
        barThickness: 18,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#333",
          font: {
            size: 12,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          padding: 15,
          boxWidth: 30,
        },
      },
      title: {
        display: true,
        text: "Thống kê số lượng chuyến đi theo trạng thái",
        color: "#333",
        font: {
          size: 16,
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          weight: "bold",
        },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#333",
        bodyColor: "#666",
        borderColor: "#ddd",
        borderWidth: 1,
        cornerRadius: 4,
        padding: 10,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}`,
        },
      },
      datalabels: {
        display: true,
        color: "#fff",
        formatter: (value) => (value > 0 ? value : ""),
        anchor: "center",
        align: "center",
        font: {
          size: 12,
          weight: "bold",
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        },
        textShadow: "0 0 3px rgba(0, 0, 0, 0.5)",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Thời gian",
          color: "#333",
          font: {
            size: 14,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          padding: 10,
        },
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "#666",
          font: { size: 12 },
        },
      },
      y: {
        title: {
          display: true,
          text: "Số lượng chuyến đi",
          color: "#333",
          font: {
            size: 14,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          padding: 10,
        },
        beginAtZero: true,
        stacked: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          borderDash: [5, 5],
        },
        ticks: {
          color: "#666",
          font: { size: 12 },
          stepSize: 1,
        },
      },
    },
    elements: {
      bar: {
        borderSkipped: false,
        borderRadius: 4,
      },
    },
    hover: {
      mode: "index",
      intersect: false,
      onHover: (event, chartElement) => {
        event.native.target.style.cursor = chartElement[0]
          ? "pointer"
          : "default";
      },
    },
    categoryPercentage: 0.6,
  };

  return (
    <div className="dashboard-chart-container">
      <Bar data={data} options={options} />
    </div>
);
};

export default RideStatusStatisticsChart;

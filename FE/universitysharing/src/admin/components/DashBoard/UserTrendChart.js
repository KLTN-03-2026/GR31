import React from "react";
import { useSelector } from "react-redux";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const UserTrendChart = () => {
  const { userTrend } = useSelector((state) => state.dashboard);

  const labels = userTrend?.labels || [];
  const dataPoints = userTrend?.data || [];

  const data = {
    labels,
    datasets: [
      {
        label: "Số lượng người dùng",
        data: dataPoints,
        borderColor: "#1890ff",
        backgroundColor: "rgba(24, 144, 255, 0.2)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#1890ff",
        pointBorderColor: "#fff",
        pointHoverRadius: 7,
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
          font: { size: 12 },
        },
      },
      title: {
        display: true,
        text: "Xu hướng người dùng theo tháng",
        color: "#333",
        font: { size: 16 },
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#333",
        bodyColor: "#333",
        borderColor: "#ddd",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Tháng",
          color: "#333",
        },
        ticks: { color: "#333" },
        grid: { display: false },
      },
      y: {
        title: {
          display: true,
          text: "Số lượng",
          color: "#333",
        },
        ticks: {
          color: "#333",
          beginAtZero: true,
        },
        grid: { color: "#e8e8e8" },
      },
    },
  };

  return (
    <div style={{ height: "300px" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default UserTrendChart;

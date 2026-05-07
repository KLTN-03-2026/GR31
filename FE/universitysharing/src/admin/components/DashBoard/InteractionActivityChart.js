import React from "react";
import { useSelector } from "react-redux";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

const InteractionActivityChart = () => {
  const { interactionActivity } = useSelector((state) => state.dashboard);

  const labels = interactionActivity?.labels || [];
  const likes = interactionActivity?.datasets?.likes || [];
  const comments = interactionActivity?.datasets?.comments || [];
  const shares = interactionActivity?.datasets?.shares || [];

  const data = {
    labels,
    datasets: [
      {
        label: "Lượt thích",
        data: likes,
        backgroundColor: "#52c41a",
        borderColor: "#52c41a",
        borderWidth: 1,
        barThickness: 30,
      },
      {
        label: "Bình luận",
        data: comments,
        backgroundColor: "#1890ff",
        borderColor: "#1890ff",
        borderWidth: 1,
        barThickness: 30,
      },
      {
        label: "Chia sẻ",
        data: shares,
        backgroundColor: "#faad14",
        borderColor: "#faad14",
        borderWidth: 1,
        barThickness: 30,
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
        text: "Hoạt động tương tác",
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
          text: "Thời gian",
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
      <Bar data={data} options={options} />
    </div>
  );
};

export default InteractionActivityChart;

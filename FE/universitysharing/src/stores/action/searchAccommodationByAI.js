import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axiosClient from "../../Service/axiosClient"; // Giả định axiosClient đã được cấu hình

// ====================================================================
// 6. SEARCH BY AI (Tìm kiếm trọ bằng AI)
// ====================================================================
export const searchAccommodationByAI = createAsyncThunk(
  "accommodation/searchByAI",
  async ({ question }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        "/api/Accommodation/search",
        { Question: question }, // Body theo yêu cầu Postman
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi từ server khi tìm kiếm AI");
      }

      // Toast thông báo thành công
      toast.success("Tìm kiếm AI thành công!");

      return response.data.data; // { answer: string, responseDataAI: [...] }
    } catch (error) {
      console.error("Error in searchAccommodationByAI:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);